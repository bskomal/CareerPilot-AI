import React, { createContext, useState } from 'react';

export const ResultsContext = createContext();

export function ResultsProvider({ children }) {
    const [resume, setResumeState] = useState(() => {
        try {
            const stored = localStorage.getItem('careerpilot_active_resume');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    const [match, setMatchState] = useState(() => {
        try {
            const stored = localStorage.getItem('careerpilot_active_match');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    const [career, setCareerState] = useState(() => {
        try {
            const stored = localStorage.getItem('careerpilot_active_career');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    const setResume = (data) => {
        setResumeState(data);
        if (data) {
            localStorage.setItem('careerpilot_active_resume', JSON.stringify(data));
        } else {
            localStorage.removeItem('careerpilot_active_resume');
        }
    };

    const setMatch = (data) => {
        setMatchState(data);
        if (data) {
            localStorage.setItem('careerpilot_active_match', JSON.stringify(data));
        } else {
            localStorage.removeItem('careerpilot_active_match');
        }
    };

    const setCareer = (data) => {
        setCareerState(data);
        if (data) {
            localStorage.setItem('careerpilot_active_career', JSON.stringify(data));
        } else {
            localStorage.removeItem('careerpilot_active_career');
        }
    };

    return (
        <ResultsContext.Provider value={{ resume, match, career, setResume, setMatch, setCareer }}>
            {children}
        </ResultsContext.Provider>
    );
}
