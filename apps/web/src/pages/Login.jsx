import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-100 rounded-full">
                        <LogIn className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <h2 className="mb-6 text-3xl font-bold text-center text-gray-800">Welcome Back</h2>
                {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                        Sign In
                    </button>
                </form>
                <p className="mt-6 text-sm text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                        Register for free
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
