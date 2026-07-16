import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

export default function TransitionAccelerationRing({ score = 0, pace = 'Moderate Pace', size = 180 }) {
    const radius = 65;
    const strokeWidth = 9;
    const circumference = 2 * Math.PI * radius; // ~408.4
    const offset = circumference - (circumference * score) / 100;

    return (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center select-none">
            {/* Subtle rotating glow behind the ring */}
            <div className="absolute inset-0 w-full h-full rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04)_0%,transparent_70%)] animate-spin-slow pointer-events-none" />

            <svg width={size} height={size} viewBox="0 0 160 160" className="relative z-10 transform -rotate-90">
                <defs>
                    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />   {/* indigo-500 */}
                        <stop offset="50%" stopColor="#3b82f6" />  {/* blue-500 */}
                        <stop offset="100%" stopColor="#22d3ee" /> {/* cyan-400 */}
                    </linearGradient>
                    <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Base gray path */}
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="rgba(30, 41, 59, 0.4)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Glow layer (underneath the active stroke) */}
                <motion.circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="url(#ring-gradient)"
                    strokeWidth={strokeWidth + 2}
                    fill="transparent"
                    strokeLinecap="round"
                    filter="url(#ring-glow)"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    style={{
                        strokeDasharray: circumference,
                        opacity: 0.45
                    }}
                />

                {/* Main active stroke */}
                <motion.circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="url(#ring-gradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    style={{
                        strokeDasharray: circumference
                    }}
                />
            </svg>

            {/* Label inside (Absolute centered) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                <span className="text-3xl font-extrabold text-white flex items-baseline">
                    <AnimatedCounter value={score} decimals={1} />
                    <span className="text-lg font-bold text-indigo-400 ml-0.5">%</span>
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center max-w-[110px] leading-tight">
                    {pace || 'Acceleration'}
                </span>
            </div>
        </div>
    );
}
