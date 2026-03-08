"use client";
import React, { useEffect, useState, Suspense, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ArrowLeft, ChevronRight, Search, Filter, X, User, Pencil, Book, PhoneCall, Info, Handshake, Mail, Settings, LogOut } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import UserAvatar from '@/components/UserAvatar';
// import JobRecommendations from '../_components/JobRecommendations';

// Job categories (full list for filter)
const jobCategories = [
  { title: 'Accounting/Finance' },
  { title: 'Administration' },
  { title: 'Banking' },
  { title: 'R&D/Science' },
  { title: 'Engineering - Construction/Civil/Architecture' },
  { title: 'Business Development' },
  { title: 'Creative/Design/Art' },
  { title: 'Customer Service/Support' },
  { title: 'Writing/Editorial' },
  { title: 'Hospitality/Hotels/Food Services' },
  { title: 'Human Resources' },
  { title: 'Installation/Maintenance/Repair' },
  { title: 'IT/Software Development' },
  { title: 'Legal' },
  { title: 'Logistics/Supply Chain' },
  { title: 'Operations/Management' },
  { title: 'Manufacturing/Production' },
  { title: 'Marketing/PR/Advertising' },
  { title: 'Medical/Healthcare' },
  { title: 'Other' },
  { title: 'Project/Program Management' },
  { title: 'Quality' },
  { title: 'Analyst/Research' },
  { title: 'Sales/Retail' },
  { title: 'Media/Journalism/Publishing' },
  { title: 'Sports and Leisure' },
  { title: 'Fashion' },
  { title: 'Pharmaceutical' },
  { title: 'Tourism/Travel' },
  { title: 'Purchasing/Procurement' },
  { title: 'Strategy/Consulting' },
  { title: 'C-Level Executive/GM/Director' },
];

const interviewTypes = [
  { label: 'All Types', value: 'all' },
  { label: 'Call Interview', value: 'Call Interview' },
  { label: 'Video Interview', value: 'Video Interview' },
];

