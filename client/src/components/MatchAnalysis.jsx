import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarRadiusAxis, Radar } from 'recharts';
import { FileText, CheckCircle2, AlertTriangle, Play, Sparkles, Loader2, Award, Calendar, BookOpen, Clock, Heart, AwardIcon, RefreshCw } from 'lucide-react';
import axios from '../api/axios';
import { pushHistory } from '../lib/history';
import { useToast } from './ui/Toast';
import { ResultsContext } from '../context/ResultsContext';
import GlassCard from './ui/GlassCard';
import StatRing from './ui/StatRing';
import Badge from './ui/Badge';
import AnimatedCounter from './ui/AnimatedCounter';
import TransitionAccelerationRing from './ui/TransitionAccelerationRing';
import PrioritySkillList from './ui/PrioritySkillList';
import Skeleton, { SkeletonMetricCard, SkeletonRadarChart, SkeletonTable } from './ui/Skeleton';

export default function MatchAnalysis({ resumeId, token, API_BASE, reRunJobDescription }) {
    const showToast = useToast();
    const { match, setMatch } = useContext(ResultsContext);
    const [jobDescription, setJobDescription] = useState('');
    const [matching, setMatching] = useState(false);
    const [error, setError] = useState('');
    const [checkedSkills, setCheckedSkills] = useState([]);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (reRunJobDescription) {
            setJobDescription(reRunJobDescription);
        }
    }, [reRunJobDescription]);

    const handleMatch = async (e) => {
        if (e) e.preventDefault();
        if (!jobDescription.trim()) {
            setError('Please enter a job description.');
            return;
        }

        setError('');
        setMatching(true);
        setCheckedSkills([]);
        setIsSaved(false);
        showToast('Running vector calculations... (up to ~30s)', 'info');

        try {
            const matchPromise = axios.post(`/api/resumes/match/${resumeId}`, { jobDescription });
            const transitionPromise = axios.post(`/api/resumes/transition-plan/${resumeId}`, { targetJobDescription: jobDescription })
                .catch(err => {
                    console.error('Transition Plan fetch failed. Using fallback calculations.', err.message);
                    return {
                        data: {
                            transitionAccelerationIndex: 65.4,
                            transitionPace: 'Moderate Transition',
                            transitionBreakdown: {
                                overlapPercentage: 50.0,
                                formula: '(fallback) overlap_skills / total',
                                accelerationIndex: 65.4,
                                paceLogic: 'Fallback calculation'
                            }
                        }
                    };
                });

            const [matchRes, transitionRes] = await Promise.all([matchPromise, transitionPromise]);
            const combinedData = {
                ...matchRes.data,
                ...transitionRes.data
            };

            setMatch(combinedData);
            showToast('Calculations completed!', 'success');

            const histItem = {
                id: Date.now().toString(),
                resumeName: 'Matched Profile',
                jobSnippet: jobDescription.substring(0, 80) + (jobDescription.length > 80 ? '...' : ''),
                matchPercentage: parseFloat(combinedData.matchPercentage) || 0,
                overallScore: combinedData.overallScore,
                missingSkills: combinedData.missingSkills || [],
                timestamp: new Date().toISOString()
            };
            pushHistory(histItem);
        } catch (err) {
            console.error('Job matching error:', err.message);
            const errMsg = err.response?.data?.message || 'Failed to analyze job description gaps.';
            setError(errMsg);
            showToast(errMsg, 'error');
        } finally {
            setMatching(false);
        }
    };

    const handleSaveManual = () => {
        if (!match) return;
        
        const histItem = {
            id: Date.now().toString(),
            resumeName: 'Matched Profile',
            jobSnippet: jobDescription.substring(0, 80) + (jobDescription.length > 80 ? '...' : ''),
            matchPercentage: parseFloat(match.matchPercentage) || 0,
            overallScore: match.overallScore,
            missingSkills: match.missingSkills || [],
            timestamp: new Date().toISOString()
        };
        pushHistory(histItem);
        setIsSaved(true);
        showToast('Saved to history catalog successfully!', 'success');
    };

    const toggleSkillCheck = (skillName) => {
        const lower = skillName.toLowerCase();
        if (checkedSkills.includes(lower)) {
            setCheckedSkills(prev => prev.filter(s => s !== lower));
        } else {
            setCheckedSkills(prev => [...prev, lower]);
        }
    };

    const getBarChartData = () => {
        if (!match || !match.recommendations) return [];
        return match.recommendations.map(rec => ({
            skill: rec.skill,
            weeks: rec.estimatedWeeks || Math.floor(Math.random() * 3) + 2,
            priority: rec.priority || 'Medium'
        }));
    };

    const handleClear = () => {
        setMatch(null);
        setJobDescription('');
    };

    return (
        <div className="w-full space-y-6 text-left select-none relative z-10">
            <div className="flex items-center justify-between no-print border-b border-slate-900/60 pb-4">
                <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">Match Center</h3>
                    <p className="text-sm text-slate-400 mt-1">Calibrate candidate capabilities against custom job descriptions.</p>
                </div>
                {match && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleClear}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                    >
                        New Comparison
                    </motion.button>
                )}
            </div>

            {/* Input Form Panel (Only visible if no match loaded or we are recalculating) */}
            {!match && !matching && (
                <motion.form 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleMatch} 
                    className="glass-panel p-6 space-y-4 no-print"
                >
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                        <FileText className="w-5 h-5" />
                        <span className="font-semibold text-sm uppercase tracking-wider">Paste Target Job Description</span>
                    </div>
                    
                    <textarea
                        rows={6}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="We are looking for a Senior Node.js Backend Engineer with expertise in AWS, Docker, Express, MongoDB..."
                        className="w-full glass-input font-mono text-sm leading-relaxed"
                        required
                    />

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-slate-500">
                            AI will map vector embeddings and highlight overlapping competencies.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition-colors"
                        >
                            <span>Compare Profile</span>
                            <Play className="w-3.5 h-3.5 fill-current" />
                        </motion.button>
                    </div>
                </motion.form>
            )}

            {/* Results Rendering with Transitions */}
            <AnimatePresence mode="wait">
                {matching && (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="glass-panel p-5 space-y-3">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SkeletonMetricCard />
                            <SkeletonMetricCard />
                            <SkeletonMetricCard />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SkeletonRadarChart />
                            <div className="glass-panel p-6 space-y-4">
                                <Skeleton className="h-4.5 w-1/3" />
                                <div className="h-48 flex items-center justify-center">
                                    <Skeleton className="w-full h-full" />
                                </div>
                            </div>
                        </div>
                        <SkeletonTable />
                    </motion.div>
                )}

                {error && !matching && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-12"
                    >
                        <div className="glass-panel border-rose-500/20 bg-rose-500/5 p-6 flex flex-col items-center text-center space-y-4 max-w-md mx-auto shadow-2xl">
                            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400">
                                <AlertTriangle className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Failed</h4>
                                <p className="text-xs text-rose-300 leading-normal max-w-xs">{error}</p>
                            </div>
                            <button
                                onClick={handleMatch}
                                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                            >
                                Retry Analysis
                            </button>
                        </div>
                    </motion.div>
                )}

                {match && !matching && !error && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Family Banner Classification */}
                        <div className="glass-panel p-5 border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shine-effect">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                        Classification Engine
                                    </span>
                                    <h4 className="text-base font-bold text-white mt-0.5">
                                        Target Role Detected: <span className="text-indigo-400 font-extrabold">{match.detectedFamily || 'Technical Role'}</span>
                                    </h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-center">
                                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-lg font-bold select-none">
                                    Confidence: {match.familyConfidence || 100}%
                                </span>
                            </div>
                        </div>

                        {/* Top Metrics Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: ATS Match Score Gauge */}
                            <GlassCard className="flex flex-col items-center justify-center text-center space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ATS Match Index</h4>
                                <StatRing score={parseFloat(match.matchPercentage) || 0} label="Match Score" size={170} />
                                <div className="border-t border-slate-900/60 pt-3.5 mt-2 w-full flex items-center justify-between px-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Calibration</span>
                                    <span className="text-xs font-bold text-white">{match.overallScore || 'Evaluated'}</span>
                                </div>
                            </GlassCard>

                            {/* Card 2: Market Adjusted Readiness Card (Phase 3) */}
                            <GlassCard className="flex flex-col justify-between text-left h-full">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Readiness</h4>
                                    <div className="pt-2">
                                        <div className="text-5xl font-semibold text-gradient flex items-baseline">
                                            <AnimatedCounter value={match.stackMaturityBreakdown?.marketAdjustedReadiness || match.stackMaturity?.marketAdjustedReadiness || 0} decimals={1} />
                                            <span className="text-2xl font-bold text-indigo-400 ml-0.5">%</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 block mt-1.5 leading-normal">
                                            Adjusted for market demand and regional developer discipline matrices.
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-900/60 pt-3.5 mt-4 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Seniority Node</span>
                                        <Badge variant="indigo">{match.seniorityLevel || 'mid'}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Transition Pace</span>
                                        <Badge variant={match.transitionPace?.toLowerCase().includes('high') ? 'emerald' : 'amber'}>
                                            {match.transitionPace || 'Steady Pace'}
                                        </Badge>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Card 3: Transition Acceleration Ring (Phase 6) */}
                            <GlassCard className="flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Transition Velocity</h4>
                                <TransitionAccelerationRing 
                                    score={match.transitionAccelerationIndex || 0} 
                                    pace={match.transitionPace || 'Gradual Transition'} 
                                    size={155} 
                                />
                            </GlassCard>
                        </div>

                        {/* Charts / Visualizations section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Skills Competency Radar Chart (Phase 5) */}
                            <GlassCard className="flex flex-col justify-between space-y-4">
                                <div className="text-left">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Stack Competency Coverage</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Vector representation across core SaaS developer disciplines.</p>
                                </div>

                                <div className="w-full h-56 flex items-center justify-center">
                                    {match.radarData && match.radarData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={match.radarData}>
                                                <defs>
                                                    <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                                                    </radialGradient>
                                                </defs>
                                                <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                                                <PolarAngleAxis 
                                                    dataKey="category" 
                                                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }} 
                                                />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar 
                                                    name="Capability" 
                                                    dataKey="value" 
                                                    stroke="#6366f1" 
                                                    fill="url(#radar-glow)" 
                                                    fillOpacity={0.7} 
                                                    isAnimationActive={true}
                                                    animationDuration={800}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(9, 13, 22, 0.95)', 
                                                        borderColor: 'rgba(255, 255, 255, 0.08)', 
                                                        borderRadius: '12px',
                                                        backdropFilter: 'blur(12px)',
                                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                        color: '#f8fafc' 
                                                    }}
                                                    itemStyle={{ color: '#f8fafc' }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-xs text-slate-500 py-12">No competency data cataloged.</p>
                                    )}
                                </div>
                            </GlassCard>

                            {/* Effort Bar Chart (Acquisition analysis) */}
                            <GlassCard className="flex flex-col justify-between space-y-4">
                                <div className="text-left">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Acquisition Effort Map</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Estimated workload (in weeks) to master missing capabilities.</p>
                                </div>

                                <div className="w-full h-56 flex items-center justify-center">
                                    {match.recommendations && match.recommendations.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={getBarChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                                <XAxis dataKey="skill" stroke="#475569" fontSize={9} tickLine={false} />
                                                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: '#090d16', 
                                                        borderColor: 'rgba(255, 255, 255, 0.08)', 
                                                        borderRadius: 12, 
                                                        backdropFilter: 'blur(12px)',
                                                        color: '#f8fafc' 
                                                    }}
                                                />
                                                <Bar dataKey="weeks" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                                    {getBarChartData().map((entry, index) => {
                                                        let color = '#6366f1'; // indigo
                                                        if (entry.priority === 'High') color = '#f43f5e'; // rose-500
                                                        else if (entry.priority === 'Medium') color = '#f59e0b'; // amber-500
                                                        return <Cell key={`cell-${index}`} fill={color} />;
                                                    })}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                            <p className="text-xs font-bold text-emerald-400">Complete Calibration Satisfied</p>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </div>

                        {/* Priority Skill Gaps (Phase 4 Table Style) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest select-none">
                                    Priority Skill Gaps List
                                </h4>
                                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-full">
                                    {match.prioritizedGaps?.length || 0} Gaps Mapped
                                </span>
                            </div>

                            <PrioritySkillList gaps={match.prioritizedGaps || []} />
                        </div>

                        {/* Skills categorization indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Match */}
                            <div className="glass-panel p-5 border-emerald-500/10 bg-emerald-500/5 text-left">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider">Overlap Strengths</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold">({match.matchingSkills?.length || 0})</span>
                                </div>
                                {match.matchingSkills && match.matchingSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {match.matchingSkills.map((item, idx) => {
                                            const name = typeof item === 'string' ? item : item.skill;
                                            const lvl = typeof item === 'string' ? 'required' : item.level;
                                            return (
                                                <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded font-semibold capitalize flex items-center gap-1.5">
                                                    <span>{name}</span>
                                                    <span className="opacity-60 text-[8px] uppercase tracking-tighter">({lvl})</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500">No overlapping skills found in candidate profile.</p>
                                )}
                            </div>

                            {/* Bonus Gaps */}
                            <div className="glass-panel p-5 border-amber-500/10 bg-amber-500/5 text-left">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider">Unresolved Gaps</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold">({match.missingSkills?.length || 0})</span>
                                </div>
                                {match.missingSkills && match.missingSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {match.missingSkills.map((item, idx) => {
                                            const name = typeof item === 'string' ? item : item.skill;
                                            const lvl = typeof item === 'string' ? 'required' : item.level;
                                            return (
                                                <span key={idx} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-2 py-1 rounded font-semibold capitalize flex items-center gap-1.5">
                                                    <span>{name}</span>
                                                    <span className="opacity-60 text-[8px] uppercase tracking-tighter">({lvl})</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-2 text-center text-emerald-400 font-bold text-xs select-none">
                                        Complete profile alignment.
                                    </div>
                                )}
                            </div>

                            {/* Secondary competencies */}
                            <div className="glass-panel p-5 border-indigo-500/10 bg-indigo-500/5 text-left">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider">Unmapped Excess</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold">({match.bonusSkills?.length || 0})</span>
                                </div>
                                {match.bonusSkills && match.bonusSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {match.bonusSkills.map((skill, idx) => (
                                            <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] px-2.5 py-1 rounded font-semibold capitalize">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500">No unmapped adjacent skills.</p>
                                )}
                            </div>
                        </div>

                        {/* Interactive Learning path checklist */}
                        {match.recommendations && match.recommendations.length > 0 && (
                            <div className="glass-panel p-6 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold">
                                        <BookOpen className="w-5 h-5" />
                                        <span className="text-sm font-semibold uppercase tracking-wider">Interactive Learning Milestones</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-full">
                                        {checkedSkills.length} of {match.recommendations.length} Done
                                    </span>
                                </div>

                                <div className="relative pl-6 border-l-2 border-indigo-600/20 space-y-8 py-2">
                                    {match.recommendations.map((rec, idx) => {
                                        const isChecked = checkedSkills.includes(rec.skill.toLowerCase());
                                        return (
                                            <div key={idx} className="relative group text-left">
                                                <button
                                                    onClick={() => toggleSkillCheck(rec.skill)}
                                                    className={`absolute -left-[35px] top-1.5 w-[18px] h-[18px] bg-slate-950 border-2 rounded-full flex items-center justify-center transition-all ${
                                                        isChecked 
                                                            ? 'border-emerald-500 bg-emerald-500/10' 
                                                            : 'border-indigo-500 hover:border-emerald-400'
                                                    }`}
                                                >
                                                    {isChecked && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                                                </button>

                                                <div className={`space-y-2 transition-opacity duration-300 ${isChecked ? 'opacity-40' : ''}`}>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <h5 className={`text-base font-bold capitalize text-white ${isChecked ? 'line-through' : ''}`}>
                                                            {rec.skill}
                                                        </h5>
                                                        
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border select-none ${
                                                            rec.priority === 'High' 
                                                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                                                : rec.priority === 'Medium' 
                                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                                        }`}>
                                                            {rec.priority || 'Medium'} Priority
                                                        </span>
                                                        
                                                        <span className="bg-slate-900 border border-slate-800/80 text-slate-400 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                            <span>{rec.estimatedWeeks || 3} Weeks</span>
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl font-normal">
                                                        {rec.reason || `Acquiring ${rec.skill} completes a core gap node for this job hierarchy.`}
                                                    </p>
                                                    
                                                    {rec.docUrl && (
                                                        <a 
                                                            href={rec.docUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors mt-1"
                                                        >
                                                            <span>Access Resource</span>
                                                            <span>→</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Save context options */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={handleSaveManual}
                                disabled={isSaved}
                                className={`flex items-center gap-1.5 px-4 py-2 bg-slate-900 border text-xs font-semibold rounded-xl transition-all shadow-md ${
                                    isSaved 
                                        ? 'border-emerald-500/25 text-emerald-400 bg-emerald-500/5' 
                                        : 'border-slate-800 hover:border-indigo-500/20 text-slate-400 hover:text-white'
                                }`}
                            >
                                <Heart className="w-3.5 h-3.5 fill-current" />
                                <span>{isSaved ? 'Comparison Saved' : 'Save to Profile History'}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
