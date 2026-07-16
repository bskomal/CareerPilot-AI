import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function AnimatedCounter({ value, decimals = 1, className = '' }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
        if (isNaN(numericValue)) {
            setDisplayValue(value);
            return;
        }

        const controls = animate(0, numericValue, {
            duration: 1.2,
            ease: 'easeOut',
            onUpdate: (latest) => {
                setDisplayValue(latest.toFixed(decimals));
            }
        });

        return () => controls.stop();
    }, [value, decimals]);

    return <span className={className}>{displayValue}</span>;
}
