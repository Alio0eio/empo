import { NextResponse } from 'next/server';
import { createJob, listJobs } from '@/utils/mockJobStore';

// GET /api/mock-jobs - list all mock jobs
export async function GET() {
  try {
    const jobs = listJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error('Error listing mock jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list jobs' },
      { status: 500 }
    );
  }
}

// POST /api/mock-jobs - create a new mock job
export async function POST(req) {
  try {
    const body = await req.json();

    // Minimal validation for dev use
    if (!body.jobTitle || !body.jobDescription) {
      return NextResponse.json(
        { success: false, error: 'jobTitle and jobDescription are required' },
        { status: 400 }
      );
    }

    const job = createJob({
      jobPosition: body.jobTitle,
      jobDescription: body.jobDescription,
      jobCategories: body.jobCategories || [],
      jobTypes: body.jobTypes || [],
      workplace: body.workplace || '',
      country: body.country || '',
      city: body.city || '',
      careerLevel: body.careerLevel || '',
      minExperience: body.minExperience ?? null,
      maxExperience: body.maxExperience ?? null,
      minSalary: body.minSalary ?? null,
      maxSalary: body.maxSalary ?? null,
      currency: body.currency || '',
      period: body.period || '',
      hideSalary: !!body.hideSalary,
      additionalSalary: body.additionalSalary || '',
      vacancies: body.vacancies ?? 1,
      skills: body.skills || '',
      gender: body.gender || '',
      education: body.education || '',
      academicExcellence: !!body.academicExcellence,
      recruiterName: body.recruiterName || 'Demo Recruiter',
      location: body.city && body.country ? `${body.city}, ${body.country}` : body.country || '',
      type: 'Video Interview',
      _type: 'mock',
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error creating mock job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

