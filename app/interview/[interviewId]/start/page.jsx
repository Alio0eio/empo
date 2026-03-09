"use client"
import { getOrCreateMockInterview } from '@/utils/devInterviewStore';
import { saveUserAnswer, getUserAnswers } from '@/utils/devInterviewStore';
import React, { useEffect, useState, use } from 'react'
import QuestionsSection from './_components/QuestionsSection';
import RecordAnswerSection from './_components/RecordAnswerSection';
import QuestionTimer from './_components/QuestionTimer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { generateSessionId, isQuestionAnswered, isQuestionSkipped, calculateSessionProgress, getCurrentAnswer } from '@/utils/sessionUtils';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Menu, Volume2, VolumeX, Eye, EyeOff, Shield, Clock, CheckCircle, SkipForward, ArrowLeft, ArrowRight, Play, Pause, Mic, MicOff, AlertTriangle, Info, Lightbulb, Target, Trophy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function StartInterview({ params }) {
  // Unwrap params Promise for Next.js 15 compatibility
  const resolvedParams = use(params);
  const interviewId = resolvedParams.interviewId;

  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isQuestionRead, setIsQuestionRead] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      initializeSession();
    }
  }, [interviewId, user]);

  // Cleanup effect to end session when component unmounts
  useEffect(() => {
    return () => {
      // End session when component unmounts
      if (sessionId) {
        endSession();
      }
    };
  }, [sessionId]);

  /**
   * Initialize the interview session
   */
  const initializeSession = async () => {
    try {
      setLoading(true);
      setSessionStartTime(new Date());

      // Generate new session ID for this attempt
      const newSessionId = generateSessionId(
        user.primaryEmailAddress.emailAddress,
        interviewId
      );
      setSessionId(newSessionId);

      // Initialize session-level cheating detection with enhanced settings
      try {
        console.log('Creating session with:', { sessionId: newSessionId, mockId: interviewId });

        const response = await fetch('/api/session-cheating-detection/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: newSessionId,
            mockId: interviewId,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            detectionSettings: {
              detectionInterval: 2000, // More frequent detection
              confidenceThreshold: 0.75, // Higher confidence
              maxViolations: 5, // More violations before high risk
              alertCooldown: 10000, // Shorter cooldown
              faceDetectionEnabled: true,
              deviceDetectionEnabled: true,
              movementAnalysisEnabled: true,
              audioAnalysisEnabled: true,
              tabSwitchingDetectionEnabled: true,
              typingDetectionEnabled: true
            }
          })
        });

        console.log('Session creation response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Enhanced session-level cheating detection initialized:', result);
        } else {
          const errorText = await response.text();
          console.warn('Failed to initialize session cheating detection:', errorText);
        }
      } catch (error) {
        console.error('Error initializing session cheating detection:', error);
      }

      // Get interview details from localStorage (dev mode) — auto-creates with sample questions if needed
      const found = await getOrCreateMockInterview(interviewId);

      if (!found) {
        toast.error('Interview not found');
        return;
      }

      const jsonMockResp = JSON.parse(found.jsonMockResp);
      setMockInterviewQuestion(jsonMockResp);
      setInterviewData(found);

      // Get existing answers for this session
      await loadSessionAnswers(newSessionId);

    } catch (error) {
      console.error('Error initializing session:', error);
      toast.error('Failed to initialize interview session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load answers for the current session
   */
  const loadSessionAnswers = async (currentSessionId) => {
    try {
      console.log('Loading session answers for:', currentSessionId);
      const answers = getUserAnswers(interviewId, currentSessionId);

      console.log('Loaded answers:', answers);
      setUserAnswers(answers);
    } catch (error) {
      console.error('Error loading session answers:', error);
    }
  };

  /**
   * Handle skipping a question
   */
  const handleSkipQuestion = async () => {
    if (!sessionId || !mockInterviewQuestion) return;

    try {
      const question = mockInterviewQuestion[activeQuestionIndex];

      // Check if already skipped
      if (isQuestionSkipped(userAnswers, activeQuestionIndex, sessionId)) {
        toast.info('Question already skipped');
        return;
      }

      // Save skip record to localStorage (dev mode)
      saveUserAnswer({
        mockIdRef: interviewId,
        question: question.question,
        questionIndex: activeQuestionIndex,
        sessionId: sessionId,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        userAns: 'SKIPPED',
        isSkipped: true,
        isAnswered: false,
        rating: '0',
        feedback: 'Question skipped by candidate',
        createdAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Reload answers
      await loadSessionAnswers(sessionId);

      toast.success('Question skipped');

      // Move to next question if available
      if (activeQuestionIndex < mockInterviewQuestion.length - 1) {
        setActiveQuestionIndex(activeQuestionIndex + 1);
      }
    } catch (error) {
      console.error('Error skipping question:', error);
      toast.error('Failed to skip question');
    }
  };

  /**
   * Auto-skip unanswered questions when navigating to last question
   */
  const autoSkipUnansweredQuestions = async () => {
    if (!sessionId || !mockInterviewQuestion) return;

    try {
      let hasChanges = false;

      // Check all questions except the last one
      for (let i = 0; i < mockInterviewQuestion.length - 1; i++) {
        const isAnswered = isQuestionAnswered(userAnswers, i, sessionId);
        const isSkipped = isQuestionSkipped(userAnswers, i, sessionId);

        // If question is neither answered nor skipped, skip it
        if (!isAnswered && !isSkipped) {
          const question = mockInterviewQuestion[i];

          saveUserAnswer({
            mockIdRef: interviewId,
            question: question.question,
            questionIndex: i,
            sessionId: sessionId,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            userAns: 'AUTO_SKIPPED',
            isSkipped: true,
            isAnswered: false,
            rating: '0',
            feedback: 'Question auto-skipped when navigating to last question',
            createdAt: new Date().toISOString(),
            lastAttemptAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          hasChanges = true;
        }
      }

      if (hasChanges) {
        await loadSessionAnswers(sessionId);
        toast.info('Unanswered questions have been auto-skipped');
      }
    } catch (error) {
      console.error('Error auto-skipping questions:', error);
      toast.error('Failed to auto-skip questions');
    }
  };

  /**
   * Handle moving to next question
   */
  const handleNextQuestion = () => {
    if (activeQuestionIndex < (mockInterviewQuestion?.length || 1) - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    }
  };

  /**
   * Handle time expired for current question
   */
  const handleTimeExpired = async () => {
    if (!sessionId || !mockInterviewQuestion) return;

    try {
      const question = mockInterviewQuestion[activeQuestionIndex];

      // Check if already answered
      if (isQuestionAnswered(userAnswers, activeQuestionIndex, sessionId)) {
        return;
      }

      // Save timeout record to localStorage (dev mode)
      saveUserAnswer({
        mockIdRef: interviewId,
        question: question.question,
        questionIndex: activeQuestionIndex,
        sessionId: sessionId,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        userAns: 'TIMEOUT',
        isSkipped: false,
        isAnswered: false,
        rating: '0',
        feedback: 'Question timed out - no answer provided',
        createdAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Reload answers
      await loadSessionAnswers(sessionId);

      toast.warning('Time expired for this question');

      // Auto-move to next question after 2 seconds
      setTimeout(() => {
        if (activeQuestionIndex < mockInterviewQuestion.length - 1) {
          setActiveQuestionIndex(activeQuestionIndex + 1);
        }
      }, 2000);
    } catch (error) {
      console.error('Error handling time expired:', error);
      toast.error('Failed to handle time expiration');
    }
  };

  /**
   * Handle moving to previous question
   */
  const handlePreviousQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  /**
   * End the interview session
   */
  const endSession = async () => {
    if (!sessionId) return;

    try {
      // End cheating detection session
      await fetch('/api/session-cheating-detection/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          mockId: interviewId
        })
      });

      console.log('Session ended successfully');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  /**
   * Check if current question is answered
   */
  const isCurrentQuestionAnswered = () => {
    return isQuestionAnswered(userAnswers, activeQuestionIndex, sessionId);
  };

  /**
   * Check if current question is skipped
   */
  const isCurrentQuestionSkipped = () => {
    return isQuestionSkipped(userAnswers, activeQuestionIndex, sessionId);
  };

  /**
   * Get progress for current session
   */
  const getSessionProgress = () => {
    if (!mockInterviewQuestion || !sessionId) return { answered: 0, skipped: 0, total: 0, progress: 0 };
    return calculateSessionProgress(userAnswers, sessionId, mockInterviewQuestion.length);
  };

  /**
   * Read question aloud
   */
  const readQuestionAloud = () => {
    if ('speechSynthesis' in window) {
      const speech = new window.SpeechSynthesisUtterance(mockInterviewQuestion?.[activeQuestionIndex]?.question);
      speech.rate = 0.9;
      speech.pitch = 1;
      window.speechSynthesis.speak(speech);
      setIsQuestionRead(true);
    }
  };

  /**
   * Calculate session duration
   */
  const getSessionDuration = () => {
    if (!sessionStartTime) return '00:00';
    const duration = Math.floor((new Date() - sessionStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbf9f9] to-[#f1e9ea] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#be3144] border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#f05941] border-t-transparent animate-ping opacity-20"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">Initializing Interview Session</h3>
            <p className="text-gray-600">Setting up your interview environment...</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = getSessionProgress();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#fbf9f9] to-[#f1e9ea] flex flex-col">
        {/* Enhanced Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden">
                <Image src={'/logo.png'} width={48} height={48} alt='logo' className="object-contain group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#be3144] to-[#f05941] opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-[#be3144] to-[#f05941] bg-clip-text text-transparent">I-Hire</span>
                <span className="text-xs text-gray-500">AI-Powered Interviews</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Session Duration */}
              <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{getSessionDuration()}</span>
              </div>

              {/* Progress Indicator */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#be3144] to-[#f05941] transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{progress.progress}%</span>
              </div>

              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 ring-2 ring-gray-200 hover:ring-[#be3144] transition-all duration-300",
                    userButtonPopoverCard: "shadow-lg border border-gray-200",
                    userPreviewAvatarBox: "w-12 h-12"
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Floating Action Buttons */}
        <div className="fixed top-32 right-6 z-50 flex flex-col gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="bg-gradient-to-r from-[#be3144] to-[#f05941] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-xl"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open question list"
              >
                <Menu className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Question Navigator</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-xl border border-gray-200"
                onClick={() => setShowInstructions((prev) => !prev)}
                aria-label="Toggle instructions"
              >
                <Info className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Instructions</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-6">
          <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
            {/* Left: Question Card, Timer, Navigation */}
            <div className="flex-1 min-w-[320px] max-w-xl flex flex-col gap-6">
              {/* Question Card */}
              <Card className="bg-white shadow-xl border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#be3144] to-[#f05941] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {activeQuestionIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">
                          Question {activeQuestionIndex + 1} of {mockInterviewQuestion?.length || 0}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {isCurrentQuestionAnswered() ? '✓ Answered' :
                            isCurrentQuestionSkipped() ? '⏭ Skipped' : '⏱️ In Progress'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={readQuestionAloud}
                            aria-label="Read question aloud"
                          >
                            {isQuestionRead ? <VolumeX className="w-5 h-5 text-gray-600" /> : <Volume2 className="w-5 h-5 text-gray-600" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isQuestionRead ? 'Question read' : 'Read question aloud'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 text-lg leading-relaxed">
                      {mockInterviewQuestion?.[activeQuestionIndex]?.question}
                    </p>
                  </div>
                  {/* Enhanced Note Section */}
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Tip:</strong> {process.env.NEXT_PUBLIC_QUESTION_NOTE || 'Click "Record Answer" when you\'re ready to respond. Speak clearly and look at the camera.'}
                    </AlertDescription>
                  </Alert>
                  {/* Collapsible Interview Tips (moved here) */}
                  <div className="mt-2">
                    <div
                      className="cursor-pointer select-none flex items-center gap-2 px-4 py-2 rounded-t-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
                      onClick={() => setShowInstructions((prev) => !prev)}
                      aria-expanded={showInstructions}
                      tabIndex={0}
                      role="button"
                    >
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900 text-base">Interview Tips</span>
                      <span className="ml-auto text-blue-600">{showInstructions ? '▲' : '▼'}</span>
                    </div>
                    {showInstructions && (
                      <div className="bg-blue-50 border border-t-0 border-blue-200 rounded-b-lg px-6 py-4 animate-fade-in">
                        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                          <li>Speak clearly and at a moderate pace</li>
                          <li>Look directly at the camera when answering</li>
                          <li>Take a moment to think before responding</li>
                          <li>You can skip questions if needed</li>
                          <li>Each question has a 3-minute time limit</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Timer */}
              <QuestionTimer
                activeQuestionIndex={activeQuestionIndex}
                onTimeExpired={handleTimeExpired}
                onNextQuestion={handleNextQuestion}
                isQuestionAnswered={isCurrentQuestionAnswered()}
                isQuestionSkipped={isCurrentQuestionSkipped()}
                totalQuestions={mockInterviewQuestion?.length || 0}
              />
              {/* Compact Progress Summary */}
              <div className="flex items-center justify-between bg-white/80 rounded-lg px-4 py-2 shadow border mb-2">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-[#be3144]" />
                  <span className="text-xs font-medium text-gray-700">Progress</span>
                  <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="w-4 h-4" />{progress.answered} answered</span>
                  <span className="flex items-center gap-1 text-xs text-yellow-700"><SkipForward className="w-4 h-4" />{progress.skipped} skipped</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#be3144]">
                  <Trophy className="w-4 h-4" />
                  {progress.progress}%
                </div>
              </div>
              {/* Navigation */}
              <div className="flex items-center justify-between mt-2">
                {/* Previous Button */}
                <div>
                  {activeQuestionIndex > 0 && (
                    <Button
                      onClick={handlePreviousQuestion}
                      variant="outline"
                      className="px-6 py-3 rounded-full bg-white border-gray-200 text-gray-700 font-semibold shadow-md hover:scale-105 hover:border-[#be3144] hover:text-[#be3144] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#be3144] focus:ring-offset-2"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>
                {/* Center Status */}
                <div className="text-center space-y-2">
                  <div className="flex items-center gap-2 justify-center">
                    {isCurrentQuestionAnswered() && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Answered
                      </Badge>
                    )}
                    {isCurrentQuestionSkipped() && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <SkipForward className="w-3 h-3 mr-1" />
                        Skipped
                      </Badge>
                    )}
                    {!isCurrentQuestionAnswered() && !isCurrentQuestionSkipped() && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Next/Skip/End Buttons */}
                <div className="flex gap-3">
                  {/* Show Skip button only if question is not answered and not skipped */}
                  {!isCurrentQuestionAnswered() && !isCurrentQuestionSkipped() && (
                    <Button
                      onClick={handleSkipQuestion}
                      variant="outline"
                      className="px-6 py-3 rounded-full bg-yellow-50 border-yellow-200 text-yellow-700 font-semibold shadow-md hover:scale-105 hover:bg-yellow-100 transition-all duration-300"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip
                    </Button>
                  )}

                  {/* Show Next button if question is answered or skipped, and not the last question */}
                  {(isCurrentQuestionAnswered() || isCurrentQuestionSkipped()) &&
                    activeQuestionIndex < (mockInterviewQuestion?.length || 1) - 1 && (
                      <Button
                        onClick={handleNextQuestion}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-[#be3144] to-[#f05941] text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#be3144] focus:ring-offset-2"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}

                  {/* Show End Interview button only on the last question if it's answered or skipped */}
                  {activeQuestionIndex === (mockInterviewQuestion?.length || 1) - 1 &&
                    (isCurrentQuestionAnswered() || isCurrentQuestionSkipped()) &&
                    interviewData?.mockId && (
                      <Button
                        onClick={async () => {
                          await endSession();
                          window.location.href = `/job-seeker/interview-thankyou`;
                        }}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        End Interview
                      </Button>
                    )}
                </div>
              </div>
            </div>
            {/* Right: Camera/Answer Section */}
            <div className="flex-1 min-w-[320px] max-w-xl flex flex-col gap-6">
              <RecordAnswerSection
                mockInterviewQuestion={mockInterviewQuestion}
                activeQuestionIndex={activeQuestionIndex}
                interviewData={interviewData}
                sessionId={sessionId}
                userEmail={user?.primaryEmailAddress?.emailAddress}
                onAnswerSubmitted={async () => {
                  console.log('onAnswerSubmitted called');
                  await loadSessionAnswers(sessionId);
                }}
                currentAnswer={getCurrentAnswer(userAnswers, activeQuestionIndex, sessionId)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Question Navigator Sheet */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-6">
          <QuestionsSection
            mockInterviewQuestion={mockInterviewQuestion}
            activeQuestionIndex={activeQuestionIndex}
            onSelectQuestion={async (index) => {
              // If navigating to the last question, auto-skip unanswered questions
              if (index === (mockInterviewQuestion?.length || 1) - 1) {
                await autoSkipUnansweredQuestions();
              }
              setActiveQuestionIndex(index);
              setDrawerOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}

export default StartInterview