import React, { useEffect, useState } from 'react';
import { Plus, Users, MapPin, Clock } from 'lucide-react';
import ApplicantManagementModal from './ApplicantManagementModal';
import { Plus, Users, MapPin, Clock, ChevronRight } from 'lucide-react';

const EmployerWorkspace = () => {
    const [jobs, setJobs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMyJobs = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/jobs/my-jobs', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setJobs(data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyJobs();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Employer Dashboard</h2>
                    <p className="text-gray-500 mt-1">Manage your postings and discover top Malawian talent.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 md:mt-0 bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center hover:bg-blue-700 transition font-bold shadow-xl shadow-blue-100"
                >
                    <Plus size={20} className="mr-2" />
                    Post New Opportunity
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition">{job.title}</h3>
                                    <div className="flex items-center text-sm text-gray-500 mt-2 space-x-6">
                                        <span className="flex items-center">
                                            <MapPin size={16} className="mr-1.5 text-blue-500" />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center capitalize">
                                            <Clock size={16} className="mr-1.5 text-blue-500" />
                                            {job.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center space-x-4">
                                    <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl flex items-center font-bold">
                                        <Users size={20} className="mr-3" />
                                        {job._count.applications} Applicants
                                        <ChevronRight size={20} className="ml-2 opacity-30 group-hover:translate-x-1 transition" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {!loading && jobs.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <Users className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-bold text-lg">You haven't posted any jobs yet.</p>
                        <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 font-bold hover:underline">Create your first post</button>
                    </div>
                )}
            </div>

            {showModal && (
                <CreateJobModal
                    onClose={() => setShowModal(false)}
                    onCreated={fetchMyJobs}
                />
            )}

            {selectedJob && (
                <ApplicantManagementModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                />
            )}
        </div>
    );
};

export default EmployerWorkspace;
