import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FileText, Compass, History, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppShell({ activeTab, setActiveTab, children }) {
    const { user, logout } = useContext(AuthContext);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard },
        { id: 'studio', name: 'Resume Studio', icon: FileText },
        { id: 'match', name: 'Job Match', icon: FileText },
        { id: 'career', name: 'Career Growth', icon: Compass },
        { id: 'history', name: 'History & Trends', icon: History },
        { id: 'settings', name: 'Settings', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200 flex flex-col md:flex-row relative overflow-hidden">
            {/* Layer 1: Animated Noise overlay */}
            <div className="noise-overlay" />

            {/* Layer 2: Drifting Blurred Gradient Orb */}
            <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none drift-orb z-0" />

            {/* Sidebar (Desktop layout) */}
            <aside className="hidden md:flex md:w-64 bg-slate-900/40 backdrop-blur-md border-r border-slate-800/80 flex-col justify-between h-screen fixed left-0 top-0 z-30 no-print select-none">
                <div>
                    <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 font-bold shrink-0">
                            CP
                        </div>
                        <span className="font-bold text-lg text-white">CareerPilot AI</span>
                    </div>

                    <nav className="p-4 space-y-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                                        isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav-glow"
                                            className="absolute inset-0 bg-indigo-600/15 border border-indigo-500/25 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.08)]"
                                            transition={{ type: "spring", stiffness: 180, damping: 20 }}
                                        />
                                    )}
                                    <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                                    <span className="relative z-10 text-left">{tab.name}</span>
                                </motion.button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-800/50 space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs text-slate-500">Theme Toggle</span>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-950/40 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-sm font-medium rounded-lg transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Bottom Nav Bar (Mobile layout) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-900 flex justify-around py-2.5 px-4 no-print select-none">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{tab.name.split(' ')[0]}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Main Workspace window */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-8 relative z-10">
                <header className="h-16 border-b border-slate-900/60 flex items-center justify-between px-6 md:px-8 select-none no-print">
                    <span className="text-sm font-bold text-slate-500 capitalize md:hidden">
                        Tab: <span className="text-white capitalize">{activeTab}</span>
                    </span>
                    <div className="flex items-center gap-4 ml-auto">
                        <span className="text-xs font-semibold text-slate-400">
                            User: <span className="text-slate-200 font-bold">{user?.name || 'Recruiter User'}</span>
                        </span>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
