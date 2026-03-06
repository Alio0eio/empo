"use client"
import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Star, Eye, Send, Loader2, TrendingUp, Brain, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import clientJobMatcherModel from '@/utils/clientModelLoader';
import CircularProgress from '@/components/ui/circular-progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function JobRecommendations() {
  const [enhancedRecommendations, setEnhancedRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelStatus, setModelStatus] = useState(null);
  const [hiddenJobIds, setHiddenJobIds] = useState([]);
  const [rawRecommendations, setRawRecommendations] = useState([]);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      generateEnhancedRecommendations();
      checkModelStatus();
    }
  }, [isLoaded, user]);

  const checkModelStatus = async () => {
    try {
      const response = await fetch('/api/model-status');
      const data = await response.json();
      if (response.ok) {
        setModelStatus(data.status);
      }
    } catch (error) {
      console.error('Error checking model status:', error);
    }
  };

  const generateEnhancedRecommendations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/job-recommendations?userId=${user.id}&limit=50`);
      
      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing API response as JSON:', parseError);
        throw new Error(`Failed to parse API response: ${parseError.message}`);
      }
      
      if (!response.ok) {
        console.error('API returned error status:', response.status, 'Data:', data);
        if (response.status === 404) {
          setUserProfile(data.userProfile || {});
          setRawRecommendations([]);
          setEnhancedRecommendations([]);
          setLoading(false);
          return;
        }
        throw new Error(data.details || 'Failed to fetch job data for enhancement');
      }
      
      setRawRecommendations(data.recommendations || []);
      setUserProfile(data.userProfile);
      const mapped = (data.recommendations || []).map(job => {
        if (job._type === 'call' || job._type === 'mock') return job;
        if (job.job_id) {
          return {
            ...job,
            _type: 'call',
            jobPosition: job.jobPosition || job.jobTitle,
            jobDescription: job.jobDescription || job.jobDesc || job.jobDescription,
          };
        } else if (job.mockId) {
          return {
            ...job,
            _type: 'mock',
            jobPosition: job.jobPosition || job.jobTitle,
            jobDescription: job.jobDescription || job.jobDesc || job.jobDescription,
          };
        }
        return null;
      }).filter(Boolean);
      setEnhancedRecommendations(mapped);
      if (typeof window !== 'undefined') {
        console.log('Raw recommendations from API:', data.recommendations);
        console.log('Mapped recommendations:', mapped);
      }
    } catch (error) {
      console.error('Error in generateEnhancedRecommendations:', error);
      setError(error.message || 'Failed to generate enhanced recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#be3144]" />
        <span className="ml-2 text-[#8e575f]">Loading your account...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <TrendingUp className="w-12 h-12 text-[#8e575f] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#191011] mb-2">Sign In for AI-Powered Job Recommendations</h3>
        <p className="text-[#8e575f] mb-4">
          Please sign in to get personalized job recommendations powered by our fine-tuned AI model.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#be3144]" />
        <span className="ml-2 text-[#8e575f]">Loading AI-powered job recommendations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
        <Button
          onClick={generateEnhancedRecommendations}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const filteredRecommendations = enhancedRecommendations.filter(job => !hiddenJobIds.includes(job._type === 'call' ? job.job_id : job.mockId));

  if (filteredRecommendations.length === 0) {
    if (rawRecommendations.length > 0) {
      return (
        <div className="text-center p-8">
          <TrendingUp className="w-12 h-12 text-[#8e575f] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#be3144] mb-2">No valid jobs with _type found</h3>
          <p className="text-[#8e575f] mb-4">Raw jobs from API (check console for details):</p>
          <pre className="text-xs text-left bg-[#f1e9ea] p-2 rounded max-h-60 overflow-auto" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(rawRecommendations, null, 2)}</pre>
        </div>
      );
    }
    return (
      <div className="text-center p-8">
        <TrendingUp className="w-12 h-12 text-[#8e575f] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#191011] mb-2">No Job Recommendations Yet</h3>
        <p className="text-[#8e575f] mb-4">
          Upload your CV to get personalized job recommendations powered by our fine-tuned AI model.
        </p>
        <Button
          onClick={() => window.location.href = '/job-seeker/Upload-CV'}
          className="bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#f05941] hover:to-[#ff7b54]"
        >
          Upload CV
        </Button>
      </div>
    );
  }

  const isProfileEmpty = userProfile &&
    !userProfile.skills?.length &&
    !userProfile.experience?.length &&
    !userProfile.currentPosition;

  if (isProfileEmpty) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium text-[#191011] mb-2">
          Your profile is empty
        </h3>
        <p className="text-[#8e575f] mb-4">
          Please upload your CV to get personalized job recommendations powered by our AI model.
        </p>
        <Button
          onClick={() => window.location.href = '/job-seeker/Upload-CV'}
          className="bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#f05941] hover:to-[#ff7b54]"
        >
          Upload CV
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-[#191011]">
              AI-Enhanced Job Recommendations
            </h2>
            <Sparkles className="w-5 h-5 text-[#be3144]" />
          </div>
          <p className="text-[#8e575f]">
            Powered by fine-tuned semantic matching model
          </p>
          {modelStatus && (
            <div className="flex items-center gap-2 mt-2">
              <Brain className="w-4 h-4 text-[#8e575f]" />
              <span className="text-xs text-[#8e575f]">
                AI semantic matching model active
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={generateEnhancedRecommendations}
          variant="outline"
          size="sm"
          className="border-[#be3144] text-[#be3144] hover:bg-[#be3144]/10"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecommendations.map((job, idx) => {
          const key = job._type === 'call' ? job.job_id : job.mockId;
          const handleViewDetails = () => {
            if (job._type === 'call') {
              router.push(`/job-seeker/job/call/${job.job_id}`);
            } else {
              router.push(`/job-seeker/job/mock/${job.mockId}`);
            }
          };

          // Generate deterministic random data for UI demo purposes (consistent with LatestJobsSection)
          const letter = job.jobPosition ? job.jobPosition.charAt(0).toUpperCase() : "J";
          const bgColors = ["bg-blue-50 text-blue-600", "bg-purple-50 text-purple-600", "bg-orange-50 text-orange-600", "bg-green-50 text-green-600"];
          const colorClass = bgColors[idx % bgColors.length];

          // Mock tags based on job title words
          const tags = [];

          // Add Match Score as the first tag if available
          if (typeof job.matchScore === 'number') {
            tags.push(`${job.matchScore}% Match`);
          }

          if (job.jobPosition.toLowerCase().includes('react') || job.jobPosition.toLowerCase().includes('frontend')) tags.push('React', 'Frontend');
          else if (job.jobPosition.toLowerCase().includes('backend') || job.jobPosition.toLowerCase().includes('node')) tags.push('Node.js', 'Backend');
          else if (job.jobPosition.toLowerCase().includes('manager')) tags.push('Management', 'Agile');
          else tags.push('Full Time');

          if (job.location) tags.push(job.location);

          // Mock salary
          const minSalary = 80 + (idx * 5);
          const maxSalary = minSalary + 30;

          return (
            <div
              key={key}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl ${colorClass}`}>
                  {letter}
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                </button>
              </div>

              <h3 className="font-bold text-[#1a1a1a] text-xl mb-2 line-clamp-1" title={job.jobPosition}>
                {job.jobPosition}
              </h3>

              <div className="text-sm text-gray-500 mb-6 flex items-center font-medium">
                <span>{(job.recruiterName || job.createdBy || 'Tech Corp Inc.')}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span>{job.location || 'Remote'}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((tag, i) => {
                  const isMatchScore = tag.includes('% Match');
                  return (
                    <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${isMatchScore ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                      {tag}
                    </span>
                  );
                })}
              </div>

              <div className="mt-auto flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1">Salary</span>
                  <span className="text-base font-bold text-[#1a1a1a]">${minSalary}k - ${maxSalary}k</span>
                </div>
                <Button
                  onClick={handleViewDetails}
                  className="bg-[#1a1a1a] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-black transition-all hover:shadow-lg active:scale-95 h-auto"
                >
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center pt-4">
        <p className="text-sm text-[#8e575f]">
          Powered by AI semantic matching
        </p>
      </div>
    </div>
  );
} 