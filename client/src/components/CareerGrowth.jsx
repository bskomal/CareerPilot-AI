import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, Cell, XAxis, YAxis } from 'recharts';
import { Compass, Sparkles, AlertTriangle, Layers, Calendar, BookOpen, Clock, CheckCircle, Heart, ArrowRight } from 'lucide-react';
import { ResultsContext } from '../context/ResultsContext';
import GlassCard from './ui/GlassCard';
import StatRing from './ui/StatRing';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import AnimatedCounter from './ui/AnimatedCounter';
import TransitionAccelerationRing from './ui/TransitionAccelerationRing';
import PrioritySkillList from './ui/PrioritySkillList';
import Skeleton, { SkeletonRadarChart, SkeletonMetricCard, SkeletonTable } from './ui/Skeleton';

export default function CareerGrowth({ setActiveTab }) {
    const { match } = useContext(ResultsContext);

    // If no target job comparison exists in context, show Empty State.
    if (!match) {
        return (
            <div className="w-full space-y-6 text-left select-none relative z-10">
                <div className="border-b border-slate-900/60 pb-4">
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">Career Path & Transition</h3>
                    <p className="text-sm text-slate-400 mt-1">Predict growth trajectories and alternative role options.</p>
                </div>
                
                <EmptyState
                    title="No Data Available Yet"
                    description="To generate your personalized transition ring, competency radar chart, and priority skill gaps, please run a comparison against a target job description in the Match Center first."
                    icon={Compass}
                    actionLabel="Go to Match Center"
                    onAction={() => setActiveTab('match')}
                />
            </div>
        );
    }

    const getBarChartData = () => {
        if (!match.recommendations) return [];
        return match.recommendations.map(rec => ({
            skill: rec.skill,
            weeks: rec.estimatedWeeks || Math.floor(Math.random() * 3) + 2,
            priority: rec.priority || 'Medium'
        }));
    };

    return (
        <div className="w-full space-y-6 text-left select-none relative z-10">
            {/* Header section */}
            <div className="flex items-center justify-between no-print border-b border-slate-900/60 pb-4">
                <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">Career Path & Transition</h3>
                    <p className="text-sm text-slate-400 mt-1">Predict growth trajectories and alternative role options.</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
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

                    {/* Card 2: Market Adjusted Readiness Card */}
                    <GlassCard className="flex flex-col justify-between text-left h-full">
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Readiness</h4>
                            <div className="pt-2">
                                <div className="text-5xl font-semibold text-gradient flex items-baseline">
                                    <AnimatedCounter value={match.stackMaturityBreakdown?.marketAdjustedReadiness || match.stackMaturity?.marketAdjustedReadiness || 0} decimals={1} />
                                    <span className="text-2xl font-bold text-indigo-400 ml-0.5">%</span>
                                </div>
                                <span className="text-[10px] text-slate-500 block mt-1.5 leading-normal font-normal">
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

                    {/* Card 3: Transition Acceleration Ring */}
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
                    {/* Skills Competency Radar Chart */}
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
                                            <radialGradient id="career-growth-radar" cx="50%" cy="50%" r="50%">
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
                                            fill="url(#career-growth-radar)" 
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

                    {/* Effort Bar Chart */}
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
                                                let color = '#6366f1'; 
                                                if (entry.priority === 'High') color = '#f43f5e'; 
                                                else if (entry.priority === 'Medium') color = '#f59e0b'; 
                                                return <Cell key={`cell-${index}`} fill={color} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                    <p className="text-xs font-bold text-emerald-400">Complete Calibration Satisfied</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Priority Skill Gaps */}
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
            </motion.div>
        </div>
    );
}
