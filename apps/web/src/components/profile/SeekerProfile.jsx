import React, { useState, useEffect } from 'react';
import { User, FileText, MapPin, CheckCircle, Upload, Save } from 'lucide-react';

const SeekerProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setProfile(data);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            await fetch('http://localhost:3000/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });
            fetchProfile();
        } catch (err) {
            console.error('Update failed', err);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('resume', file);

        try {
            await fetch('http://localhost:3000/profile/resume', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            fetchProfile();
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading Profile...</div>;

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 p-8 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold">{profile.fullName}</h2>
                        <p className="opacity-80">Complete your profile to stand out to employers</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-2xl flex flex-col items-center">
                        <span className="text-4xl font-black">{profile.completion}%</span>
                        <span className="text-xs uppercase font-bold">Complete</span>
                    </div>
                </div>

                {/* Completion Bar */}
                <div className="mt-8 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-1000"
                        style={{ width: `${profile.completion}%` }}
                    ></div>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-700">
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Bio</label>
                            <textarea
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none h-32"
                                placeholder="Tell employers about your experience and goals..."
                                value={profile.bio || ''}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                                        value={profile.location || ''}
                                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-100"
                        >
                            <Save className="mr-2" size={18} />
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <h3 className="font-bold flex items-center text-gray-800 mb-4">
                            <FileText className="mr-2 text-blue-600" />
                            Resume / CV
                        </h3>

                        {profile.resumeUrl ? (
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl border flex items-center justify-between">
                                    <span className="text-sm font-medium truncate max-w-[150px]">Current Resume</span>
                                    <CheckCircle className="text-green-500" size={20} />
                                </div>
                                <a
                                    href={profile.resumeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-center text-sm font-bold text-blue-600 hover:underline"
                                >
                                    View Resume
                                </a>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mb-4">You haven't uploaded a resume yet.</p>
                        )}

                        <label className="mt-4 block w-full">
                            <span className={`w-full py-3 flex items-center justify-center font-bold border-2 border-dashed rounded-xl cursor-pointer transition ${uploading ? 'border-gray-200 text-gray-400' : 'border-blue-400 text-blue-600 hover:bg-blue-50'}`}>
                                <Upload className="mr-2" size={18} />
                                {uploading ? 'Uploading...' : 'Upload PDF'}
                            </span>
                            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeekerProfile;
