"use client"
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InterviewComplete() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to thank you page after a short delay for UX
        const timer = setTimeout(() => {
            router.push('/job-seeker/interview-thankyou');
        }, 500);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fbf9f9] to-[#f1e9ea] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#be3144] mx-auto mb-4"></div>
                <p className="text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
}
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">Notification</p>
                                    <p className="text-sm text-gray-600">You'll receive an email with results</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-md">
                    <Button onClick={handleHomeClick} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg py-3 px-6 flex items-center justify-center space-x-2 transition duration-300 ease-in-out shadow-md border border-gray-300">
                        <Home className="h-5 w-5" />
                        <span>Return to Homepage</span>
                    </Button>
                    <Button onClick={handleOpportunitiesClick} className="flex-1 bg-gradient-to-r from-[#be3144] to-[#f05941] hover:from-[#f05941] hover:to-[#ff7b54] text-white rounded-lg py-3 px-6 flex items-center justify-center space-x-2 transition duration-300 ease-in-out shadow-md">
                        <span>View Other Opportunities</span>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white text-gray-500 text-center py-6 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-sm">&copy; {new Date().getFullYear()} I-Hire. All rights reserved.</p>
                    <div className="mt-2 flex justify-center space-x-6">
                        <a href="#" className="text-gray-500 hover:text-[#be3144]">
                            <span className="sr-only">Privacy Policy</span>
                            <span className="text-sm">Privacy Policy</span>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-[#be3144]">
                            <span className="sr-only">Terms of Service</span>
                            <span className="text-sm">Terms</span>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-[#be3144]">
                            <span className="sr-only">Contact</span>
                            <span className="text-sm">Contact</span>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InterviewComplete;