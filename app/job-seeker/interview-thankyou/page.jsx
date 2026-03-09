"use client"
import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InterviewThankYou() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fbf9f9] via-[#f1e9ea] to-[#fde4e6] flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-72 h-72 bg-[#FF4B4B]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#be3144]/5 rounded-full blur-3xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-md w-full">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#f1e9ea]/50 backdrop-blur">
                    {/* Header Background */}
                    <div className="h-32 bg-gradient-to-br from-[#be3144] via-[#f05941] to-[#FF4B4B] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg scale-110"></div>
                                <CheckCircle className="w-16 h-16 text-white relative z-10" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-10 text-center space-y-6">
                        {/* Title */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Thank You!
                            </h1>
                            <p className="text-gray-600 text-base leading-relaxed">
                                Your interview has been completed successfully.
                            </p>
                        </div>

                        {/* Message */}
                        <div className="bg-gradient-to-br from-[#f1e9ea] to-[#fde4e6] rounded-2xl p-5 border border-[#f1c8cc]">
                            <p className="text-gray-800 font-medium">
                                You will hear about your interview feedback soon. Our team will review your responses and get back to you shortly.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="space-y-3 bg-blue-50 rounded-2xl p-4 border border-blue-100">
                            <p className="text-sm text-blue-900 font-medium">📧 Check your email</p>
                            <p className="text-xs text-blue-800">
                                We'll send you an update with your interview feedback and next steps.
                            </p>
                        </div>

                        {/* Button */}
                        <Link href="/job-seeker/jobs" className="w-full block">
                            <Button className="w-full bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#a02d3a] hover:to-[#d64a35] text-white font-semibold py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2">
                                Back to Job Listings
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>

                        {/* Secondary Link */}
                        <Link href="/job-seeker" className="block">
                            <button className="text-gray-600 hover:text-[#be3144] font-medium transition-colors duration-200">
                                Return to Home
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="text-center mt-8 text-gray-600 text-sm">
                    <p>Questions? <span className="text-[#be3144] font-medium">Contact our support team</span></p>
                </div>
            </div>
        </div>
    );
}
