import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Compass, CheckCircle2, ChevronRight, FileSearch, TrendingUp } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

export default function Landing() {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Semantic Matching',
            desc: 'Calculate absolute role compatibility utilizing vectorized cosine similarity embeddings.',
            icon: FileSearch
        },
        {
            title: 'Skill-Gap Roadmap',
            desc: 'Find missing competencies and access interactive training roadmaps mapped by priority.',
            icon: Sparkles
        },
        {
            title: 'Career Horizons',
            desc: 'Map profiles to 16 developer disciplines and evaluate adjacent path probabilities.',
            icon: Compass
        }
    ];

    const steps = [
        { num: '01', title: 'Upload Resume', desc: 'Securely parse candidate PDF or Word documents with zero local model overhead.' },
        { num: '02', title: 'Compare Gap Metrics', desc: 'Paste job requirements and identify matching parameters and learning roadmaps.' },
        { num: '03', title: 'Track Progression', desc: 'Log calculations over time, watch trend lines, and aggregate recurring missing skills.' }
    ];

    return (
        <div className="min-h-screen w-screen bg-slate-950 text-slate-100 overflow-x-hidden relative flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-screen h-screen mesh-bg opacity-30 pointer-events-none z-0" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 font-extrabold">
                        CP
                    </div>
                    <span className="font-extrabold text-xl text-white tracking-tight">
                        CareerPilot <span className="text-indigo-400 font-medium">AI</span>
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2"
                    >
                        Sign In
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/register')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        Get Started
                    </motion.button>
                </div>
            </header>

            {/* Hero Main */}
            <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-24 relative z-10 flex-1 flex flex-col items-center justify-center text-center space-y-12">
                <div className="space-y-6 max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold select-none"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Recruiter-Grade AI ATS Engine</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] select-none"
                    >
                        Align Profiles to <br className="hidden md:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-500 to-emerald-400">
                            Career Milestones
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-base md:text-lg text-slate-400 leading-relaxed font-normal"
                    >
                        Upload candidate resumes, identify missing technical skill gaps, and predict logical career growth horizons using semantic embedding vector matching.
                    </motion.p>
                </div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-4 relative z-20"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/register')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all w-full sm:w-auto justify-center"
                    >
                        <span>Analyze Your Resume</span>
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>

                {/* How it Works timeline section */}
                <div className="w-full pt-16 border-t border-slate-900/80 space-y-12">
                    <h2 className="text-2xl font-extrabold text-white text-center select-none uppercase tracking-wide">
                        How It Works
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, idx) => (
                            <GlassCard key={idx} className="text-left space-y-3" delay={idx * 0.1}>
                                <span className="text-3xl font-extrabold text-indigo-500 font-mono block">
                                    {step.num}
                                </span>
                                <h3 className="text-lg font-bold text-slate-200">{step.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-normal">{step.desc}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="w-full pt-16 space-y-12">
                    <h2 className="text-2xl font-extrabold text-white text-center select-none uppercase tracking-wide">
                        Core Capabilities
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feat, idx) => {
                            const Icon = feat.icon;
                            return (
                                <GlassCard key={idx} className="text-left space-y-4" glow delay={idx * 0.15}>
                                    <div className="w-10 h-10 bg-indigo-600/15 border border-indigo-500/25 rounded-xl flex items-center justify-center text-indigo-400">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-slate-200">{feat.title}</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed font-normal">{feat.desc}</p>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950/80 py-8 relative z-10 select-none">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-slate-500">
                        &copy; 2026 CareerPilot AI. All rights reserved. Recruiter-grade parser.
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Vector Encrypted Security</span>
                    </span>
                </div>
            </footer>
        </div>
    );
}
