import { FEEDBACK_PROMPT } from '@/utils/Constants';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemMessage = {
  role: "system",
  content: "You are a helpful AI assistant skilled at generating structured interview questions and giving feedback.",
};

export async function POST(req) {
  const { conversation } = await req.json();

  const FINAL_PROMPT = FEEDBACK_PROMPT
    .replace('{{conversation}}', JSON.stringify(conversation));

  try {
    const gemini = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const completion = await gemini.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        systemMessage,
        {
          role: "user",
          content: FINAL_PROMPT,
        },
      ],
    });

    return NextResponse.json(completion.choices[0].message);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
