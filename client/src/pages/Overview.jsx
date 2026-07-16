import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ResultsContext } from '../context/ResultsContext';
import { computeATSScore, categorizeSkills } from '../lib/skills';
import { getHistory } from '../lib/history';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, Upload, Activity, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import StatRing from '../components/ui/StatRing';
import EmptyState from '../components/ui/EmptyState';

export default function Overview({ setActiveTab, setJobDescriptionToReRun }) {
    const { user } = useContext(AuthContext);
    const { resume } = useContext(ResultsContext);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        const list = getHistory();
        setRecentActivities(list.slice(0, 3));
    }, [resume]);

    if (!resume) {
        return (
            <div className="space-y-8 text-left">
                <div className="border-b border-slate-900 pb-4">
                    <h2 className="text-3xl font-extrabold text-white">Overview Dashboard</h2>
                    <p className="text-sm text-slate-400 mt-1">Real-time profile statistics and career milestones.</p>
                </div>
                <EmptyState
                    title="Initialize Your Dashboard"
                    description="Upload your candidate profile resume in the Resume Studio to calculate ATS metrics, map core skills, and predict transitions."
                    icon={Upload}
                    actionLabel="Go to Resume Studio"
                    onAction={() => setActiveTab('studio')}
                />
            </div>
        );
    }

    const atsScore = computeATSScore(resume);
    const categorized = categorizeSkills(resume.extracted_skills || []);
    const pieData = Object.entries(categorized)
        .map(([name, list]) => ({ name, value: list.length }))
        .filter(item => item.value > 0);

    const COLORS = {
        "Frontend": "#6366f1", // indigo
        "Backend": "#10b981", // emerald
        "DevOps": "#f59e0b", // amber
        "Data & AI": "#3b82f6", // blue
        "Tools & Agile": "#64748b" // slate
    };

    const handleReRun = (activity) => {
        if (setJobDescriptionToReRun) {
            setJobDescriptionToReRun(activity.jobSnippet);
        }
        setActiveTab('match');
    };

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: "spring", stiffness: 180, damping: 20 }
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 text-left select-none"
        >
            {/* Header section */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900/60 pb-4"
            >
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        Welcome Back, {user?.name || resume.extracted_name || 'Candidate'}!
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Here is a summary of your ATS health and career path predictions.</p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/80 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active Profile Load</span>
                </div>
            </motion.div>

            {/* Metrics cards grid */}
            <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {/* ATS health gauge */}
                <GlassCard className="flex flex-col items-center justify-center text-center space-y-3" glow>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ATS Profile Health</h4>
                    <StatRing score={atsScore} label="ATS Score" size={170} />
                    <p className="text-[11px] text-slate-400 leading-normal max-w-[200px] mt-2">
                        Computed based on parsing data points, core skills, and embedding structures.
                    </p>
                </GlassCard>

                {/* Donut Chart skill categories */}
                <GlassCard className="flex flex-col items-center justify-center text-center space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Skill Distribution</h4>
                    {pieData.length > 0 ? (
                        <div className="w-full h-44 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="rgba(15,23,42,0.8)"
                                        strokeWidth={2}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#6366f1'} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#090d16', 
                                            borderColor: 'rgba(255, 255, 255, 0.08)', 
                                            borderRadius: 12, 
                                            backdropFilter: 'blur(12px)',
                                            color: '#f8fafc' 
                                        }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 py-12">No categorized skills found.</p>
                    )}
                    
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2">
                        {pieData.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                <div style={{ backgroundColor: COLORS[d.name] }} className="w-2 h-2 rounded-full shrink-0" />
                                <span>{d.name} ({d.value})</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Quick actions panel */}
                <GlassCard className="flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Actions</h4>
                        <p className="text-xs text-slate-400 leading-normal">Jump directly to matching requirements or testing career horizons.</p>
                    </div>

                    <div className="space-y-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab('match')}
                            className="w-full flex items-center justify-between p-3 bg-slate-950/40 hover:bg-indigo-600/10 border border-slate-900 hover:border-indigo-500/20 text-slate-200 hover:text-white rounded-xl transition-all text-xs font-semibold"
                        >
                            <span>Match a Job Description</span>
                            <ArrowRight className="w-4 h-4 text-indigo-400" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab('career')}
                            className="w-full flex items-center justify-between p-3 bg-slate-950/40 hover:bg-indigo-600/10 border border-slate-900 hover:border-indigo-500/20 text-slate-200 hover:text-white rounded-xl transition-all text-xs font-semibold"
                        >
                            <span>Predict Transition Paths</span>
                            <ArrowRight className="w-4 h-4 text-indigo-400" />
                        </motion.button>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Recent activity log */}
            <motion.div 
                variants={itemVariants}
                className="space-y-4"
            >
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 select-none">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <span>Recent Matching Logs</span>
                </h3>

                {recentActivities.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {recentActivities.map((act) => (
                            <div key={act.id} className="glass-panel p-4 flex items-center justify-between hover:border-slate-700/80 transition-all select-none">
                                <div className="space-y-1 pr-6 flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full select-none">
                                            {new Date(act.timestamp).toLocaleDateString()}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border select-none ${
                                            act.matchPercentage >= 75
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : act.matchPercentage >= 50
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                            {act.overallScore}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-200 truncate mt-1">
                                        Role Target: {act.jobSnippet || 'Unknown Target Job'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 select-none">
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                            Match
                                        </span>
                                        <span className="text-base font-extrabold text-indigo-400">
                                            {act.matchPercentage}%
                                        </span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleReRun(act)}
                                        className="p-2 rounded-lg bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all"
                                        title="Re-run matching analysis"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                    </motion.button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel p-6 text-center select-none">
                        <p className="text-slate-500 text-xs">No matching history found. Run a job comparison to see logs here.</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
