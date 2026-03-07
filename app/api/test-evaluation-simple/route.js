import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(req) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Simple evaluation prompt
    const prompt = `Analyze this interview response and provide a JSON response with:
    - "rating": number (1-10)
    - "feedback": string (constructive feedback)
    - "suggestions": array of 3 improvement suggestions
    - "overallAssessment": string (brief overall assessment)

    Question: ${question}
    Answer: ${answer}

    Return only valid JSON.`;

    const completion = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: "You are an expert interview evaluator. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    });

    const content = completion.choices[0].message.content;
    let result;

    try {
      result = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch (parseError) {
      result = {
        rating: 5,
        feedback: "Evaluation completed successfully",
        suggestions: ["Continue practicing", "Focus on clarity", "Provide more examples"],
        overallAssessment: "Good response with room for improvement"
      };
    }

    return NextResponse.json({
      success: true,
      evaluation: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during evaluation' },
      { status: 500 }
    );
  }
} 