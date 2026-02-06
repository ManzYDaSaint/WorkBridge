import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, refreshSession } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
            setLoading(false);
            return;
        }
        if (savedUser && !token) {
            refreshSession().then((ok) => {
                if (ok) {
                    const updated = localStorage.getItem('user');
                    if (updated) setUser(JSON.parse(updated));
                }
            }).finally(() => setLoading(false));
            return;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return data.user;
        } else {
            throw new Error(data.error || 'Login failed');
        }
    };

    const register = async (formData) => {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return data.user;
        } else {
            throw new Error(data.error || 'Registration failed');
        }
    };

    const logout = async () => {
        try {
            const userId = user?.id;
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId })
            });
        } catch (err) {
            // ignore
        }
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
    };

    const toggleSubscription = async () => {
        if (!user || user.role !== 'JOB_SEEKER') return;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/notifications/toggle-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
        });

        if (response.ok) {
            const updatedUser = { ...user, jobSeeker: { ...user.jobSeeker, isSubscribed: !user.jobSeeker.isSubscribed } };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, toggleSubscription }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
