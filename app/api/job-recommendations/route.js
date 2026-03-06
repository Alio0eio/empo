import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { UserProfile, JobDetails, JobRecommendation, callInterview, MockInterview } from '@/utils/schema';
import { eq, and, or, like, inArray } from 'drizzle-orm';

// Helper to safely serialize any value to JSON
function safeJsonSerialize(obj, depth = 0) {
  if (depth > 10) return null; // Prevent infinite recursion
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (typeof obj !== 'object') {
    return obj; // primitives are already safe
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => safeJsonSerialize(item, depth + 1));
  }
  
  // For objects, create a new object with only safe properties
  const safe = {};
  for (const key of Object.keys(obj)) {
    if (
      key !== 'prototype' &&
      typeof obj[key] !== 'function' &&
      !key.startsWith('$$')
    ) {
      safe[key] = safeJsonSerialize(obj[key], depth + 1);
    }
  }
  return safe;
}

// Helper function to serialize job objects for JSON response
function serializeJobObject(job) {
  if (!job) return null;
  
  const serialized = {};
  
  // Only copy specific safe properties
  const safeProps = [
    'id', 'job_id', 'mockId', 'jobTitle', 'jobPosition', 'jobDescription', 'jobDesc',
    'company', 'recruiterName', 'createdBy', 'location', 'city', 'skills', 'category',
    'duration', 'type', 'careerLevel', 'experience', 'minExperience', '_type'
  ];
  
  safeProps.forEach(prop => {
    if (job.hasOwnProperty(prop)) {
      let value = job[prop];
      // Convert Date to ISO string
      if (value instanceof Date) {
        value = value.toISOString();
      }
      serialized[prop] = value;
    }
  });
  
  // Explicitly handle createdAt
  if (job.createdAt) {
    if (job.createdAt instanceof Date) {
      serialized.createdAt = job.createdAt.toISOString();
    } else {
      serialized.createdAt = job.createdAt;
    }
  }
  
  return serialized;
}

// Helper function to serialize user profile for JSON response
function serializeUserProfile(userProfile) {
  if (!userProfile) return null;
  
  return {
    name: userProfile.name,
    skills: userProfile.skills,
    experience: userProfile.experience,
    currentPosition: userProfile.currentPosition,
  };
}

// Mock data for development when database is not available
function getMockUserProfile(userId) {
  return {
    id: 1,
    userId: userId,
    name: 'John Developer',
    email: `user_${userId}@example.com`,
    currentPosition: 'Full Stack Developer',
    currentCompany: 'Tech Corp',
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
    experience: [
      { title: 'Senior Developer', company: 'Tech Corp', duration: '2 years' },
      { title: 'Developer', company: 'StartupXYZ', duration: '3 years' }
    ],
    education: [
      { degree: 'BS', field: 'Computer Science', institution: 'University of California' }
    ]
  };
}

