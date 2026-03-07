import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Gemini client (OpenAI-compatible API)
const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Enhanced scoring map for label categories
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

  // Leadership
  'No Leadership': 0, 'Minimal Leadership': 2, 'Emerging Leader': 4, 'Effective Leader': 6, 'Strong Leader': 8, 'Exceptional Leader': 10,

  // Innovation
  'No Innovation': 0, 'Basic Innovation': 2, 'Moderate Innovation': 4, 'Good Innovation': 6, 'Strong Innovation': 8, 'Breakthrough Innovation': 10,

  // Adaptability
  'Rigid': 0, 'Somewhat Flexible': 2, 'Moderately Adaptable': 4, 'Adaptable': 6, 'Highly Adaptable': 8, 'Exceptionally Adaptable': 10,

  // Cultural Fit
  'Poor Fit': 0, 'Questionable Fit': 2, 'Adequate Fit': 4, 'Good Fit': 6, 'Strong Fit': 8, 'Perfect Fit': 10,

  // Stress Management
  'Poor Under Pressure': 0, 'Struggles Under Pressure': 2, 'Handles Pressure Adequately': 4, 'Good Under Pressure': 6, 'Thrives Under Pressure': 8, 'Exceptional Under Pressure': 10,

  // Learning Ability
  'Slow Learner': 0, 'Moderate Learner': 2, 'Good Learner': 4, 'Fast Learner': 6, 'Quick Learner': 8, 'Exceptional Learner': 10,

  // Problem Complexity
  'Simple Problems': 0, 'Basic Problems': 2, 'Moderate Problems': 4, 'Complex Problems': 6, 'Very Complex Problems': 8, 'Extremely Complex Problems': 10,

  // Communication Style
  'Unclear': 0, 'Somewhat Clear': 2, 'Generally Clear': 4, 'Clear': 6, 'Very Clear': 8, 'Exceptionally Clear': 10,

  // Professional Maturity
  'Immature': 0, 'Somewhat Mature': 2, 'Moderately Mature': 4, 'Mature': 6, 'Very Mature': 8, 'Exceptionally Mature': 10,

  // Team Dynamics
  'Disruptive': 0, 'Neutral': 2, 'Supportive': 4, 'Collaborative': 6, 'Enhancing': 8, 'Transformative': 10,
};

// Enhanced label weights with interview type considerations
const LABEL_WEIGHTS = {
  // Core evaluation labels (universal)
  "Relevance to Question": 1.5,
  "Technical Accuracy": 1.5,
  "Clarity of Expression": 1.2,
  "Answer Structure": 1.2,
  "Depth of Knowledge": 1.3,
  "Practical Application": 1.4,
  "Problem-Solving Approach": 1.3,
  "Communication Skills": 1.1,
  "Confidence Level": 1.0,
  "Answer Completeness": 1.2,

  // Technical interview specific
  "Technical Accuracy": 2.0,
  "Problem-Solving Approach": 1.8,
  "Depth of Knowledge": 1.7,
  "Practical Application": 1.6,

  // Behavioral interview specific
  "Communication Skills": 1.8,
  "Leadership": 1.6,
  "Team Dynamics": 1.5,
  "Cultural Fit": 1.4,
  "Adaptability": 1.3,
  "Stress Management": 1.2,

  // Leadership interview specific
  "Leadership": 2.0,
  "Team Dynamics": 1.8,
  "Innovation": 1.6,
  "Impact": 1.7,
  "Professional Maturity": 1.5,

  // General professional skills
  "Learning Ability": 1.1,
  "Problem Complexity": 1.2,
  "Communication Style": 1.3,
  "Professional Maturity": 1.2,
};

// Label templates for different interview types
const LABEL_TEMPLATES = {
  technical: [
    "Technical Accuracy",
    "Problem-Solving Approach",
    "Depth of Knowledge",
    "Practical Application",
    "Relevance to Question",
    "Answer Structure",
    "Clarity of Expression",
    "Communication Skills",
    "Confidence Level",
    "Answer Completeness"
  ],
  behavioral: [
    "Communication Skills",
    "Leadership",
    "Team Dynamics",
    "Cultural Fit",
    "Adaptability",
    "Stress Management",
    "Problem-Solving Approach",
    "Practical Application",
    "Relevance to Question",
    "Answer Structure"
  ],
  leadership: [
    "Leadership",
    "Team Dynamics",
    "Innovation",
    "Impact",
    "Professional Maturity",
    "Communication Skills",
    "Problem-Solving Approach",
    "Adaptability",
    "Strategic Thinking",
    "Influence"
  ],
  general: [
    "Relevance to Question",
    "Communication Skills",
    "Answer Structure",
    "Clarity of Expression",
    "Confidence Level",
    "Answer Completeness",
    "Professional Maturity",
    "Learning Ability",
    "Cultural Fit",
    "Adaptability"
  ]
};

