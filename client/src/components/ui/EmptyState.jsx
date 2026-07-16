import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ title, description, icon: Icon, actionLabel, onAction, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-panel p-12 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto ${className}`}
        >
            {Icon && (
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500">
                    <Icon className="w-6 h-6" />
                </div>
            )}
            <div className="space-y-1">
                <h5 className="font-bold text-white text-base">{title}</h5>
                <p className="text-sm text-slate-400 leading-normal">{description}</p>
            </div>
            {actionLabel && onAction && (
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onAction}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all shadow-md mt-2"
                >
                    {actionLabel}
                </motion.button>
            )}
        </motion.div>
    );
}
