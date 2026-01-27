import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, LogOut, ShieldAlert, Settings } from 'lucide-react';
import JobBoard from '../components/jobs/JobBoard';
import EmployerWorkspace from '../components/jobs/EmployerWorkspace';
import NotificationDropdown from '../components/notifications/NotificationDropdown';
import SeekerProfile from '../components/profile/SeekerProfile';
import MobileNav from '../components/layout/MobileNav';

const Dashboard = () => {
    const [activeTab, setActiveTab] = React.useState('jobs'); // jobs, profile, notifications
    const [unreadCount, setUnreadCount] = React.useState(0);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('http://localhost:3000/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const unread = data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" />;

    const isPendingEmployer = user.role === 'EMPLOYER' && user.employer?.status === 'PENDING';

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 md:h-20 items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-blue-100">W</div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">WorkBridge</h1>
                        </div>

                        {/* Desktop Navigation */}
                        {user.role === 'JOB_SEEKER' && (
                            <div className="hidden md:flex flex-1 mx-12 space-x-2">
                                <button
                                    onClick={() => setActiveTab('jobs')}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition flex items-center ${activeTab === 'jobs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Board
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition flex items-center ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Profile
                                </button>
                            </div>
                        )}

                        <div className="flex items-center space-x-4 md:space-x-6">
                            <div className="hidden md:block">
                                <NotificationDropdown />
                            </div>
                            <div className="hidden sm:flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-xl">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    {user.role.replace('_', ' ')}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="hidden md:flex items-center text-gray-500 hover:text-red-600 font-semibold transition group"
                            >
                                <LogOut className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {isPendingEmployer && (
                    <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-3xl flex items-center text-yellow-800 animate-in slide-in-from-top-4 duration-500">
                        <ShieldAlert className="mr-4 text-yellow-500" size={32} />
                        <div>
                            <p className="font-bold text-lg">Account Verification Pending</p>
                            <p className="opacity-80">Our team is reviewing your company details. You'll be able to post jobs once approved.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8">
                    {user.role === 'EMPLOYER' ? (
                        <EmployerWorkspace />
                    ) : (
                        activeTab === 'jobs' ? (
                            <>
                                <JobBoard />
                                {/* Subscription Toggle */}
                                <div className="mt-8 bg-blue-600 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center shadow-2xl shadow-blue-100">
                                    <div className="mb-4 md:mb-0">
                                        <h3 className="text-2xl font-bold flex items-center">
                                            <Settings className="mr-3" />
                                            Stay Updated?
                                        </h3>
                                        <p className="text-blue-100">Receive SMS and Email alerts when new jobs match your skills.</p>
                                    </div>
                                    <button
                                        onClick={toggleSubscription}
                                        className={`px-8 py-3 rounded-xl font-bold transition ${user.jobSeeker.isSubscribed
                                            ? 'bg-blue-500 text-white border-2 border-blue-400'
                                            : 'bg-white text-blue-600 shadow-xl'
                                            }`}
                                    >
                                        {user.jobSeeker.isSubscribed ? 'Disable Alerts' : 'Enable Mobile Alerts'}
                                    </button>
                                </div>
                            </>
                        ) : activeTab === 'notifications' ? (
                            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 animate-in fade-in zoom-in duration-300">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Alerts</h2>
                                <NotificationDropdown isMobile={true} />
                            </div>
                        ) : (
                            <SeekerProfile />
                        )
                    )}
                </div>
            </main>

            {/* Mobile Navigation */}
            {user.role === 'JOB_SEEKER' && (
                <MobileNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    unreadNotifications={unreadCount}
                    onLogout={logout}
                />
            )}
        </div>
    );
};

export default Dashboard;