function getMockJobs() {
  return [
    {
      id: 'job_1',
      job_id: 'job_1',
      _type: 'call',
      type: 'Call Interview',
      jobTitle: 'Senior React Developer',
      jobPosition: 'Senior React Developer',
      jobDescription: 'We are looking for an experienced React developer with 5+ years of experience. Must have strong knowledge of TypeScript and modern testing frameworks.',
      recruiterName: 'Jane Smith',
      location: 'San Francisco, CA',
      city: 'San Francisco, CA',
      skills: 'React,TypeScript,JavaScript,Node.js',
      category: 'Software Development',
      duration: '60 minutes',
      createdAt: new Date('2024-02-01')
    },
    {
      id: 'job_2',
      job_id: 'job_2',
      _type: 'call',
      type: 'Call Interview',
      jobTitle: 'Full Stack Engineer',
      jobPosition: 'Full Stack Engineer',
      jobDescription: 'Join our growing team as a Full Stack Engineer. Work with React, Node.js, and PostgreSQL. We value clean code and collaboration.',
      recruiterName: 'Bob Johnson',
      location: 'New York, NY',
      city: 'New York, NY',
      skills: 'React,Node.js,PostgreSQL,JavaScript',
      category: 'Software Development',
      duration: '60 minutes',
      createdAt: new Date('2024-02-05')
    },
    {
      id: 'mock_1',
      mockId: 'mock_1',
      _type: 'mock',
      type: 'Video Interview',
      jobTitle: 'Python Backend Developer',
      jobPosition: 'Python Backend Developer',
      jobDesc: 'Python backend development role focusing on API design and database optimization. Experience with FastAPI, PostgreSQL, and Docker required.',
      jobDescription: 'Python backend development role focusing on API design and database optimization. Experience with FastAPI, PostgreSQL, and Docker required.',
      createdBy: 'Alice Williams',
      location: 'Austin, TX',
      city: 'Austin, TX',
      skills: 'Python,FastAPI,PostgreSQL,Docker',
      category: 'Software Development',
      createdAt: new Date('2024-01-28')
    },
    {
      id: 'mock_2',
      mockId: 'mock_2',
      _type: 'mock',
      type: 'Video Interview',
      jobTitle: 'DevOps Engineer',
      jobPosition: 'DevOps Engineer',
      jobDesc: 'Looking for a DevOps engineer to manage our cloud infrastructure on AWS. Experience with Kubernetes, CI/CD pipelines, and infrastructure as code.',
      jobDescription: 'Looking for a DevOps engineer to manage our cloud infrastructure on AWS. Experience with Kubernetes, CI/CD pipelines, and infrastructure as code.',
      createdBy: 'Charlie Brown',
      location: 'Seattle, WA',
      city: 'Seattle, WA',
      skills: 'AWS,Kubernetes,Docker,CI/CD',
      category: 'DevOps',
      createdAt: new Date('2024-02-10')
    },
    {
      id: 'job_3',
      job_id: 'job_3',
      _type: 'call',
      type: 'Call Interview',
      jobTitle: 'JavaScript/Node.js Developer',
      jobPosition: 'JavaScript/Node.js Developer',
      jobDescription: 'Build scalable backend systems using Node.js and Express. Work with MongoDB and Redis for data persistence and caching.',
      recruiterName: 'Emma Davis',
      location: 'Boston, MA',
      city: 'Boston, MA',
      skills: 'Node.js,JavaScript,MongoDB,Redis',
      category: 'Software Development',
      duration: '45 minutes',
      createdAt: new Date('2024-02-03')
    }
  ];
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit')) || 10;
    if (!userId) {
      return NextResponse.json(
        safeJsonSerialize({ error: 'userId is required' }),
        { status: 400 }
      );
    }

    console.log('Generating recommendations for userId:', userId);

    // Try to load real user profile from DB, fall back to mock profile
    let userProfile = null;
    try {
      const userProfiles = await db
        .select()
        .from(UserProfile)
        .where(eq(UserProfile.userId, userId));
      if (userProfiles.length > 0) {
        userProfile = userProfiles[0];
      }
    } catch (dbError) {
      console.error('Error loading UserProfile from DB, using mock profile instead:', dbError.message);
    }

    if (!userProfile) {
      userProfile = getMockUserProfile(userId);
    }

    // Load latest jobs from DB (call + mock interviews), with graceful fallback to mock jobs
    let allJobs = [];
    let usedDbJobs = false;
    try {
      // Load call interviews
      const callJobs = await db.select().from(callInterview);

      // Load visible mock interviews
      const mockJobs = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.isHidden, false));

      // Collect related JobDetails for richer AI matching (skills, location, etc.)
      const jobDetailsIds = [...callJobs, ...mockJobs]
        .map((job) => job.jobDetailsId)
        .filter((id) => id !== null && id !== undefined);

      let jobDetailsMap = new Map();
      if (jobDetailsIds.length > 0) {
        const uniqueIds = Array.from(new Set(jobDetailsIds));
        const jobDetailsRows = await db
          .select()
          .from(JobDetails)
          .where(inArray(JobDetails.id, uniqueIds));
        jobDetailsMap = new Map(jobDetailsRows.map((jd) => [jd.id, jd]));
      }

      // Normalize call interview jobs into a unified "job" shape used by the matcher
      const callJobsNormalized = callJobs.map((job) => {
        const details = jobDetailsMap.get(job.jobDetailsId) || {};
        return {
          id: job.job_id || job.id,
          job_id: job.job_id,
          _type: 'call',
          type: 'Call Interview',
          jobTitle: details.jobTitle || job.jobPosition || details.jobTitle,
          jobPosition: job.jobPosition || details.jobTitle,
          jobDescription: details.jobDescription || job.jobDescription,
          jobDesc: details.jobDescription || job.jobDescription,
          recruiterName: job.recruiterName,
          createdBy: job.recruiterName,
          location: details.city,
          city: details.city,
          skills: details.skills || '',
          category: job.category || (Array.isArray(details.jobCategories) ? details.jobCategories[0] : null),
          duration: job.duration,
          createdAt: job.createdAt,
        };
      });

      // Normalize mock interview jobs into the same shape
      const mockJobsNormalized = mockJobs.map((job) => {
        const details = jobDetailsMap.get(job.jobDetailsId) || {};
        return {
          id: job.mockId || job.id,
          mockId: job.mockId,
          _type: 'mock',
          type: 'Video Interview',
          jobTitle: details.jobTitle || job.jobPosition,
          jobPosition: job.jobPosition || details.jobTitle,
          jobDescription: details.jobDescription || job.jobDesc,
          jobDesc: job.jobDesc || details.jobDescription,
          createdBy: job.createdBy,
          recruiterName: job.createdBy,
          location: details.city,
          city: details.city,
          skills: details.skills || job.skills || '',
          category: job.category || (Array.isArray(details.jobCategories) ? details.jobCategories[0] : null),
          createdAt: job.createdAt ? new Date(job.createdAt) : undefined,
        };
      });

      allJobs = [...callJobsNormalized, ...mockJobsNormalized];
      usedDbJobs = allJobs.length > 0;
    } catch (dbError) {
      console.error('Error loading jobs from DB, falling back to mock jobs:', dbError.message);
    }

    // Final fallback to hard-coded mock jobs if DB is unavailable or empty
    if (!usedDbJobs) {
      console.log('Using mock jobs as fallback for recommendations and latest jobs');
      allJobs = getMockJobs();
    }

    if (allJobs.length === 0) {
      return NextResponse.json(
        safeJsonSerialize({
          recommendations: [],
          userProfile: serializeUserProfile(userProfile),
          message: 'No jobs available for recommendations'
        })
      );
    }

    console.log('User profile:', userProfile.name || userProfile.userId || 'Unknown');
    console.log('All jobs count:', allJobs.length);
    console.log('Job titles:', allJobs.map(j => j.jobTitle || j.jobPosition).join(', '));

    // Dynamically import jobMatcherService to avoid build issues
    let jobMatcherService;
    let modelStatus = { isLoaded: false, message: 'Model not available in server environment' };
    let recommendations = [];
    
    try {
      const jobMatcherModule = await import('@/utils/jobMatcherModel');
      jobMatcherService = jobMatcherModule.default;
      
      // Generate recommendations using the job matcher service
      // This will automatically use fallback if model is not available
      recommendations = await jobMatcherService.generateRecommendations(
        userProfile,
        allJobs,
        limit
      );
      
      modelStatus = await jobMatcherService.getModelStatus();
    } catch (error) {
      console.log('Job matcher model not available:', error.message);
      // Use basic fallback recommendations
      // Basic fallback: treat all jobs as equally available and score by position
      recommendations = allJobs.slice(0, limit).map((job, index) => ({
        jobId: job.id,
        jobTitle: job.jobTitle || job.jobPosition,
        company: job.recruiterName || job.createdBy || job.company || job.city,
        city: job.city,
        matchScore: Math.max(50, 100 - index * 5), // Basic scoring
        reason: 'Based on available interview listings',
        job: job,
      }));
    }

    console.log('Recommendations count:', recommendations?.length || 0);
    if (recommendations?.length > 0) {
      console.log('First recommendation keys:', Object.keys(recommendations[0]));
    } else {
      console.log('No recommendations generated, using fallback');
    }
    
    // Ensure recommendations is always an array
    if (!Array.isArray(recommendations)) {
      console.warn('Recommendations is not an array, defaulting to empty array');
      recommendations = [];
    }

    // Save recommendations to database - but skip if jobDetailsId is missing
    // Since we're using callInterview and MockInterview tables, we don't have jobDetailsId
    // We'll just return the recommendations without saving to JobRecommendation table
    console.log('Skipping database save for recommendations (using call/mock interviews)');

    // Attach _type and ids to each recommendation (copy from job object to top level)
    const recommendationsWithJobFields = recommendations.map(rec => {
      const serializedJob = serializeJobObject(rec.job);
      
      // Ensure createdAt is properly serialized at top level
      let createdAt = rec.job?.createdAt;
      if (createdAt instanceof Date) {
        createdAt = createdAt.toISOString();
      }
      
      return {
        jobId: rec.jobId,
        jobTitle: rec.jobTitle,
        company: rec.company,
        location: rec.location || rec.city,
        matchScore: rec.matchScore,
        reason: rec.reason,
        _type: rec.job?._type,
        job_id: rec.job?.job_id,
        mockId: rec.job?.mockId,
        jobDescription: rec.job?.jobDescription || rec.job?.jobDesc,
        jobPosition: rec.job?.jobPosition,
        createdAt: createdAt,
        recruiterName: rec.job?.recruiterName,
        createdBy: rec.job?.createdBy,
        city: rec.job?.city || rec.location,
        job: serializedJob,
      };
    });

    // Format latest jobs (newest first) without any matching/scoring
    const latestJobsFormatted = [...allJobs]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      })
      .map(job => {
      const serializedJob = serializeJobObject(job);
      
      let createdAt = job.createdAt;
      if (createdAt instanceof Date) {
        createdAt = createdAt.toISOString();
      }
      
      return {
        jobId: job.id,
        jobTitle: job.jobTitle || job.jobPosition,
        company: job.recruiterName || job.createdBy || job.company || job.city,
        location: job.city || job.location,
        _type: job._type,
        job_id: job.job_id,
        mockId: job.mockId,
        jobDescription: job.jobDescription || job.jobDesc,
        jobPosition: job.jobPosition || job.jobTitle,
        createdAt: createdAt,
        recruiterName: job.recruiterName,
        createdBy: job.createdBy,
        city: job.city || job.location,
        job: serializedJob,
      };
    }).slice(0, limit);

    return NextResponse.json(
      safeJsonSerialize({
        recommendations: recommendationsWithJobFields,
        latestJobs: latestJobsFormatted,
        userProfile: serializeUserProfile(userProfile),
        modelStatus
      })
    );
  } catch (error) {
    console.error('Error generating job recommendations:', error);
    return NextResponse.json(
      safeJsonSerialize({
        error: 'Failed to generate job recommendations',
        details: error.message 
      }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { userId, jobDetailsId, action } = await req.json();

    if (!userId || !jobDetailsId || !action) {
      return NextResponse.json(
        { error: 'userId, jobDetailsId, and action are required' },
        { status: 400 }
      );
    }

    // Update recommendation status
    const updateData = {};
    if (action === 'view') {
      updateData.isViewed = true;
    } else if (action === 'apply') {
      updateData.isApplied = true;
    }

    const [updatedRecommendation] = await db.update(JobRecommendation)
      .set(updateData)
      .where(and(
        eq(JobRecommendation.userId, userId),
        eq(JobRecommendation.jobDetailsId, jobDetailsId)
      ))
      .returning();

    return NextResponse.json(updatedRecommendation);
  } catch (error) {
    console.error('Error updating job recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update job recommendation' },
      { status: 500 }
    );
  }
} 