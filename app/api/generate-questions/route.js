import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Groq client (OpenAI-compatible API)
const groq = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
    try {
        const { prompt, position, careerLevel, experience } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log('[generate-questions] Generating questions for:', position);

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an advanced AI interviewer with deep expertise across ${position}. 
          You dynamically adapt your knowledge to match the specific job title, responsibilities, and required skills.
          For each interview, you generate insightful, industry-relevant, and challenging questions tailored to the job position.
          Also generate questions based on the candidate's career level: ${careerLevel} and based on their Experience: ${experience} and customize your questions accordingly.
          Ensure the questions reflect real-world scenarios, best practices, and the latest industry standards.
          
          CRITICAL: You MUST respond with ONLY a valid JSON array. NO markdown code blocks, NO explanations before or after.
          NO extra text whatsoever - just the JSON array.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            top_p: 0.9,
        });

        const aiResponse = completion.choices[0].message.content;
        console.log('[generate-questions] Success! Response length:', aiResponse?.length);

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error('[generate-questions] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to generate questions' },
            { status: 500 }
        );
    }
}
