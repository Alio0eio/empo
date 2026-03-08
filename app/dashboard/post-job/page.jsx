"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, ChevronDown, ChevronUp, Save, Eye, EyeOff, AlertCircle, CheckCircle, Clock, MapPin, DollarSign, Users, Briefcase, GraduationCap, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CreateOptions from '../_components/CreateOptions';

const jobCategories = [
  'Accounting/Finance',
  'Administration',
  'Banking',
  'R&D/Science',
  'Engineering - Construction/Civil/Architecture',
  'Business Development',
  'Creative/Design/Art',
  'Customer Service/Support',
  'Writing/Editorial',
  'Hospitality/Hotels/Food Services',
  'Human Resources',
  'Installation/Maintenance/Repair',
  'IT/Software Development',
  'Legal',
  'Logistics/Supply Chain',
  'Operations/Management',
  'Manufacturing/Production',
  'Marketing/PR/Advertising',
  'Medical/Healthcare',
  'Other',
  'Project/Program Management',
  'Quality',
  'Analyst/Research',
  'Sales/Retail',
  'Media/Journalism/Publishing',
  'Sports and Leisure',
  'Fashion',
  'Pharmaceutical',
  'Tourism/Travel',
  'Purchasing/Procurement',
  'Strategy/Consulting',
  'C-Level Executive/GM/Director',
];
const jobTypes = [
  'Full Time', 'Part Time', 'Freelance / Project', 'Shift Based', 'Volunteering'
];
const workplaces = ['On-site', 'Remote', 'Hybrid'];
const countries = ['Egypt', 'USA', 'UK', 'Germany', 'India'];
const cities = {
  Egypt: ['Cairo', 'Alexandria', 'Giza'],
  USA: ['New York', 'San Francisco', 'Los Angeles'],
  UK: ['London', 'Manchester'],
  Germany: ['Berlin', 'Munich'],
  India: ['Delhi', 'Mumbai'],
};
const careerLevels = [
  { label: 'Experienced', sub: 'Non-Manager' },
  { label: 'Manager', sub: '' },
  { label: 'Senior Management', sub: 'CEO, GM, Director, Head' },
  { label: 'Entry Level', sub: 'Junior Level / Fresh Grad' },
  { label: 'Student', sub: 'Undergrad / Postgrad' },
];
const currencyOptions = [
  { label: 'Egyptian Pound', value: 'EGP' },
  { label: 'US Dollar', value: 'USD' },
  { label: 'Euro', value: 'EUR' },
];
const periodOptions = [
  { label: 'Per Month', value: 'Per Month' },
  { label: 'Per Year', value: 'Per Year' },
  { label: 'Per Week', value: 'Per Week' },
];