function get_evaluation_prompt(question, answer, interviewType = 'general') {
  const template = LABEL_TEMPLATES[interviewType] || LABEL_TEMPLATES.general;

  return `Act like a senior AI evaluation architect and enterprise prompt engineer with 15+ years of experience designing human-in-the-loop assessment systems for technical and behavioral interviews. You specialize in deconstructing candidate responses into detailed, structured labels that support manual review, fairness, and consistent interpretation across large-scale hiring processes.

You are tasked with extracting granular evaluation **labels** from a candidate's answer to an interview question. These labels will be **manually scored** later by a human reviewer. Your job is to output **descriptive label values and justifications** — no scoring or opinions.

**Interview Type**: ${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)}

Output a **JSON object** in this format:
{
  "Label Name": {
    "value": "STANDARDIZED_LABEL_VALUE",
    "justification": "Brief explanation of why the label applies, based only on the candidate's answer.",
    "category": "CORE|TECHNICAL|BEHAVIORAL|LEADERSHIP|GENERAL"
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

Leadership:['No Leadership', 'Minimal Leadership', 'Emerging Leader', 'Effective Leader', 'Strong Leader', 'Exceptional Leader']

Innovation:['No Innovation', 'Basic Innovation', 'Moderate Innovation', 'Good Innovation', 'Strong Innovation', 'Breakthrough Innovation']

Adaptability:['Rigid', 'Somewhat Flexible', 'Moderately Adaptable', 'Adaptable', 'Highly Adaptable', 'Exceptionally Adaptable']

Cultural Fit:['Poor Fit', 'Questionable Fit', 'Adequate Fit', 'Good Fit', 'Strong Fit', 'Perfect Fit']

Stress Management:['Poor Under Pressure', 'Struggles Under Pressure', 'Handles Pressure Adequately', 'Good Under Pressure', 'Thrives Under Pressure', 'Exceptional Under Pressure']

Learning Ability:['Slow Learner', 'Moderate Learner', 'Good Learner', 'Fast Learner', 'Quick Learner', 'Exceptional Learner']

Problem Complexity:['Simple Problems', 'Basic Problems', 'Moderate Problems', 'Complex Problems', 'Very Complex Problems', 'Extremely Complex Problems']

Communication Style:['Unclear', 'Somewhat Clear', 'Generally Clear', 'Clear', 'Very Clear', 'Exceptionally Clear']

Professional Maturity:['Immature', 'Somewhat Mature', 'Moderately Mature', 'Mature', 'Very Mature', 'Exceptionally Mature']

Team Dynamics:['Disruptive', 'Neutral', 'Supportive', 'Collaborative', 'Enhancing', 'Transformative']

Answer Length:['Extremely Short', 'Very Short', 'Short', 'Medium', 'Detailed', 'Long', 'Very Long', 'Excessively Long']

Answer Completeness:['Not Complete', 'Partially Complete', 'Mostly Complete', 'Complete', 'Thoroughly Complete']

**IMPORTANT**: Analyze the response and provide these specific labels based on the content and interview type:

${template.map((label, index) => `${index + 1}. **${label}** - ${getLabelDescription(label)}`).join('\n')}

The interview question is:
${question}

The candidate's answer is:
${answer}

Take a deep breath and work on this problem step-by-step.`;
}

