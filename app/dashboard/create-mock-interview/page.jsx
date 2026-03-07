"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddNewInterview from '../_components/AddNewInterview';
import { getDevJob } from '@/utils/devInterviewStore';

function CreateMockInterview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobDetailsId = searchParams.get('jobDetailsId');
  const [jobDetails, setJobDetails] = useState(null);

  // Debug log
  useEffect(() => {
    console.log('jobDetailsId from router state:', jobDetailsId);
  }, [jobDetailsId]);

  useEffect(() => {
    if (jobDetailsId) {
      // Load job details from localStorage (dev mode)
      const job = getDevJob(jobDetailsId);
      setJobDetails(job);
    }
  }, [jobDetailsId]);

  return (
    <div className='mt-8 px-4 sm:px-8 md:px-12 lg:px-24 xl:px-36 2xl:px-48'>
      <div className='flex gap-4 items-center mb-6'>
        <button
          onClick={() => router.back()}
          className='p-2 rounded-full hover:bg-gray-100 transition-colors'
          aria-label="Go back"
        >
          <ArrowLeft className='w-6 h-6' />
        </button>
        <h1 className='text-2xl font-bold'>Create Mock Interview</h1>
      </div>
      <AddNewInterview open={true} setOpen={() => { }} jobDetails={jobDetails} jobDetailsId={jobDetailsId} />
    </div>
  );
}

export default function CreateMockInterviewWithSuspense(props) {
  return (
    <Suspense>
      <CreateMockInterview {...props} />
    </Suspense>
  );
} 