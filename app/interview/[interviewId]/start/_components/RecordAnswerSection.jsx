"use client";
import Webcam from 'react-webcam';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, RefreshCw, Save, Loader2, Languages, Shield, Eye, EyeOff, AlertTriangle, Monitor, Activity, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { chatSession } from '@/utils/OpenAIModel';
import { saveUserAnswer } from '@/utils/devInterviewStore';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';
import { useReactMediaRecorder } from 'react-media-recorder';
import { transcribeAudio } from '@/utils/OpenAIModel';
import CheatingDetection from './CheatingDetection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert } from '@/components/ui/alert';

function RecordAnswerSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
  interviewType = 'technical',
  sessionId,
  userEmail,
  onAnswerSubmitted,
  currentAnswer
}) {
  // State declarations
  const [userAnswer, setUserAnswer] = useState(currentAnswer?.userAns || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(currentAnswer?.feedback ? {
    feedback: currentAnswer.feedback,
    rating: currentAnswer.rating,
    suggestions: currentAnswer.suggestions ? currentAnswer.suggestions.split(', ') : []
  } : null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [followUpAnalysis, setFollowUpAnalysis] = useState(null);
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [languageMode, setLanguageMode] = useState('auto'); // 'auto', 'en', or 'ar'
  const [retryCount, setRetryCount] = useState(currentAnswer?.retryCount || 0);
  const [cheatingAlerts, setCheatingAlerts] = useState([]);
  const [cheatingRisk, setCheatingRisk] = useState(0);
  const [showCheatingDetection, setShowCheatingDetection] = useState(false);
  const [showCheatingDetails, setShowCheatingDetails] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);

  const webcamRef = useRef(null);
  const { user } = useUser();
  const MIN_ANSWER_LENGTH = 10;
  const cheatingDetectionRef = useRef(null);
  const landmarkCanvasRef = useRef(null);

  // Initialize with existing answer if available
  useEffect(() => {
    if (currentAnswer) {
      setUserAnswer(currentAnswer.userAns || '');
      setFeedback({
        rating: currentAnswer.rating,
        feedback: currentAnswer.feedback,
        suggestions: currentAnswer.suggestions ? currentAnswer.suggestions.split(', ') : []
      });
      setRetryCount(currentAnswer.retryCount || 0);
    } else {
      setUserAnswer('');
      setFeedback(null);
      setRetryCount(0);
    }
  }, [currentAnswer, activeQuestionIndex]);

  // Audio recording setup
  const {
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    mediaBlobUrl,
    clearBlobUrl,
    status,
    error: recordingError
  } = useReactMediaRecorder({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Disable audio monitoring to prevent hearing your own voice
      sampleRate: 44100,
      channelCount: 1
    },
    onStart: () => {
      setIsRecording(true);
      setDetectedLanguage(null);
    },
    onStop: async (blobUrl, blob) => {
      setIsRecording(false);
      setAudioBlob(blob);
      setIsTranscribing(true);
      try {
        const { text, detectedLanguage } = await transcribeAudio(blob, languageMode);
        setUserAnswer(text);
        setDetectedLanguage(detectedLanguage);
      } catch (error) {
        toast.error('Audio transcription failed');
        console.error('Transcription error:', error);
      } finally {
        setIsTranscribing(false);
      }
    },
    mediaRecorderOptions: {
      mimeType: 'audio/webm'
    }
  });

  // Handle recording errors
  useEffect(() => {
    if (recordingError) {
      toast.error(`Recording error: ${recordingError}`);
      console.error('Recording error:', recordingError);
    }
  }, [recordingError]);

  // Auto-submit when recording stops with sufficient answer
  useEffect(() => {
    if (!isRecording && userAnswer.trim().length >= MIN_ANSWER_LENGTH && !isProcessing) {
      handleSubmitAnswer();
    }
  }, [isRecording, userAnswer]);

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (recordingTime > 0) {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartStopRecording = async () => {
    try {
      if (isRecording) {
        stopAudioRecording();
      } else {
        setUserAnswer('');
        setFeedback(null);
        setFollowUpAnalysis(null);
        clearBlobUrl();
        startAudioRecording();
      }
    } catch (err) {
      toast.error('Error accessing microphone');
      console.error('Microphone access error:', err);
    }
  };

  const generateFeedback = async () => {
    if (!userAnswer.trim()) return null;

    try {
      // Use the new video interview evaluation API
      const response = await fetch('/api/video-interview-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: mockInterviewQuestion[activeQuestionIndex]?.question,
          answer: userAnswer,
          interviewType: interviewType
        })
      });

      if (!response.ok) {
        throw new Error('Evaluation API request failed');
      }

      const evaluationResult = await response.json();

      // Format the result for compatibility with existing UI
      return {
        rating: evaluationResult.evaluation_score || evaluationResult.traditional_feedback?.rating || 5,
        feedback: evaluationResult.traditional_feedback?.feedback || "Evaluation completed successfully",
        suggestions: evaluationResult.traditional_feedback?.suggestions || ["Continue practicing", "Focus on clarity", "Provide more examples"],
        transcriptionQuality: evaluationResult.traditional_feedback?.transcriptionQuality || 5,
        language: detectedLanguage || 'en',
        overallAssessment: evaluationResult.traditional_feedback?.overallAssessment || "Good response with room for improvement",
        // Add detailed evaluation data
        detailedEvaluation: evaluationResult.labels || {},
        evaluationScore: (function () {
          const score = parseFloat(evaluationResult.evaluation_score);
          return isNaN(score) ? 5.0 : score;
        })(),
        detailedScores: evaluationResult.detailed_scores || {},
        combinedScore: evaluationResult.combined_score?.toString() || "5",
        // Store the original combined_score for database saving
        originalCombinedScore: evaluationResult.combined_score
      };
    } catch (error) {
      console.error("Feedback generation failed", error);
      toast.error("Failed to generate feedback");
      return null;
    }
  };

  const generateFollowUpAnalysis = async () => {
    if (!userAnswer.trim()) return null;

    try {
      const followUpPrompt = `Act like an expert interview coach analyzing:
        Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}
        Answer: ${userAnswer}

        Provide JSON response with:
        - "needsFollowUp": boolean
        - "reason": string
        - "suggestedFollowUp": string`;

      const result = await chatSession(followUpPrompt, interviewType);
      return JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch (error) {
      console.error("Follow up generation failed", error);
      return null;
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || userAnswer.trim().length < MIN_ANSWER_LENGTH) {
      toast.error(`Answer must be at least ${MIN_ANSWER_LENGTH} characters long`);
      return;
    }

    try {
      setLoading(true);
      setIsProcessing(true);

      // Generate feedback
      const feedbackResult = await generateFeedback();
      if (feedbackResult) {
        setFeedback(feedbackResult);
      }

      // Generate follow-up analysis
      const followUpResult = await generateFollowUpAnalysis();
      if (followUpResult) {
        setFollowUpAnalysis(followUpResult);
      }

      // Save cheating detection data
      const cheatingData = cheatingDetectionRef.current ? {
        overallRisk: cheatingRisk,
        alerts: cheatingAlerts,
        detectionHistory: cheatingDetectionRef.current.getDetectionHistory ? cheatingDetectionRef.current.getDetectionHistory() : [],
        enhancedMetrics: cheatingDetectionRef.current.getEnhancedMetrics ? cheatingDetectionRef.current.getEnhancedMetrics() : {},
        sessionId: sessionId,
        questionIndex: activeQuestionIndex,
        timestamp: new Date().toISOString()
      } : null;

      if (cheatingData) {
        await saveCheatingDetectionData(cheatingData);
      }

      // Save answer to database
      const question = mockInterviewQuestion[activeQuestionIndex];
      const answerData = {
        mockIdRef: interviewData.mockId,
        question: question.question,
        questionIndex: activeQuestionIndex,
        sessionId: sessionId,
        userEmail: userEmail,
        userAns: userAnswer,
        isSkipped: false,
        isAnswered: true,
        rating: feedbackResult?.rating?.toString() || '5',
        feedback: feedbackResult?.feedback || 'No feedback available',
        suggestions: feedbackResult?.suggestions && Array.isArray(feedbackResult.suggestions) ? feedbackResult.suggestions.join(', ') : '',
        cheatingDetection: cheatingData,
        createdAt: new Date().toISOString(),
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
        retryCount: retryCount,
        // Add missing evaluation fields
        detailedEvaluation: feedbackResult?.detailedEvaluation || {},
        evaluationScore: feedbackResult?.evaluationScore?.toString() || '5',
        detailedScores: feedbackResult?.detailedScores || {},
        combinedScore: feedbackResult?.originalCombinedScore?.toString() || feedbackResult?.combinedScore?.toString() || '5',
        overallAssessment: feedbackResult?.overallAssessment || 'Good response with room for improvement',
        interview_type: interviewType,
        language: feedbackResult?.language || 'en'
      };

      // Save answer to localStorage (dev mode)
      saveUserAnswer(answerData);

      // Reload answers
      if (onAnswerSubmitted) {
        await onAnswerSubmitted();
      }

      toast.success('Answer saved successfully!');
      setRetryCount(prev => prev + 1);

    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setUserAnswer('');
    setFeedback(null);
    setFollowUpAnalysis(null);
    clearBlobUrl();
    setRetryCount(prev => prev + 1);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const containsArabic = (text) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  const handleCheatingDetected = (alert) => {
    setCheatingAlerts(prev => [...prev, { ...alert, id: Date.now() }]);
  };

  const handleCheatingResolved = (alertId) => {
    setCheatingAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleCheatingRiskUpdate = (risk) => {
    setCheatingRisk(risk);
  };

  const drawLandmarks = useCallback((landmarks, videoElement) => {
    if (!landmarkCanvasRef.current || !showLandmarks) return;

    const canvas = landmarkCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Get the video's display size
    const videoRect = videoElement.getBoundingClientRect();
    canvas.width = videoRect.width;
    canvas.height = videoRect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks) return;

    // Calculate scale factors
    const scaleX = canvas.width / videoElement.videoWidth;
    const scaleY = canvas.height / videoElement.videoHeight;

    // Helper functions
    const scaleXCoord = (x) => x * scaleX;
    const scaleYCoord = (y) => y * scaleY;

    // Draw all 68 landmarks
    const points = landmarks.positions;

    // Draw different landmark groups with different colors
    ctx.lineWidth = 2;

    // Jaw line (points 0-16)
    ctx.strokeStyle = '#FF6B6B';
    ctx.fillStyle = '#FF6B6B';
    for (let i = 0; i < 17; i++) {
      const point = points[i];
      const scaledX = scaleXCoord(point.x);
      const scaledY = scaleYCoord(point.y);
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      if (i > 0) {
        const prevPoint = points[i - 1];
        const prevScaledX = scaleXCoord(prevPoint.x);
        const prevScaledY = scaleYCoord(prevPoint.y);
        ctx.beginPath();
        ctx.moveTo(prevScaledX, prevScaledY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }
    }

    // Right eyebrow (points 17-21)
    ctx.strokeStyle = '#4ECDC4';
    ctx.fillStyle = '#4ECDC4';
    for (let i = 17; i < 22; i++) {
      const point = points[i];
      const scaledX = scaleXCoord(point.x);
      const scaledY = scaleYCoord(point.y);
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      if (i > 17) {
        const prevPoint = points[i - 1];
        const prevScaledX = scaleXCoord(prevPoint.x);
        const prevScaledY = scaleYCoord(prevPoint.y);
        ctx.beginPath();
        ctx.moveTo(prevScaledX, prevScaledY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }
    }

    // Left eyebrow (points 22-26)
    for (let i = 22; i < 27; i++) {
      const point = points[i];
      const scaledX = scaleXCoord(point.x);
      const scaledY = scaleYCoord(point.y);
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      if (i > 22) {
        const prevPoint = points[i - 1];
        const prevScaledX = scaleXCoord(prevPoint.x);
        const prevScaledY = scaleYCoord(prevPoint.y);
        ctx.beginPath();
        ctx.moveTo(prevScaledX, prevScaledY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }
    }

    // Nose (points 27-35)
    ctx.strokeStyle = '#45B7D1';
    ctx.fillStyle = '#45B7D1';
    for (let i = 27; i < 36; i++) {
      const point = points[i];
      const scaledX = scaleXCoord(point.x);
      const scaledY = scaleYCoord(point.y);
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      if (i > 27) {
        const prevPoint = points[i - 1];
        const prevScaledX = scaleXCoord(prevPoint.x);
        const prevScaledY = scaleYCoord(prevPoint.y);
        ctx.beginPath();
        ctx.moveTo(prevScaledX, prevScaledY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }
    }

    // Right eye (points 36-41)
    ctx.strokeStyle = '#96CEB4';
    ctx.fillStyle = '#96CEB4';
    for (let i = 36; i < 42; i++) {
      const point = points[i];
      const scaledX = scaleXCoord(point.x);
      const scaledY = scaleYCoord(point.y);
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      if (i > 36) {
        const prevPoint = points[i - 1];
        const prevScaledX = scaleXCoord(prevPoint.x);
        const prevScaledY = scaleYCoord(prevPoint.y);
        ctx.beginPath();
        ctx.moveTo(prevScaledX, prevScaledY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }
    }
    // Close the eye circle
    const lastEyePoint = points[41];
    const firstEyePoint = points[36];
    ctx.beginPath();
    ctx.moveTo(scaleXCoord(lastEyePoint.x), scaleYCoord(lastEyePoint.y));
    ctx.lineTo(scaleXCoord(firstEyePoint.x), scaleYCoord(firstEyePoint.y));
    ctx.stroke();

    // Left eye (points 42-47)
    for (let i = 42; i < 48; i++) {
      const point = points[i];
      const scaledX = scaleXCoord(point.x);
      const scaledY = scaleYCoord(point.y);
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      if (i > 42) {
        const prevPoint = points[i - 1];
        const prevScaledX = scaleXCoord(prevPoint.x);
        const prevScaledY = scaleYCoord(prevPoint.y);
        ctx.beginPath();
        ctx.moveTo(prevScaledX, prevScaledY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }
    }
    // Close the eye circle
    const lastLeftEyePoint = points[47];
    const firstLeftEyePoint = points[42];
    ctx.beginPath();
    ctx.moveTo(scaleXCoord(lastLeftEyePoint.x), scaleYCoord(lastLeftEyePoint.y));
    ctx.lineTo(scaleXCoord(firstLeftEyePoint.x), scaleYCoord(firstLeftEyePoint.y));
    ctx.stroke();

    // Mouth (points 48-67)
    ctx.strokeStyle = '#FFEAA7';
    ctx.fillStyle = '#FFEAA7';
    for (let i = 48; i < 68; i++) {
      const point = points[i];
      const scaledX = scaleXCoord(point.x);
      const scaledY = scaleYCoord(point.y);
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      if (i > 48) {
        const prevPoint = points[i - 1];
        const prevScaledX = scaleXCoord(prevPoint.x);
        const prevScaledY = scaleYCoord(prevPoint.y);
        ctx.beginPath();
        ctx.moveTo(prevScaledX, prevScaledY);
        ctx.lineTo(scaledX, scaledY);
        ctx.stroke();
      }
    }

    // Draw eye centers and gaze direction
    if (landmarks.getLeftEye && landmarks.getRightEye) {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      // Calculate eye centers
      const leftEyeCenter = leftEye.reduce((acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }), { x: 0, y: 0 });
      leftEyeCenter.x /= leftEye.length;
      leftEyeCenter.y /= leftEye.length;

      const rightEyeCenter = rightEye.reduce((acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }), { x: 0, y: 0 });
      rightEyeCenter.x /= rightEye.length;
      rightEyeCenter.y /= rightEye.length;

      // Draw eye centers (scaled)
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(scaleXCoord(leftEyeCenter.x), scaleYCoord(leftEyeCenter.y), 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(scaleXCoord(rightEyeCenter.x), scaleYCoord(rightEyeCenter.y), 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw gaze direction line (scaled)
      const eyeCenter = {
        x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
        y: (leftEyeCenter.y + rightEyeCenter.y) / 2
      };
      const videoCenter = { x: canvas.width / 2, y: canvas.height / 2 };

      // Calculate gaze direction and distance
      const gazeVector = {
        x: eyeCenter.x - videoCenter.x,
        y: eyeCenter.y - videoCenter.y
      };
      const gazeDistance = Math.sqrt(gazeVector.x * gazeVector.x + gazeVector.y * gazeVector.y);
      const normalizedGaze = {
        x: gazeVector.x / gazeDistance,
        y: gazeVector.y / gazeDistance
      };

      // Draw gaze direction with color based on distance
      const maxDistance = Math.min(canvas.width, canvas.height) * 0.4;
      const gazeIntensity = Math.min(1.0, gazeDistance / maxDistance);

      // Color based on gaze intensity (green = looking at center, red = looking away)
      const red = Math.floor(255 * gazeIntensity);
      const green = Math.floor(255 * (1 - gazeIntensity));
      ctx.strokeStyle = `rgb(${red}, ${green}, 0)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(scaleXCoord(eyeCenter.x), scaleYCoord(eyeCenter.y));
      ctx.lineTo(videoCenter.x, videoCenter.y);
      ctx.stroke();

      // Draw center target with size based on gaze accuracy
      const targetSize = 8 + (gazeIntensity * 4);
      ctx.fillStyle = `rgb(${green}, ${red}, 0)`;
      ctx.beginPath();
      ctx.arc(videoCenter.x, videoCenter.y, targetSize, 0, 2 * Math.PI);
      ctx.fill();

      // Draw gaze zone indicator
      const zone = calculateGazeZone(eyeCenter, videoElement);
      ctx.fillStyle = '#0000FF';
      ctx.font = '14px Arial';
      ctx.fillText(`Zone: ${zone}`, 10, 20);
      ctx.fillText(`Distance: ${Math.round(gazeDistance)}`, 10, 40);
      ctx.fillText(`Intensity: ${Math.round(gazeIntensity * 100)}%`, 10, 60);

      // Draw device detection landmarks if available
      if (landmarks.deviceDetection) {
        const deviceData = landmarks.deviceDetection;

        // Draw bright areas (yellow dots)
        ctx.fillStyle = '#FFFF00';
        ctx.globalAlpha = 0.6;
        for (const area of deviceData.brightAreas) {
          const scaledX = scaleXCoord(area.x);
          const scaledY = scaleYCoord(area.y);
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw blue areas (blue dots)
        ctx.fillStyle = '#0080FF';
        for (const area of deviceData.blueAreas) {
          const scaledX = scaleXCoord(area.x);
          const scaledY = scaleYCoord(area.y);
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw white areas (white dots)
        ctx.fillStyle = '#FFFFFF';
        for (const area of deviceData.whiteAreas) {
          const scaledX = scaleXCoord(area.x);
          const scaledY = scaleYCoord(area.y);
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw edge points (red dots)
        ctx.fillStyle = '#FF0000';
        for (const point of deviceData.edgePoints) {
          const scaledX = scaleXCoord(point.x);
          const scaledY = scaleYCoord(point.y);
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, 1, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw detected device clusters (circles)
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        for (const cluster of deviceData.detectedRegions) {
          const scaledX = scaleXCoord(cluster.center.x);
          const scaledY = scaleYCoord(cluster.center.y);
          const radius = Math.min(20, cluster.size / 2);

          ctx.beginPath();
          ctx.arc(scaledX, scaledY, radius, 0, 2 * Math.PI);
          ctx.stroke();

          // Draw cluster info
          ctx.fillStyle = '#FF00FF';
          ctx.font = '12px Arial';
          const typesText = cluster.types && Array.isArray(cluster.types) ? cluster.types.join(',') : 'unknown';
          ctx.fillText(typesText, scaledX + radius + 5, scaledY);
        }

        // Reset alpha
        ctx.globalAlpha = 1.0;

        // Draw YOLO detection boxes if available
        if (landmarks.yoloDetections && landmarks.yoloDetections.length > 0) {
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;

          for (const detection of landmarks.yoloDetections) {
            const [x1, y1, x2, y2] = detection.bbox;
            const scaledX1 = scaleXCoord(x1);
            const scaledY1 = scaleYCoord(y1);
            const scaledX2 = scaleXCoord(x2);
            const scaledY2 = scaleYCoord(y2);

            // Draw bounding box
            ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);

            // Draw confidence label
            ctx.fillStyle = '#FF0000';
            ctx.font = '12px Arial';
            ctx.fillText(`${Math.round(detection.confidence * 100)}%`, scaledX1, scaledY1 - 5);

            // Draw device type label
            ctx.fillText(`Mobile Device`, scaledX1, scaledY2 + 15);
          }

          ctx.globalAlpha = 1.0;
        }

        // Draw device detection info
        if (landmarks.deviceDetected) {
          ctx.fillStyle = '#FF0000';
          ctx.font = '16px Arial';
          ctx.fillText(`DEVICE DETECTED: ${landmarks.deviceType || 'unknown'}`, 10, 80);
          ctx.fillText(`Confidence: ${Math.round(landmarks.deviceConfidence * 100)}%`, 10, 100);

          // Show YOLO-only mode
          if (landmarks.yoloOnly) {
            ctx.fillText(`YOLO-ONLY MODE`, 10, 120);
          } else if (landmarks.backendUsed) {
            ctx.fillText(`Backend: ${landmarks.backendUsed.toUpperCase()}`, 10, 120);
          }
        }
      }
    }
  }, [showLandmarks]);

  // Calculate gaze zone (center, left, right, top, bottom)
  const calculateGazeZone = (eyeCenter, videoElement) => {
    const centerX = videoElement.videoWidth / 2;
    const centerY = videoElement.videoHeight / 2;
    const threshold = Math.min(videoElement.videoWidth, videoElement.videoHeight) * 0.2;

    const dx = eyeCenter.x - centerX;
    const dy = eyeCenter.y - centerY;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      return 'center';
    } else if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'bottom' : 'top';
    }
  };

  const handleLandmarkData = useCallback((landmarks) => {
    if (landmarks && webcamRef.current) {
      drawLandmarks(landmarks, webcamRef.current.video);
    }
  }, [drawLandmarks]);

  const saveCheatingDetectionData = async (cheatingData) => {
    try {
      // Extract mockId from sessionId (format: email_mockId_timestamp_randomId)
      const sessionParts = sessionId.split('_');
      const mockId = sessionParts[1]; // mockId is the second part
      console.log('Saving session-level cheating detection data:', { sessionId, mockId: mockId, sessionParts: sessionParts, riskScore: cheatingData.riskScore || cheatingRisk, alertsCount: cheatingData.alerts?.length || cheatingAlerts.length, detectionHistoryLength: cheatingData.detectionHistory?.length || 0 });

      // First, try to create the session if it doesn't exist
      try {
        const createResponse = await fetch('/api/session-cheating-detection/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId,
            mockId: mockId,
            userEmail: userEmail,
            detectionSettings: {
              detectionInterval: 2000,
              confidenceThreshold: 0.75,
              maxViolations: 5,
              alertCooldown: 10000,
              faceDetectionEnabled: true,
              deviceDetectionEnabled: true,
              movementAnalysisEnabled: true,
              audioAnalysisEnabled: true,
              tabSwitchingDetectionEnabled: true,
              typingDetectionEnabled: true
            }
          })
        });
        if (createResponse.ok) {
          console.log('Session created/updated successfully');
        } else {
          console.warn('Session creation failed, but continuing with update');
        }
      } catch (error) {
        console.warn('Session creation attempt failed:', error);
      }

      const requestBody = {
        sessionId: sessionId,
        mockId: mockId,
        detectionData: {
          riskScore: cheatingData.riskScore || cheatingRisk,
          alerts: cheatingData.alerts || cheatingAlerts,
          detectionHistory: cheatingData.detectionHistory || [],
          enhancedMetrics: cheatingData.enhancedMetrics || {},
          severityLevel: cheatingData.severityLevel || 'low',
          detectionSettings: cheatingData.detectionSettings || {}
        },
        riskScore: cheatingData.riskScore || cheatingRisk,
        alerts: cheatingData.alerts || cheatingAlerts,
        enhancedMetrics: cheatingData.enhancedMetrics || {},
        detectionHistory: cheatingData.detectionHistory || []
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/session-cheating-detection/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Session-level cheating detection data saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving session-level cheating detection data:', error);
      console.error('Error details:', { message: error.message, stack: error.stack, name: error.name });
      // Don't throw error to avoid breaking the main save operation
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Camera Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Monitor className="h-6 w-6 text-gray-600" />
                  {cheatingRisk > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">Interview Camera</CardTitle>
                  <CardDescription className="text-gray-600">
                    {cheatingRisk > 0 ? `${Math.round(cheatingRisk)}% risk detected` : 'Monitoring active'}
                  </CardDescription>
                </div>
              </div>

              {/* Cheating Detection Toggle */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCheatingDetails(!showCheatingDetails)}
                      className="flex items-center gap-2"
                    >
                      {showCheatingDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showCheatingDetails ? 'Hide' : 'Show'} Details
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showCheatingDetails ? 'Hide cheating detection details' : 'Show cheating detection details'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLandmarks(!showLandmarks)}
                      className="flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      {showLandmarks ? 'Hide' : 'Show'} Landmarks
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showLandmarks ? 'Hide facial landmarks' : 'Show facial landmarks'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCheatingDetection(true)}
                      className="flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Alerts
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View cheating detection alerts</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {/* Webcam */}
            <div className="relative w-full max-w-md mx-auto">
              <Webcam
                ref={webcamRef}
                className="w-full rounded-lg shadow-md object-cover"
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
              />

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                  REC
                </div>
              )}

              {/* Risk Level Indicator */}
              {cheatingRisk > 0 && (
                <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-medium text-white ${cheatingRisk < 30 ? 'bg-green-500' :
                  cheatingRisk < 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                  Risk: {Math.round(cheatingRisk)}%
                </div>
              )}

              {/* Landmark Overlay */}
              <canvas
                ref={landmarkCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-lg"
              />
            </div>

            {/* Cheating Detection Status */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Active</span>
                </div>
                <span className="text-gray-600">Alerts: {cheatingAlerts.length}</span>
              </div>
            </div>

            {/* Cheating Detection (always running, details toggled) */}
            <CheatingDetection
              webcamRef={webcamRef}
              isRecording={isRecording}
              onCheatingDetected={handleCheatingDetected}
              onCheatingResolved={handleCheatingResolved}
              onCheatingRiskUpdate={handleCheatingRiskUpdate}
              onLandmarkData={handleLandmarkData}
              sessionId={sessionId}
              questionIndex={activeQuestionIndex}
              interviewSettings={{
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
              }}
              ref={cheatingDetectionRef}
              showDetails={showCheatingDetails}
            />

            {/* Quick Risk Indicator */}
            {!showCheatingDetails && cheatingRisk > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="text-orange-800">
                  <div className="font-medium">Risk Level: {Math.round(cheatingRisk)}%</div>
                  <div className="text-sm">{cheatingAlerts.length} alerts detected</div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Language Selector */}
        <div className="flex items-center justify-between mb-2 gap-2 w-full flex-wrap">
          {/* Language Selector - Left */}
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary mr-1" />
            <Button
              variant={languageMode === 'auto' ? "default" : "outline"}
              onClick={() => setLanguageMode('auto')}
              size="icon"
              className={`rounded-full px-3 py-1 text-xs font-medium min-w-[70px] ${languageMode === 'auto' ? 'bg-[#be3144] text-white' : ''}`}
            >
              Auto Detect
            </Button>
            <Button
              variant={languageMode === 'en' ? "default" : "outline"}
              onClick={() => setLanguageMode('en')}
              size="icon"
              className={`rounded-full px-3 py-1 text-xs font-medium min-w-[70px] ${languageMode === 'en' ? 'bg-[#be3144] text-white' : ''}`}
            >
              English
            </Button>
            <Button
              variant={languageMode === 'ar' ? "default" : "outline"}
              onClick={() => setLanguageMode('ar')}
              size="icon"
              className={`rounded-full px-3 py-1 text-xs font-medium min-w-[70px] ${languageMode === 'ar' ? 'bg-[#be3144] text-white' : ''}`}
            >
              العربية
            </Button>
          </div>
          {/* Action Buttons - Right */}
          <div className="flex gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              className="gap-1 px-4 py-2 text-xs font-semibold rounded-full shadow-sm"
              onClick={handleStartStopRecording}
              disabled={loading || isTranscribing}
            >
              {isRecording ? (
                <>
                  <StopCircle className="h-4 w-4" />
                  <span className="animate-pulse">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Record</span>
                </>
              )}
              {isTranscribing && <Loader2 className="h-3 w-3 animate-spin" />}
            </Button>
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isRecording || (!userAnswer && !feedback)}
              className="px-4 py-2 text-xs rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {retryCount > 0 ? 'Retry' : 'Retry'}
            </Button>
            <Button
              onClick={handleSubmitAnswer}
              disabled={loading || !userAnswer.trim() || userAnswer.trim().length < MIN_ANSWER_LENGTH}
              className="gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-[#be3144] to-[#f05941] text-white text-xs font-semibold shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Saving...' : (retryCount > 0 ? 'Update' : 'Save')}
            </Button>
          </div>
        </div>

        {/* Recording Progress Bar */}
        {isRecording && (
          <div className="w-full max-w-2xl mb-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Recording: {formatTime(recordingTime)}</span>
              <span>Max: 2 min</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300 bg-red-500"
                style={{ width: `${Math.min(100, (recordingTime / 120) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Transcription Display */}
        <div className="w-full mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-800">Your Answer</span>
            {detectedLanguage && (
              <span className="text-xs text-muted-foreground">
                {detectedLanguage === 'en' ? 'English' : detectedLanguage === 'ar' ? 'Arabic' : 'Mixed'}
              </span>
            )}
          </div>
          <div
            className={`bg-gray-50 p-3 rounded-lg min-h-[60px] border text-sm ${containsArabic(userAnswer) ? 'text-right' : 'text-left'} font-medium`}
            dir={containsArabic(userAnswer) ? 'rtl' : 'ltr'}
          >
            {userAnswer ? (
              <p className="whitespace-pre-wrap">{userAnswer}</p>
            ) : (
              <span className="text-muted-foreground italic">
                {isRecording ? "Recording..." : "Your transcription will appear here"}
              </span>
            )}
          </div>
        </div>

        {/* Audio Player */}
        {mediaBlobUrl && (
          <div className="w-full max-w-2xl mb-4">
            <h3 className="text-lg font-semibold mb-2">Recording:</h3>
            <audio src={mediaBlobUrl} controls className="w-full rounded-lg" />
          </div>
        )}

        {/* Feedback */}
        {/* {feedback && (
          <div className="w-full max-w-2xl space-y-4 animate-in fade-in">
            <h3 className="text-lg font-semibold">Feedback:</h3>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <span className="font-medium mr-2">Rating:</span>
                <span className="bg-green-100 px-2 py-1 rounded-full text-sm">
                  {feedback.rating}/10
                </span>
                {feedback.transcriptionQuality && (
                  <span className="ml-2 text-sm">
                    (Quality: {feedback.transcriptionQuality}/5)
                  </span>
                )}
                {feedback.language && (
                  <span className="ml-2 text-sm">
                    (Language: {feedback.language})
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Feedback:</span>
                  <p className="text-sm mt-1">{feedback.feedback}</p>
                </div>
                {feedback.suggestions && feedback.suggestions.length > 0 && (
                  <div>
                    <span className="font-medium">Suggestions:</span>
                    <ul className="text-sm mt-1 list-disc list-inside">
                      {feedback.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )} */}
      </div>
    </TooltipProvider>
  );
}

export default RecordAnswerSection;