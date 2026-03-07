"use client"
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import FormContainer from './_components/FormContainer';
import QuestionList from './_components/QuestionList';
import { toast } from 'sonner';
import InterviewLink from './_components/InterviewLink';
import { motion, AnimatePresence } from 'framer-motion';
import { getDevJob } from '@/utils/devInterviewStore';

function CreateInterview() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobDetailsId = searchParams.get('jobDetailsId');
    const [jobDetails, setJobDetails] = useState(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [jobId, setJobId] = useState();
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (jobDetailsId) {
            // Load job details from localStorage (dev mode)
            const job = getDevJob(jobDetailsId);
            setJobDetails(job);
        }
    }, [jobDetailsId]);

    useEffect(() => {
        if (jobDetailsId) {
            setFormData(prev => ({
                ...prev,
                jobDetailsId: Number(jobDetailsId)
            }));
        }
    }, [jobDetailsId]);

    const onHandleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }

    const onGoToNext = () => {
        if (!formData?.jobPosition || !formData?.jobDescription || !formData?.duration || !formData?.type) {
            toast.error('Please complete all required fields!', {
                description: 'All fields are necessary to generate the best interview questions.',
                position: 'top-center'
            });
            return;
        }
        handleStepChange(step + 1);
    }

    const onCreateLink = (job_id) => {
        setJobId(job_id);
        handleStepChange(step + 1);
    }

    const handleStepChange = (newStep) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setStep(newStep);
            setIsTransitioning(false);
        }, 300);
    }

    const stepTitles = [
        "Enter Interview Details",
        "Review Questions",
        "Share Interview Link"
    ];

    const progressColors = [
        "bg-red-200",
        "bg-red-200",
        "bg-green-500"
    ];

    return (
        <div className='mt-8 px-4 sm:px-8 md:px-12 lg:px-24 xl:px-36 2xl:px-48'>
            <div className='flex gap-4 items-center mb-6'>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className='p-2 rounded-full hover:bg-gray-100 transition-colors'
                    aria-label="Go back"
                >
                    <ArrowLeft className='h-5 w-5 text-gray-600' />
                </motion.button>
                <div>
                    <h2 className='font-bold text-2xl sm:text-3xl text-gray-800'>Create New Interview</h2>
                    <p className='text-sm text-gray-500 mt-1'>{stepTitles[step - 1]}</p>
                </div>
            </div>

            <div className='mb-8'>
                <Progress
                    value={step * 33.33}
                    className={`h-2 transition-all duration-500 ${progressColors[step - 1]}`}
                />
                <div className='flex justify-between mt-2 text-xs text-gray-500'>
                    <span>Step {step} of 3</span>
                    <span>{Math.round(step * 33.33)}% complete</span>
                </div>
            </div>

            <AnimatePresence mode='wait'>
                {!isTransitioning && (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: step > 1 ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: step > 1 ? -20 : 20 }}
                        transition={{ duration: 0.3 }}
                        className='mb-10'
                    >
                        {step === 1 && (
                            <FormContainer
                                onHandleInputChange={onHandleInputChange}
                                GoToNext={onGoToNext}
                                jobDetails={jobDetails}
                                jobDetailsId={jobDetailsId}
                            />
                        )}
                        {step === 2 && (
                            <QuestionList
                                formData={formData}
                                onCreateLink={onCreateLink}
                                onBack={() => handleStepChange(step - 1)}
                                jobDetails={jobDetails}
                            />
                        )}
                        {step === 3 && (
                            <InterviewLink
                                job_id={jobId}
                                formData={formData}
                                onBack={() => handleStepChange(step - 1)}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function CreateInterviewPageWithSuspense(props) {
    return (
        <Suspense>
            <CreateInterview {...props} />
        </Suspense>
    );
}