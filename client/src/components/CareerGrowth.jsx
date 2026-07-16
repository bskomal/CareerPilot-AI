import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Compass, Sparkles, Loader2, Award, AlertTriangle, Layers, ArrowRight, Printer, CheckCircle } from 'lucide-react';
import axios from '../api/axios';
import { useToast } from './ui/Toast';
import { ResultsContext } from '../context/ResultsContext';
import Skeleton, { SkeletonRadarChart } from './ui/Skeleton';

export default function CareerGrowth({ resumeId }) {
    const showToast = useToast();
    const { career, setCareer } = useContext(ResultsContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchCareerPredictions = async () => {
        // If predictions are already calculated and saved in the context results, skip loading.
        if (career) return;

        setLoading(true);
        setError('');
        showToast('Running transition maps on AI... (up to ~30s)', 'info');
        try {
            const res = await axios.post(`/api/resumes/career-path/${resumeId}`);
            setCareer(res.data);
            showToast('Career path predictions calculated!', 'success');
        } catch (err) {
            console.error('Career predictions error:', err.message);
            const errMsg = err.response?.data?.message || 'Failed to predict career path transition horizons.';
            setError(errMsg);
            showToast(errMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (resumeId) {
            fetchCareerPredictions();
        }
    }, [resumeId]);

    const getRadarData = () => {
        if (!career || !career.clusterBreakdown) return [];
        return career.clusterBreakdown.map(item => ({
            subject: item.cluster,
            score: typeof item.score === 'string' ? parseFloat(item.score.replace('%', '')) : item.score,
            fullMark: 100
        }));
    };

    const renderStrengthBar = (probString) => {
        const percent = parseFloat(probString.replace('%', '')) || 0;
        
        return (
            <div className="flex items-center gap-2 font-mono select-none">
                <div className="w-24 bg-slate-950/40 border border-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                        style={{ width: `${percent}%` }}
                        className="bg-indigo-500 h-full rounded-full"
                    />
                </div>
                <span className="text-slate-200 font-semibold text-xs ml-1">{probString}</span>
            </div>
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleRecalculate = async () => {
        setLoading(true);
        setError('');
        showToast('Running transition maps on AI... (up to ~30s)', 'info');
        try {
            const res = await axios.post(`/api/resumes/career-path/${resumeId}`);
            setCareer(res.data);
            showToast('Career path predictions calculated!', 'success');
        } catch (err) {
            console.error('Career predictions error:', err.message);
            const errMsg = err.response?.data?.message || 'Failed to predict career path transition horizons.';
            setError(errMsg);
            showToast(errMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6 text-left select-none relative z-10">
            <div className="flex items-center justify-between no-print border-b border-slate-900/60 pb-4">
                <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">Career Path Predictor</h3>
                    <p className="text-sm text-slate-400 mt-1">Predict growth trajectories and alternative role options.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRecalculate}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                        Recalculate Path
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!career || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print Report</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SkeletonRadarChart />
                            <div className="md:col-span-2 glass-panel p-6 space-y-4">
                                <Skeleton className="h-4.5 w-1/4" />
                                <Skeleton className="h-8 w-2/3" />
                                <Skeleton className="h-20 w-full" />
                                <div className="grid grid-cols-2 gap-4 border-t border-slate-900/60 pt-4 mt-6">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-4.5 w-1/4" />
                            <div className="glass-panel p-6 space-y-3">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {error && !loading && (
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
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Mapping Error</h4>
                                <p className="text-xs text-rose-300 leading-normal max-w-xs">{error}</p>
                            </div>
                            <button
                                onClick={fetchCareerPredictions}
                                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                            >
                                Retry Predictions
                            </button>
                        </div>
                    </motion.div>
                )}

                {career && !loading && !error && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 180, damping: 20 }}
                        className="space-y-6"
                    >
                        {/* Summary section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-400" />
                                    <span>Career Cluster Map</span>
                                </h4>
                                <div className="w-full h-56 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                                            <defs>
                                                <radialGradient id="career-radar-glow" cx="50%" cy="50%" r="50%">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                                                </radialGradient>
                                            </defs>
                                            <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                                            <PolarAngleAxis 
                                                dataKey="subject" 
                                                tick={{ fill: '#94a3b8', fontSize: 8.5, fontWeight: 500 }} 
                                            />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar 
                                                name="Profile Cluster Match" 
                                                dataKey="score" 
                                                stroke="#6366f1" 
                                                fill="url(#career-radar-glow)" 
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
                                </div>
                            </div>

                            <div className="glass-panel p-6 md:col-span-2 flex flex-col justify-between print-text">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Compass className="w-5 h-5 text-indigo-400" />
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Trajectory Analysis Summary</span>
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-white pt-2">
                                        Top Alignment: {career.topCareerMatch}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-normal">
                                        {career.careerSummary}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-slate-900/60 pt-4 mt-6">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                            Dominant Cluster
                                        </span>
                                        <span className="text-sm font-bold text-white mt-0.5 block truncate">
                                            {career.dominantCluster}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                            Match Scope
                                        </span>
                                        <span className="text-sm font-bold text-white mt-0.5 block truncate">
                                            16 Tech Disciplines
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Recommended transition paths */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                <span>Recommended Transition Paths</span>
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-6">
                                {career.recommendedRoles.map((roleInfo, index) => (
                                    <div key={index} className="glass-panel p-6 border-l-4 border-l-indigo-600 space-y-4 flex flex-col justify-between hover:border-slate-800/80 transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900/60 pb-4">
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="text-lg font-bold text-white">{roleInfo.role}</h5>
                                                    <span className="bg-slate-900 border border-slate-800/80 text-[9px] font-bold text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {roleInfo.cluster}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{roleInfo.reason}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-left md:text-right">
                                                    Transition likelihood
                                                </span>
                                                {renderStrengthBar(roleInfo.transitionProbability)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 text-left">
                                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Skills Possessed ({roleInfo.matchingSkills.length})</span>
                                                </span>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {roleInfo.matchingSkills.map((s, i) => (
                                                        <span key={i} className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-md font-medium capitalize">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-left">
                                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>Missing Skill Gaps ({roleInfo.missingSkills.length})</span>
                                                </span>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {roleInfo.missingSkills.map((s, i) => (
                                                        <span key={i} className="bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-md font-medium capitalize">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {roleInfo.nextSteps && roleInfo.nextSteps.length > 0 && (
                                            <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 mt-2">
                                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2 text-left">
                                                    Transition Milestones
                                                </span>
                                                <div className="flex flex-col md:flex-row gap-3">
                                                    {roleInfo.nextSteps.map((step, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 border border-slate-800/80 px-3 py-2 rounded-lg font-medium">
                                                            <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                            <span>{step}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Adjacent roles grid */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 pt-2">
                                <Compass className="w-5 h-5 text-indigo-400" />
                                <span>Adjacent Career Horizons</span>
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {career.adjacentRoles.map((role, idx) => (
                                    <div key={idx} className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-slate-800/85 transition-all">
                                        <div className="space-y-1 text-left">
                                            <h5 className="font-bold text-white text-base">{role.role}</h5>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                                {role.cluster}
                                            </span>
                                            <p className="text-xs text-slate-400 leading-normal pt-2 font-normal">{role.reason}</p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-900/60 pt-3">
                                            <span className="text-[11px] text-slate-500">Transition Likelihood</span>
                                            <span className="text-xs font-mono font-bold text-indigo-400">
                                                {role.transitionProbability}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
