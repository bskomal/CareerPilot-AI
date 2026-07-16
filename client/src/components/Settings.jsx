import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Sun, Moon, User, Shield, Key, LogOut } from 'lucide-react';
import GlassCard from './ui/GlassCard';

export default function Settings() {
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

    return (
        <div className="space-y-8 text-left max-w-3xl select-none">
            {/* Header */}
            <div className="border-b border-slate-900 pb-4">
                <h2 className="text-3xl font-extrabold text-white">System Settings</h2>
                <p className="text-sm text-slate-400 mt-1">Configure workspace styles and review credentials.</p>
            </div>

            {/* Profile Credentials card */}
            <GlassCard className="space-y-4">
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-400" />
                    <span>Account Credentials</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-900 pt-4 text-sm">
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                            Full Name
                        </span>
                        <span className="text-slate-200 font-bold block mt-0.5">
                            {user?.name || 'Candidate User'}
                        </span>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                            Email Address
                        </span>
                        <span className="text-slate-200 font-bold block mt-0.5">
                            {user?.email || 'user@example.com'}
                        </span>
                    </div>
                </div>
            </GlassCard>

            {/* Theme & Display styles */}
            <GlassCard className="space-y-4">
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sun className="w-5 h-5 text-indigo-400" />
                    <span>Workspace Display</span>
                </h3>

                <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                    <div className="space-y-1 pr-6 flex-1">
                        <span className="text-sm font-bold text-slate-200 block">
                            Color Palette Mode
                        </span>
                        <span className="text-xs text-slate-500 leading-normal block">
                            Toggle between a sleek Dark professional workspace theme or standard Light styling.
                        </span>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/20 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-4 h-4 text-indigo-400" />
                                <span>Switch to Light</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4 text-indigo-400" />
                                <span>Switch to Dark</span>
                            </>
                        )}
                    </button>
                </div>
            </GlassCard>

            {/* Platform Settings */}
            <GlassCard className="space-y-4">
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <span>Security & Session</span>
                </h3>

                <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                    <div className="space-y-1 pr-6">
                        <span className="text-sm font-bold text-slate-200 block">
                            Log Out of Session
                        </span>
                        <span className="text-xs text-slate-500 leading-normal block">
                            Terminate your active JSON Web Token authorization state on this browser window.
                        </span>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-950/40 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-xs font-semibold rounded-xl transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
