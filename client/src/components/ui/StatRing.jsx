import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import AnimatedCounter from './AnimatedCounter';

export default function StatRing({ score, label = 'ATS SCORE', size = 160 }) {
    const data = [{ name: 'Score', value: score }];
    
    let fill = '#6366f1'; // indigo
    if (score >= 80) fill = '#10b981'; // emerald
    else if (score >= 50) fill = '#f59e0b'; // amber
    else if (score > 0) fill = '#f43f5e'; // rose

    return (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center select-none">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="80%"
                    outerRadius="100%"
                    barSize={8}
                    data={data}
                    startAngle={180}
                    endAngle={-180}
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                    />
                    <RadialBar
                        background={{ fill: 'rgba(30, 41, 59, 0.4)' }}
                        clockWise
                        dataKey="value"
                        fill={fill}
                        cornerRadius={5}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-white flex items-baseline">
                    <AnimatedCounter value={score} decimals={0} />
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</span>
            </div>
        </div>
    );
}
