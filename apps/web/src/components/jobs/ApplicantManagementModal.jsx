import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, User, FileText, Star, Mail, MapPin } from 'lucide-react';
import { apiFetchJson } from '../../lib/api';

const ApplicantManagementModal = ({ job, onClose }) => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApplicants = async () => {
        try {
            const res = await apiFetch(`/jobs/${job.id}/applicants`);
            const data = await res.json();
            setApplicants(data);
        } catch (err) {
            console.error('Failed to fetch applicants', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, [job.id]);

    const updateStatus = async (applicationId, status) => {
        try {
            const res = await apiFetchJson(`/jobs/applications/${applicationId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (res.ok) fetchApplicants();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{job.title}</h3>
                        <p className="text-gray-500">Manage candidates and track hiring progress</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 bg-white rounded-xl shadow-sm border">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {loading ? (
                        <p className="text-center py-12 text-gray-400">Loading candidates...</p>
                    ) : applicants.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="mx-auto text-gray-200 mb-4" size={64} />
                            <p className="text-gray-500 font-medium">No applications yet for this position.</p>
                        </div>
                    ) : (
                        applicants.map((app) => (
                            <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                            <User size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900">{app.jobSeeker.fullName}</h4>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center"><MapPin size={14} className="mr-1" /> {app.jobSeeker.location || 'Remote'}</span>
                                                <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-bold">
                                                    <Star size={14} className="mr-1 fill-current" /> {app.matchScore}% Match
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                                        <select
                                            value={app.status}
                                            onChange={(e) => updateStatus(app.id, e.target.value)}
                                            className="px-4 py-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="REVIEWED">Reviewed</option>
                                            <option value="SHORTLISTED">Shortlisted</option>
                                            <option value="INTERVIEWING">Interviewing</option>
                                            <option value="ACCEPTED">Accepted</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>

                                        {app.jobSeeker.resumeUrl && (
                                            <a
                                                href={app.jobSeeker.resumeUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition font-bold text-sm shadow-sm"
                                            >
                                                <FileText size={18} className="mr-2" /> Resume
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {app.jobSeeker.bio && (
                                    <p className="mt-4 text-gray-600 text-sm line-clamp-2">{app.jobSeeker.bio}</p>
                                )}

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {app.jobSeeker.skills.map((skill, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicantManagementModal;
