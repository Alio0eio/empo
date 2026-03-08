import { Button } from '@/components/ui/button'
import { ArrowRight, Briefcase, MapPin, Calendar, Users, GraduationCap, DollarSign, Trash2 } from 'lucide-react'
import moment from 'moment'
import Link from 'next/link'
import React, { useState } from 'react'

function PostedJobCard({ job, viewDetail = false, onDelete, isDeleted = false, onRestore }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const location = [job?.city, job?.country].filter(Boolean).join(', ')
    const salary = job?.minSalary || job?.maxSalary
        ? `${job.minSalary || '?'} - ${job.maxSalary || '?'} ${job.currency || 'EGP'}/${job.period || 'Per Month'}`
        : null

    return (
        <div className='group bg-white rounded-2xl shadow-lg border border-[#E4D3D5] p-6 hover:shadow-2xl hover:border-[#be3144]/20 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden'>
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#be3144]/5 to-[#f05941]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Header */}
            <div className='flex items-center justify-between relative z-10'>
                <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-[#be3144] to-[#f05941] flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                    {job?.jobPosition?.charAt(0)?.toUpperCase() || job?.jobTitle?.charAt(0)?.toUpperCase() || 'J'}
                </div>
                <div className='flex flex-col items-end gap-1'>
                    <span className='text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full'>
                        {moment(job?.createdAt).format('DD MMM YYYY')}
                    </span>
                    <span className='text-xs font-medium text-[#be3144] bg-[#fbeaec] px-2 py-1 rounded-full flex items-center gap-1'>
                        <Briefcase className='h-3 w-3' />
                        Posted Job
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className='relative z-10 flex-1'>
                <h2 className='font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-[#be3144] transition-colors duration-200'>
                    {job?.jobPosition || job?.jobTitle || 'Job Position'}
                </h2>

                <div className='space-y-3'>
                    {/* Location */}
                    {location && (
                        <div className='flex items-center'>
                            <span className='text-sm text-gray-600 flex items-center gap-2'>
                                <MapPin className='h-4 w-4 text-[#be3144]' />
                                {location}
                            </span>
                        </div>
                    )}

                    {/* Career Level & Categories */}
                    <div className='flex items-center justify-between'>
                        {job?.careerLevel && (
                            <span className='text-sm text-gray-600 flex items-center gap-2'>
                                <GraduationCap className='h-4 w-4 text-[#be3144]' />
                                {job.careerLevel}
                            </span>
                        )}
                        <span className='text-sm text-gray-600 flex items-center gap-2'>
                            <Calendar className='h-4 w-4 text-[#be3144]' />
                            {moment(job?.createdAt).format('MMM DD')}
                        </span>
                    </div>

                    {/* Salary */}
                    {salary && !job?.hideSalary && (
                        <div className='flex items-center'>
                            <span className='text-sm text-gray-600 flex items-center gap-2'>
                                <DollarSign className='h-4 w-4 text-[#be3144]' />
                                {salary}
                            </span>
                        </div>
                    )}

                    {/* Categories */}
                    {job?.jobCategories && job.jobCategories.length > 0 && (
                        <div className='flex flex-wrap gap-1.5'>
                            {job.jobCategories.slice(0, 2).map((cat, idx) => (
                                <span
                                    key={idx}
                                    className='text-xs bg-gradient-to-r from-[#be3144]/10 to-[#f05941]/10 text-[#be3144] px-2 py-0.5 rounded-full font-medium'
                                >
                                    {cat}
                                </span>
                            ))}
                            {job.jobCategories.length > 2 && (
                                <span className='text-xs text-gray-400 px-1'>
                                    +{job.jobCategories.length - 2} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Vacancies */}
                    {job?.vacancies && (
                        <div className='flex items-center'>
                            <span className='text-sm text-gray-600 flex items-center gap-2'>
                                <Users className='h-4 w-4 text-[#be3144]' />
                                {job.vacancies} {job.vacancies === 1 ? 'Vacancy' : 'Vacancies'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && !isDeleted && (
                <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full'>
                        <h3 className='text-lg font-bold text-gray-900 mb-2'>Delete Job?</h3>
                        <p className='text-gray-600 mb-6'>Are you sure you want to delete this job posting? You can restore it later from All Jobs.</p>
                        <div className='flex gap-3'>
                            <Button
                                variant='outline'
                                className='flex-1 border-gray-300 text-gray-700 hover:bg-gray-50'
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className='flex-1 bg-red-600 hover:bg-red-700 text-white'
                                onClick={() => {
                                    onDelete(job.id);
                                    setShowDeleteConfirm(false);
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            {viewDetail ? (
                <div className='flex flex-col sm:flex-row gap-2 w-full relative z-10'>
                    {!isDeleted && (
                        <Link href={`/dashboard/post-job`} className='flex-1'>
                            <Button
                                variant='outline'
                                className='w-full border-[#be3144] text-[#be3144] hover:bg-[#be3144] hover:text-white transition-all duration-200 flex gap-2 text-sm font-medium group-hover:shadow-lg'
                            >
                                View Details
                                <ArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform duration-200' />
                            </Button>
                        </Link>
                    )}
                    {!isDeleted && onDelete && (
                        <Button
                            variant='outline'
                            className='border-red-300 text-red-600 hover:bg-red-50 transition-all duration-200 flex gap-2 text-sm font-medium'
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 className='h-4 w-4' />
                            Delete
                        </Button>
                    )}
                    {isDeleted && onRestore && (
                        <Button
                            variant='outline'
                            className='flex-1 border-green-300 text-green-600 hover:bg-green-50 transition-all duration-200 flex gap-2 text-sm font-medium'
                            onClick={() => onRestore(job.id)}
                        >
                            <ArrowRight className='h-4 w-4' />
                            Restore Job
                        </Button>
                    )}
                </div>
            ) : (
                <div className='flex flex-col sm:flex-row gap-3 w-full relative z-10'>
                    <Link href={`/dashboard/post-job`} className='flex-1'>
                        <Button
                            variant='outline'
                            className='w-full border-[#be3144] text-[#be3144] hover:bg-[#be3144] hover:text-white transition-all duration-200 flex gap-2 text-sm font-medium'
                        >
                            <Briefcase className='h-4 w-4' />
                            View Job
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}

export default PostedJobCard
