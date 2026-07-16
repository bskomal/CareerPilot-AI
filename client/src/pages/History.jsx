import React, { useState, useEffect } from 'react';
import { getHistory, clearHistory } from '../lib/history';
import { aggregateRecurringGaps } from '../lib/skills';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { History, Activity, AlertTriangle, Calendar, Trash2, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function HistoryPage({ setActiveTab, setJobDescriptionToReRun }) {
    const [historyList, setHistoryList] = useState([]);
    const [recurringGaps, setRecurringGaps] = useState([]);

    const loadHistoryData = () => {
        const stored = getHistory();
        setHistoryList(stored);
        setRecurringGaps(aggregateRecurringGaps(stored));
    };

    useEffect(() => {
        loadHistoryData();
    }, []);

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear all match history?')) {
            clearHistory();
            loadHistoryData();
        }
    };

    const handleReRun = (item) => {
        if (setJobDescriptionToReRun) {
            setJobDescriptionToReRun(item.jobSnippet);
        }
        setActiveTab('match');
    };

    // Format data for trends area chart
    const getChartData = () => {
        return historyList
            .slice()
            .reverse()
            .map((item, idx) => ({
                index: idx + 1,
                match: item.matchPercentage,
                date: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }));
    };

    if (historyList.length === 0) {
        return (
            <div className="space-y-8 text-left">
                <div className="border-b border-slate-900 pb-4">
                    <h2 className="text-3xl font-extrabold text-white">History & Trends</h2>
                    <p className="text-sm text-slate-400 mt-1">Review historical compatibility analytics.</p>
                </div>
                <EmptyState
                    title="No Match History"
                    description="You haven't matched any job descriptions against your profile yet. Once calculated, your history and trends will appear here."
                    icon={History}
                    actionLabel="Match a Job Now"
                    onAction={() => setActiveTab('match')}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 text-left select-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white">History & Trends</h2>
                    <p className="text-sm text-slate-400 mt-1">Review historical compatibility analytics.</p>
                </div>
                <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/40 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-xs font-semibold rounded-lg transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                </button>
            </div>

            {/* Charts & Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Area Chart Trends */}
                <GlassCard className="md:col-span-2 flex flex-col justify-between" glow>
                    <div className="space-y-1 mb-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            <span>Compatibility Trend Line</span>
                        </h4>
                        <p className="text-xs text-slate-500">Fluctuation of match percentages across past calculations.</p>
                    </div>

                    <div className="w-full h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="matchColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8, color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Area type="monotone" dataKey="match" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#matchColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Top Recurring Gaps */}
                <GlassCard className="flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span>Top Recurring Skill Gaps</span>
                        </h4>
                        <p className="text-xs text-slate-500">Compounded missing competencies detected across jobs.</p>
                    </div>

                    {recurringGaps.length > 0 ? (
                        <div className="space-y-3 flex-1 pt-2">
                            {recurringGaps.map((gap, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-xl">
                                    <span className="text-xs font-semibold text-slate-200 capitalize truncate pr-4">{gap.skill}</span>
                                    <Badge variant="amber" className="shrink-0 font-mono text-[9px]">
                                        Missed in {gap.count} {gap.count === 1 ? 'job' : 'jobs'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 flex-1">
                            <Sparkles className="w-8 h-8 text-emerald-400" />
                            <p className="text-xs font-semibold text-emerald-400">Roadmap Clear!</p>
                            <p className="text-[10px] text-slate-500">No recurring gaps detected in matched history.</p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Complete History logs */}
            <div className="space-y-4">
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-400" />
                    <span>Chronological Logs ({historyList.length})</span>
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {historyList.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between hover:border-slate-700/80 transition-all gap-4"
                            >
                                <div className="space-y-1.5 text-left flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="slate" className="font-semibold flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                        </Badge>
                                        <Badge variant={
                                            item.matchPercentage >= 75 
                                                ? 'emerald' 
                                                : item.matchPercentage >= 50 
                                                    ? 'amber' 
                                                    : 'rose'
                                        }>
                                            {item.overallScore}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-200 truncate">
                                        Role Target: {item.jobSnippet || 'Unknown Target Job'}
                                    </p>
                                    {item.missingSkills && item.missingSkills.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                                            <span>Gaps:</span>
                                            <span className="text-slate-400 font-medium capitalize truncate">
                                                {item.missingSkills.slice(0, 3).join(', ')}
                                                {item.missingSkills.length > 3 ? '...' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 justify-between md:justify-end border-t border-slate-900 md:border-none pt-3 md:pt-0 shrink-0">
                                    <div className="text-left md:text-right">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                            Score
                                        </span>
                                        <span className="text-lg font-extrabold text-indigo-400">
                                            {item.matchPercentage}%
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleReRun(item)}
                                        className="p-2.5 rounded-xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all flex items-center justify-center"
                                        title="Re-run matching analysis"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
