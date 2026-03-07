import { QUESTION_PROMPT } from '@/utils/Constants';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemMessage = {
  role: "system",
  content: "You are a helpful AI assistant skilled at generating structured interview questions. Always respond with valid JSON only, no markdown or extra text.",
};

export async function POST(req) {
  const { jobPosition, jobDescription, duration, type } = await req.json();

  // Validate input
  if (!jobPosition || !jobDescription || !duration || !type) {
    return NextResponse.json(
      { error: 'Missing required fields: jobPosition, jobDescription, duration, type' },
      { status: 400 }
    );
  }

  const FINAL_PROMPT = QUESTION_PROMPT
    .replace('{{jobTitle}}', jobPosition)
    .replace('{{jobDescription}}', jobDescription)
    .replace('{{duration}}', duration)
    .replace('{{type}}', type);

  try {
    const gemini = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const completion = await gemini.chat.completions.create({
      model: "gemini-2.0-flash",
      temperature: 0.7,
      top_p: 0.9,
      messages: [
        systemMessage,
        {
          role: "user",
          content: FINAL_PROMPT,
        },
      ],
    });

    const responseContent = completion.choices[0].message.content;

    // Validate that response is valid JSON
    try {
      JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Invalid JSON response from Gemini:', responseContent);
      return NextResponse.json(
        { error: 'Failed to parse AI response as valid JSON' },
        { status: 500 }
      );
    }

    // Return the full message object with content
    return NextResponse.json(completion.choices[0].message);
  } catch (e) {
    console.error('Error generating questions:', e);
    return NextResponse.json(
      { error: 'Failed to generate questions: ' + (e.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
