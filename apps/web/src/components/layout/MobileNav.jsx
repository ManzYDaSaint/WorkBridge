import React from 'react';
import { Briefcase, User, Bell, LogOut } from 'lucide-react';

const MobileNav = ({ activeTab, onTabChange, unreadNotifications, onLogout }) => {
    const tabs = [
        { id: 'jobs', label: 'Board', icon: Briefcase },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotifications },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative flex flex-col items-center space-y-1 transition-all ${isActive ? 'text-blue-600' : 'text-gray-400'
                            }`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                            {tab.label}
                        </span>
                        {tab.badge > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}

            <button
                onClick={onLogout}
                className="flex flex-col items-center space-y-1 text-gray-400"
            >
                <div className="p-2">
                    <LogOut size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    Exit
                </span>
            </button>
        </div>
    );
};

export default MobileNav;
