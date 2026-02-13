"use client"
import { useUser, useClerk } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { db } from '@/utils/db';
import { MockInterview, callInterview } from '@/utils/schema';
import { desc, eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  WebcamIcon, Briefcase, Star, Lightbulb, Search,
  ArrowRight, Building2, Code, Paintbrush, Database,
  ChevronRight, Loader2, BarChart2, Clock, User,
  Pencil, Book, PhoneCall, HelpCircle, Info, Handshake, Mail, Settings, LogOut, MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CallInterviewCard from '../dashboard/_components/CallInterviewCard';
import Header from "../dashboard/_components/Header";
import Image from 'next/image';
import LatestJobsSection from './LatestJobsSection';
import JobRecommendations from './_components/JobRecommendations';
import UserAvatar from '@/components/UserAvatar';

export default function JobSeekerPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [interviewList, setInterviewList] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  const { signOut } = useClerk();

  // Use the same jobCategories as in the jobs page for consistency
  const jobCategories = [
    { title: 'Accounting/Finance', icon: <Database className="w-6 h-6 text-[#be3144]" />, description: 'Manage financial accounts and records.' },
    { title: 'Administration', icon: <Building2 className="w-6 h-6 text-[#be3144]" />, description: 'Oversee office operations and support.' },
    { title: 'Banking', icon: <Briefcase className="w-6 h-6 text-[#be3144]" />, description: 'Work in financial institutions and services.' },
    { title: 'IT/Software Development', icon: <Code className="w-6 h-6 text-[#be3144]" />, description: 'Develop and maintain software systems.' },
    { title: 'Marketing/PR/Advertising', icon: <Lightbulb className="w-6 h-6 text-[#be3144]" />, description: 'Promote brands and manage public relations.' },
    { title: 'Human Resources', icon: <User className="w-6 h-6 text-[#be3144]" />, description: 'Manage recruitment and employee relations.' },
    { title: 'Customer Service/Support', icon: <Star className="w-6 h-6 text-[#be3144]" />, description: 'Assist and support customers.' },
    { title: 'Other', icon: <Database className="w-6 h-6 text-[#be3144]" />, description: 'Explore more categories.' },
  ];

  useEffect(() => {
    if (isLoaded && user) {
      fetchInterviews();
    }
    if (isLoaded) {
      fetchAllJobs();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (isLoaded && user) {
      fetch(`/api/user-profile?userId=${user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setUserProfile(data))
        .catch(() => setUserProfile(null));
    }
  }, [isLoaded, user]);

  const fetchInterviews = async () => {
    try {
      const result = await db.select()
        .from(MockInterview)
        .where(eq(MockInterview.createdBy, user?.primaryEmailAddress?.emailAddress))
        .orderBy(desc(MockInterview.createdAt));

      setInterviewList(result);
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const fetchAllJobs = async () => {
    try {
      const callJobs = await db.select().from(callInterview).orderBy(desc(callInterview.createdAt));
      const callJobsWithType = callJobs.map(j => ({ ...j, _type: 'call', type: 'Call Interview', jobDescription: j.jobDescription }));
      const mockJobs = await db.select().from(MockInterview).where(eq(MockInterview.isHidden, false)).orderBy(desc(MockInterview.createdAt));
      const mockJobsWithType = mockJobs.map(j => ({ ...j, _type: 'mock', type: 'Video Interview', jobDescription: j.jobDesc }));
      setAllJobs([...callJobsWithType, ...mockJobsWithType]);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleCategorySelect = (categoryTitle) => {
    router.push(`/job-seeker/jobs?category=${encodeURIComponent(categoryTitle)}`);
  };

  // Calculate interview stats
  const completedInterviews = interviewList.length;
  const avgRating = interviewList.reduce((acc, curr) => acc + (curr.rating || 0), 0) / completedInterviews || 0;
  const lastInterviewDate = interviewList[0]?.createdAt;

  // User-friendly job card for job seekers
  function JobSeekerJobCard({ job }) {
    const router = useRouter();
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#be3144] to-[#f05941] flex items-center justify-center text-white font-bold text-lg">
              {job.jobPosition?.charAt(0) || 'J'}
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#191011] mb-0.5">{job.jobPosition}</h3>
              <span className="text-xs text-[#8e575f]">{job.recruiterName || 'Employer'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#f1e9ea] text-xs text-[#be3144] font-medium">
              {job.type || 'Interview'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#f1e9ea] text-xs text-[#be3144] font-medium">
              {job.duration || 'N/A'}
            </span>
          </div>
          <p className="text-sm text-[#191011] mb-4 line-clamp-3 min-h-[48px]">{job.jobDescription || 'No description provided.'}</p>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Button
            className="w-full bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#f05941] hover:to-[#ff7b54] text-white"
            onClick={() => router.push(`/job-seeker/job/${job.job_id}`)}
          >
            View Details
          </Button>
          <Button
            className="w-full border-[#be3144] text-[#be3144] hover:bg-[#f1e9ea]"
            variant="outline"
            onClick={() => router.push(`/job-seeker/Call-Interview/${job.job_id}`)}
          >
            Start Interview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f9] to-[#f1e9ea]">
      {/* Job Seeker Header matching main site style */}
      <div className="pt-[70px]">
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2 shadow-lg' : 'py-4 shadow-sm'}`} style={{ backgroundColor: '#FBF1EE' }}>
          <div className="container mx-auto px-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              {/* Logo with hover effect */}
              <div className={`transition-all duration-300 ${scrolled ? 'w-12 h-12' : 'w-14 h-14'}`}>
                <Image
                  src={'/logo.png'}
                  width={scrolled ? 48 : 56}
                  height={scrolled ? 48 : 56}
                  alt='logo'
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Gradient company name */}
              <span className={`text-xl font-bold text-[#FF4B4B] transition-all duration-300 ${scrolled ? 'text-2xl' : 'text-3xl'}`}>I-Hire</span>
            </Link>
            {/* Job seeker actions */}
            <div className="flex items-center gap-4">
              {/* Desktop Upload CV button */}
              <Button
                variant="outline"
                className="hidden md:flex items-center gap-2 border-[#FF4B4B] text-[#FF4B4B] hover:bg-[#fff0f0] transition-colors"
                onClick={() => router.push('/job-seeker/Upload-CV')}
              >
                <span>Upload CV</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {isLoaded && user && (
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fff0f0] to-[#e4d3d5] flex items-center justify-center overflow-hidden border-2 border-[#fff0f0] hover:border-[#FF4B4B] transition-colors shadow-sm cursor-pointer"
                    onClick={() => setMenuOpen((open) => !open)}
                    style={{ cursor: 'pointer' }}
                  >
                    <UserAvatar
                      profilePhoto={userProfile?.profilePhoto}
                      userImageUrl={user.imageUrl}
                      name={userProfile?.name || user.fullName}
                      size={56}
                    />
                  </div>
                  {completedInterviews > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#FF4B4B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow">
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
                        <UserAvatar
                          profilePhoto={userProfile?.profilePhoto}
                          userImageUrl={user.imageUrl}
                          name={userProfile?.name || user.fullName}
                          size={56}
                        />
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
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium">
                          <Pencil className="w-5 h-5 text-[#191011]" /> Edit Profile
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium">
                          <Book className="w-5 h-5 text-[#191011]" /> Career Readings
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium">
                          <PhoneCall className="w-5 h-5 text-[#191011]" /> Help Center
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium">
                          <Info className="w-5 h-5 text-[#191011]" /> About Us
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium">
                          <Handshake className="w-5 h-5 text-[#191011]" /> Become A Partner
                        </a>
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium">
                          <Mail className="w-5 h-5 text-[#191011]" /> Contact Us
                        </a>
                        <a
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setMenuOpen(false);
                            router.push('/job-seeker/chat');
                          }}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium"
                        >
                          <MessageCircle className="w-5 h-5 text-[#191011]" /> Chat
                        </a>
                      </div>
                      <div className="border-t border-[#f1e9ea] flex flex-col">
                        <a href="#" className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f0] transition-colors text-[#191011] text-base font-medium">
                          <Settings className="w-5 h-5 text-[#191011]" /> Account Settings
                        </a>
                        <a href="#" onClick={e => { e.preventDefault(); signOut(); }} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9eaea] transition-colors text-[#FF4B4B] text-base font-semibold">
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Mobile Upload CV button */}
        <div className="block md:hidden mb-8 px-2">
          <Button
            className="w-full py-4 text-lg font-bold rounded-2xl shadow-lg bg-[#FF4B4B] hover:bg-[#ff3333] text-white flex items-center justify-center gap-3 transition-all duration-200 active:scale-95"
            onClick={() => router.push('/job-seeker/Upload-CV')}
            style={{ minHeight: 56 }}
          >
            <span>Upload CV</span>
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* New Hero Section */}
        <section className="relative py-16 md:py-24 flex flex-col items-center text-center px-4">
          <div className="bg-[#FFF0F0] text-[#FF4B4B] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-6 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B4B]"></span>
            AI-Powered Search
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-[#1a1a1a] mb-6 leading-tight max-w-4xl tracking-tight">
            Find the job that <br className="hidden md:block" />
            <span className="text-[#FF4B4B]">fits your life.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mb-10 leading-relaxed">
            Connect with top employers and let our AI coach guide you through interview prep to landing your offer.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-4xl bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 flex flex-col md:flex-row items-center gap-2 mb-8">
            <div className="flex-1 flex items-center px-4 w-full h-14 md:h-auto border-b md:border-b-0 md:border-r border-gray-100">
              <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="w-full h-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center px-4 w-full h-14 md:h-auto">
              <div className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <input
                type="text"
                placeholder="Location"
                className="w-full h-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <Button
              onClick={() => {
                if (searchQuery.trim()) {
                  router.push(`/job-seeker/jobs?search=${encodeURIComponent(searchQuery)}`);
                } else {
                  router.push('/job-seeker/jobs');
                }
              }}
              className="w-full md:w-auto px-8 h-12 rounded-xl bg-[#DC3535] hover:bg-[#c02e2e] text-white font-semibold text-base shadow-lg shadow-red-200 transition-all hover:shadow-red-300"
            >
              Search
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              Verified Companies
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#3b82f6] flex items-center justify-center text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              AI Resume Review
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#a855f7] flex items-center justify-center text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              Salary Insights
            </div>
          </div>
        </section>

        {/* Explore Categories */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">Explore Categories</h2>
              <p className="text-gray-500">Find opportunities across different industries</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-black transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {jobCategories.slice(0, 5).map((category, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleCategorySelect(category.title)}
              >
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl
                    ${index === 0 ? 'bg-blue-50 text-blue-600' : ''}
                    ${index === 1 ? 'bg-purple-50 text-purple-600' : ''}
                    ${index === 2 ? 'bg-green-50 text-green-600' : ''}
                    ${index === 3 ? 'bg-orange-50 text-orange-600' : ''}
                    ${index >= 4 ? 'bg-red-50 text-red-600' : ''}
                `}>
                  {category.icon}
                </div>
                <h3 className="font-bold text-[#1a1a1a] text-lg mb-1 group-hover:text-[#FF4B4B] transition-colors">
                  {category.title.split('/')[0]} {/* Simplify title for clean look */}
                </h3>
                <p className="text-sm text-gray-500">
                  {Math.floor(Math.random() * 900) + 100}+ Jobs
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Recommendations Section */}
        <section className="mb-10">
          <JobRecommendations />
        </section>

        <LatestJobsSection allJobs={allJobs} loadingJobs={loadingJobs} />
      </main>
      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#191011] via-[#23202b] to-[#2B2D42] text-white pt-14 pb-8 px-4 border-t-4 border-[#be3144] mt-12 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-8">
          {/* Logo and brand */}
          <div className="flex-1 flex flex-col items-center md:items-start mb-8 md:mb-0">
            <div className="flex items-center gap-4 mb-4">
              <Image src="/logo.png" width={56} height={56} alt="I-Hire Logo" className="drop-shadow-lg" />
              <span className="text-3xl font-extrabold bg-gradient-to-r from-[#fff] to-[#f1e9ea] bg-clip-text text-transparent tracking-wide">I-Hire</span>
            </div>
            <p className="text-[#f1e9ea] text-base font-medium max-w-xs text-center md:text-left mb-2">Connecting talented professionals with top employers across the MENA region.</p>
            <span className="inline-block bg-[#be3144] text-white text-xs font-semibold px-3 py-1 rounded-full mt-2 shadow">Empowering Your Career Journey</span>
          </div>
          {/* Links */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#be3144]">For Job Seekers</h4>
              <ul className="space-y-2 text-[#f1e9ea] text-sm">
                <li><Link href="/job-seeker/jobs" className="hover:text-[#be3144] transition-colors">Browse Jobs</Link></li>
                <li><Link href="/job-seeker/applications" className="hover:text-[#be3144] transition-colors">My Applications</Link></li>
                <li><Link href="/job-seeker/profile" className="hover:text-[#be3144] transition-colors">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#be3144]">Company</h4>
              <ul className="space-y-2 text-[#f1e9ea] text-sm">
                <li><Link href="/about" className="hover:text-[#be3144] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#be3144] transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-[#be3144] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1 w-full flex flex-col items-center mt-8 lg:mt-0">
              <h4 className="font-bold text-lg mb-4 text-[#be3144] text-center">Connect With Us</h4>
              <div className="w-full flex justify-center items-center gap-4 mb-4">
                <Link href="#" className="w-9 h-9 bg-[#be3144] rounded-full flex items-center justify-center hover:bg-[#f05941] transition-colors" aria-label="Twitter">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </Link>
                <Link href="#" className="w-9 h-9 bg-[#be3144] rounded-full flex items-center justify-center hover:bg-[#f05941] transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" />
                    <circle cx="17" cy="7" r="1.5" fill="currentColor" />
                  </svg>
                </Link>
                <Link href="#" className="w-9 h-9 bg-[#be3144] rounded-full flex items-center justify-center hover:bg-[#f05941] transition-colors" aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </Link>
              </div>
              <p className="text-[#f1e9ea] text-xs text-center">© {new Date().getFullYear()} <span className="font-bold text-[#be3144]">I-Hire</span>. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function for time ago
function timeAgo(date) {
  const now = new Date();
  const posted = new Date(date);
  const diff = Math.floor((now - posted) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return posted.toLocaleDateString();
}