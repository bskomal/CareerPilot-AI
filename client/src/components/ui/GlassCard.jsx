import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', glow = false, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20, delay }}
            whileHover={{ 
                y: -4, 
                boxShadow: "0 30px 70px rgba(0,0,0,0.65), inset 0 1px 0px rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.08)"
            }}
            className={`p-6 transition-all duration-300 ${
                glow ? 'glass-panel-glow' : 'glass-panel'
            } ${className}`}
        >
            {children}
        </motion.div>
    );
}
