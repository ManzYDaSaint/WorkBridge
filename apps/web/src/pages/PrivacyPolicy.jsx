import React from 'react';
import { Shield, ChevronLeft, Lock, Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <nav className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/" className="flex items-center text-blue-600 font-bold">
                            <ChevronLeft size={20} className="mr-1" />
                            Back to App
                        </Link>
                        <div className="flex items-center space-x-2">
                            <Shield className="text-blue-600" size={24} />
                            <span className="font-bold text-gray-900">Legal Center</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-green-50 rounded-2xl text-green-600 mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4">Privacy Policy</h1>
                    <p className="text-gray-500">How we protect your data in the digital marketplace.</p>
                </div>

                <div className="prose prose-green max-w-none text-gray-600 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">1</span>
                            Data We Collect
                        </h2>
                        <p>
                            We collect information that you provide directly to us when you create an account, apply for a job, or post a job opening.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <h4 className="font-bold text-gray-900 mb-2">For Seekers</h4>
                                <p className="text-sm">Name, email, phone number, location, skills, and resume files (stored securely via Supabase).</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <h4 className="font-bold text-gray-900 mb-2">For Employers</h4>
                                <p className="text-sm">Company name, industry, location, and business verification documentation.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">2</span>
                            How We Use Your Data
                        </h2>
                        <p>
                            The primary purpose of collecting your data is to facilitate the hiring process. This includes:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Matching seekers with relevant job opportunities.</li>
                            <li>Sending automated notifications (Email/SMS) regarding application statuses.</li>
                            <li>Verifying employer legitimacy to protect job seekers.</li>
                            <li>Analyzing platform metrics to improve the WorkBridge experience.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">3</span>
                            Data Protection & Storage
                        </h2>
                        <p>
                            We use enterprise-grade security to protect your data. Resumes are stored in encrypted cloud buckets via Supabase. Sensitive account actions are logged in our internal audit trails to prevent unauthorized access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">4</span>
                            Third-Party Services
                        </h2>
                        <p>
                            We work with trusted partners to provide our services:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li><strong>Resend</strong> for email delivery.</li>
                            <li><strong>Twilio</strong> for SMS alerts.</li>
                            <li><strong>Supabase</strong> for file storage and database management.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">5</span>
                            Your Rights
                        </h2>
                        <p>
                            You have the right to access, correct, or delete your personal data at any time through your Dashboard. If you wish to permanently delete your account, please contact our privacy team.
                        </p>
                    </section>

                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 mt-12">
                        <h3 className="font-bold text-gray-900 mb-2">Privacy Concerns?</h3>
                        <p className="text-sm flex items-center">
                            <Fingerprint className="mr-2 text-green-600" size={18} />
                            Reach out to our Data Protection Officer at privacy@workbridge.mw
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
