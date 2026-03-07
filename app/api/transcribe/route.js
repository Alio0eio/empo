import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert to Groq-compatible format
    const buffer = await file.arrayBuffer();
    const transcription = await groq.audio.transcriptions.create({
      file: new Blob([buffer], { type: file.type }),
      model: 'whisper-large-v3',
    });

    return NextResponse.json({
      text: transcription.text,
      language: transcription.language,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}