import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, Briefcase, User } from 'lucide-react';
import { apiFetch } from '../lib/api';

const AdminDashboard = () => {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('metrics'); // metrics, employers, users, audit
    const [employers, setEmployers] = useState([]);
    const [users, setUsers] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditMeta, setAuditMeta] = useState({ total: 0, limit: 50, offset: 0 });
    const [auditFilters, setAuditFilters] = useState({
        userId: '',
        action: '',
        method: '',
        path: '',
        statusCode: '',
        minStatus: '',
        maxStatus: '',
        from: '',
        to: ''
    });
    const [purgeDays, setPurgeDays] = useState(90);
    const [fetchLoading, setFetchLoading] = useState(true);

    const fetchData = async () => {
        try {
            const searchParams = new URLSearchParams({
                limit: String(auditMeta.limit),
                offset: String(auditMeta.offset)
            });
            Object.entries(auditFilters).forEach(([key, value]) => {
                if (value) searchParams.set(key, value);
            });

            const [empRes, metRes, userRes, auditRes] = await Promise.all([
                apiFetch('/admin/employers'),
                apiFetch('/admin/metrics'),
                apiFetch('/admin/users'),
                apiFetch(`/admin/audit-logs?${searchParams.toString()}`)
            ]);

            setEmployers(await empRes.json());
            setMetrics(await metRes.json());
            setUsers(await userRes.json());
            const auditPayload = await auditRes.json();
            setAuditLogs(auditPayload.items || []);
            setAuditMeta({ total: auditPayload.total || 0, limit: auditPayload.limit || 50, offset: auditPayload.offset || 0 });
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'ADMIN') fetchData();
    }, [user, auditMeta.offset, auditFilters]);

    const handleExport = async () => {
        const searchParams = new URLSearchParams({
            limit: '1000'
        });
        Object.entries(auditFilters).forEach(([key, value]) => {
            if (value) searchParams.set(key, value);
        });
        const res = await apiFetch(`/admin/audit-logs/export?${searchParams.toString()}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit-logs.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    const handlePurge = async () => {
        if (!confirm(`Delete audit logs older than ${purgeDays} days?`)) return;
        await apiFetch('/admin/audit-logs/purge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: Number(purgeDays) })
        });
        setAuditMeta((m) => ({ ...m, offset: 0 }));
        fetchData();
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await apiFetch(`/admin/employers/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
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
    if (!user || user.role !== 'ADMIN') return <Navigate to="/" />;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-bold text-gray-900">WorkBridge Portal</h1>
                        <div className="flex space-x-1">
                            {['metrics', 'employers', 'users', 'audit'].map((tab) => (
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

                {activeTab === 'audit' && (
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-6 gap-3 text-sm">
                            <div className="flex gap-2 md:col-span-6">
                                <button
                                    onClick={() => setAuditFilters({ userId: '', action: '', method: '', path: '', statusCode: '', minStatus: '400', maxStatus: '', from: '', to: '' })}
                                    className="px-3 py-2 border rounded"
                                >
                                    Errors (>=400)
                                </button>
                                <button
                                    onClick={() => setAuditFilters({ userId: '', action: '', method: '', path: '/admin', statusCode: '', minStatus: '', maxStatus: '', from: '', to: '' })}
                                    className="px-3 py-2 border rounded"
                                >
                                    Admin Only
                                </button>
                                <button
                                    onClick={() => setAuditFilters({ userId: '', action: '', method: '', path: '', statusCode: '', minStatus: '', maxStatus: '', from: '', to: '' })}
                                    className="px-3 py-2 border rounded"
                                >
                                    All
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="px-3 py-2 border rounded"
                                >
                                    Export CSV
                                </button>
                                <div className="ml-auto flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="border rounded px-2 py-1 w-24"
                                        value={purgeDays}
                                        onChange={(e) => setPurgeDays(e.target.value)}
                                        min={1}
                                        max={3650}
                                    />
                                    <button
                                        onClick={handlePurge}
                                        className="px-3 py-2 border rounded"
                                    >
                                        Purge
                                    </button>
                                </div>
                            </div>
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="User ID"
                                value={auditFilters.userId}
                                onChange={(e) => setAuditFilters({ ...auditFilters, userId: e.target.value })}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Action"
                                value={auditFilters.action}
                                onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Method"
                                value={auditFilters.method}
                                onChange={(e) => setAuditFilters({ ...auditFilters, method: e.target.value })}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Path"
                                value={auditFilters.path}
                                onChange={(e) => setAuditFilters({ ...auditFilters, path: e.target.value })}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Status"
                                value={auditFilters.statusCode}
                                onChange={(e) => setAuditFilters({ ...auditFilters, statusCode: e.target.value })}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Min Status"
                                value={auditFilters.minStatus}
                                onChange={(e) => setAuditFilters({ ...auditFilters, minStatus: e.target.value })}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Max Status"
                                value={auditFilters.maxStatus}
                                onChange={(e) => setAuditFilters({ ...auditFilters, maxStatus: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAuditMeta((m) => ({ ...m, offset: 0 }))}
                                    className="px-3 py-2 border rounded"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => setAuditFilters({ userId: '', action: '', method: '', path: '', statusCode: '', minStatus: '', maxStatus: '', from: '', to: '' })}
                                    className="px-3 py-2 border rounded"
                                >
                                    Clear
                                </button>
                            </div>
                            <input
                                type="datetime-local"
                                className="border rounded px-3 py-2"
                                value={auditFilters.from}
                                onChange={(e) => setAuditFilters({ ...auditFilters, from: e.target.value })}
                            />
                            <input
                                type="datetime-local"
                                className="border rounded px-3 py-2"
                                value={auditFilters.to}
                                onChange={(e) => setAuditFilters({ ...auditFilters, to: e.target.value })}
                            />
                        </div>
                        <Table
                            headers={['Time', 'User', 'Action', 'Path', 'Status', 'IP']}
                            data={auditLogs}
                            renderRow={(log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-medium">{log.user?.email || 'ANONYMOUS'}</div>
                                        <div className="text-xs text-gray-500">{log.user?.role || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">{log.action}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{log.path}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.statusCode >= 400 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {log.statusCode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{log.ip || '-'}</td>
                                </tr>
                            )}
                        />
                        <div className="flex justify-between items-center px-6 py-4 border-t text-sm text-gray-500">
                            <span>Total: {auditMeta.total}</span>
                            <div className="space-x-2">
                                <button
                                    onClick={() => setAuditMeta((m) => ({ ...m, offset: Math.max(m.offset - m.limit, 0) }))}
                                    disabled={auditMeta.offset === 0}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setAuditMeta((m) => ({ ...m, offset: m.offset + m.limit }))}
                                    disabled={auditMeta.offset + auditMeta.limit >= auditMeta.total}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
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
