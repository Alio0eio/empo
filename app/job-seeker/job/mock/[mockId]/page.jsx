"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrCreateMockInterview } from '@/utils/devInterviewStore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function MockJobDetailsPage() {
  const { mockId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mockId) fetchJob();
    // eslint-disable-next-line
  }, [mockId]);

  const fetchJob = async () => {
    try {
      // Read from localStorage (dev mode)
      const interview = await getOrCreateMockInterview(mockId);
      setJob(interview);
    } catch (error) {
      setJob(null);
      setJobDetails(null);
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
              <span className="text-sm text-[#8e575f]">{job.createdBy || 'Employer'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded bg-[#f1e9ea] text-sm text-[#be3144] font-medium">
              Video Interview
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded bg-[#f1e9ea] text-sm text-[#be3144] font-medium">
              {job.jobExperience ? `${job.jobExperience} years experience` : 'N/A'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-[#be3144] mb-2">Job Description</h3>
            <p className="text-[#191011] text-base whitespace-pre-line">{job.jobDesc || 'No description provided.'}</p>
          </div>
          {jobDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><b>Job Title:</b> {jobDetails.jobTitle}</div>
              <div><b>Categories:</b> {jobDetails.jobCategories?.join(', ')}</div>
              <div><b>Types:</b> {jobDetails.jobTypes?.join(', ')}</div>
              <div><b>Workplace:</b> {jobDetails.workplace}</div>
              <div><b>Country:</b> {jobDetails.country}</div>
              <div><b>City:</b> {jobDetails.city}</div>
              <div><b>Career Level:</b> {jobDetails.careerLevel}</div>
              <div><b>Experience:</b> {jobDetails.minExperience} - {jobDetails.maxExperience}</div>
              <div><b>Salary:</b> {jobDetails.minSalary} - {jobDetails.maxSalary} {jobDetails.currency} ({jobDetails.period})</div>
              <div><b>Vacancies:</b> {jobDetails.vacancies}</div>
              <div><b>Job Description:</b> {jobDetails.jobDescription}</div>
              <div><b>Requirements:</b> {jobDetails.jobRequirements}</div>
              <div><b>Skills:</b> {jobDetails.skills}</div>
              <div><b>Gender:</b> {jobDetails.gender}</div>
              <div><b>Education:</b> {jobDetails.education}</div>
              <div><b>Academic Excellence:</b> {jobDetails.academicExcellence ? 'Yes' : 'No'}</div>
              <div><b>Created At:</b> {new Date(jobDetails.createdAt).toLocaleString()}</div>
            </div>
          )}
          <Button
            className="w-full bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#f05941] hover:to-[#ff7b54] text-white text-lg mt-4"
            size="lg"
            onClick={() => router.push(`/interview/${job.mockId}`)}
          >
            Start Interview
          </Button>
        </div>
      </main>
    </div>
  );
} 