const careerLevels = [
  { label: 'All Levels', value: 'all' },
  { label: 'Entry Level', value: 'Entry Level' },
  { label: 'Experienced', value: 'Experienced' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Senior Management', value: 'Senior Management' },
  { label: 'Student', value: 'Student' },
];

// User-friendly job card for job seekers
function JobSeekerJobCard({ job }) {
  const router = useRouter();
  const handleViewDetails = () => {
    if (job._type === 'call' && job.job_id) {
      router.push(`/job-seeker/job/call/${job.job_id}`);
    } else if (job._type === 'mock' && job.mockId) {
      router.push(`/job-seeker/job/mock/${job.mockId}`);
    } else if (job.id) {
      // Dev/local-storage job details page
      router.push(`/job-seeker/jobs/dev/${job.id}`);
    }
  };

  // Generate deterministic random data for UI demo purposes
  const letter = job.jobPosition ? job.jobPosition.charAt(0).toUpperCase() : "J";
  // Use a simple hash of the job ID or position to pick a color, or just random based on position length
  const bgIds = ["bg-blue-50 text-blue-600", "bg-purple-50 text-purple-600", "bg-orange-50 text-orange-600", "bg-green-50 text-green-600"];
  const colorIndex = (job.jobPosition?.length || 0) % bgIds.length;
  const colorClass = bgIds[colorIndex];

  // Mock tags based on job title words
  const tags = [];
  if (job.jobPosition?.toLowerCase().includes('react') || job.jobPosition?.toLowerCase().includes('frontend')) tags.push('React', 'Frontend');
  else if (job.jobPosition?.toLowerCase().includes('backend') || job.jobPosition?.toLowerCase().includes('node')) tags.push('Node.js', 'Backend');
  else if (job.jobPosition?.toLowerCase().includes('manager')) tags.push('Management', 'Agile');
  else tags.push('Full Time');

  if (job.location) tags.push(job.location);

  // Mock salary
  const minSalary = 80 + (colorIndex * 5);
  const maxSalary = minSalary + 30;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative group">
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
        {tags.map((tag, i) => (
          <span key={i} className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            {tag}
          </span>
        ))}
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
}

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const initialCategory = searchParams.get('category') || 'All Categories';
  const [allJobs, setAllJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCareerLevel, setSelectedCareerLevel] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9;
  const { user, isLoaded } = useUser();
  const [completedInterviews, setCompletedInterviews] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  // const [showRecommendations, setShowRecommendations] = useState(false);

  // Theme colors
  const themePrimary = '#FF4B4B';
  const themeBg = '#f1e9ea';
  const themeText = '#FF4B4B';
  const themeSecondaryText = '#8e575f';

  useEffect(() => {
    // Load jobs from localStorage for dev/demo use
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('devJobs');
        const jobs = raw ? JSON.parse(raw) : [];
        // Filter out deleted jobs
        const activeJobs = Array.isArray(jobs) ? jobs.filter(job => !job.deleted) : [];
        setAllJobs(activeJobs);
      } catch (e) {
        console.error('Failed to load jobs from localStorage', e);
        setAllJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    } else {
      setLoadingJobs(false);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetch(`/api/user-profile?userId=${user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setUserProfile(data))
        .catch(() => setUserProfile(null));
    }
  }, [isLoaded, user]);

  // Note: fetchAllJobs is no longer used; jobs come from localStorage only in this dev setup.

  // Filter jobs by selected category, type, career level, and search query
  const filteredJobs = allJobs.filter(job => {
    const normalizedSelectedCategory = selectedCategory.toLowerCase();

    const categoryMatch =
      selectedCategory === 'All Categories' ||
      // Match single category field (existing DB-based jobs)
      (job.category && job.category.toLowerCase() === normalizedSelectedCategory) ||
      // Match array of categories from mock job store
      (Array.isArray(job.jobCategories) &&
        job.jobCategories.some(cat => cat.toLowerCase() === normalizedSelectedCategory));

    const typeMatch = selectedType === 'all' || job.type === selectedType;
    
    const careerLevelMatch = selectedCareerLevel === 'all' || job.careerLevel === selectedCareerLevel;
    
    const query = searchQuery.toLowerCase();
    const searchMatch =
      (job.jobPosition?.toLowerCase().includes(query)) ||
      ((job.jobDescription || job.jobDesc || '').toLowerCase().includes(query)) ||
      (job.location?.toLowerCase().includes(query)) ||
      (job.recruiterName?.toLowerCase().includes(query)) ||
      (job.createdBy?.toLowerCase().includes(query));
    return categoryMatch && typeMatch && careerLevelMatch && searchMatch;
  });

  // Pagination logic
  const totalJobs = filteredJobs.length;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const startIdx = (currentPage - 1) * jobsPerPage;
  const endIdx = Math.min(startIdx + jobsPerPage, totalJobs);
  const paginatedJobs = filteredJobs.slice(startIdx, endIdx);

  // Pagination controls logic (show up to 5 page numbers)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const clearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedType('all');
    setSelectedCareerLevel('all');
    setSearchQuery("");
    setCurrentPage(1);
  };

  // When filters/search change, reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedType, selectedCareerLevel, searchQuery]);

  // When searchQuery, selectedCategory, or selectedCareerLevel changes, update the URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    if (selectedCategory && selectedCategory !== 'All Categories') {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    if (selectedCareerLevel && selectedCareerLevel !== 'all') {
      params.set('level', selectedCareerLevel);
    } else {
      params.delete('level');
    }
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedCareerLevel]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f9] to-[#f1e9ea]">
      {/* Job Seeker Header matching main site style */}
      <div className="pt-[70px]">
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2 shadow-lg bg-white' : 'py-4 shadow-sm bg-[#FBF1EE]'}`}>
          <div className="container mx-auto px-4 flex items-center justify-between gap-4">
            {/* Logo and brand */}
            <Link href="/job-seeker" className="flex items-center gap-4 group flex-shrink-0">
              <div className={`transition-all duration-300 ${scrolled ? 'w-12 h-12' : 'w-14 h-14'}`}>
                <Image
                  src={'/logo.png'}
                  width={scrolled ? 48 : 56}
                  height={scrolled ? 48 : 56}
                  alt='logo'
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className={`font-bold text-[#FF4B4B] transition-all duration-300 ${scrolled ? 'text-2xl' : 'text-3xl'}`}>I-Hire</span>
            </Link>
            {/* Navigation links (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <Link href="/job-seeker" className="text-[#191011] hover:text-[#FF4B4B] font-medium transition-colors">
                Home
              </Link>
              <Link href="/job-seeker/jobs" className="text-[#FF4B4B] font-medium">
                Jobs
              </Link>
              <Link href="/job-seeker/applications" className="text-[#191011] hover:text-[#FF4B4B] font-medium transition-colors">
                My Applications
              </Link>
            </div>
            {/* Profile button always right */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {isLoaded && user && (
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f1e9ea] to-[#e4d3d5] flex items-center justify-center overflow-hidden border-2 border-[#f1e9ea] hover:border-[#FF4B4B] transition-colors shadow-sm cursor-pointer"
                    onClick={() => setMenuOpen((open) => !open)}
                  >
                    <UserAvatar profilePhoto={userProfile?.profilePhoto} userImageUrl={user.imageUrl} name={userProfile?.name || user.fullName} size={40} />
                  </div>
                  {completedInterviews > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FF4B4B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {completedInterviews}
                    </span>
                  )}
                  {menuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#e4d3d5] z-50 overflow-hidden animate-fade-in"
                      style={{ minWidth: 280 }}
                    >
                      <div className="p-5 border-b border-[#f1e9ea] flex items-center gap-4 bg-[#f9f6f6]">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#f1e9ea]">
                          <UserAvatar profilePhoto={userProfile?.profilePhoto} userImageUrl={user.imageUrl} name={userProfile?.name || user.fullName} size={40} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold text-[#191011] truncate">{user.fullName || 'User'}</div>
                          <div className="text-xs text-[#8e575f] truncate">{user.primaryEmailAddress?.emailAddress || 'email@example.com'}</div>
                          <a
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              setMenuOpen(false);
                              router.push('/job-seeker/profile');
                            }}
                            className="text-xs text-[#FF4B4B] hover:underline mt-1"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-col divide-y divide-[#f1e9ea]">
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f1e9ea] transition-colors text-[#191011] text-base font-medium">
                          <Pencil className="w-5 h-5 text-[#191011]" /> Edit Profile
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f1e9ea] transition-colors text-[#191011] text-base font-medium">
                          <Book className="w-5 h-5 text-[#191011]" /> Career Readings
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f1e9ea] transition-colors text-[#191011] text-base font-medium">
                          <PhoneCall className="w-5 h-5 text-[#191011]" /> Help Center
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f1e9ea] transition-colors text-[#191011] text-base font-medium">
                          <Info className="w-5 h-5 text-[#191011]" /> About Us
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f1e9ea] transition-colors text-[#191011] text-base font-medium">
                          <Handshake className="w-5 h-5 text-[#191011]" /> Become A Partner
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f1e9ea] transition-colors text-[#191011] text-base font-medium">
                          <Mail className="w-5 h-5 text-[#191011]" /> Contact Us
                        </a>
                      </div>
                      <div className="border-t border-[#f1e9ea] flex flex-col">
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f1e9ea] transition-colors text-[#191011] text-base font-medium">
                          <Settings className="w-5 h-5 text-[#191011]" /> Account Settings
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9eaea] transition-colors text-[#FF4B4B] text-base font-semibold">
                          <LogOut className="w-5 h-5 text-[#FF4B4B]" /> Logout
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Prominent search bar section under the header */}
      <section className="relative w-full py-16 px-4 flex flex-col items-center justify-center shadow-lg bg-[url('/ai.png')] bg-cover bg-center overflow-hidden">
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F6DED8]/95 via-[#f05941]/80 to-[#FF4B4B]/90 z-0"></div>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] tracking-tight">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-white/90 text-center mb-10 max-w-2xl mx-auto">
            Browse through hundreds of job opportunities in Egypt and the MENA region
          </p>
          {/* Responsive search and filter row */}
          <form onSubmit={e => e.preventDefault()} className="w-full mx-auto flex items-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#f1e9ea] overflow-hidden px-4 py-1 gap-2">
            <span className="flex items-center">
              <Search className="text-[#FF4B4B] w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search by Job Title, Keywords, Location, or Creator (e.g. Sales in Cairo, Amr)"
              className="flex-1 py-4 px-4 text-base bg-transparent focus:outline-none focus:ring-0 placeholder-[#c08a92] text-[#191011] transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ minWidth: 0 }}
            />
            <button
              type="submit"
              className="hidden md:block rounded-lg bg-gradient-to-r from-[#FF4B4B] to-[#f05941] hover:from-[#f05941] hover:to-[#FF4B4B] text-white font-bold px-6 py-3 text-base shadow-lg transition-all border-none outline-none focus:ring-2 focus:ring-[#FF4B4B]/50"
            >
              Search
            </button>
            {/* Filters button only on mobile, inside the search bar box */}
            <Button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-2 bg-white text-[#FF4B4B] border border-[#FF4B4B] hover:bg-[#FF4B4B]/10 h-full px-4 rounded-lg !py-3"
              style={{ marginLeft: 0, height: '48px' }}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </form>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Mobile filter dialog */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#191011]">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="text-[#8e575f] hover:text-[#FF4B4B]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#8e575f] mb-2">Job Category</label>
                  <select
                    className="w-full border border-[#e4d3d5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B4B]/50 transition-all bg-white"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                  >
                    <option>All Categories</option>
                    {jobCategories.map((cat, idx) => (
                      <option key={idx} value={cat.title}>{cat.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8e575f] mb-2">Interview Type</label>
                  <select
                    className="w-full border border-[#e4d3d5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B4B]/50 transition-all bg-white"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                  >
                    {interviewTypes.map((type, idx) => (
                      <option key={idx} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8e575f] mb-2">Job Level</label>
                  <select
                    className="w-full border border-[#e4d3d5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B4B]/50 transition-all bg-white"
                    value={selectedCareerLevel}
                    onChange={e => setSelectedCareerLevel(e.target.value)}
                  >
                    {careerLevels.map((level, idx) => (
                      <option key={idx} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={clearFilters}
                    className="flex-1 bg-white text-[#FF4B4B] border border-[#FF4B4B] hover:bg-[#FF4B4B]/10"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 bg-gradient-to-r from-[#FF4B4B] to-[#f05941] hover:from-[#f05941] hover:to-[#FF4B4B] text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop filters */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#f1e9ea] sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#191011]">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#FF4B4B] hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#8e575f] mb-2">Job Category</label>
                  <select
                    className="w-full border border-[#e4d3d5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B4B]/50 transition-all bg-white"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                  >
                    <option>All Categories</option>
                    {jobCategories.map((cat, idx) => (
                      <option key={idx} value={cat.title}>{cat.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8e575f] mb-2">Interview Type</label>
                  <select
                    className="w-full border border-[#e4d3d5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B4B]/50 transition-all bg-white"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                  >
                    {interviewTypes.map((type, idx) => (
                      <option key={idx} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8e575f] mb-2">Job Level</label>
                  <select
                    className="w-full border border-[#e4d3d5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B4B]/50 transition-all bg-white"
                    value={selectedCareerLevel}
                    onChange={e => setSelectedCareerLevel(e.target.value)}
                  >
                    {careerLevels.map((level, idx) => (
                      <option key={idx} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Job listings */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-[#191011]">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
              </h2>
              {/* AI recommendations temporarily disabled in dev (no DB) */}
            </div>

            {/* Only show standard jobs list in this dev setup */}
              {loadingJobs ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF4B4B]" />
                  <span className="ml-2 text-[#8e575f]">Loading jobs...</span>
                </div>
              ) : filteredJobs.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedJobs.map((job) => (
                      <JobSeekerJobCard job={job} key={job._type === 'call' ? job.job_id : job.mockId} />
                    ))}
                  </div>
                  {/* Pagination controls */}
                  <div className="flex flex-col items-center justify-center mt-8">
                    <div className="flex items-center gap-2 text-base mb-2" style={{ color: themeSecondaryText }}>
                      {totalJobs > 0 && (
                        <span>
                          Showing {startIdx + 1} - {endIdx} of {totalJobs}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          background: currentPage === 1 ? themeBg : '#fff',
                          color: currentPage === 1 ? '#c8bfc2' : themeText,
                          border: `1px solid ${themeBg}`,
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s, color 0.2s',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 0.75rem',
                        }}
                      >
                        &#60;
                      </button>
                      {pageNumbers.map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          style={{
                            background: num === currentPage ? themePrimary : themeBg,
                            color: num === currentPage ? '#fff' : themeText,
                            border: `1px solid ${themeBg}`,
                            transition: 'background 0.2s, color 0.2s',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            fontWeight: num === currentPage ? 700 : 500,
                          }}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          background: currentPage === totalPages ? themeBg : '#fff',
                          color: currentPage === totalPages ? '#c8bfc2' : themeText,
                          border: `1px solid ${themeBg}`,
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s, color 0.2s',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 0.75rem',
                        }}
                      >
                        &#62;
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-[#8e575f] py-12 text-lg">No jobs found matching your criteria.</div>
              )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#191011] via-[#23202b] to-[#2B2D42] text-white pt-14 pb-8 px-4 border-t-4 border-[#FF4B4B] mt-12 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-8">
          {/* Logo and brand */}
          <div className="flex-1 flex flex-col items-center md:items-start mb-8 md:mb-0">
            <div className="flex items-center gap-4 mb-4">
              <Image src="/logo.png" width={56} height={56} alt="I-Hire Logo" className="drop-shadow-lg" />
              <span className="text-3xl font-extrabold bg-gradient-to-r from-[#fff] to-[#f1e9ea] bg-clip-text text-transparent tracking-wide">I-Hire</span>
            </div>
            <p className="text-[#f1e9ea] text-base font-medium max-w-xs text-center md:text-left mb-2">Connecting talented professionals with top employers across the MENA region.</p>
            <span className="inline-block bg-[#FF4B4B] text-white text-xs font-semibold px-3 py-1 rounded-full mt-2 shadow">Empowering Your Career Journey</span>
          </div>
          {/* Links */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#FF4B4B]">For Job Seekers</h4>
              <ul className="space-y-2 text-[#f1e9ea] text-sm">
                <li><Link href="/job-seeker/jobs" className="hover:text-[#FF4B4B] transition-colors">Browse Jobs</Link></li>
                <li><Link href="/job-seeker/applications" className="hover:text-[#FF4B4B] transition-colors">My Applications</Link></li>
                <li><Link href="/job-seeker/profile" className="hover:text-[#FF4B4B] transition-colors">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#FF4B4B]">Company</h4>
              <ul className="space-y-2 text-[#f1e9ea] text-sm">
                <li><Link href="/about" className="hover:text-[#FF4B4B] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#FF4B4B] transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-[#FF4B4B] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1 w-full flex flex-col items-center mt-8 lg:mt-0">
              <h4 className="font-bold text-lg mb-4 text-[#FF4B4B] text-center">Connect With Us</h4>
              <div className="w-full flex justify-center items-center gap-4 mb-4">
                <Link href="#" className="w-9 h-9 bg-[#FF4B4B] rounded-full flex items-center justify-center hover:bg-[#f05941] transition-colors" aria-label="Twitter">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </Link>
                <Link href="#" className="w-9 h-9 bg-[#FF4B4B] rounded-full flex items-center justify-center hover:bg-[#f05941] transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" />
                    <circle cx="17" cy="7" r="1.5" fill="currentColor" />
                  </svg>
                </Link>
                <Link href="#" className="w-9 h-9 bg-[#FF4B4B] rounded-full flex items-center justify-center hover:bg-[#f05941] transition-colors" aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </Link>
              </div>
              <p className="text-[#f1e9ea] text-xs text-center">© {new Date().getFullYear()} <span className="font-bold text-[#FF4B4B]">I-Hire</span>. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function JobSeekerJobsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobsPageContent />
    </Suspense>
  );
}