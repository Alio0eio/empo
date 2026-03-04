"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  GraduationCap,
  CheckCircle,
} from "lucide-react";

export default function DevJobDetailsPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("devJobs") : null;
      const jobs = raw ? JSON.parse(raw) : [];
      const found = Array.isArray(jobs)
        ? jobs.find((j) => String(j.id) === String(jobId))
        : null;
      setJob(found || null);
    } catch (e) {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-[#be3144] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <h2 className="text-2xl font-bold text-[#be3144] mb-4">Job Not Found</h2>
        <p className="text-[#8e575f] mb-6 max-w-md text-center">
          This job is no longer available.
        </p>
        <Button onClick={() => router.push("/job-seeker/jobs")}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  const location =
    job.city && job.country
      ? `${job.city}, ${job.country}`
      : job.city || job.country || "Location not specified";

  const experienceText =
    job.minExperience || job.maxExperience
      ? `${job.minExperience ?? "0"} - ${job.maxExperience ?? "N/A"} yrs`
      : "Not specified";

  const salaryText =
    job.minSalary || job.maxSalary
      ? `${job.minSalary ?? "?"} - ${job.maxSalary ?? "?"} ${job.currency || ""}`
      : "Not specified";

  const responsibilities = (job.jobRequirements || "")
    .split(/\r?\n|•|- /)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/job-seeker/jobs")}
            className="text-[#be3144] hover:text-[#a82a3d] hover:bg-[#f1e9ea] -ml-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-[#191011] text-center flex-1">
            {job.jobPosition}
          </h1>
          <div className="w-[90px]" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          {/* Job Title & Company */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#191011] mb-2">
                {job.jobPosition}
              </h1>
              <p className="text-lg text-[#8e575f] font-medium">
                {job.recruiterName || "Demo Recruiter"}
              </p>
            </div>
            <div className="shrink-0">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-[#be3144] to-[#f05941] flex items-center justify-center text-white font-bold text-2xl">
                {job.jobPosition?.charAt(0).toUpperCase() || "J"}
              </div>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
            {/* Location */}
            <div>
              <p className="text-xs text-[#8e575f] uppercase font-semibold tracking-wider mb-1">
                Location
              </p>
              <p className="text-sm sm:text-base font-semibold text-[#191011] flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#be3144]" />
                {location}
              </p>
            </div>

            {/* Job Type */}
            {Array.isArray(job.jobTypes) && job.jobTypes.length > 0 && (
              <div>
                <p className="text-xs text-[#8e575f] uppercase font-semibold tracking-wider mb-1">
                  Job Type
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#191011]">
                  {job.jobTypes.join(", ")}
                </p>
              </div>
            )}

            {/* Workplace */}
            {job.workplace && (
              <div>
                <p className="text-xs text-[#8e575f] uppercase font-semibold tracking-wider mb-1">
                  Work Style
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#191011]">
                  {job.workplace}
                </p>
              </div>
            )}

            {/* Salary */}
            {(job.minSalary || job.maxSalary) && (
              <div>
                <p className="text-xs text-[#8e575f] uppercase font-semibold tracking-wider mb-1">
                  Salary
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#be3144] flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {salaryText}
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button className="w-full bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#f05941] hover:to-[#be3144] text-white font-semibold text-base py-6 rounded-lg">
            Apply Now
          </Button>
        </section>

        {/* About the Role */}
        {job.jobDescription && (
          <section className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[#191011] mb-4">About the Role</h2>
            <p className="text-[#191011] leading-relaxed whitespace-pre-line text-base">
              {job.jobDescription}
            </p>
          </section>
        )}

        {/* Two Column Section - Requirements & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requirements */}
          {responsibilities.length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-[#191011] mb-4 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-[#be3144]" />
                Requirements
              </h2>
              <ul className="space-y-3">
                {responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#be3144] shrink-0 mt-0.5" />
                    <span className="text-[#191011]">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills */}
          {job.skills && (
            <section className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-[#191011] mb-4">Required Skills</h2>
              <p className="text-[#191011] leading-relaxed whitespace-pre-line">
                {job.skills}
              </p>
            </section>
          )}
        </div>

        {/* Experience and Education Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Experience */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-[#be3144]" />
              <h3 className="text-lg font-bold text-[#191011]">Experience</h3>
            </div>
            <p className="text-2xl font-bold text-[#be3144]">{experienceText}</p>
          </section>

          {/* Education */}
          {job.education && (
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-[#be3144]" />
                <h3 className="text-lg font-bold text-[#191011]">Education</h3>
              </div>
              <p className="text-base font-semibold text-[#191011]">{job.education}</p>
            </section>
          )}

          {/* Career Level */}
          {job.careerLevel && (
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#be3144]" />
                <h3 className="text-lg font-bold text-[#191011]">Career Level</h3>
              </div>
              <p className="text-base font-semibold text-[#191011]">{job.careerLevel}</p>
            </section>
          )}
        </div>

        {/* Categories */}
        {Array.isArray(job.jobCategories) && job.jobCategories.length > 0 && (
          <section className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[#191011] mb-4">Job Categories</h2>
            <div className="flex flex-wrap gap-2">
              {job.jobCategories.map((category, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#be3144] to-[#f05941] text-white text-sm font-semibold"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {job.vacancies && (
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-[#191011] mb-3">Vacancies</h3>
              <p className="text-2xl font-bold text-[#be3144]">{job.vacancies}</p>
            </section>
          )}

          {job.gender && (
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-[#191011] mb-3">Gender Preference</h3>
              <p className="text-base text-[#191011] font-semibold">{job.gender}</p>
            </section>
          )}

          {job.additionalSalary && (
            <section className="bg-white rounded-lg border border-gray-200 p-6 md:col-span-2">
              <h3 className="text-lg font-bold text-[#191011] mb-3">Additional Salary Info</h3>
              <p className="text-[#191011] leading-relaxed whitespace-pre-line">
                {job.additionalSalary}
              </p>
            </section>
          )}

          {job.benefitsDescription && (
            <section className="bg-white rounded-lg border border-gray-200 p-6 md:col-span-2">
              <h3 className="text-lg font-bold text-[#191011] mb-3">Benefits</h3>
              <p className="text-[#191011] leading-relaxed whitespace-pre-line">
                {job.benefitsDescription}
              </p>
            </section>
          )}
        </div>

        {/* Company Info Footer */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[#191011] mb-4">About the Company</h2>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-[#be3144] to-[#f05941] flex items-center justify-center text-white font-bold text-lg shrink-0">
              {(job.recruiterName || "D").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-[#191011]">
                {job.recruiterName || "Demo Recruiter"}
              </p>
              <p className="text-sm text-[#8e575f]">{location}</p>
            </div>
          </div>
          <p className="text-[#191011] leading-relaxed">
            {job.companyDescription || "Company information coming soon."}
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-r from-[#be3144] to-[#f05941] rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Apply?</h2>
          <p className="mb-6 text-white/90">
            Take the next step in your career and apply for this position today.
          </p>
          <Button className="bg-white text-[#be3144] hover:bg-gray-100 font-semibold text-base px-8 py-3 rounded-lg">
            Apply Now
          </Button>
        </section>
      </main>
    </div>
  );
}

