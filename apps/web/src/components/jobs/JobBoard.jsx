import React, { useEffect, useState } from 'react';
import { Search, MapPin, Briefcase, ChevronRight, CheckCircle } from 'lucide-react';

const JobBoard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    const fetchJobs = async () => {
        try {
            const res = await fetch('http://localhost:3000/jobs');
            const data = await res.json();
            setJobs(data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleApply = async (jobId) => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to apply');

        try {
            const res = await fetch(`http://localhost:3000/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setAppliedJobs(prev => new Set([...prev, jobId]));
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to apply');
            }
        } catch (err) {
            console.error('Application error', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search jobs, skills, or locations..."
                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 space-y-4">
                                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="flex space-x-4">
                                        <div className="h-4 bg-gray-100 rounded w-20"></div>
                                        <div className="h-4 bg-gray-100 rounded w-20"></div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="h-6 bg-gray-50 rounded w-16"></div>
                                        <div className="h-6 bg-gray-50 rounded w-16"></div>
                                    </div>
                                </div>
                                <div className="ml-4 h-10 bg-gray-200 rounded-xl w-28"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 transition group">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">{job.title}</h3>
                                    <p className="font-semibold text-gray-600 mt-1">{job.employer.companyName}</p>

                                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <MapPin size={16} className="mr-1" />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center capitalize">
                                            <Briefcase size={16} className="mr-1" />
                                            {job.type}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {job.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="ml-4">
                                    {appliedJobs.has(job.id) ? (
                                        <div className="flex items-center text-green-600 font-bold px-4 py-2 bg-green-50 rounded-xl">
                                            <CheckCircle size={20} className="mr-2" />
                                            Applied
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleApply(job.id)}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-100"
                                        >
                                            Apply Now
                                            <ChevronRight size={18} className="ml-1" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default JobBoard;
