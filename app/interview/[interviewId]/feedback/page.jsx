"use client";
import { getOrCreateMockInterview } from '@/utils/devInterviewStore';
import { getUserAnswers, saveUserAnswer } from '@/utils/devInterviewStore';
import React, { useEffect, useState, use, Suspense } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { calculateSessionProgress } from '@/utils/sessionUtils';

// Separate component that uses useSearchParams
function FeedbackContent({ params }) {
  // Unwrap params Promise for Next.js 15 compatibility
  const resolvedParams = use(params);
  const interviewId = resolvedParams.interviewId;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [feedbackList, setFeedbackList] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sessionProgress, setSessionProgress] = useState(null);
  const router = useRouter();

  const [interviewData, setInterviewData] = useState({
    interviewType: '',
    jobPosition: '',
    careerLevel: '',
    jobExperience: ''
  });

  // Fetch interview metadata and answers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get interview metadata from localStorage (dev mode)
        const interviewMeta = await getOrCreateMockInterview(interviewId);

        if (interviewMeta) {
          setInterviewData({
            interviewType: interviewMeta.interviewType,
            jobPosition: interviewMeta.jobPosition,
            careerLevel: interviewMeta.careerLevel,
            jobExperience: interviewMeta.jobExperience
          });
        }

        // Get answers from localStorage (dev mode)
        const answers = getUserAnswers(interviewId, sessionId || null);
        setFeedbackList(answers);

        // Calculate session progress if sessionId is provided
        if (sessionId && interviewMeta) {
          const jsonMockResp = JSON.parse(interviewMeta.jsonMockResp);
          const progress = calculateSessionProgress(answers, sessionId, jsonMockResp.length);
          setSessionProgress(progress);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error('Failed to load interview data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [interviewId, sessionId]);

  const handleAnswerChange = (questionId, value) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const submitAnswer = async (questionId, questionText, answer) => {
    if (!answer?.trim()) {
      toast.warning('Please provide an answer');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [questionId]: true }));

    try {
      // Save answer to localStorage (dev mode)
      saveUserAnswer({
        id: questionId,
        mockIdRef: interviewId,
        question: questionText,
        userAns: answer,
        sessionId: sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Clear the current answer from state
      setCurrentAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });

      // Refresh the question list from localStorage
      const updatedAnswers = getUserAnswers(interviewId, sessionId || null);
      setFeedbackList(updatedAnswers);
      toast.success('Answer saved successfully');

    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error('Failed to save answer');
    } finally {
      setLoadingStates(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // Calculate progress
  const answeredCount = feedbackList.filter(item => item.userAns && item.isAnswered).length;
  const skippedCount = feedbackList.filter(item => item.isSkipped).length;
  const totalCount = feedbackList.length;
  const progressPercentage = totalCount > 0 ? Math.round(((answeredCount + skippedCount) / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className='p-10'>
      {feedbackList.length === 0 ? (
        <div className="text-center py-10">
          <h2 className='font-bold text-xl text-gray-500'>No interview questions found</h2>
          <Button onClick={() => router.replace('/')} className="mt-6">
            Go Home
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className='text-3xl font-bold text-green-600'>Interview Feedback</h2>

            {/* Session Info */}
            {sessionId && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Session Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Session ID:</span>
                    <p className="text-blue-600">{sessionId.split('_').slice(-2).join('_')}</p>
                  </div>
                  {sessionProgress && (
                    <>
                      <div>
                        <span className="font-medium text-blue-700">Answered:</span>
                        <p className="text-blue-600">{sessionProgress.answered} questions</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Skipped:</span>
                        <p className="text-blue-600">{sessionProgress.skipped} questions</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <h2 className='text-primary text-lg'>Complete your interview responses</h2>
              <span className="text-sm font-medium">
                {answeredCount + skippedCount}/{totalCount} completed ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            {feedbackList.map((item, index) => (
              <div key={item.id || index} className="border rounded-lg p-4">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{item.question}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          {item.rating && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Rating: {item.rating}/10
                            </span>
                          )}
                          {item.isSkipped && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              ⏭ Skipped
                            </span>
                          )}
                          {item.isAnswered && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              ✓ Answered
                            </span>
                          )}
                          {item.retryCount > 0 && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Retry #{item.retryCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    {item.userAns ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Your Answer:</h4>
                          <p className="bg-gray-50 p-3 rounded border">{item.userAns}</p>
                        </div>
                        {item.feedback && (
                          <div>
                            <h4 className="font-medium mb-2">Feedback:</h4>
                            <p className="bg-green-50 p-3 rounded border border-green-200">{item.feedback}</p>
                          </div>
                        )}
                        {item.suggestions && (
                          <div>
                            <h4 className="font-medium mb-2">Suggestions:</h4>
                            <ul className="bg-blue-50 p-3 rounded border border-blue-200 list-disc list-inside">
                              {item.suggestions.split(', ').map((suggestion, i) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Type your answer here..."
                          value={currentAnswers[item.id] || ""}
                          onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                          className="min-h-[120px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleAnswerChange(item.id, "")}
                          >
                            Clear
                          </Button>
                          <Button
                            onClick={() => submitAnswer(item.id, item.question, currentAnswers[item.id])}
                            disabled={loadingStates[item.id] || !currentAnswers[item.id]?.trim()}
                            className="min-w-[120px]"
                          >
                            {loadingStates[item.id] ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Saving...
                              </span>
                            ) : 'Submit Answer'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={() => router.replace('/')}
            >
              Save and Exit
            </Button>
            {answeredCount + skippedCount === totalCount && totalCount > 0 && (
              <Button
                onClick={() => router.push(`/interview/${interviewId}/results${sessionId ? `?sessionId=${sessionId}` : ''}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                View Final Results
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Loading fallback component
function FeedbackLoading() {
  return (
    <div className="p-10 flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );
}

// Main component with Suspense boundary
export default function Feedback({ params }) {
  return (
    <Suspense fallback={<FeedbackLoading />}>
      <FeedbackContent params={params} />
    </Suspense>
  );
}