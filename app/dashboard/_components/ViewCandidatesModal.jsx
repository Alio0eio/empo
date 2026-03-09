'use client'

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Mail, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getJobFeedback } from '@/utils/localStorageFeedback';
import { getOrCreateMockInterview } from '@/utils/devInterviewStore';

export function ViewCandidatesModal({ jobId, jobPosition, isOpen, onOpenChange }) {
  const [candidates, setCandidate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchCandidates();
    }
  }, [isOpen, jobId]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Try to fetch feedback with direct job_id match (for call interviews where job_id is a UUID)
      const directFeedback = getJobFeedback(String(jobId));
      console.log('Direct feedback for jobId:', jobId, '=', directFeedback);

      // Step 2: Find call interviews linked to this posted job (where jobDetailsId == jobId)
      if (typeof window !== 'undefined') {
        const rawCallInterviews = window.localStorage.getItem('devCallInterviews');
        const callInterviews = rawCallInterviews ? JSON.parse(rawCallInterviews) : [];
        
        console.log('All call interviews:', callInterviews);
        console.log('Looking for call interviews with jobDetailsId:', jobId);

        // Find interviews linked to this job
        const linkedInterviews = callInterviews.filter(interview => 
          String(interview.jobDetailsId) === String(jobId)
        );
        
        console.log('Linked call interviews:', linkedInterviews);

        // Get feedback for all linked interviews
        let linkedFeedback = [];
        linkedInterviews.forEach(interview => {
          const feedback = getJobFeedback(String(interview.job_id));
          linkedFeedback = [...linkedFeedback, ...feedback];
        });

        // Combine direct and linked feedback
        const allFeedback = [...directFeedback, ...linkedFeedback];
        console.log('All feedback (direct + linked):', allFeedback);

        const formattedCandidates = allFeedback.map(item => {
          let score = 'N/A';
          let assessment = 'Pending';
          let recommended = false;

          try {
            if (item.feedback) {
              const feedbackObj = typeof item.feedback === 'string' 
                ? JSON.parse(item.feedback) 
                : item.feedback;
              
              score = feedbackObj.overallScore || feedbackObj.score || feedbackObj.rating || 'N/A';
              assessment = feedbackObj.overallAssessment || feedbackObj.assessment || 'Pending';
              recommended = feedbackObj.recommended || item.recommended || false;
            }
          } catch (e) {
            console.error('Error parsing feedback:', e);
          }

          return {
            id: item.id,
            userName: item.userName,
            userEmail: item.userEmail,
            score: score,
            assessment: assessment,
            recommended: recommended,
            feedback: item.feedback
          };
        });

        console.log('Formatted candidates:', formattedCandidates);
        setCandidate(formattedCandidates);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (typeof score === 'string' && score === 'N/A') return 'text-gray-600';
    const numScore = typeof score === 'number' ? score : parseInt(score);
    if (numScore >= 80) return 'text-green-600';
    if (numScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (typeof score === 'string' && score === 'N/A') return 'bg-gray-50';
    const numScore = typeof score === 'number' ? score : parseInt(score);
    if (numScore >= 80) return 'bg-green-50';
    if (numScore >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#be3144]" />
            Interview Candidates for {jobPosition}
          </DialogTitle>
          <DialogDescription>
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} participated in this interview
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#be3144] mr-2" />
            <span className="text-gray-600">Loading candidates...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && candidates.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">No candidates have completed the interview yet</p>
          </div>
        )}

        {!loading && !error && candidates.length > 0 && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="border border-[#E4D3D5] hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {candidate.userName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">
                          {candidate.userEmail}
                        </span>
                      </div>
                    </div>

                    {/* Score Section */}
                    <div className="flex items-center gap-3">
                      <div className={`${getScoreBgColor(candidate.score)} rounded-lg p-3 text-center`}>
                        <div className="flex items-center gap-1 justify-center mb-1">
                          <Star className={`h-4 w-4 ${getScoreColor(candidate.score)}`} />
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(candidate.score)}`}>
                          {candidate.score}
                        </div>
                        <div className="text-xs text-gray-600">Score</div>
                      </div>

                      {/* Recommendation Status */}
                      {candidate.recommended ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Recommended</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <AlertCircle className="h-6 w-6 text-gray-400" />
                          <span className="text-xs font-medium text-gray-600">Not Recommended</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assessment Summary */}
                  {candidate.assessment && candidate.assessment !== 'Pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Assessment:</span> {candidate.assessment}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