export default function PostJobPage() {
  const { user } = useUser();
  const [step, setStep] = useState('jobDetails');
  const [jobDetails, setJobDetails] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedWorkplace, setSelectedWorkplace] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [hideSalary, setHideSalary] = useState(false);
  const [additionalSalary, setAdditionalSalary] = useState('');
  const [vacancies, setVacancies] = useState(1);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReq, setJobReq] = useState('');
  const [skills, setSkills] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [period, setPeriod] = useState('Per Month');
  const [showCurrencyEdit, setShowCurrencyEdit] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gender, setGender] = useState('');
  const [education, setEducation] = useState('');
  const [academicExcellence, setAcademicExcellence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [showPreview, setShowPreview] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const router = useRouter();

  const genderOptions = [
    'No Preference', 'Males Only', 'Females Only', 'Males Preferred', 'Females Preferred'
  ];
  const educationOptions = [
    'Not Specified', 'High School (or equivalent)', 'Diploma',
    "Bachelor's Degree", "Master's Degree", 'Doctorate', 'MBA'
  ];

  // Calculate form progress
  useEffect(() => {
    const requiredFields = [
      jobTitle,
      selectedCategories.length > 0,
      selectedTypes.length > 0,
      selectedWorkplace,
      selectedCountry,
      selectedCity,
      selectedCareer,
      jobDesc,
      jobReq
    ];
    const completedFields = requiredFields.filter(Boolean).length;
    const progress = Math.round((completedFields / requiredFields.length) * 100);
    setFormProgress(progress);
  }, [jobTitle, selectedCategories, selectedTypes, selectedWorkplace, selectedCountry, selectedCity, selectedCareer, jobDesc, jobReq]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!jobTitle || !selectedCategories.length) return;
    
    setAutoSaveStatus('saving');
    try {
      const details = {
        jobTitle,
        jobCategories: selectedCategories,
        jobTypes: selectedTypes,
        workplace: selectedWorkplace,
        country: selectedCountry,
        city: selectedCity,
        careerLevel: selectedCareer,
        minExperience: minExp ? parseInt(minExp) : null,
        maxExperience: maxExp ? parseInt(maxExp) : null,
        minSalary: minSalary ? parseInt(minSalary) : null,
        maxSalary: maxSalary ? parseInt(maxSalary) : null,
        currency,
        period,
        hideSalary,
        additionalSalary,
        vacancies,
        jobDescription: jobDesc,
        jobRequirements: jobReq,
        skills,
        gender,
        education,
        academicExcellence,
      };
      
      const response = await fetch('/api/job-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAutoSaveStatus('saved');
          // Store the job details ID for later use
          setJobDetails(prev => ({ ...prev, id: result.id }));
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          setAutoSaveStatus('error');
        }
      } else {
        setAutoSaveStatus('error');
      }
    } catch (err) {
      setAutoSaveStatus('error');
    }
  }, [jobTitle, selectedCategories, selectedTypes, selectedWorkplace, selectedCountry, selectedCity, selectedCareer, minExp, maxExp, minSalary, maxSalary, currency, period, hideSalary, additionalSalary, vacancies, jobDesc, jobReq, skills, gender, education, academicExcellence]);

  // Debounced auto-save
  useEffect(() => {
    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [autoSave]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!jobTitle.trim()) errors.jobTitle = 'Job title is required';
    if (selectedCategories.length === 0) errors.categories = 'At least one category is required';
    if (selectedTypes.length === 0) errors.types = 'At least one job type is required';
    if (!selectedWorkplace) errors.workplace = 'Workplace type is required';
    if (!selectedCountry) errors.country = 'Country is required';
    if (!selectedCity) errors.city = 'City is required';
    if (!selectedCareer) errors.career = 'Career level is required';
    if (!jobDesc.trim()) errors.jobDesc = 'Job description is required';
    if (!jobReq.trim()) errors.jobReq = 'Job requirements are required';
    
    if (minExp && maxExp && parseInt(minExp) > parseInt(maxExp)) {
      errors.experience = 'Minimum experience cannot be greater than maximum';
    }
    
    if (minSalary && maxSalary && parseInt(minSalary) > parseInt(maxSalary)) {
      errors.salary = 'Minimum salary cannot be greater than maximum';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else if (selectedTypes.length < 3) {
      setSelectedTypes([...selectedTypes, type]);
    }
  };
  
  const handleWorkplace = (wp) => setSelectedWorkplace(wp);
  const handleCareer = (cl) => setSelectedCareer(cl.label);

  const handleJobDetailsSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    const details = {
      jobTitle,
      jobCategories: selectedCategories,
      jobTypes: selectedTypes,
      workplace: selectedWorkplace,
      country: selectedCountry,
      city: selectedCity,
      careerLevel: selectedCareer,
      minExperience: minExp ? parseInt(minExp) : null,
      maxExperience: maxExp ? parseInt(maxExp) : null,
      minSalary: minSalary ? parseInt(minSalary) : null,
      maxSalary: maxSalary ? parseInt(maxSalary) : null,
      currency,
      period,
      hideSalary,
      additionalSalary,
      vacancies,
      jobDescription: jobDesc,
      jobRequirements: jobReq,
      skills,
      gender,
      education,
      academicExcellence,
    };

    try {
      // Simple client-side storage for dev/demo only
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('devJobs');
        const existing = raw ? JSON.parse(raw) : [];
        const job = {
          id: Date.now(),
          jobPosition: jobTitle,
          jobDescription: jobDesc,
          jobRequirements: jobReq,
          jobCategories: selectedCategories,
          jobTypes: selectedTypes,
          workplace: selectedWorkplace,
          country: selectedCountry,
          city: selectedCity,
          careerLevel: selectedCareer,
          minExperience: minExp ? parseInt(minExp) : null,
          maxExperience: maxExp ? parseInt(maxExp) : null,
          minSalary: minSalary ? parseInt(minSalary) : null,
          maxSalary: maxSalary ? parseInt(maxSalary) : null,
          currency,
          period,
          hideSalary,
          additionalSalary,
          vacancies,
          skills,
          gender,
          education,
          academicExcellence,
          recruiterName: user?.fullName || 'Demo Recruiter',
          recruiterEmail: user?.primaryEmailAddress?.emailAddress || '',
          location: selectedCity && selectedCountry ? `${selectedCity}, ${selectedCountry}` : selectedCountry || '',
          type: 'Video Interview',
          _type: 'mock',
          createdAt: new Date().toISOString(),
        };
        const updated = [...existing, job];
        window.localStorage.setItem('devJobs', JSON.stringify(updated));
        setJobDetails(job);
        setSuccess(true);
      } else {
        setError('window.localStorage is not available in this environment.');
      }
    } catch (err) {
      setError('Failed to save job details locally.');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseType = (type) => {
    if (!jobDetails || !jobDetails.id) {
      setError('Job details must be saved first.');
      return;
    }
    if (type === 'mock') {
      router.push(`/dashboard/create-mock-interview?jobDetailsId=${jobDetails.id}`);
    } else if (type === 'call') {
      router.push(`/dashboard/create-interview?jobDetailsId=${jobDetails.id}`);
    }
  };

  // Job Preview Component
  const JobPreview = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#e4d3d5]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#191011]">Job Preview</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="text-[#be3144] hover:bg-[#f1e9ea]">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#191011] mb-2">{jobTitle || 'Job Title'}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategories.map(cat => (
                <span key={cat} className="bg-gradient-to-r from-[#be3144] to-[#f05941] text-white px-2 py-1 rounded text-sm font-medium">
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#be3144]" />
                {selectedCity}, {selectedCountry}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-[#be3144]" />
                {selectedTypes.join(', ')}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-[#be3144]" />
                {selectedWorkplace}
              </span>
            </div>
          </div>
          
          {!hideSalary && (minSalary || maxSalary) && (
            <div className="bg-[#fbf9f9] p-4 rounded-lg border border-[#e4d3d5]">
              <h4 className="font-semibold mb-2 text-[#191011]">Salary Range</h4>
              <p className="text-lg font-bold text-[#be3144]">
                {minSalary && maxSalary ? `${minSalary} - ${maxSalary}` : minSalary || maxSalary} {currency}/{period}
              </p>
              {additionalSalary && (
                <p className="text-sm text-gray-600 mt-1">{additionalSalary}</p>
              )}
            </div>
          )}
          
          <div>
            <h4 className="font-semibold mb-2 text-[#191011]">Job Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{jobDesc || 'No description provided'}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 text-[#191011]">Requirements</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{jobReq || 'No requirements specified'}</p>
          </div>
          
          {skills && (
            <div>
              <h4 className="font-semibold mb-2 text-[#191011]">Skills & Tools</h4>
              <p className="text-gray-700">{skills}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (step === 'chooseType') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbf9f9] to-[#f1e9ea] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <CreateOptions onChoose={handleChooseType} />
        </div>
      </div>
    );
  }

  if (showPreview) {
    return <JobPreview />;
  }

  // Default: show job details form
  return (
    <div>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-[#be3144]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#be3144]">Post a New Job</h1>
              <p className="text-[#8e575f] mt-1">Create a compelling job posting to attract top talent</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                disabled={!jobTitle || !jobDesc}
                className="flex items-center gap-2 border-[#be3144] text-[#be3144] hover:bg-[#f1e9ea] hover:border-[#f05941] transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-[#be3144]">
                    <Clock className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Saved
                  </div>
                )}
                {autoSaveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    Save failed
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-[#be3144] mb-2">
              <span>Form Completion</span>
              <span>{formProgress}%</span>
            </div>
            <div className="w-full bg-[#f1e9ea] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#be3144] to-[#f05941] h-2 rounded-full transition-all duration-300"
                style={{ width: `${formProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleJobDetailsSubmit}>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Basic Information Section */}
            <div className="p-6 border-b border-[#e4d3d5]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-[#be3144] to-[#f05941] rounded-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#191011]">Basic Information</h2>
              </div>
              
              <div className="space-y-6">
                {/* Job Title */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">
                    Job Title <span className="text-[#be3144]">*</span>
                  </label>
                  <Input 
                    value={jobTitle} 
                    onChange={e => setJobTitle(e.target.value)} 
                    placeholder="e.g. Senior Software Engineer" 
                    className={`mt-1 h-12 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-[#fbf9f9] rounded-xl transition-colors ${
                      validationErrors.jobTitle ? 'border-[#be3144]' : ''
                    }`}
                  />
                  {validationErrors.jobTitle && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.jobTitle}</p>
                  )}
                </div>

                {/* Job Category */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">
                    Job Category <span className="text-[#be3144]">*</span> <span className="text-gray-400">— max. 3</span>
                  </label>
                  <div className="relative">
                    <div className={`flex flex-wrap gap-2 p-3 rounded-xl min-h-[48px] items-center bg-[#fbf9f9] border ${
                      validationErrors.categories ? 'border-[#be3144]' : 'border-[#e4d3d5]'
                    }`}>
                      {selectedCategories.map(cat => (
                        <span key={cat} className="flex items-center bg-gradient-to-r from-[#be3144] to-[#f05941] text-white rounded-lg px-3 py-1 text-sm font-medium shadow-sm">
                          {cat}
                          <button
                            type="button"
                            className="ml-2 focus:outline-none hover:bg-white/20 rounded transition-colors"
                            onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                            aria-label={`Remove ${cat}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      <Select
                        value={""}
                        onValueChange={value => {
                          if (!selectedCategories.includes(value) && selectedCategories.length < 3) {
                            setSelectedCategories([...selectedCategories, value]);
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1 min-w-[120px] bg-transparent border-0 shadow-none focus:ring-0 focus:border-0 h-8">
                          <SelectValue placeholder={selectedCategories.length === 0 ? "Select at least one job category" : ""} />
                        </SelectTrigger>
                        <SelectContent className="border-[#e4d3d5] shadow-lg max-h-72 overflow-y-auto z-50">
                          {jobCategories.filter(cat => !selectedCategories.includes(cat)).map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {validationErrors.categories && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.categories}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">You can select up to 3 categories.</div>
                </div>

                {/* Job Type */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">
                    Job Type <span className="text-[#be3144]">*</span> <span className="text-gray-400">— max. 3</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {jobTypes.map(type => (
                      <Button
                        key={type}
                        type="button"
                        variant={selectedTypes.includes(type) ? undefined : 'outline'}
                        size="sm"
                        onClick={() => handleType(type)}
                        className={selectedTypes.includes(type)
                          ? 'bg-gradient-to-r from-[#be3144] to-[#f05941] text-white border-0 shadow-sm hover:from-[#f05941] hover:to-[#be3144] transition-all'
                          : 'bg-white border-[#e4d3d5] hover:border-[#be3144] text-[#191011] hover:bg-[#f1e9ea] transition-colors'}
                      >
                        {type} {selectedTypes.includes(type) ? '✓' : '+'}
                      </Button>
                    ))}
                  </div>
                  {validationErrors.types && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.types}</p>
                  )}
                </div>

                {/* Workplace */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">
                    Workplace <span className="text-[#be3144]">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {workplaces.map(wp => (
                      <Button
                        key={wp}
                        type="button"
                        variant={selectedWorkplace === wp ? undefined : 'outline'}
                        size="sm"
                        onClick={() => handleWorkplace(wp)}
                        className={selectedWorkplace === wp
                          ? 'bg-gradient-to-r from-[#be3144] to-[#f05941] text-white border-0 shadow-sm hover:from-[#f05941] hover:to-[#be3144] transition-all'
                          : 'bg-white border-[#e4d3d5] hover:border-[#be3144] text-[#191011] hover:bg-[#f1e9ea] transition-colors'}
                      >
                        {wp}
                      </Button>
                    ))}
                  </div>
                  {validationErrors.workplace && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.workplace}</p>
                  )}
                </div>

                {/* Job Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="font-semibold text-base mb-2 block text-[#191011]">
                      Country <span className="text-[#be3144]">*</span>
                    </label>
                    <select 
                      className={`w-full border rounded-xl px-3 py-3 mt-1 bg-[#fbf9f9] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 transition-colors ${
                        validationErrors.country ? 'border-[#be3144]' : 'border-[#e4d3d5]'
                      }`} 
                      value={selectedCountry} 
                      onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }}
                    >
                      <option value="">Select country</option>
                      {countries.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {validationErrors.country && (
                      <p className="text-[#be3144] text-sm mt-1">{validationErrors.country}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-semibold text-base mb-2 block text-[#191011]">
                      City <span className="text-[#be3144]">*</span>
                    </label>
                    <select 
                      className={`w-full border rounded-xl px-3 py-3 mt-1 bg-[#fbf9f9] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 transition-colors ${
                        validationErrors.city ? 'border-[#be3144]' : 'border-[#e4d3d5]'
                      }`} 
                      value={selectedCity} 
                      onChange={e => setSelectedCity(e.target.value)}
                    >
                      <option value="">Select city</option>
                      {cities[selectedCountry]?.map(city => <option key={city}>{city}</option>)}
                    </select>
                    {validationErrors.city && (
                      <p className="text-[#be3144] text-sm mt-1">{validationErrors.city}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Career Level Section */}
            <div className="p-6 border-b border-[#e4d3d5]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-[#be3144] to-[#f05941] rounded-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#191011]">Career Level & Experience</h2>
              </div>
              
              <div className="space-y-6">
                {/* Career Level */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">
                    Career Level <span className="text-[#be3144]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {careerLevels.map(cl => {
                      const selected = selectedCareer === cl.label;
                      return (
                        <Button
                          key={cl.label}
                          type="button"
                          variant={selected ? undefined : 'outline'}
                          size="lg"
                          onClick={() => handleCareer(cl)}
                          className={
                            (selected
                              ? 'bg-gradient-to-r from-[#be3144] to-[#f05941] text-white border-0 shadow-lg scale-105 hover:from-[#f05941] hover:to-[#be3144]'
                              : 'bg-white text-[#191011] border border-[#e4d3d5] hover:border-[#be3144] hover:bg-[#f1e9ea]') +
                            ' flex flex-col items-start w-full px-4 py-3 transition-all duration-200 rounded-xl focus:ring-2 focus:ring-[#be3144]/40 hover:shadow-md min-h-[64px] text-base'
                          }
                        >
                          <span className="font-bold text-base mb-1">{cl.label}</span>
                          {cl.sub && (
                            <span className={
                              selected
                                ? 'text-white text-xs opacity-80 font-normal'
                                : 'text-gray-400 text-xs font-normal'
                            }>
                              {cl.sub}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  {validationErrors.career && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.career}</p>
                  )}
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">Years of Experience</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      placeholder="Min" 
                      value={minExp} 
                      onChange={e => setMinExp(e.target.value)} 
                      className="h-12 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-[#fbf9f9] rounded-xl transition-colors" 
                    />
                    <span className="self-center text-[#191011]">to</span>
                    <Input 
                      placeholder="Max" 
                      value={maxExp} 
                      onChange={e => setMaxExp(e.target.value)} 
                      className="h-12 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-[#fbf9f9] rounded-xl transition-colors" 
                    />
                  </div>
                  {validationErrors.experience && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.experience}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Salary Section */}
            <div className="p-6 border-b border-[#e4d3d5]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-[#be3144] to-[#f05941] rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#191011]">Salary & Benefits</h2>
              </div>
              
              <div className="space-y-6">
                {/* Salary Range */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">Salary Range</label>
                  <div className="rounded-xl border border-[#e4d3d5] bg-[#fbf9f9] p-4 flex flex-col gap-3 mt-2">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Input 
                          placeholder="e.g. 8,000" 
                          value={minSalary} 
                          onChange={e => setMinSalary(e.target.value)} 
                          className="h-12 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-white rounded-xl transition-colors" 
                        />
                        <span className="self-center text-[#191011]">to</span>
                        <Input 
                          placeholder="e.g. 12,000" 
                          value={maxSalary} 
                          onChange={e => setMaxSalary(e.target.value)} 
                          className="h-12 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-white rounded-xl transition-colors" 
                        />
                      </div>
                      <span className="text-xs text-gray-500 ml-0 sm:ml-2 mt-2 sm:mt-0 flex items-center gap-2">
                        {showCurrencyEdit ? (
                          <>
                            <select
                              className="border border-[#e4d3d5] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#be3144]/50 focus:border-[#be3144] transition-colors"
                              value={currency}
                              onChange={e => setCurrency(e.target.value)}
                            >
                              {currencyOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <select
                              className="border border-[#e4d3d5] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#be3144]/50 focus:border-[#be3144] transition-colors"
                              value={period}
                              onChange={e => setPeriod(e.target.value)}
                            >
                              {periodOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <Button type="button" size="sm" variant="ghost" className="text-[#be3144] ml-2 px-2 py-1 hover:bg-[#f1e9ea]" onClick={() => setShowCurrencyEdit(false)}>
                              Done
                            </Button>
                          </>
                        ) : (
                          <>
                            {currency}/{period}
                            <button type="button" className="text-[#be3144] underline ml-2 text-xs font-semibold hover:text-[#f05941] transition-colors" onClick={() => setShowCurrencyEdit(true)}>
                              Change
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={hideSalary} 
                        onChange={e => setHideSalary(e.target.checked)} 
                        className="accent-[#be3144] w-4 h-4" 
                      />
                      <span className="text-sm text-[#191011]">Hide salary in job post (will only be used for recommendations)</span>
                    </div>
                    <span className="text-xs mt-1 text-[#be3144]">Showing salary attracts more candidates</span>
                  </div>
                  {validationErrors.salary && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.salary}</p>
                  )}
                </div>

                {/* Additional Salary Details */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">Additional Salary Details <span className="text-gray-400">— optional</span></label>
                  <Textarea 
                    value={additionalSalary} 
                    onChange={e => setAdditionalSalary(e.target.value)} 
                    placeholder="e.g. Commissions and bonuses" 
                    maxLength={200} 
                    className="mt-1 h-12 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-[#fbf9f9] rounded-xl transition-colors" 
                  />
                  <div className="text-xs text-gray-400 text-right">{additionalSalary.length}/200</div>
                </div>

                {/* Number of Vacancies */}
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">Number of Vacancies</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setVacancies(Math.max(1, vacancies - 1))} 
                      className="rounded-full w-9 h-9 text-lg border-[#e4d3d5] hover:border-[#be3144] hover:bg-[#f1e9ea] transition-colors"
                    >
                      -
                    </Button>
                    <span className="px-3 text-lg font-semibold text-[#191011]">{vacancies}</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setVacancies(vacancies + 1)} 
                      className="rounded-full w-9 h-9 text-lg border-[#e4d3d5] hover:border-[#be3144] hover:bg-[#f1e9ea] transition-colors"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description Section */}
            <div className="p-6 border-b border-[#e4d3d5]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-[#be3144] to-[#f05941] rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#191011]">Job Description & Requirements</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">
                    Job Description <span className="text-[#be3144]">*</span>
                  </label>
                  <Textarea 
                    value={jobDesc} 
                    onChange={e => setJobDesc(e.target.value)} 
                    placeholder="Describe the job, responsibilities, and expectations" 
                    rows={5} 
                    className={`mt-1 h-28 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-[#fbf9f9] rounded-xl transition-colors ${
                      validationErrors.jobDesc ? 'border-[#be3144]' : ''
                    }`}
                  />
                  {validationErrors.jobDesc && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.jobDesc}</p>
                  )}
                  <div className="text-xs text-gray-400 text-right mt-1">{jobDesc.length}/2000</div>
                </div>
                
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">
                    Job Requirements <span className="text-[#be3144]">*</span>
                  </label>
                  <Textarea 
                    value={jobReq} 
                    onChange={e => setJobReq(e.target.value)} 
                    placeholder="List the requirements for the job" 
                    rows={4} 
                    className={`mt-1 h-24 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-[#fbf9f9] rounded-xl transition-colors ${
                      validationErrors.jobReq ? 'border-[#be3144]' : ''
                    }`}
                  />
                  {validationErrors.jobReq && (
                    <p className="text-[#be3144] text-sm mt-1">{validationErrors.jobReq}</p>
                  )}
                  <div className="text-xs text-gray-400 text-right mt-1">{jobReq.length}/1000</div>
                </div>
                
                <div>
                  <label className="font-semibold text-base mb-2 block text-[#191011]">Skills and Tools</label>
                  <Input 
                    value={skills} 
                    onChange={e => setSkills(e.target.value)} 
                    placeholder="Enter keywords including any related job titles, technologies, or keywords the candidate should have in their CV." 
                    className="mt-1 h-12 text-base border-[#e4d3d5] focus:border-[#be3144] focus:ring-2 focus:ring-[#be3144]/30 bg-[#fbf9f9] rounded-xl transition-colors" 
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="p-6">
              <div className="bg-[#fbf9f9] border border-[#e4d3d5] rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowAdvanced(v => !v)}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-[#191011]">Advanced Settings</h2>
                    <span className="text-xs text-gray-400 font-normal">(optional)</span>
                  </div>
                  {showAdvanced ? <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#be3144]" /> : <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-[#be3144]" />}
                </div>
                {showAdvanced && (
                  <div className="mt-4 space-y-6">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      All the below requirements are optional. If you don't need them, skip them. However, they can help us provide you with much better candidate recommendations, especially if this job is for a technical position.
                    </p>
                    
                    {/* Gender */}
                    <div>
                      <label className="font-semibold text-sm sm:text-base mb-2 block text-[#191011]">Gender</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {genderOptions.map(opt => (
                          <Button
                            key={opt}
                            type="button"
                            variant={gender === opt ? undefined : 'outline'}
                            size="lg"
                            onClick={() => setGender(gender === opt ? '' : opt)}
                            className={
                              (gender === opt
                                ? 'bg-gradient-to-r from-[#be3144] to-[#f05941] text-white border-0 shadow-md scale-105 hover:from-[#f05941] hover:to-[#be3144]'
                                : 'bg-white text-[#191011] border border-[#e4d3d5] hover:border-[#be3144] hover:bg-[#f1e9ea]') +
                              ' w-full px-3 py-2 sm:px-4 sm:py-3 transition-all duration-200 rounded-xl focus:ring-2 focus:ring-[#be3144]/40 hover:shadow-md text-xs sm:text-base'
                            }
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Education Level */}
                    <div>
                      <label className="font-semibold text-sm sm:text-base mb-2 block text-[#191011]">Education Level</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {educationOptions.map(opt => (
                          <Button
                            key={opt}
                            type="button"
                            variant={education === opt ? undefined : 'outline'}
                            size="lg"
                            onClick={() => setEducation(education === opt ? '' : opt)}
                            className={
                              (education === opt
                                ? 'bg-gradient-to-r from-[#be3144] to-[#f05941] text-white border-0 shadow-md scale-105 hover:from-[#f05941] hover:to-[#be3144]'
                                : 'bg-white text-[#191011] border border-[#e4d3d5] hover:border-[#be3144] hover:bg-[#f1e9ea]') +
                              ' w-full px-3 py-2 sm:px-4 sm:py-3 transition-all duration-200 rounded-xl focus:ring-2 focus:ring-[#be3144]/40 hover:shadow-md text-xs sm:text-base'
                            }
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Academic Excellence */}
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={academicExcellence}
                        onChange={e => setAcademicExcellence(e.target.checked)}
                        className="accent-[#be3144] w-4 h-4 sm:w-5 sm:h-5 mr-2"
                        id="academic-excellence"
                      />
                      <label htmlFor="academic-excellence" className="text-xs sm:text-base font-medium select-none text-[#191011]">
                        Academic Excellence is important
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6 -mt-2">
                      (i.e. job seeker with excellent and very good grade will be preferred)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-6 bg-[#fbf9f9] border-t border-[#e4d3d5]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Form Progress:</span> {formProgress}% complete
                </div>
                <Button 
                  type="submit" 
                  className="px-8 py-3 bg-gradient-to-r from-[#be3144] to-[#f05941] text-white font-semibold rounded-xl shadow-md hover:from-[#f05941] hover:to-[#be3144] transition-all duration-200 text-lg flex items-center gap-2" 
                  disabled={loading || formProgress < 50}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save & Continue
                    </>
                  )}
                </Button>
              </div>
              {success && <div className="text-green-600 font-semibold mt-4 text-center">Job posted successfully!</div>}
              {error && <div className="text-red-600 font-semibold mt-4 text-center">{error}</div>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 