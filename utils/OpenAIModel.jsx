import OpenAI from "openai";

// ── Gemini client (OpenAI-compatible API) for chat completions ──
const gemini = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  dangerouslyAllowBrowser: true,
});

// ── Groq client (OpenAI-compatible API) for audio transcription ──
const groq = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true,
});

export async function chatSession(prompt, interviewType, jobPosition = "", careerLevel = "", jobExperience = "") {
  let systemMessage;

  // Choose system role based on interview type
  if (interviewType === 'behavioral') {
    systemMessage = {
      role: "system",
      content: `Act as a highly experienced senior hiring manager, organizational psychologist, 
      and behavioral strategist with 20+ years in evaluating talent across industries.
      Your expertise lies in uncovering a candidate's mindset, emotional intelligence, interpersonal strengths,
      leadership potential, and cultural adaptability — without relying on technical questions.

      You are responsible for designing a *deeply personalized, non-repetitive, and behavior-focused interview* that analyzes how the candidate:
      - Thinks under pressure  
      - Navigates team dynamics   
      - Leads or follows when appropriate  
      - Aligns with organizational values and long-term vision  

      Craft questions that reveal *real behavioral depth, decision-making rationale, adaptability, communication style, resilience, and **self-awareness*. Focus on:
      - Practical experiences (past challenges, tough choices, growth moments)  
      - Values, motivations, and internal drivers  
      - How the candidate interacts with people and systems  
      - Emotional agility and learning mindset  

      *Do not* ask technical or skill-assessment questions — your goal is to understand the human behind the resume.

      The interview must feel insightful, structured, and tailored — just as a world-class behavioral panel would conduct.
      
      CRITICAL: Respond with ONLY valid JSON array. NO markdown code blocks, NO extra text, NO explanations.`
    };
  } else if (interviewType === 'technical') {
    systemMessage = {
      role: "system",
      content: `You are an advanced AI interviewer with deep expertise across ${jobPosition}. 
        You dynamically adapt your knowledge to match the specific job title, responsibilities, and required skills.
        For each interview, you generate insightful, industry-relevant, and challenging questions tailored to the job position.
        also generate questions based on the candidate's career level: ${careerLevel} and based on their Experience: ${jobExperience} and customize your questions accordingly.
        Ensure the questions reflect real-world scenarios, best practices, and the latest industry standards.
        
        CRITICAL: Respond with ONLY valid JSON array. NO markdown code blocks, NO extra text, NO explanations.`
    };
  }

  const response = await gemini.chat.completions.create({
    model: "gemini-2.0-flash",
    temperature: 0.7,
    top_p: 0.9,
    messages: [
      systemMessage,
      {
        role: "user",
        content: prompt
      }
    ],
  });

  return response.choices[0].message.content;
}

export async function transcribeAudio(audioBlob, languageMode = 'auto') {
  try {
    const audioFile = new File([audioBlob], 'recording.webm', {
      type: 'audio/webm'
    });

    const params = {
      file: audioFile,
      model: 'whisper-large-v3',
      response_format: 'json',
      prompt: 'This is a multilingual conversation. Transcribe exactly what you hear in the original language(s) without translation. Maintain code-switching between languages as spoken.'
    };

    // Only specify language if not in auto mode
    if (languageMode !== 'auto') {
      params.language = languageMode;
    }

    const transcription = await groq.audio.transcriptions.create(params);

    return {
      text: transcription.text,
      detectedLanguage: transcription.language || languageMode
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe (${languageMode}): ${error.message}`);
  }
}


export async function generateAudioFeedback(audioBlob, question, interviewType) {
  try {
    // First transcribe the audio
    const transcription = await transcribeAudio(audioBlob);

    // Then generate feedback using chatSession
    const feedbackPrompt = `
      Analyze this interview response:

      Question: ${question}
      Answer: ${transcription}

      Provide JSON response with:
      - "rating": number (1-10)
      - "feedback": string (constructive feedback)
      - "suggestions": string[] (3 improvement suggestions)
    `;

    const feedback = await chatSession(feedbackPrompt, interviewType);
    return {
      transcription,
      feedback: JSON.parse(feedback.replace(/```json|```/g, '').trim())
    };
  } catch (error) {
    console.error("Audio feedback generation failed", error);
    throw error;
  }
}
