import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, CheckCircle, XCircle, Users, Briefcase, User } from 'lucide-react';

const AdminDashboard = () => {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('metrics'); // metrics, employers, users
    const [employers, setEmployers] = useState([]);
    const [users, setUsers] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [empRes, metRes, userRes] = await Promise.all([
                fetch('http://localhost:3000/admin/employers', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:3000/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:3000/admin/users', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setEmployers(await empRes.json());
            setMetrics(await metRes.json());
            setUsers(await userRes.json());
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'ADMIN') fetchData();
    }, [user]);

    const updateStatus = async (id, status) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/admin/employers/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setEmployers(employers.map(emp => emp.id === id ? { ...emp, status } : emp));
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    if (loading || fetchLoading) return <div className="p-8">Loading Admin...</div>;
    if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" />;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-bold text-gray-900">WorkBridge Portal</h1>
                        <div className="flex space-x-1">
                            {['metrics', 'employers', 'users'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6">
                {activeTab === 'metrics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard title="Users" value={metrics?.totalUsers} icon={<Users />} color="blue" />
                        <MetricCard title="Job Seekers" value={metrics?.totalJobSeekers} icon={<User />} color="green" />
                        <MetricCard title="Employers" value={metrics?.totalEmployers} icon={<Briefcase />} color="purple" />
                        <MetricCard title="Jobs Posted" value={metrics?.totalJobs} icon={<Briefcase />} color="yellow" />
                    </div>
                )}

                {activeTab === 'employers' && (
                    <div className="bg-white rounded-xl shadow-sm border">
                        <Table
                            headers={['Company', 'Industry', 'Status', 'Actions']}
                            data={employers}
                            renderRow={(emp) => (
                                <tr key={emp.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{emp.companyName}</div>
                                        <div className="text-xs text-gray-500">{emp.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{emp.industry || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={emp.status} />
                                    </td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        {emp.status === 'PENDING' && (
                                            <>
                                                <button onClick={() => updateStatus(emp.id, 'APPROVED')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button onClick={() => updateStatus(emp.id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )}
                        />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border">
                        <Table
                            headers={['Email', 'Role', 'Profile Name', 'Joined']}
                            data={users}
                            renderRow={(u) => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 font-medium">{u.email}</td>
                                    <td className="px-6 py-4"><span className="text-xs uppercase bg-gray-100 px-2 py-1 rounded">{u.role}</span></td>
                                    <td className="px-6 py-4 text-sm">
                                        {u.role === 'JOB_SEEKER' ? u.jobSeeker?.fullName : u.employer?.companyName || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                </tr>
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border flex items-center`}>
        <div className={`p-4 bg-opacity-10 rounded-xl mr-4 flex items-center justify-center`} style={{ backgroundColor: color, color: color }}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value || 0}</p>
        </div>
    </div>
);

const Table = ({ headers, data, renderRow }) => (
    <table className="w-full text-left">
        <thead className="bg-gray-50 border-b">
            <tr>
                {headers.map(h => <th key={h} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}
            </tr>
        </thead>
        <tbody className="divide-y">{data.map(renderRow)}</tbody>
    </table>
);

const StatusBadge = ({ status }) => {
    const colors = {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700'
    };
    return <span className={`px-3 py-1 text-xs font-bold rounded-full ${colors[status]}`}>{status}</span>;
};

export default AdminDashboard;