function getLabelDescription(label) {
  const descriptions = {
    "Relevance to Question": "How well the answer addresses the specific question asked",
    "Technical Accuracy": "Correctness of technical concepts, facts, or methodologies mentioned",
    "Clarity of Expression": "How clearly and understandably the candidate communicates their thoughts",
    "Answer Structure": "Logical organization and flow of the response",
    "Depth of Knowledge": "Level of expertise and understanding demonstrated",
    "Practical Application": "How well the candidate can apply concepts to real-world scenarios",
    "Problem-Solving Approach": "Methodology and reasoning used to address challenges",
    "Communication Skills": "Effectiveness of verbal communication and articulation",
    "Confidence Level": "Self-assurance and conviction in the response",
    "Answer Completeness": "How thoroughly the question was addressed",
    "Leadership": "Demonstrated leadership qualities and capabilities",
    "Team Dynamics": "Understanding and effectiveness in team environments",
    "Innovation": "Creativity and innovative thinking demonstrated",
    "Impact": "Measurable impact and results achieved",
    "Adaptability": "Flexibility and ability to handle change",
    "Cultural Fit": "Alignment with organizational values and culture",
    "Stress Management": "Ability to perform under pressure",
    "Learning Ability": "Capacity to acquire new knowledge and skills",
    "Professional Maturity": "Professional judgment and decision-making",
    "Strategic Thinking": "Long-term planning and strategic vision"
  };

  return descriptions[label] || "Evaluation of this specific aspect";
}

async function evaluate_answer(question, answer, interviewType = 'general') {
  try {
    // Skip evaluation for empty answers
    if (!answer || answer.trim() === "" || answer === "[SKIPPED]") {
      return {
        skipped: true,
        evaluation_score: 0,
        labels: {}
      };
    }

    // Get the evaluation prompt with interview type
    const prompt = get_evaluation_prompt(question, answer, interviewType);

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
        // Return a default evaluation instead of raising an error
        return {
          skipped: false,
          evaluation_score: 5, // Default middle score
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

      // Calculate scores with interview type specific weights
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

        // Get weight based on interview type and label
        let weight = 1; // Default weight

        // Check for interview type specific weights first
        if (interviewType === 'technical' && ['Technical Accuracy', 'Problem-Solving Approach', 'Depth of Knowledge', 'Practical Application'].includes(label)) {
          weight = LABEL_WEIGHTS[label] || 1.5;
        } else if (interviewType === 'behavioral' && ['Communication Skills', 'Leadership', 'Team Dynamics', 'Cultural Fit', 'Adaptability', 'Stress Management'].includes(label)) {
          weight = LABEL_WEIGHTS[label] || 1.4;
        } else if (interviewType === 'leadership' && ['Leadership', 'Team Dynamics', 'Innovation', 'Impact', 'Professional Maturity'].includes(label)) {
          weight = LABEL_WEIGHTS[label] || 1.6;
        } else {
          // Use general weights
          weight = LABEL_WEIGHTS[label] || 1;
        }

        const weighted = label_score * weight;

        scores[label] = {
          label_value: label_value,
          score: label_score,
          weight: weight,
          weighted_score: weighted,
          justification: details.justification || "",
          category: details.category || "GENERAL"
        };

        total_score += weighted;
        total_weight += weight;
      }

      const overall_score = total_weight ? (total_score / total_weight) : 5; // Preserve decimal precision

      // Format the result to match the expected structure
      return {
        labels: labels,
        evaluation_score: overall_score,
        detailed_scores: scores,
        skipped: false,
        interview_type: interviewType,
        label_categories: {
          core: Object.keys(labels).filter(label => scores[label]?.category === 'CORE'),
          technical: Object.keys(labels).filter(label => scores[label]?.category === 'TECHNICAL'),
          behavioral: Object.keys(labels).filter(label => scores[label]?.category === 'BEHAVIORAL'),
          leadership: Object.keys(labels).filter(label => scores[label]?.category === 'LEADERSHIP'),
          general: Object.keys(labels).filter(label => scores[label]?.category === 'GENERAL')
        }
      };

    } catch (api_error) {
      console.log(`[DEBUG] Gemini API error: ${api_error.message}`);
      // Return a default evaluation instead of raising an error
      return {
        skipped: false,
        evaluation_score: 5, // Default middle score
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
    // Return a default evaluation instead of raising an error
    return {
      skipped: false,
      evaluation_score: 5, // Default middle score
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
    const { question, answer, interviewType = 'general' } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Evaluate the answer using the sophisticated evaluation system with interview type
    const evaluation = await evaluate_answer(question, answer, interviewType);

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
      timestamp: new Date().toISOString(),
      interview_type: interviewType,
      label_template_used: LABEL_TEMPLATES[interviewType] || LABEL_TEMPLATES.general
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Video interview evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during evaluation' },
      { status: 500 }
    );
  }
} 