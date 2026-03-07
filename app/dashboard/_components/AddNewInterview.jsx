"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/OpenAIModel";
import { LoaderCircle, Video, ArrowRight } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { saveMockInterview } from "@/utils/devInterviewStore";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AddNewInterview({ open, setOpen, jobDetails, jobDetailsId }) {
  if (!open) return null;
  const [interviewType, setInterviewType] = useState(""); // Initially empty, user selects one
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobRes, setJobRes] = useState("");
  const [jobReq, setJobReq] = useState("");
  const [perfSkills, setPerfSkills] = useState("");
  const [careerLevel, setCareerLevel] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  const [achievements, setAchievements] = useState("");
  const [projects, setProjects] = useState("");
  const [jsonResponse, setJsonResponse] = useState(null)
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const [category, setCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const resetForm = () => {
    setInterviewType("");
    setJobPosition("");
    setJobDesc("");
    setJobRes("");
    setJobReq("");
    setPerfSkills("");
    setCareerLevel("");
    setJobExperience("");
    setSkills("");
    setEducation("");
    setAchievements("");
    setProjects("");
    setJsonResponse(null);
    setCategory("");
    setCategoryError("");
  };

  // Optionally pre-fill fields from jobDetails
  useEffect(() => {
    if (jobDetails) {
      if (jobDetails.jobTitle) setJobPosition(jobDetails.jobTitle);
      if (jobDetails.careerLevel) setCareerLevel(jobDetails.careerLevel);
      if (jobDetails.jobDescription) setJobDesc(jobDetails.jobDescription);
      if (jobDetails.skills) setSkills(jobDetails.skills);
      if (jobDetails.education) setEducation(jobDetails.education);
      // ...add more pre-fills as needed
    }
  }, [jobDetails]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setCategoryError("");
    if (!category) {
      setCategoryError("Please select a job category.");
      return;
    }
    setLoading(true);
    let prompt = "";

    if (interviewType === "technical") {
      prompt =
        `Job Details:
        - Job Position: ${jobPosition}
        - Job Description: ${jobDesc}
        - Job Responsibilities: ${jobRes}
        - Job Requirements: ${jobReq}
        - Preferred Skills: ${perfSkills}
        - Experience Needed: ${jobExperience}
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
        
        ### JSON Output Format (IMPORTANT - RESPOND ONLY WITH VALID JSON, NO MARKDOWN):
        
        You MUST respond with ONLY a valid JSON array. No markdown code blocks, no extra text.
        
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
        - Do NOT include markdown code blocks (```json or ```)
        - Do NOT include any text before or after the JSON
        - Each question must have: question, type, and answer fields
        - Type must be one of: Technical, Behavioral, Experience, Problem Solving, Leadership
        `
    } else if (interviewType === "behavioral") {
      prompt =
        `
        Candidate Information:
            Skills: ${skills},  
            Education: ${education},  
            Achievements: ${achievements},  
            Projects: ${projects},

        ---

        ### Rules for Question Generation:

        #### 1. Background & Icebreaker Questions (2 questions)  
        - Help the candidate ease into the conversation while gathering valuable insight.  
        - Include:  
        - "Tell me about yourself."  
        - "What are your strengths and weaknesses?"

        #### 2. Motivation & Career Goals (2 questions)  
      - Explore the candidate's personal drive, ambitions, and cultural alignment.  
        - Include:  
        - "Why do you want to work for our company?"  
        - "What motivates you to perform well?"

        #### 3. Skills-Based Questions (1–2 questions)  
        - Assess communication skills,presentation abilities,problem-solving,collaboration,adaptability and *other soft skills* relevant to the role.  
        - Include one question testing how multiple skills interact in realistic, domain-relevant situations.  
        - If soft skills are present (e.g., leadership, communication), design questions that test practical application.

        #### 4. Project-Based Questions (2 questions)  
        - Evaluate *role, **challenges faced, **decision-making, **collaboration, and **overall behavioral approach*.  
        - Example:  
        - "If given unlimited resources, how would you enhance this project?"  
      - "Describe a project that didn't go as planned and what you learned."

        #### 5. Achievements-Based Questions (2 questions)  
        - Explore the impact, effort, and significance of key accomplishments.  
        - Include one reflective question about how past success shapes future actions.

        #### 6. Education-Based Questions (2 questions)  
        - Analyze how formal education influences problem-solving or strategic thinking.  
        - Include one challenge-based question applying theoretical knowledge to practical problems.

        #### 7. Behavioral Questions (2 questions)  
        - Use the STAR method (Situation, Task, Action, Result) to probe past behavior.  
        - Example:  
        - One question about conflict resolution.  
        - One testing leadership or teamwork under pressure.

        #### 8. Situational Questions (2 questions)  
        - Pose realistic hypotheticals based on domain and experience level.  
        - Avoid overlap with earlier categories.  
        - Example:  
        - One ethical dilemma focused on professional integrity, fairness, or stakeholder conflict.

        #### 9. Stress-Based Questions (2 questions)  
        - Gauge decision-making under tight timelines, uncertainty, or resource conflict.  
        - Example:  
        - One question requiring a choice between two equally critical priorities.

        #### 10. Cultural Fit Questions (2 questions)  
        - Assess alignment with team dynamics, adaptability, and values.  
        - Example:  
        - One question on adapting to new work environments.  
        - One on maintaining positive team influence.

        ---

        ### JSON Output Format (IMPORTANT - RESPOND ONLY WITH VALID JSON, NO MARKDOWN):
        
        You MUST respond with ONLY a valid JSON array. No markdown code blocks, no extra text.
        
        [
          { 
            "question": "Tell me about yourself and your background.",
            "type": "Behavioral",
            "answer": ""
          },
          { 
            "question": "What motivates you to perform well?",
            "type": "Motivation",
            "answer": ""
          }
        ]
        
        Important:
        - Return ONLY the JSON array, nothing else
        - Do NOT include markdown code blocks (```json or ```)
        - Do NOT include any text before or after the JSON
        - Each question must have: question, type, and answer fields
        - Ensure exactly 20-22 questions total
        `;
    }

    try {
      const aiResponse = await chatSession(
        prompt,
        interviewType,
        jobPosition,
        careerLevel,
        jobExperience
      );

      if (!aiResponse) throw new Error("Failed to get AI response.");

      const mockJsonResp = aiResponse
        .replace("```json", "")
        .replace("```", "")
        .trim();

      console.log("AI Response:", mockJsonResp);
      
      // Parse and validate JSON response
      let parsedData;
      try {
        parsedData = JSON.parse(mockJsonResp);
        console.log("Parsed data:", parsedData);
        
        // Handle both array format and object format with interviewQuestions
        let questionsArray;
        if (Array.isArray(parsedData)) {
          questionsArray = parsedData;
        } else if (parsedData.interviewQuestions && Array.isArray(parsedData.interviewQuestions)) {
          questionsArray = parsedData.interviewQuestions;
        } else {
          throw new Error('Invalid response format: expected array or object with interviewQuestions property');
        }
        
        if (!questionsArray || questionsArray.length === 0) {
          throw new Error('No questions were generated');
        }
        
        // Ensure each question has required fields
        questionsArray.forEach((q, idx) => {
          if (!q.question || typeof q.question !== 'string') {
            throw new Error(`Question ${idx + 1} missing or invalid question text`);
          }
          // Ensure answer field exists
          if (!('answer' in q)) {
            q.answer = '';
          }
        });
        
        console.log("Validated questions:", questionsArray);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        toast.error("Failed to generate valid questions: " + parseError.message);
        setLoading(false);
        return;
      }
      
      setJsonResponse(mockJsonResp);

      // Debug log for jobDetailsId
      console.log('Saving interview with jobDetailsId:', jobDetailsId);
      // Exclude id from jobDetails to avoid overwriting jobDetailsId
      const { id, ...restJobDetails } = jobDetails || {};
      const interviewData = {
        mockId: uuidv4(),
        jsonMockResp: mockJsonResp,
        jobPosition,
        jobDesc,
        jobRes,
        jobReq,
        perfSkills,
        careerLevel,
        jobExperience,
        skills,
        education,
        achievements,
        projects,
        createdBy: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
        interviewType,
        category,
        ...restJobDetails,
        jobDetailsId,
      };
      // Debug log for interviewData
      console.log('Interview data to save:', interviewData);
      // Save to localStorage (dev mode)
      const saved = saveMockInterview(interviewData);

      if (saved) {
        resetForm();
        setOpen(false);
        router.push(`/dashboard/interview-success?mockId=${saved.mockId}&jobPosition=${encodeURIComponent(jobPosition)}&interviewType=${interviewType}`);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error("Failed to generate interview questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8 bg-white rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto mt-8"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Mock Interview</h2>
        <p className="text-gray-500">Fill in the details to generate customized mock interview questions</p>
      </div>
      <form className="space-y-8" onSubmit={onSubmit}>
        {/* Interview Type */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Interview Type <span className="text-red-500">*</span></label>
          <Select onValueChange={setInterviewType} value={interviewType}>
            <SelectTrigger className="w-full h-12 text-base border-gray-300 focus:ring-2 focus:ring-primary/50">
              <SelectValue placeholder="Select Interview Type" />
            </SelectTrigger>
            <SelectContent className="border-gray-300 shadow-lg">
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Job Position */}
        {interviewType && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Job Position <span className="text-red-500">*</span></label>
            <Input
              placeholder="e.g. Full Stack Developer"
              className="mt-1 h-12 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
              onChange={(event) => setJobPosition(event.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Enter the job title you're hiring for</p>
          </div>
        )}
        {/* Job Description */}
        {interviewType && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Job Description <span className="text-red-500">*</span></label>
            <Textarea
              placeholder="Enter job description details including responsibilities, requirements, etc."
              className="h-[150px] mt-1 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
              onChange={(event) => setJobDesc(event.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Detailed descriptions yield better question recommendations</p>
          </div>
        )}
        {/* Job Category */}
        {interviewType && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Job Category <span className="text-red-500">*</span></label>
            <Select onValueChange={value => { setCategory(value); setCategoryError(''); }} value={category}>
              <SelectTrigger className="w-full h-12 text-base border-gray-300 focus:ring-2 focus:ring-primary/50">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="border-gray-300 shadow-lg max-h-72 overflow-y-auto">
                <SelectItem value="Accounting/Finance">Accounting/Finance</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
                <SelectItem value="Banking">Banking</SelectItem>
                <SelectItem value="R&D/Science">R&D/Science</SelectItem>
                <SelectItem value="Engineering - Construction/Civil/Architecture">Engineering - Construction/Civil/Architecture</SelectItem>
                <SelectItem value="Business Development">Business Development</SelectItem>
                <SelectItem value="Creative/Design/Art">Creative/Design/Art</SelectItem>
                <SelectItem value="Customer Service/Support">Customer Service/Support</SelectItem>
                <SelectItem value="Writing/Editorial">Writing/Editorial</SelectItem>
                <SelectItem value="Hospitality/Hotels/Food Services">Hospitality/Hotels/Food Services</SelectItem>
                <SelectItem value="Human Resources">Human Resources</SelectItem>
                <SelectItem value="Installation/Maintenance/Repair">Installation/Maintenance/Repair</SelectItem>
                <SelectItem value="IT/Software Development">IT/Software Development</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Logistics/Supply Chain">Logistics/Supply Chain</SelectItem>
                <SelectItem value="Operations/Management">Operations/Management</SelectItem>
                <SelectItem value="Manufacturing/Production">Manufacturing/Production</SelectItem>
                <SelectItem value="Marketing/PR/Advertising">Marketing/PR/Advertising</SelectItem>
                <SelectItem value="Medical/Healthcare">Medical/Healthcare</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Project/Program Management">Project/Program Management</SelectItem>
                <SelectItem value="Quality">Quality</SelectItem>
                <SelectItem value="Analyst/Research">Analyst/Research</SelectItem>
                <SelectItem value="Sales/Retail">Sales/Retail</SelectItem>
                <SelectItem value="Media/Journalism/Publishing">Media/Journalism/Publishing</SelectItem>
                <SelectItem value="Sports and Leisure">Sports and Leisure</SelectItem>
                <SelectItem value="Fashion">Fashion</SelectItem>
                <SelectItem value="Pharmaceutical">Pharmaceutical</SelectItem>
                <SelectItem value="Tourism/Travel">Tourism/Travel</SelectItem>
                <SelectItem value="Purchasing/Procurement">Purchasing/Procurement</SelectItem>
                <SelectItem value="Strategy/Consulting">Strategy/Consulting</SelectItem>
                <SelectItem value="C-Level Executive/GM/Director">C-Level Executive/GM/Director</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">Choose the job category for filtering</p>
            {categoryError && <p className="text-xs text-red-500 mt-1">{categoryError}</p>}
          </div>
        )}
        {/* Technical Fields */}
        {interviewType === 'technical' && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Job Responsibilities</label>
              <Textarea
                placeholder="Ex. Join us as a [Job Title] to [core responsibility]."
                className="h-[80px] mt-1 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(event) => setJobRes(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Job Requirements</label>
              <Textarea
                placeholder="Ex.🔹 Skills: {Key technical & soft skills} "
                className="h-[80px] mt-1 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(event) => setJobReq(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Preferred Skills (Not Mandatory)</label>
              <Input
                placeholder="Ex. Experienced (Non-Manager)"
                className="mt-1 h-12 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(event) => setPerfSkills(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Career Level</label>
              <Input
                placeholder="Ex. Experienced (Non-Manager)"
                className="mt-1 h-12 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(event) => setCareerLevel(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Experience Needed</label>
              <Input
                placeholder="Ex. Years of Experience Needed"
                className="mt-1 h-12 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(event) => setJobExperience(event.target.value)}
                required
              />
            </div>
          </>
        )}
        {/* Behavioral Fields */}
        {interviewType === 'behavioral' && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Skills</label>
              <Textarea
                placeholder="e.g., React, Node.js, Leadership, Problem-solving"
                className="h-[80px] mt-1 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Education</label>
              <Textarea
                placeholder="e.g., BSc in Computer Science, MBA..."
                className="h-[80px] mt-1 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(e) => setEducation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Achievements</label>
              <Textarea
                placeholder="e.g., Hackathon winner, Published research..."
                className="h-[80px] mt-1 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(e) => setAchievements(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Projects</label>
              <Textarea
                placeholder="e.g., E-commerce website, AI chatbot..."
                className="h-[80px] mt-1 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(e) => setProjects(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Experience Needed</label>
              <Input
                placeholder="Ex. 5"
                max="100"
                type="number"
                className="mt-1 h-12 text-base border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                onChange={(event) => setJobExperience(event.target.value)}
                required
              />
            </div>
          </>
        )}
        {/* Submit Button */}
        <div className="pt-6 flex justify-between border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-12 px-8 text-base font-medium mr-4"
          >
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 text-base font-medium bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md transition-all"
            >
              {loading ? (
                'Generating...'
              ) : (
                <>
                  Generate Questions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}