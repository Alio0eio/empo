import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/utils/db';
import { CVAnalysis, UserProfile } from '@/utils/schema';
import { eq } from 'drizzle-orm';

const gemini = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const cvAnalysis = await db.select().from(CVAnalysis).where(eq(CVAnalysis.userId, userId));

    if (cvAnalysis.length === 0) {
      return NextResponse.json(
        { error: 'CV analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(cvAnalysis[0]);
  } catch (error) {
    console.error('Error fetching CV analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV analysis' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { cvText, userId, originalFileName, extractedText } = await req.json();

    if (!cvText) {
      return NextResponse.json(
        { error: 'CV text is required' },
        { status: 400 }
      );
    }

    const prompt = `
    Act like an expert natural language processing system specialized in parsing CVs and resumes. Your task is to extract structured data from freeform CV text and return it strictly in JSON format. Do not return any explanations, notes, or additional text—only valid JSON.

    Objective: Analyze a block of CV or resume text and identify the most relevant structured information fields for downstream use in HR software or recruitment systems.

    Instructions:
    Step 1: Carefully read and understand the entire CV text, paying attention to both explicit headings and implied patterns in the content.
    Step 2: Identify and extract the following fields with high accuracy and return them using the precise JSON schema below:
    - name (string): Full name of the person.
    - email (string): Valid email address.
    - phone (string): Valid phone number with or without country code.
    - education (array of objects): Each object should include:
    - degree (e.g., BSc Computer Science)
    - institution (e.g., Stanford University)
    - year (e.g., 2020 or a string range like "2017–2021")
    - experience (array of objects): Each object should include:
    - company (e.g., Microsoft)
    - position (e.g., Software Engineer)
    - duration (e.g., Jan 2019 – Mar 2023)
    - responsibilities (array of strings): One string per responsibility; always return an array even if there's only one item.
    - skills (array of strings): List technical and soft skills.
    - languages (array of strings): Include only human languages mentioned.
    - certifications (array of strings): Include any professional certifications or licenses.

    Step 3: Ensure that the JSON is valid, syntactically correct, and represents all information found. If a section is missing, omit the field entirely rather than returning empty strings or arrays.

    Step 4: Wrap your entire response strictly in JSON format and nothing else.
    
    CV Text:
    ${cvText}

    Take a deep breath and work on this problem step-by-step.`;

    const completion = await gemini.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a CV parser that extracts structured information from CV text. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gemini-2.0-flash",
      response_format: { type: "json_object" },
    });

    const extractedData = JSON.parse(completion.choices[0].message.content);

    // Save CV analysis to database if userId is provided
    let cvAnalysisId = null;
    if (userId) {
      try {
        console.log('Attempting to save CV analysis for userId:', userId);

        const [cvAnalysis] = await db.insert(CVAnalysis).values({
          userId,
          originalFileName: originalFileName || null,
          extractedText: extractedText || cvText,
          parsedData: extractedData,
          analysisStatus: 'completed'
        }).returning({ id: CVAnalysis.id });

        cvAnalysisId = cvAnalysis.id;
        console.log('CV analysis saved with ID:', cvAnalysisId);

        // Check if user profile exists, if not create one
        const existingProfile = await db.select().from(UserProfile).where(UserProfile.userId.eq(userId));
        console.log('Existing profile found:', existingProfile.length > 0);

        if (existingProfile.length === 0 && extractedData.email) {
          // Create user profile from CV data
          console.log('Creating new user profile');
          await db.insert(UserProfile).values({
            userId,
            email: extractedData.email,
            name: extractedData.name || null,
            phone: extractedData.phone || null,
            skills: extractedData.skills || [],
            languages: extractedData.languages || [],
            certifications: extractedData.certifications || [],
            education: extractedData.education || null,
            experience: extractedData.experience || null,
            cvAnalysisId: cvAnalysisId,
            isProfileComplete: false
          });
          console.log('User profile created successfully');
        } else if (existingProfile.length > 0) {
          // Update existing profile with new CV data
          console.log('Updating existing user profile');
          await db.update(UserProfile)
            .set({
              name: extractedData.name || existingProfile[0].name,
              phone: extractedData.phone || existingProfile[0].phone,
              skills: extractedData.skills || existingProfile[0].skills,
              languages: extractedData.languages || existingProfile[0].languages,
              certifications: extractedData.certifications || existingProfile[0].certifications,
              education: extractedData.education || existingProfile[0].education,
              experience: extractedData.experience || existingProfile[0].experience,
              cvAnalysisId: cvAnalysisId,
              updatedAt: new Date()
            })
            .where(UserProfile.userId.eq(userId));
          console.log('User profile updated successfully');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue without saving to database, but still return the parsed data
        console.log('Continuing without database save due to error');
      }
    }

    return NextResponse.json({
      ...extractedData,
      cvAnalysisId,
      saved: !!userId && !!cvAnalysisId
    });
  } catch (error) {
    console.error('Error analyzing CV:', error);
    return NextResponse.json(
      { error: 'Failed to analyze CV', details: error.message },
      { status: 500 }
    );
  }
} 