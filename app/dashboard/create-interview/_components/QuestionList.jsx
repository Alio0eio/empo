import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import axios from 'axios'
import { Loader2, Loader2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import QuestionListContainer from './QuestionListContainer';
import { v4 as uuidv4 } from 'uuid';
import { saveCallInterview } from '@/utils/devInterviewStore';

function QuestionList({ formData, onCreateLink }) {
  const [loading, setLoading] = useState(true);
  const [questionList, setQuestionList] = useState();
  const { user } = useUser();
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (formData) {
      GenerateQuestionList()
    }
  }, [formData])

  const GenerateQuestionList = async () => {
    setLoading(true);
    try {
      const result = await axios.post('/api/GenerateQuestionForPhone', {
        ...formData
      })
      
      console.log('API Response:', result.data);
      
      const Content = result.data.content;
      
      if (!Content) {
        throw new Error('No content in API response');
      }
      
      // Clean up markdown code blocks if present
      const FINAL_CONTENT = Content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Cleaned content:', FINAL_CONTENT);
      
      // Parse JSON and extract questions
      const parsedData = JSON.parse(FINAL_CONTENT);
      
      // Handle both array and object with interviewQuestions property
      let questionsArray;
      if (Array.isArray(parsedData)) {
        questionsArray = parsedData;
      } else if (parsedData?.interviewQuestions && Array.isArray(parsedData.interviewQuestions)) {
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
        // Ensure type field exists (for phone interviews)
        if (!q.type) {
          q.type = 'General';
        }
      });
      
      console.log('Parsed and validated questions:', questionsArray);
      setQuestionList(questionsArray);
      setLoading(false);
    } catch (e) {
      console.error('Question generation error:', e);
      
      // Provide specific error message
      if (e.response?.data?.error) {
        toast.error(e.response.data.error);
      } else if (e.message.includes('JSON')) {
        toast.error('Failed to parse AI response. Please try again.');
      } else if (e.message.includes('No questions')) {
        toast.error('AI failed to generate any questions. Please try again.');
      } else {
        toast.error(e.message || 'Server Error, Please try again');
      }
      
      setLoading(false);
    }
  }

  const onFinish = async () => {
    setSaveLoading(true);
    try {
      const job_id = uuidv4();

      // Save to localStorage (dev mode)
      saveCallInterview({
        ...formData,
        questionList,
        recruiterName: user?.fullName,
        recruiterEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        job_id,
        createdAt: new Date().toISOString(),
        jobDetailsId: formData.jobDetailsId,
      });

      toast.success('Interview saved successfully!');
      onCreateLink(job_id);
    } catch (e) {
      console.error('Save interview error:', e);
      toast.error('Error saving interview');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading &&
        <div className='p-5 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 flex gap-4 items-center shadow-sm'>
          <Loader2Icon className='animate-spin h-6 w-6 text-red-600' />
          <div>
            <h2 className='font-medium text-gray-800'>Generating Interview Questions</h2>
            <p className='text-red-600 text-sm mt-1'>Our AI is crafting personalized questions based on your requirements</p>
          </div>
        </div>
      }

      {/* Questions List */}
      {questionList?.length > 0 &&
        <div className='space-y-4'>
          <QuestionListContainer questionList={questionList} />
        </div>
      }

      {/* Action Button */}
      <div className='flex justify-end mt-8'>
        <Button
          onClick={onFinish}
          disabled={saveLoading || loading || !questionList?.length}
          className="h-12 px-6 text-base font-medium bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saveLoading ? (
            <>
              <Loader2 className='animate-spin h-5 w-5 mr-2' />
              Processing...
            </>
          ) : (
            'Create Interview Link & Finish'
          )}
        </Button>
      </div>
    </div>
  )
}

export default QuestionList