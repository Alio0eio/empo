"use client"
import { InterviewDataContext } from '@/app/context/InterviewDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCallInterview } from '@/utils/devInterviewStore'
import { Clock, Info, Loader2Icon, Settings, Video } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

function Call_Interview() {

    const { job_id } = useParams();
    console.log(job_id)
    const [interviewData, setInterviewData] = useState();
    const [userName, setUserName] = useState();
    const [userEmail, setUserEmail] = useState();
    const [loading, setLoading] = useState(false);
    const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
    const router = useRouter();

    useEffect(() => {
        job_id && GetInterviewDetails();
    }, [job_id])

    const GetInterviewDetails = async () => {
        try {
            setLoading(true);

            // Read from localStorage (dev mode)
            const result = getCallInterview(job_id);

            if (!result) {
                toast('Incorrect Interview Link');
                return;
            }

            setInterviewData({
                jobPosition: result.jobPosition,
                jobDescription: result.jobDescription,
                duration: result.duration,
                type: result.type,
                job_id: result.job_id,
            });
            return result;
        } catch (error) {
            toast('Incorrect Interview Link');
        } finally {
            setLoading(false);
        }
    };

    const handleTestCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                }
            });

            toast.success('Camera and microphone are working!');

            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            toast.error('Error accessing camera or microphone: ' + error.message);
        }
    };

    const onJoinInterview = async () => {
        try {
            setLoading(true);

            // Read from localStorage (dev mode)
            const result = getCallInterview(job_id);

            if (!result) {
                toast.error("No interview found with this ID.");
                setLoading(false);
                return;
            }

            console.log(result);

            setInterviewInfo({
                userName: userName,
                userEmail: userEmail,
                interviewData: result
            });
            router.push('/job-seeker/Call-Interview/' + job_id + '/start')
        } catch (error) {
            toast.error("Something went wrong while joining the interview.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className='px-10 md:px-28 lg:px-48 xl:px-80 mt-7'>
            <div className='flex flex-col items-center justify-center border rounded-lg bg-white p-7 lg:px-33 xl:px-52 mb-20 pb-15'>
                <Image
                    src={'/logo.png'}
                    width={200}
                    height={100}
                    alt='logo'
                    className="w-[85px]"
                />
                <h2 className='mt-3'>AI-Powered Interview Platform</h2>
                <Image
                    src={'/two-men.png'}
                    width={500}
                    height={500}
                    alt={'two-men'}
                    className="w-[350px] my-6"
                />

                <h2 className='font-bold text-xl'>{interviewData?.jobPosition}</h2>
                <h2 className='flex gap-2 items-center text-gray-500 mt-3'><Clock className='h-4 w-4' /> {interviewData?.duration}</h2>

                <div className='w-full'>
                    <h2>Enter your full name</h2>
                    <Input placeholder='e.g. Jhon Smith' onChange={(event) => setUserName(event.target.value)} />
                </div>

                <div className='w-full'>
                    <h2>Enter your Email</h2>
                    <Input placeholder='e.g. example@gmail.com' onChange={(event) => setUserEmail(event.target.value)} />
                </div>

                <div className='p-3 bg-red-100 flex gap-4 rounded-2xl mt-5'>
                    <Info className='text-primary' />
                    <div>
                        <h2 className='font-bold'>Before you begin</h2>
                        <ul className=''>
                            <li className='text-sm text-primary'>- Test your camera and microphone</li>
                            <li className='text-sm text-primary'>- Ensure you have a stable internet connection</li>
                            <li className='text-sm text-primary'>- Find a Quiet place for interview</li>
                        </ul>
                    </div>
                </div>

                <Button className='mt-5 w-full font-bold'
                    disabled={loading || !userName}
                    onClick={() => onJoinInterview()}
                >
                    <Video /> {loading && <Loader2Icon />} Join Interview
                </Button>

                <Button
                    variant="outline"
                    className='mt-3 w-full'
                    onClick={handleTestCamera}
                >
                    <Settings /> Test Camera & Microphone
                </Button>

            </div>
        </div>
    )
}

export default Call_Interview