import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
                        <span className="font-bold text-gray-900">WorkBridge</span>
                        <span>&copy; 2026. Empowering Malawi.</span>
                    </div>
                    <div className="flex space-x-8">
                        <Link to="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
                        <Link to="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link>
                        <a href="mailto:support@workbridge.mw" className="hover:text-blue-600 transition">Support</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
