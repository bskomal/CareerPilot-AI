import React from 'react';
import { LayoutDashboard, FileText, Compass, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({ activeTab, setActiveTab, username, onLogout }) {
    const menuItems = [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard },
        { id: 'match', name: 'Resume Match', icon: FileText },
        { id: 'career', name: 'Career Growth', icon: Compass }
    ];

    return (
        <aside className="w-64 bg-slate-900/40 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 no-print select-none">
            <div>
                {/* Header logo */}
                <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 font-bold">
                        CP
                    </div>
                    <span className="font-bold text-lg text-white">CareerPilot AI</span>
                </div>

                {/* Navigation items */}
                <nav className="p-4 space-y-1.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/20 rounded-xl"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                                <span className="relative z-10">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Profile footer section */}
            <div className="p-4 border-t border-slate-800/50 space-y-3">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-slate-300">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-sm font-semibold text-slate-200 truncate">{username || 'User'}</span>
                        <span className="text-xs text-slate-500 truncate">Candidate</span>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-950/40 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-sm font-medium rounded-lg transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
}
