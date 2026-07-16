import React from 'react';

export default function SectionTitle({ title, subtitle, icon: Icon, className = '' }) {
    return (
        <div className={`flex items-start gap-3 text-left ${className}`}>
            {Icon && (
                <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div>
                <h4 className="text-lg font-bold text-white leading-snug">{title}</h4>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}
