import React from 'react';
import { Shield, ChevronLeft, FileText, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
                    <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl text-blue-600 mb-4">
                        <Scale size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4">Terms of Service</h1>
                    <p className="text-gray-500">Last Updated: January 26, 2026</p>
                </div>

                <div className="prose prose-blue max-w-none text-gray-600 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">1</span>
                            Acceptance of Terms
                        </h2>
                        <p>
                            By accessing or using the WorkBridge platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services. WorkBridge provides a marketplace connecting Malawian talent with verified employers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">2</span>
                            User Accounts & Security
                        </h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration. Any unauthorized use of your account should be reported immediately to WorkBridge support.
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Seekers must represent their skills and experience truthfully.</li>
                            <li>Employers must provide valid business registration details for verification.</li>
                            <li>WorkBridge reserves the right to suspend accounts that violate platform integrity.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">3</span>
                            Employer Verification
                        </h2>
                        <p>
                            WorkBridge manually verifies employer accounts to ensure a safe marketplace. Approval is at the sole discretion of the WorkBridge administration. Employers may be required to submit documentation proving their legal business status in Malawi.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">4</span>
                            Communication & Notifications
                        </h2>
                        <p>
                            By joining WorkBridge, you agree to receive platform-related notifications. This includes in-app alerts, emails via Resend, and potentially SMS via Twilio. You can manage your communication preferences in the Dashboard settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 text-xl font-bold">5</span>
                            Termination
                        </h2>
                        <p>
                            We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 mt-12">
                        <h3 className="font-bold text-gray-900 mb-2">Have questions?</h3>
                        <p className="text-sm">If you have any questions about these Terms, please contact us at support@workbridge.mw</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
