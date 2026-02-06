import React, { useEffect, useState } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const NotificationDropdown = ({ isMobile = false }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = async () => {
        try {
            const res = await apiFetch('/notifications');
            const data = await res.json();
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read`, {
                method: 'PATCH',
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="text-green-500" size={18} />;
            case 'WARNING': return <AlertTriangle className="text-yellow-500" size={18} />;
            case 'ERROR': return <XCircle className="text-red-500" size={18} />;
            default: return <Info className="text-blue-500" size={18} />;
        }
    };

    const NotificationList = () => (
        <div className={`${!isMobile && 'max-h-96 overflow-y-auto'}`}>
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No notifications yet.</div>
            ) : (
                notifications.map((n) => (
                    <div
                        key={n.id}
                        onClick={() => !n.isRead && markAsRead(n.id)}
                        className={`p-4 border-b last:border-0 cursor-pointer flex items-start space-x-3 transition ${n.isRead ? 'opacity-60' : 'bg-blue-50 bg-opacity-30'}`}
                    >
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1">
                            <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'font-bold text-gray-900'}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                    </div>
                ))
            )}
        </div>
    );

    if (isMobile) return <NotificationList />;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <span className="font-bold text-gray-800">Notifications</span>
                        <span className="text-xs text-gray-400">{unreadCount} unread</span>
                    </div>
                    <NotificationList />
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
