"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCallInterview } from '@/utils/devInterviewStore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function JobDetailsPage() {
  const { job_id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (job_id) fetchJob();
    // eslint-disable-next-line
  }, [job_id]);

  const fetchJob = async () => {
    try {
      // Read from localStorage (dev mode)
      const interview = getCallInterview(job_id);
      setJob(interview);
    } catch (error) {
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fbf9f9] to-[#f1e9ea]">
        <Loader2 className="w-10 h-10 animate-spin text-[#be3144]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#fbf9f9] to-[#f1e9ea] p-8">
        <h2 className="text-2xl font-bold text-[#be3144] mb-4">Job Not Found</h2>
        <p className="text-[#8e575f] mb-6">The job you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/job-seeker/jobs')}>Back to Jobs</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f9] to-[#f1e9ea]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[#f1e9ea] px-6 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/job-seeker/jobs')} className="flex items-center gap-2 text-[#be3144] hover:text-[#a82a3d] font-medium">
            <ArrowLeft className="w-5 h-5" />
            Back to Jobs
          </Button>
          <h1 className="text-xl font-bold text-[#191011]">Job Details</h1>
          <div></div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-[#e4d3d5] p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-[#be3144] to-[#f05941] flex items-center justify-center text-white font-bold text-2xl">
              {job.jobPosition?.charAt(0) || 'J'}
            </div>
            <div>
              <h2 className="font-bold text-2xl text-[#191011] mb-1">{job.jobPosition}</h2>
              <span className="text-sm text-[#8e575f]">{job.recruiterName || 'Employer'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded bg-[#f1e9ea] text-sm text-[#be3144] font-medium">
              {job.type || 'Interview'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded bg-[#f1e9ea] text-sm text-[#be3144] font-medium">
              {job.duration || 'N/A'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-[#be3144] mb-2">Job Description</h3>
            <p className="text-[#191011] text-base whitespace-pre-line">{job.jobDescription || 'No description provided.'}</p>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#f05941] hover:to-[#ff7b54] text-white text-lg mt-4"
            size="lg"
            onClick={() => router.push(`/job-seeker/Call-Interview/${job.job_id}`)}
          >
            Start Interview
          </Button>
        </div>
      </main>
    </div>
  );
} 