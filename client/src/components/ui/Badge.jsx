import React from 'react';

export default function Badge({ children, variant = 'indigo', className = '' }) {
    const variants = {
        indigo: 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        slate: 'bg-slate-800 border-slate-700 text-slate-300'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${variants[variant] || variants.indigo} ${className}`}>
            {children}
        </span>
    );
}
