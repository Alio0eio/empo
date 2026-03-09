"use client"
import { InterviewDataContext } from '@/app/context/InterviewDataContext'
import { Loader2Icon, Mic, Phone, Timer } from 'lucide-react';
import Image from 'next/image';
import React, { useContext, useEffect, useState, useRef } from 'react'
import Vapi from "@vapi-ai/web";
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import TimerComponent from './_components/TimerComponent';
import axios from 'axios';

function StartInterview() {
    const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
    const vapiRef = useRef(null);
    const [activeUser, setActiveUser] = useState(false);
    const [conversation, setConversation] = useState();
    const [callEnd, setCallEnd] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const { job_id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize VAPI client only once
        vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

        const handleMessage = (message) => {
            console.log('[Vapi] Message event:', message); // Debug log
            if (message?.conversation) {
                const convoString = JSON.stringify(message.conversation);
                setConversation(convoString);
            }
        };

        const callStartHandler = () => {
            toast('Call Connected...');
        };

        const speechStartHandler = () => {
            setActiveUser(false);
        };

        const speechEndHandler = () => {
            setActiveUser(true);
        };

        const callEndHandler = (event) => {
            console.log('[Vapi] Call ended:', event);
            setCallEnd(true);
            // Only generate feedback if conversation is available
            if (conversation) {
                GenerateFeedback();
            } else {
                toast.error('Interview ended but no conversation data was captured. Feedback cannot be generated.');
            }
        };

        const errorHandler = (error) => {
            console.error('[Vapi] Error event:', error);
            if (error?.errorMsg?.includes('Meeting has ended')) {
                toast.error('The interview session was ended unexpectedly.');
                setCallEnd(true);
            }
        };

        vapiRef.current.on("message", handleMessage);
        vapiRef.current.on("call-start", callStartHandler);
        vapiRef.current.on("speech-start", speechStartHandler);
        vapiRef.current.on("speech-end", speechEndHandler);
        vapiRef.current.on("call-end", callEndHandler);
        vapiRef.current.on("error", errorHandler);

        return () => {
            // Clean up event listeners
            if (vapiRef.current) {
                vapiRef.current.off("message", handleMessage);
                vapiRef.current.off("call-start", callStartHandler);
                vapiRef.current.off("speech-start", speechStartHandler);
                vapiRef.current.off("speech-end", speechEndHandler);
                vapiRef.current.off("call-end", callEndHandler);
                vapiRef.current.off("error", errorHandler);
                vapiRef.current.stop();
                vapiRef.current = null; // Nullify to prevent duplicate instances
            }
        };
    }, []); // Only run on mount/unmount

    useEffect(() => {
        if (interviewInfo && vapiRef.current) {
            startCall();
        }
    }, [interviewInfo])

    const startCall = () => {
        if (!interviewInfo || !vapiRef.current) {
            toast.error('Interview information is not available');
            return;
        }
        // Guard: Don't start if already in a call (optional, based on Vapi API)
        if (vapiRef.current.isStarted && typeof vapiRef.current.isStarted === 'function' && vapiRef.current.isStarted()) {
            console.warn('Vapi call already started.');
            return;
        }
        const questionList = interviewInfo?.interviewData?.questionList
            ?.map((item) => item.question)
            ?.join(", ");
        const assistantOptions = {
            name: "AI Recruiter",
            firstMessage: `Hi ${interviewInfo?.userName}, how are you? Ready for your interview on ${interviewInfo?.interviewData?.jobPosition}`,
            transcriber: {
                provider: "deepgram",
                model: "nova-2",
                language: "en-US",
            },
            voice: {
                provider: "playht",
                voiceId: "jennifer",
            },
            model: {
                provider: "openai",
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey there! Welcome to your ${interviewInfo?.interviewData?.jobPosition} interview. Let's get started with a few questions!"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise.
Below Are the questions ask one by one:
Questions: ${questionList}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging-use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
- Be friendly, engaging, and witty.
- keep responses short and natural, like a real conversation.
- Adapt based on the candidate's confidence level.
- Ensure the interview remains focused on React.
`.trim(),
                    },
                ],
            },
        };
        vapiRef.current.start(assistantOptions);
    }

    const stopInterview = async () => {
        if (vapiRef.current) {
            await vapiRef.current.stop();
            setCallEnd(true);

            // Wait up to 1 second for conversation data to arrive
            let waited = 0;
            const waitInterval = 100;
            while (!conversation && waited < 1000) {
                await new Promise(res => setTimeout(res, waitInterval));
                waited += waitInterval;
            }

            if (conversation) {
                GenerateFeedback();
            } else {
                toast.error('Interview ended but no conversation data was captured. Feedback cannot be generated.');
            }
        }
    }

    const toggleMute = () => {
        if (vapiRef.current) {
            if (isMuted) {
                vapiRef.current.setMuted(false);
                toast('Microphone unmuted');
            } else {
                vapiRef.current.setMuted(true);
                toast('Microphone muted');
            }
            setIsMuted(!isMuted);
        }
    }

    const GenerateFeedback = async () => {
        try {
            setLoading(true);
            if (!interviewInfo) {
                throw new Error("Interview information is not available");
            }
            if (!conversation) {
                throw new Error("No conversation data available");
            }
            const result = await axios.post('/api/GenerateFeedbackForPhone', {
                conversation: conversation
            });
            const Content = result.data.content;
            const FINAL_CONTENT = Content.replace('```json', '').replace('```', '');
            // Using Drizzle syntax for database insertion
            const feedbackData = {
                userName: interviewInfo.userName,
                userEmail: interviewInfo.userEmail,
                job_id: job_id,
                feedback: JSON.parse(FINAL_CONTENT),
                recommended: false,
            };
            const insertedFeedback = await db.insert(callInterviewFeedback)
                .values(feedbackData)
                .returning();
            router.replace('/job-seeker/interview-thankyou');
        } catch (error) {
            console.error('Error saving feedback:', error);
            toast.error('Failed to save feedback: ' + (error?.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    }

    if (!interviewInfo) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2Icon className="animate-spin h-12 w-12 mx-auto" />
                    <p className="mt-4">Loading interview information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='p-20 lg:px-48 xl:px-50'>
            <h2 className='font-bold text-xl flex justify-between'>AI Interview Session
                <span className='flex gap-2 items-center'>
                    <Timer />
                    <TimerComponent start={true} />
                </span>
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-5'>
                <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center justify-center'>
                    <div className='relative'>
                        {!activeUser && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />}
                        <Image
                            src={'/ai.png'}
                            alt='AI Recruiter'
                            width={60}
                            height={60}
                            className='rounded-full object-cover'
                        />
                        <h2>AI Recruiter</h2>
                    </div>
                </div>

                <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center justify-center'>
                    <div className='relative'>
                        {activeUser && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />}
                        <h2 className='text-2xl text-white bg-primary h-[50px] w-[50px] p-3 rounded-full flex items-center justify-center'>
                            {interviewInfo?.userName?.[0]?.toUpperCase() || 'U'}
                        </h2>
                    </div>
                    <h2>{interviewInfo?.userName}</h2>
                </div>
            </div>

            <div className='flex items-center gap-5 justify-center mt-7'>
                <Mic
                    className={`h-12 w-12 p-3 ${isMuted ? 'bg-gray-300' : 'bg-primary'} text-white rounded-full cursor-pointer`}
                    onClick={toggleMute}
                />
                {!loading ? (
                    <Phone
                        className='h-12 w-12 p-3 bg-red-500 text-white rounded-full cursor-pointer'
                        onClick={stopInterview}
                    />
                ) : (
                    <Loader2Icon className='h-12 w-12 p-3 animate-spin' />
                )}
            </div>

            <h2 className='text-sm text-gray-400 text-center mt-5'>
                {callEnd ? 'Interview Completed' : 'Interview in Progress...'}
            </h2>
        </div>
    )
}

export default StartInterview;