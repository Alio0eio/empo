/**
 * LocalStorage utility for managing interview feedback for posted jobs
 */

const INTERVIEW_FEEDBACK_KEY = 'interviewFeedback';

/**
 * Save interview feedback to localStorage
 */
export function saveInterviewFeedback(feedbackData) {
  try {
    if (typeof window === 'undefined') return null;

    const raw = window.localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
    const allFeedback = raw ? JSON.parse(raw) : [];

    const newFeedback = {
      id: Date.now().toString(),
      ...feedbackData,
      createdAt: new Date().toISOString()
    };

    console.log('Saving interview feedback:', newFeedback);
    allFeedback.push(newFeedback);
    window.localStorage.setItem(INTERVIEW_FEEDBACK_KEY, JSON.stringify(allFeedback));
    console.log('All feedback after save:', allFeedback);

    return newFeedback;
  } catch (error) {
    console.error('Error saving interview feedback:', error);
    return null;
  }
}

/**
 * Get all feedback for a specific job
 */
export function getJobFeedback(jobId) {
  try {
    if (typeof window === 'undefined') return [];

    const raw = window.localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
    const allFeedback = raw ? JSON.parse(raw) : [];

    console.log('All feedback in localStorage:', allFeedback);
    console.log('Looking for job_id:', jobId, 'Type:', typeof jobId);

    const filtered = allFeedback.filter(feedback => {
      const match = feedback.job_id === jobId || String(feedback.job_id) === String(jobId);
      console.log('Checking feedback job_id:', feedback.job_id, 'Match:', match);
      return match;
    });

    console.log('Filtered feedback for job:', filtered);
    return filtered;
  } catch (error) {
    console.error('Error fetching job feedback:', error);
    return [];
  }
}

/**
 * Get all interview feedback
 */
export function getAllInterviewFeedback() {
  try {
    if (typeof window === 'undefined') return [];

    const raw = window.localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return [];
  }
}

/**
 * Delete feedback by ID
 */
export function deleteInterviewFeedback(feedbackId) {
  try {
    if (typeof window === 'undefined') return false;

    const raw = window.localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
    const allFeedback = raw ? JSON.parse(raw) : [];

    const filtered = allFeedback.filter(f => f.id !== feedbackId);
    window.localStorage.setItem(INTERVIEW_FEEDBACK_KEY, JSON.stringify(filtered));

    return true;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
}

/**
 * Clear all feedback (dev only)
 */
export function clearAllFeedback() {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.removeItem(INTERVIEW_FEEDBACK_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing feedback:', error);
    return false;
  }
}
