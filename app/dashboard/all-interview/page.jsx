"use client"
import { Button } from '@/components/ui/button';
import { db } from '@/utils/db';
import { callInterview } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import { Video, Briefcase } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import CallInterviewCard from '../_components/CallInterviewCard';
import PostedJobCard from '../_components/PostedJobCard';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';


function AllInterview() {
  const [interviewList, setInterviewList] = useState([]);
  const [allJobsList, setAllJobsList] = useState([]);
    const { user } = useUser();

    useEffect(() => {
        if (user) {
            GetInterviewList();
            GetAllJobs();
        }
    }, [user]);

    const GetInterviewList = async () => {
        try {
            const result = await db
                .select()
                .from(callInterview)
                .where(eq(callInterview.recruiterEmail, user?.primaryEmailAddress?.emailAddress || ''))
                .orderBy(desc(callInterview.createdAt))
            setInterviewList(result);
        } catch (error) {
            console.error("Error fetching interviews:", error);
        }
    };

    const GetAllJobs = () => {
        try {
            if (typeof window !== 'undefined') {
                const raw = window.localStorage.getItem('devJobs');
                const jobs = raw ? JSON.parse(raw) : [];
                
                // Get ALL jobs created by current recruiter (including deleted ones)
                const recruiterEmail = user?.primaryEmailAddress?.emailAddress || '';
                const recruiterJobs = jobs.filter(job => 
                    job.recruiterEmail === recruiterEmail || !job.recruiterEmail
                );
                
                // Sort newest first
                recruiterJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAllJobsList(recruiterJobs);
            }
        } catch (error) {
            console.error("Error loading all jobs from localStorage:", error);
        }
    };

    const handleRestoreJob = (jobId) => {
        try {
            if (typeof window !== 'undefined') {
                const raw = window.localStorage.getItem('devJobs');
                const jobs = raw ? JSON.parse(raw) : [];
                
                // Restore the job by removing deleted flag
                const updatedJobs = jobs.map(job => 
                    job.id === jobId ? { ...job, deleted: false, deletedAt: null } : job
                );
                
                // Update localStorage
                window.localStorage.setItem('devJobs', JSON.stringify(updatedJobs));
                
                // Update state - reload all jobs
                GetAllJobs();
            }
        } catch (error) {
            console.error("Error restoring job:", error);
        }
    };

    const handleDeleteJob = () => {
        GetAllJobs();
    };

    const totalJobs = allJobsList.length;
    const activeJobs = allJobsList.filter(job => !job.deleted).length;
    const deletedJobs = allJobsList.filter(job => job.deleted).length;

    return (
        <div className='my-5'>
            <div className='mb-8'>
                <h2 className='font-bold text-3xl text-gray-900 mb-2'>All Posted Jobs</h2>
                <p className='text-gray-600'>Overview of all jobs you've created, including deleted ones</p>
            </div>

            {/* Stats Section */}
            <div className='grid grid-cols-3 gap-4 mb-8'>
                <div className='bg-white rounded-lg p-4 border border-[#E4D3D5] shadow-sm'>
                    <div className='text-gray-600 text-sm font-medium'>Total Jobs</div>
                    <div className='text-3xl font-bold text-gray-900 mt-1'>{totalJobs}</div>
                </div>
                <div className='bg-white rounded-lg p-4 border border-[#E4D3D5] shadow-sm'>
                    <div className='text-gray-600 text-sm font-medium'>Active</div>
                    <div className='text-3xl font-bold text-[#be3144] mt-1'>{activeJobs}</div>
                </div>
                <div className='bg-white rounded-lg p-4 border border-[#E4D3D5] shadow-sm'>
                    <div className='text-gray-600 text-sm font-medium'>Deleted</div>
                    <div className='text-3xl font-bold text-red-500 mt-1'>{deletedJobs}</div>
                </div>
            </div>

            {/* Interview Section */}
            <div className='mb-10'>
                <h3 className='font-bold text-xl text-gray-900 mb-4 flex items-center gap-2'>
                    <Video className='h-5 w-5 text-[#be3144]' />
                    Call & Video Interviews
                </h3>
                {interviewList.length === 0 ? (
                    <div className='p-8 text-center'>
                        <p className='text-gray-600'>No interviews created yet</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-2 mt-5 xl:grid-cols-3 gap-5'>
                        {interviewList.map((interview, index) => (
                            <CallInterviewCard interview={interview} key={index} />
                        ))}
                    </div>
                )}
            </div>

            {/* Posted Jobs Section */}
            <div>
                <h3 className='font-bold text-xl text-gray-900 mb-4 flex items-center gap-2'>
                    <Briefcase className='h-5 w-5 text-[#be3144]' />
                    Posted Jobs
                </h3>
                {allJobsList.length === 0 ? (
                    <div className='p-8 text-center'>
                        <Briefcase className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                        <p className='text-gray-600 mb-4'>You haven't posted any jobs yet</p>
                        <Link href="/dashboard/post-job">
                            <Button className='bg-gradient-to-r from-[#A31D1D] to-[#C53030] hover:from-[#C53030] hover:to-[#E53E3E]'>
                                + Post a New Job
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                        {allJobsList.map((job, index) => {
                            if (job.deleted) {
                                return (
                                    <div key={`job-${index}`} className='relative'>
                                        <div className='absolute inset-0 bg-gray-400 opacity-30 rounded-2xl pointer-events-none'></div>
                                        <PostedJobCard 
                                            job={job} 
                                            viewDetail={true}
                                            onDelete={() => {}} 
                                            isDeleted={true}
                                            onRestore={handleRestoreJob}
                                        />
                                    </div>
                                );
                            }
                            return (
                                <div key={`job-${index}`}>
                                    <PostedJobCard job={job} viewDetail={true} onDelete={handleDeleteJob} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}


export default AllInterview