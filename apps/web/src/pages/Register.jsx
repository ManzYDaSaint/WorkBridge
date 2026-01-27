import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Briefcase, User } from 'lucide-react';

const Register = () => {
    const [role, setRole] = useState('JOB_SEEKER');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        companyName: '',
        industry: '',
        location: '',
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register({ ...formData, role });
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 py-12">
            <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl">
                <h2 className="mb-6 text-3xl font-bold text-center text-gray-800">Create Account</h2>

                <div className="flex justify-center mb-8 space-x-4">
                    <button
                        onClick={() => setRole('JOB_SEEKER')}
                        className={`flex items-center px-4 py-2 rounded-lg border transition ${role === 'JOB_SEEKER' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-600'
                            }`}
                    >
                        <User className="w-4 h-4 mr-2" />
                        Job Seeker
                    </button>
                    <button
                        onClick={() => setRole('EMPLOYER')}
                        className={`flex items-center px-4 py-2 rounded-lg border transition ${role === 'EMPLOYER' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-600'
                            }`}
                    >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Employer
                    </button>
                </div>

                {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-600">Email</label>
                            <input
                                type="email"
                                name="email"
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-600">Password</label>
                            <input
                                type="password"
                                name="password"
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {role === 'JOB_SEEKER' ? (
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-600">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-600">Company Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-600">Industry</label>
                                    <input
                                        type="text"
                                        name="industry"
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-600">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 mt-6 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                        Create Account
                    </button>
                </form>
                <p className="mt-6 text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
