import React from 'react';

export default function Skeleton({ className = '' }) {
    return (
        <div className={`shimmer rounded-xl ${className}`} />
    );
}

export function SkeletonMetricCard() {
    return (
        <div className="glass-panel p-6 space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-2/3" />
            <div className="border-t border-slate-900/60 pt-4 mt-2 space-y-2">
                <Skeleton className="h-3.5 w-5/6" />
            </div>
        </div>
    );
}

export function SkeletonRadarChart() {
    return (
        <div className="glass-panel p-6 flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <div className="w-full h-56 flex items-center justify-center">
                <Skeleton className="w-40 h-40 rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonTable() {
    return (
        <div className="space-y-3.5">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-slate-900/40">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4 mx-auto" />
                <Skeleton className="h-3 w-1/4 ml-auto" />
                <Skeleton className="h-3 w-4" />
            </div>
            {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel p-5 grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-4.5 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-2 w-24 mx-auto rounded-full" />
                    <div className="flex justify-end gap-2 items-center">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-6 w-6 rounded" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                </div>
            ))}
        </div>
    );
}
