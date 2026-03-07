"use client"
import { Button } from '@/components/ui/button';
import { Lightbulb, WebcamIcon, Loader2, Briefcase, Info, User, FileText, Video } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

function Interview({ params }) {
    const { interviewId } = React.use(params);
    const [interviewData, setInterviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [webCamEnabled, setWebCamEnabled] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('prompt');

    useEffect(() => {
        GetInterviewDetails();
        checkMediaPermissions();
    }, [interviewId]);

    /**
     * Check camera and microphone permissions
     */
    const checkMediaPermissions = async () => {
        try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' });
            const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
            
            setPermissionStatus(
                cameraPermission.state === 'granted' && microphonePermission.state === 'granted' 
                ? 'granted' 
                : 'denied'
            );
        } catch (err) {
            console.error("Permission API not supported", err);
        }
    };

    /**
     * Used to Get Interview Details by Interview Id (no database in dev).
     * We reuse the job data stored in localStorage ('devJobs') and treat the interviewId as the jobId.
     */
    const GetInterviewDetails = async () => {
        try {
            setLoading(true);
            if (typeof window === "undefined") {
                setInterviewData(null);
                return;
            }

            const raw = window.localStorage.getItem("devJobs");
            const jobs = raw ? JSON.parse(raw) : [];
            const found = Array.isArray(jobs)
                ? jobs.find(j => String(j.id) === String(interviewId))
                : null;

            if (!found) {
                throw new Error("Interview not found");
            }

            setInterviewData(found);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnableWebcam = async () => {
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
            stream.getTracks().forEach(track => track.stop());
            setWebCamEnabled(true);
            setPermissionStatus('granted');
        } catch (err) {
            console.error("Error accessing media devices:", err);
            setPermissionStatus('denied');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-10 p-5 border rounded-lg bg-destructive/10 text-destructive">
                <h2 className="font-bold text-xl">Error</h2>
                <p>{error}</p>
                <Link href="/dashboard">
                    <Button className="mt-4">Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="my-12 max-w-6xl mx-auto px-4">
            <h2 className="font-extrabold text-3xl mb-2 tracking-tight text-gray-900">AI Mock Interview</h2>
            <p className="text-gray-500 mb-10 text-lg">Step 1 of 2: Setup</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                {/* Job Details */}
                <div className="space-y-8">
                    <div className="p-8 rounded-2xl border bg-white shadow-lg">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-primary">
                            <Briefcase className="h-6 w-6" /> Job Details
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Job Role</p>
                                    <p className="text-lg font-medium">{interviewData?.jobPosition}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Job Description</p>
                                    <p className="text-lg font-medium">{interviewData?.jobDesc}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Experience Required</p>
                                    <p className="text-lg font-medium">{interviewData?.jobExperience} years</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl border-l-4 border-yellow-400 bg-yellow-50 shadow">
                        <div className="flex items-center gap-2 text-yellow-700 font-semibold mb-2">
                            <Lightbulb className="h-5 w-5" />
                            Before you start
                        </div>
                        <ul className="text-yellow-800 list-disc pl-6 space-y-1 text-base">
                            <li>Find a quiet, well-lit place</li>
                            <li>Enable your webcam and microphone</li>
                            <li>Your video is never stored</li>
                        </ul>
                    </div>
                </div>
                {/* Webcam Section */}
                <div className="flex flex-col items-center w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-8">
                    {webCamEnabled ? (
                        <div className="relative w-full">
                            <Webcam
                                audio={false}
                                videoConstraints={{ facingMode: 'user' }}
                                onUserMedia={() => setWebCamEnabled(true)}
                                onUserMediaError={() => setWebCamEnabled(false)}
                                mirrored={true}
                                aria-label="Webcam live preview"
                                className="w-full h-auto rounded-lg border shadow-md"
                            />
                            <span className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Webcam On</span>
                        </div>
                    ) : (
                        <>
                        <WebcamIcon className="h-20 w-20 text-gray-300 mb-4" />
                        <span className="text-gray-600 mb-4 text-lg font-medium">Webcam & Microphone not enabled</span>
                        <Button
                            onClick={handleEnableWebcam}
                            className="w-full py-4 text-lg font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-[#be3144] to-[#f05941] hover:scale-105 hover:shadow-lg transition"
                            disabled={permissionStatus === 'denied'}
                            aria-label="Enable Webcam & Microphone"
                        >
                            <Video className="h-5 w-5" /> Enable Webcam & Microphone
                        </Button>
                        <Button
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={handleEnableWebcam}
                            aria-label="Test Devices"
                        >
                            Test Devices
                        </Button>
                        <p className="text-xs text-gray-400 mt-4">We never store your video. You can disable access at any time.</p>
                        {permissionStatus === 'denied' && (
                            <p className="text-sm text-destructive mt-2">Please enable permissions in your browser settings.</p>
                        )}
                        </>
                    )}
                </div>
            </div>
            <div className="flex justify-end mt-12">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Link href={`/interview/${interviewId}/start`} passHref>
                          <Button
                            size="lg"
                            disabled={!webCamEnabled}
                            className="px-10 py-6 text-lg font-bold bg-gradient-to-r from-[#be3144] to-[#f05941] hover:scale-105 hover:shadow-lg transition"
                            aria-label="Start Interview Now"
                          >
                            Start Interview Now
                          </Button>
                        </Link>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {!webCamEnabled ? "Enable webcam & mic to start" : ""}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}

export default Interview;