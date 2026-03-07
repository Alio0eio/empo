/**
 * Dev/localStorage-based interview data store.
 * Replaces database queries during development.
 *
 * Stores:
 *   devJobs            – job postings (already used by post-job page)
 *   devMockInterviews  – mock (video) interviews with generated questions
 *   devCallInterviews  – call interviews with generated questions
 *   devUserAnswers     – user answers for mock interviews
 */

// ──── Generic helpers ────

function getStore(key) {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setStore(key, data) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(data));
}

// ──── Dev Jobs ────

export function getDevJob(jobId) {
    const jobs = getStore('devJobs');
    return jobs.find((j) => String(j.id) === String(jobId)) || null;
}

// ──── Mock Interviews ────

export function saveMockInterview(data) {
    const interviews = getStore('devMockInterviews');
    interviews.push(data);
    setStore('devMockInterviews', interviews);
    return data;
}

export function getMockInterview(mockId) {
    const interviews = getStore('devMockInterviews');
    return interviews.find((i) => String(i.mockId) === String(mockId)) || null;
}

/**
 * Get a mock interview by ID, or auto-create one from devJobs data
 * by dynamically generating questions via Gemini AI.
 */
export async function getOrCreateMockInterview(interviewId) {
    // 1. Check if a real mock interview already exists
    const existing = getMockInterview(interviewId);
    if (existing && existing.createdBy !== 'dev-mode') return existing;

    // If an old dev-mode fallback exists, remove it so we regenerate with AI
    if (existing && existing.createdBy === 'dev-mode') {
        const interviews = getStore('devMockInterviews');
        const filtered = interviews.filter((i) => String(i.mockId) !== String(interviewId));
        setStore('devMockInterviews', filtered);
    }

    // 2. Look up the job from devJobs
    const job = getDevJob(interviewId);
    if (!job) return null;

    // 3. Dynamically generate questions using Gemini (same prompt as AddNewInterview)
    const position = job.jobPosition || 'this role';
    const description = job.jobDescription || '';
    const requirements = job.jobRequirements || '';
    const careerLevel = job.careerLevel || 'Experienced';
    const experience = job.minExperience ? `${job.minExperience}+ years` : 'Not specified';
    const skills = job.skills || '';

    const prompt = `Job Details:
        - Job Position: ${position}
        - Job Description: ${description}
        - Job Responsibilities: ${description}
        - Job Requirements: ${requirements}
        - Preferred Skills: ${skills}
        - Experience Needed: ${experience}
        - Career Level: ${careerLevel}

        ---
        ### Rules for Generating Questions:

        
        
        1. Job Position(2-4 questions):
        - Start with introductory questions about the candidate's familiarity with the role.
        - Include experience-based questions to assess prior knowledge.
        

        2. Job Description(2-4 questions):
        - Generate situational and advanced questions related to the career level.
        - Focus on real-world problem-solving within the job function.
        

        3. Job Responsibilities(2-4 questions):
        - Create scenario-based and decision-making questions.
        - Cover each key responsibility uniquely.
        - Ensure that every question is role-specific and distinct.

        4. Job Requirements(2-4 questions):
        - Generate technical and skill-based questions that validate competencies.
        - Each required skill should have a dedicated question.
        

        5. Preferred Skills(2-4 questions) (If Provided):
        - Create in-depth questions focusing on these skills.
        

        6. Experience Needed(2-4 questions) (If Preferred Skills Are Absent):
        - Include behavioral interview questions that assess past performance.
        

        7. Career Level(2-4 questions):
        - If entry-level, focus on *learning potential and fundamental skills.
        - If mid-level, emphasize *problem-solving, teamwork, and ownership.
        - If senior-level, assess *leadership, mentorship, and strategic thinking.
        - Ensure the questions match the level of responsibility expected.

        ---
        ### Output Rules:

        - Ensure the total number of questions is between 20 and 25.
        - Ensure a mix of question types (e.g., behavioral, technical, situational, strategic).
        - Do not over-rely on any single type unless explicitly required by the job role.

        ---
        
        ### JSON Output Format (CRITICAL - RESPOND ONLY WITH JSON, NO MARKDOWN, NO EXTRA TEXT):
        
        You MUST respond with ONLY a valid JSON array. No markdown code blocks, no explanations, no extra text.
        
        [
          {
            "question": "What is your experience with...",
            "type": "Technical",
            "answer": ""
          },
          {
            "question": "Tell me about a time when...",
            "type": "Behavioral",
            "answer": ""
          }
        ]
        
        Important:
        - Return ONLY the JSON array, nothing else
        - Do NOT include markdown code blocks
        - Do NOT include any text before or after the JSON
        - Each question must have: question, type, and answer fields
        - Type must be one of: Technical, Behavioral, Experience, Problem Solving, Leadership
        `;

    // Call our API route which calls Groq server-side
    const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, position, careerLevel, experience }),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Failed to generate questions:', errData.error);
        return null;
    }

    const data = await response.json();
    const aiResponse = data.response;

    if (!aiResponse) {
        console.error('Empty AI response');
        return null;
    }

    const mockJsonResp = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    // Try to extract JSON if there's extra text
    const jsonMatch = mockJsonResp.match(/\[\s*\{[\s\S]*\}\s*\]/g);
    let cleanJsonStr = jsonMatch ? jsonMatch[0] : mockJsonResp;

    // Validate it's valid JSON and is an array
    let parsedQuestions;
    try {
        parsedQuestions = JSON.parse(cleanJsonStr);
        if (!Array.isArray(parsedQuestions)) {
            throw new Error('Response is not an array');
        }
        if (parsedQuestions.length === 0) {
            throw new Error('No questions in response');
        }
        // Validate each question has required fields
        parsedQuestions.forEach((q, idx) => {
            if (!q.question || typeof q.question !== 'string') {
                throw new Error(`Question ${idx + 1} missing or invalid question text`);
            }
            if (!('answer' in q)) {
                q.answer = '';
            }
        });
    } catch (e) {
        console.error('Invalid JSON from AI:', e.message);
        console.error('Raw response was:', aiResponse.substring(0, 300));
        return null;
    }

    console.log('✅ Questions generated via Groq AI');

    // 4. Create the mock interview entry
    const mockInterview = {
        mockId: String(job.id),
        jsonMockResp: mockJsonResp,
        jobPosition: position,
        jobDesc: description,
        jobExperience: experience,
        careerLevel: careerLevel,
        interviewType: 'technical',
        createdBy: 'groq-generated',
        createdAt: job.createdAt || new Date().toISOString(),
    };

    // 5. Save it so subsequent loads find it
    saveMockInterview(mockInterview);
    return mockInterview;
}

// ──── Call Interviews ────

export function saveCallInterview(data) {
    const interviews = getStore('devCallInterviews');
    interviews.push(data);
    setStore('devCallInterviews', interviews);
    return data;
}

export function getCallInterview(job_id) {
    const interviews = getStore('devCallInterviews');
    return interviews.find((i) => String(i.job_id) === String(job_id)) || null;
}

// ──── User Answers (for mock interview sessions) ────

export function saveUserAnswer(answer) {
    const answers = getStore('devUserAnswers');
    answers.push(answer);
    setStore('devUserAnswers', answers);
    return answer;
}

export function getUserAnswers(mockIdRef, sessionId) {
    const answers = getStore('devUserAnswers');
    return answers.filter(
        (a) =>
            String(a.mockIdRef) === String(mockIdRef) &&
            (!sessionId || String(a.sessionId) === String(sessionId))
    );
}

