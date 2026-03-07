import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Gemini client (OpenAI-compatible API)
const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Scoring map for label categories
const LABEL_SCORE_MAP = {
  // Degree-based
  'None': 0, 'Minimal': 1.7, 'Low': 3.3, 'Moderate': 5, 'Considerable': 6.7, 'High': 8.3, 'Extensive': 10,

  // Quality-based
  'Very Poor': 0, 'Poor': 2, 'Below Average': 4, 'Average': 5, 'Above Average': 6, 'Strong': 7.5, 'Excellent': 9, 'Exceptional': 10,

  // Binary
  'Not Detected': 0, 'Partially Detected': 3.3, 'Detected': 6.7, 'Clearly Evident': 10,

  // Expression-based
  'Incoherent': 0, 'Confusing': 2, 'Verbose': 4, 'Wordy': 5, 'Adequately Expressed': 6, 'Clear': 8, 'Concise': 9, 'Highly Articulate': 10,

  // Structure
  'Unstructured': 0, 'Poorly Structured': 2, 'Partially Structured': 4, 'Mostly Structured': 6, 'Logically Structured': 8, 'Well-Organized': 10,

  // Relevance
  'Not Relevant': 0, 'Marginally Relevant': 1.7, 'Partially Relevant': 3.3, 'Generally Relevant': 5, 'Relevant': 6.7, 'Highly Relevant': 8.3, 'Directly Aligned': 10,

  // Technical Accuracy
  'Incorrect': 0, 'Mostly Incorrect': 1.7, 'Partially Correct': 3.3, 'Generally Correct': 5, 'Mostly Correct': 6.7, 'Fully Correct': 8.3, 'Technically Precise': 10,

  // Collaboration
  'Sole Contribution': 2, 'Minimal Collaboration': 4, 'Moderate Collaboration': 6, 'Effective Teamwork': 7.5, 'Highly Collaborative': 9, 'Seamless Integration': 10,

  // Impact
  'No Impact': 0, 'Negligible Impact': 1.7, 'Low Impact': 3.3, 'Moderate Impact': 5, 'Strong Impact': 6.7, 'High Impact': 8.3, 'Transformational Impact': 10,

  // Answer Length
  'Extremely Short': 1, 'Very Short': 2.5, 'Short': 5, 'Medium': 10, 'Detailed': 8, 'Long': 6, 'Very Long': 3, 'Excessively Long': 1,

  // Answer Completeness
  'Not Complete': 0, 'Partially Complete': 3, 'Mostly Complete': 6, 'Complete': 8, 'Thoroughly Complete': 10,
};

// Label weights
const LABEL_WEIGHTS = {
  "Relevance to Question": 1.5,
  "Technical Accuracy": 1.5,
  "Clarity of Expression": 1.2,
  "Answer Structure": 1.2,
  "Depth of Knowledge": 1.3,
  "Practical Application": 1.4,
  "Problem-Solving Approach": 1.3,
  "Communication Skills": 1.1,
  "Confidence Level": 1.0,
  "Answer Completeness": 1.2
};

function get_test_evaluation_prompt(question, answer) {
  return `Act like a senior AI evaluation architect and enterprise prompt engineer with 15+ years of experience designing human-in-the-loop assessment systems for technical and behavioral interviews. You specialize in deconstructing candidate responses into detailed, structured labels that support manual review, fairness, and consistent interpretation across large-scale hiring processes.

You are tasked with extracting granular evaluation **labels** from a candidate's answer to an interview question. These labels will be **manually scored** later by a human reviewer. Your job is to output **descriptive label values and justifications** — no scoring or opinions.

Output a **JSON object** in this format:
{
  "Label Name": {
    "value": "STANDARDIZED_LABEL_VALUE",
    "justification": "Brief explanation of why the label applies, based only on the candidate's answer."
  },
  ...
}

Use **only** these standardized value types across labels:

Degree-based:['None', 'Minimal', 'Low', 'Moderate', 'Considerable', 'High', 'Extensive']

Quality-based:['Very Poor', 'Poor', 'Below Average', 'Average', 'Above Average', 'Strong', 'Excellent', 'Exceptional']

Binary:['Not Detected', 'Partially Detected', 'Detected', 'Clearly Evident']

Expression-based:['Incoherent', 'Confusing', 'Verbose', 'Wordy', 'Adequately Expressed', 'Clear', 'Concise', 'Highly Articulate']

Structure:['Unstructured', 'Poorly Structured', 'Partially Structured', 'Mostly Structured', 'Logically Structured', 'Well-Organized']

Relevance:['Not Relevant', 'Marginally Relevant', 'Partially Relevant', 'Generally Relevant', 'Relevant', 'Highly Relevant', 'Directly Aligned']

Technical Accuracy:['Incorrect', 'Mostly Incorrect', 'Partially Correct', 'Generally Correct', 'Mostly Correct', 'Fully Correct', 'Technically Precise']

Collaboration:['Sole Contribution', 'Minimal Collaboration', 'Moderate Collaboration', 'Effective Teamwork', 'Highly Collaborative', 'Seamless Integration']

Impact:['No Impact', 'Negligible Impact', 'Low Impact', 'Moderate Impact', 'Strong Impact', 'High Impact', 'Transformational Impact']

Answer Length:['Extremely Short', 'Very Short', 'Short', 'Medium', 'Detailed', 'Long', 'Very Long', 'Excessively Long']

Answer Completeness:['Not Complete', 'Partially Complete', 'Mostly Complete', 'Complete', 'Thoroughly Complete']

**IMPORTANT**: Analyze the response and provide these specific labels based on the content:

1. **Relevance to Question** - How well the answer addresses the specific question asked
2. **Technical Accuracy** - Correctness of technical concepts, facts, or methodologies mentioned
3. **Clarity of Expression** - How clearly and understandably the candidate communicates their thoughts
4. **Answer Structure** - Logical organization and flow of the response
5. **Depth of Knowledge** - Level of expertise and understanding demonstrated
6. **Practical Application** - How well the candidate can apply concepts to real-world scenarios
7. **Problem-Solving Approach** - Methodology and reasoning used to address challenges
8. **Communication Skills** - Effectiveness of verbal communication and articulation
9. **Confidence Level** - Self-assurance and conviction in the response
10. **Answer Completeness** - How thoroughly the question was addressed

The interview question is:
${question}

The candidate's answer is:
${answer}

Take a deep breath and work on this problem step-by-step.`;
}

