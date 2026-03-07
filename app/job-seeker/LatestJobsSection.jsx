import Link from 'next/link';
import { ArrowRight, User, Loader2 } from 'lucide-react';
import React from 'react';

export default function LatestJobsSection({ allJobs, loadingJobs = false }) {
  return (
    <section className="mb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">Latest Job Openings</h2>
          <p className="text-gray-500">Newest jobs uploaded by recruiters</p>
        </div>
        <Link href="/job-seeker/jobs" className="text-[#FF4B4B] font-semibold hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {loadingJobs ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF4B4B]" />
          <span className="ml-2 text-gray-500">Loading jobs...</span>
        </div>
      ) : allJobs && allJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allJobs.slice(0, 8).map((job, idx) => {
            // For now, all jobs come from the Job Openings page (localStorage 'devJobs').
            // "Apply" should first take the user to the job details page.
            const detailsRoute = job?.id
              ? `/job-seeker/jobs/dev/${job.id}`
              : '/job-seeker/jobs';

            // Generate deterministic random data for UI demo purposes
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const letter = job.jobPosition ? job.jobPosition.charAt(0).toUpperCase() : "J";
            const bgColors = ["bg-blue-50 text-blue-600", "bg-purple-50 text-purple-600", "bg-orange-50 text-orange-600", "bg-green-50 text-green-600"];
            const colorClass = bgColors[idx % bgColors.length];

            // Mock tags based on job title words
            const tags = [];
            const jobPositionText = (job?.jobPosition || '').toLowerCase();
            if (jobPositionText.includes('react') || jobPositionText.includes('frontend')) tags.push('React', 'Frontend');
            else if (jobPositionText.includes('backend') || jobPositionText.includes('node')) tags.push('Node.js', 'Backend');
            else if (jobPositionText.includes('manager')) tags.push('Management', 'Agile');
            else tags.push('Full Time', 'Remote');

            // Mock salary
            const minSalary = 80 + (idx * 5);
            const maxSalary = minSalary + 30;

            return (
              <div
                key={job.job_id || job.mockId || idx}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl ${colorClass}`}>
                    {letter}
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                  </button>
                </div>

                <h3 className="font-bold text-[#1a1a1a] text-xl mb-2 line-clamp-1" title={job.jobPosition}>
                  {job.jobPosition}
                </h3>

                <div className="text-sm text-gray-500 mb-6 flex items-center font-medium">
                  <span>{(job.recruiterName || 'Tech Corp Inc.')}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span>{job.location || 'Remote'}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {tags.map((tag, i) => (
                    <span key={i} className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium mb-1">Salary</span>
                    <span className="text-base font-bold text-[#1a1a1a]">${minSalary}k - ${maxSalary}k</span>
                  </div>
                  <Link
                    href={detailsRoute}
                    className="bg-[#1a1a1a] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-black transition-all hover:shadow-lg active:scale-95"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12 text-lg bg-gray-50 rounded-2xl border border-gray-100">
          No jobs available at the moment.
        </div>
      )}
    </section>
  );
}

// Helper function for time ago
function timeAgo(date) {
  const now = new Date();
  const posted = new Date(date);
  const diff = Math.floor((now - posted) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return posted.toLocaleDateString();
} 