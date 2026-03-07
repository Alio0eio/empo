import { NextResponse } from 'next/server';

export async function POST(req) {
  const { cvText } = await req.json();

  // Call Gemini API for feedback (OpenAI-compatible endpoint)
  const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemini-2.0-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a professional career coach and CV reviewer.',
        },
        {
          role: 'user',
          content: `Please review the following CV and provide detailed, actionable feedback for improvement:\n\n${cvText}`,
        },
      ],
      max_tokens: 500,
    }),
  });

  const data = await geminiRes.json();
  console.log('Gemini response:', data);
  const feedback = data.choices?.[0]?.message?.content || 'No feedback generated.';

  return NextResponse.json({ feedback });
} 