async function evaluate_answer(question, answer) {
  try {
    // Skip evaluation for empty answers
    if (!answer || answer.trim() === "" || answer === "[SKIPPED]") {
      return {
        skipped: true,
        evaluation_score: 0,
        labels: {}
      };
    }

    // Get the evaluation prompt
    const prompt = get_test_evaluation_prompt(question, answer);

    try {
      // Call the Gemini API for evaluation
      const response = await client.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      });

      // Extract the evaluation content
      const content = response.choices[0].message.content.trim();

      if (!content) {
        console.log("[DEBUG] Empty response from model.");
        return {
          skipped: false,
          evaluation_score: 5,
          labels: {
            "Default Evaluation": {
              value: "Average",
              justification: "Default evaluation due to empty model response."
            }
          }
        };
      }

      // Parse the raw JSON response
      const labels = JSON.parse(content);

      // Calculate scores
      const scores = {};
      let total_score = 0;
      let total_weight = 0;

      for (const [label, details] of Object.entries(labels)) {
        const label_value = details.value?.trim();
        let label_score = LABEL_SCORE_MAP[label_value];

        if (label_score === undefined) {
          console.log(`[DEBUG] Unrecognized value for '${label}': '${label_value}' — using default score.`);
          label_score = 5; // Default middle score
        }

        // Weight per label (default is 1)
        const weight = LABEL_WEIGHTS[label] || 1;

        const weighted = label_score * weight;

        scores[label] = {
          label_value: label_value,
          score: label_score,
          weight: weight,
          weighted_score: weighted,
          justification: details.justification || ""
        };

        total_score += weighted;
        total_weight += weight;
      }

      const overall_score = total_weight ? (total_score / total_weight) : 5; // Preserve decimal precision

      return {
        labels: labels,
        evaluation_score: overall_score,
        detailed_scores: scores,
        skipped: false
      };

    } catch (api_error) {
      console.log(`[DEBUG] Gemini API error: ${api_error.message}`);
      return {
        skipped: false,
        evaluation_score: 5,
        labels: {
          "Default Evaluation": {
            value: "Average",
            justification: `Default evaluation due to API error: ${api_error.message}`
          }
        }
      };
    }

  } catch (e) {
    console.log(`[DEBUG] Error in evaluate_answer: ${e.message}`);
    return {
      skipped: false,
      evaluation_score: 5,
      labels: {
        "Default Evaluation": {
          value: "Average",
          justification: `Default evaluation due to unexpected error: ${e.message}`
        }
      }
    };
  }
}

export async function POST(req) {
  try {
    const { question, answer, interviewType = 'technical' } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Evaluate the answer using the sophisticated evaluation system
    const evaluation = await evaluate_answer(question, answer);

    // Generate additional feedback using the existing system for compatibility
    const feedbackPrompt = `Analyze this interview response:
      Question: ${question}
      Answer: ${answer}
      Interview Type: ${interviewType}

      Provide JSON response with:
      - "rating": number (1-10)
      - "feedback": string (constructive feedback)
      - "suggestions": string[] (3 improvement suggestions)
      - "transcriptionQuality": number (1-5, how accurate the transcription is)
      - "language": string (detected language)
      - "overallAssessment": string (brief overall assessment)`;

    const gemini = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const completion = await gemini.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: "You are an expert interview evaluator." },
        { role: "user", content: feedbackPrompt }
      ],
      temperature: 0.3
    });

    const feedbackContent = completion.choices[0].message.content;
    let feedback;

    try {
      feedback = JSON.parse(feedbackContent.replace(/```json|```/g, '').trim());
    } catch (parseError) {
      feedback = {
        rating: evaluation.evaluation_score,
        feedback: "Evaluation completed successfully",
        suggestions: ["Continue practicing", "Focus on clarity", "Provide more examples"],
        transcriptionQuality: 5,
        language: "en",
        overallAssessment: "Good response with room for improvement"
      };
    }

    // Combine both evaluation systems
    const result = {
      ...evaluation,
      traditional_feedback: feedback,
      combined_score: ((evaluation.evaluation_score + feedback.rating) / 2), // Preserve decimal precision
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Test video evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during evaluation' },
      { status: 500 }
    );
  }
} 