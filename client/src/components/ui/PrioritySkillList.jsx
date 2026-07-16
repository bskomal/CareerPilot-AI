import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from './Badge';

export default function PrioritySkillList({ gaps = [] }) {
    const [expandedSkill, setExpandedSkill] = useState(null);

    const toggleExpand = (skillName) => {
        setExpandedSkill(prev => (prev === skillName ? null : skillName));
    };

    if (!gaps || gaps.length === 0) {
        return (
            <div className="glass-panel p-6 text-center text-slate-500 text-xs">
                No priority skill gaps found.
            </div>
        );
    }

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const rowVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 180, damping: 20 }
        }
    };

    const getTrendIcon = (trend) => {
        const tr = trend?.toLowerCase().trim();
        if (tr === 'up' || tr === 'growing') {
            return <TrendingUp className="w-4 h-4 text-emerald-400" />;
        } else if (tr === 'down' || tr === 'falling') {
            return <TrendingDown className="w-4 h-4 text-rose-400" />;
        } else {
            return <Minus className="w-4 h-4 text-amber-400" />;
        }
    };

    const getBadgeVariant = (category) => {
        const cat = category?.toLowerCase().trim();
        if (cat === 'devops') return 'rose';
        if (cat === 'cloud') return 'indigo';
        if (cat === 'frameworks') return 'emerald';
        if (cat === 'languages') return 'amber';
        return 'slate';
    };

    return (
        <div className="w-full space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none border-b border-slate-900/60">
                <div>Skill Requirement</div>
                <div className="text-center">Priority Index</div>
                <div className="text-right">Score & Trend</div>
                <div></div>
            </div>

            {/* Table Rows (With staggered scroll reveal) */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-2.5"
            >
                {gaps.map((item) => {
                    const isExpanded = expandedSkill === item.skill;
                    const score = item.priorityScore || 0;
                    
                    // Cap score for safe representation
                    const progressPercent = Math.min(100, Math.max(0, score));

                    return (
                        <motion.div
                            key={item.skill}
                            variants={rowVariants}
                            className={`glass-panel border-white/5 hover:bg-white/5 hover:border-white/10 transition-colors duration-200 overflow-hidden ${
                                isExpanded ? 'bg-slate-900/60 border-slate-700/50' : 'bg-slate-900/30'
                            }`}
                        >
                            {/* Main row layout */}
                            <div
                                onClick={() => toggleExpand(item.skill)}
                                className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-4 py-4 items-center cursor-pointer select-none"
                            >
                                {/* Left column: Name & category */}
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold text-white text-sm capitalize">{item.skill}</span>
                                    <Badge variant={getBadgeVariant(item.category)}>
                                        {item.category || 'Core Skill'}
                                    </Badge>
                                </div>

                                {/* Middle column: Progress bar */}
                                <div className="flex items-center justify-center">
                                    <div className="w-full max-w-[120px] bg-slate-950/40 rounded-full h-2 overflow-hidden border border-slate-900">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${progressPercent}%` }}
                                            transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.1 }}
                                            className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-full rounded-full"
                                        />
                                    </div>
                                </div>

                                {/* Right column: Score & Trend */}
                                <div className="flex items-center justify-end gap-2.5">
                                    <span className="font-bold text-sm text-slate-100">{score.toFixed(1)}</span>
                                    <div className="p-1 rounded bg-slate-950/40 border border-slate-900/80">
                                        {getTrendIcon(item.trend)}
                                    </div>
                                </div>

                                {/* Toggle icon */}
                                <div className="text-slate-500">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>

                            {/* Expandable score breakdown */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        key="breakdown"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 180, damping: 22 }}
                                        className="border-t border-slate-900/60 bg-slate-950/20 px-6 py-4 space-y-3.5 select-none"
                                    >
                                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                                            Priority Scorer Component Breakdown
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                            {/* Component 1: Demand */}
                                            <div className="space-y-1.5 text-left">
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                                    <span>Market Demand Factor (40%)</span>
                                                    <span className="text-slate-200">+{item.components?.demandComponent?.toFixed(1) || '0.0'}</span>
                                                </div>
                                                <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        style={{ width: `${((item.components?.demandComponent || 0) / 40) * 100}%` }}
                                                        className="bg-emerald-400 h-full rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Component 2: Stack Importance */}
                                            <div className="space-y-1.5 text-left">
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                                    <span>Stack Importance (30%)</span>
                                                    <span className="text-slate-200">+{item.components?.stackComponent?.toFixed(1) || '0.0'}</span>
                                                </div>
                                                <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        style={{ width: `${((item.components?.stackComponent || 0) / 30) * 100}%` }}
                                                        className="bg-indigo-400 h-full rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Component 3: Seniority Factor */}
                                            <div className="space-y-1.5 text-left">
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                                    <span>Seniority Factor (20%)</span>
                                                    <span className="text-slate-200">+{item.components?.seniorityComponent?.toFixed(1) || '0.0'}</span>
                                                </div>
                                                <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        style={{ width: `${((item.components?.seniorityComponent || 0) / 20) * 100}%` }}
                                                        className="bg-blue-400 h-full rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Component 4: Transition Overlap */}
                                            <div className="space-y-1.5 text-left">
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                                    <span>Transition Versatility (10%)</span>
                                                    <span className="text-slate-200">+{item.components?.transitionComponent?.toFixed(1) || '0.0'}</span>
                                                </div>
                                                <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        style={{ width: `${((item.components?.transitionComponent || 0) / 10) * 100}%` }}
                                                        className="bg-cyan-400 h-full rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
