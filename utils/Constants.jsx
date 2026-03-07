import { BriefcaseBusinessIcon, Calendar, Code2Icon, LayoutDashboard, List, Puzzle, Settings, User2Icon, WalletCards, MessageCircle } from "lucide-react";

export const SideBarOptions = [
    {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path:'/dashboard'
    },
    {
        name: 'Post a Job',
        icon: BriefcaseBusinessIcon,
        path:'/dashboard/post-job'
    },
    {
        name: 'Scheduled Jobs',
        icon: Calendar,
        path:'/dashboard/scheduled-interview'
    },
    {
        name: 'All Jobs',
        icon: List,
        path:'/dashboard/all-interview'
    },
    {
        name: 'Chat',
        icon: MessageCircle,
        path:'/dashboard/chat'
    },
    {
        name: 'Billing',
        icon: WalletCards,
        path:'/billing'
    },
    {
        name: 'Settings',
        icon: Settings,
        path:'/settings'
    },
]

export const InterviewType = [
    {
        title: 'Technical',
        icon: Code2Icon
    },
    {
        title: 'Behavioral',
        icon: User2Icon
    },
    {
        title: 'Experience',
        icon: BriefcaseBusinessIcon
    },
    {
        title: 'Problem Solving',
        icon: Puzzle
    },
    {
        title: 'Leadership',
        icon: Puzzle
    },
]

export const QUESTION_PROMPT = `You are an expert technical interviewer.
Based on the following inputs, generate a well-structured list of high-quality interview questions:

Job Title: {{jobTitle}}

Job Description: {{jobDescription}}

Interview Duration: {{duration}}

Interview Type: {{type}}

Your task:

1. Analyze the job description to identify key responsibilities, required skills, and expected experience.
2. Generate a list of interview questions based on the interview duration.
3. Adjust the number and depth of questions to match the interview duration.
4. Ensure the questions match the tone and structure of a real-life {{type}} interview.
5. For the 'type' field in each question, use one of these values: Technical, Behavioral, Experience, Problem Solving, or Leadership.

IMPORTANT: You MUST respond with ONLY valid JSON, no markdown, no extra text.
Your response must be a valid JSON object with the following structure:

{
  "interviewQuestions": [
    {
      "question": "Your question here?",
      "type": "Technical"
    },
    {
      "question": "Another question?",
      "type": "Behavioral"
    }
  ]
}

Guidelines:
- Each question should be clear, concise, and relevant to the {{jobTitle}} role
- Include a good mix of question types ({{type}})
- Number of questions should match the interview duration (shorter duration = fewer questions)
- The goal is to create a structured, relevant, and time-optimized interview plan

Remember: Respond with ONLY the JSON object, nothing else.`

export const FEEDBACK_PROMPT = `((conversation}}
Depends on this Interview Conversation between assitant and user,
Give me feedback for user interview. Give me rating out of 10 for technical Skills,
Communication, Problem Solving, Experince. Also give me summery in 3 lines 
about the interview and one line to let me know whether is recommanded
for hire or not with msg. Give me response in JSON format
{
    feedback:{
        rating:{
            techicalSkills:5, 
            communication:6, 
            problemSolving:4, 
            experince:7
        },
        summery:<in 3 Line>,
        Recommendation:'',
        RecommendationMsg:''
    }
}`