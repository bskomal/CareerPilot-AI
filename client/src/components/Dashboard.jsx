import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { ResultsContext } from '../context/ResultsContext';
import AppShell from './AppShell';
import UploadZone from './UploadZone';
import MatchAnalysis from './MatchAnalysis';
import CareerGrowth from './CareerGrowth';
import Overview from '../pages/Overview';
import HistoryPage from '../pages/History';
import Settings from './Settings';
import EmptyState from './ui/EmptyState';
import { Briefcase, Compass } from 'lucide-react';

export default function Dashboard() {
    const { token, API_BASE } = useContext(AuthContext);
    const { resume, setResume } = useContext(ResultsContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [reRunJobDescription, setReRunJobDescription] = useState('');
    const [scrollPositions, setScrollPositions] = useState({});

    // Scroll restoration for tabs
    useEffect(() => {
        const savedPos = scrollPositions[activeTab] || 0;
        const timer = setTimeout(() => {
            window.scrollTo({ top: savedPos, behavior: 'instant' });
        }, 60); // small delay to wait for tabs to finish mounting
        return () => clearTimeout(timer);
    }, [activeTab]);

    // Record scroll offsets
    useEffect(() => {
        const handleScroll = () => {
            setScrollPositions(prev => ({
                ...prev,
                [activeTab]: window.scrollY
            }));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeTab]);

    const handleUploadSuccess = (resumeObj) => {
        setResume(resumeObj);
        setActiveTab('overview');
    };

    const handleReRunJobDescription = (desc) => {
        setReRunJobDescription(desc);
        setActiveTab('match');
    };

    return (
        <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                >
                    {activeTab === 'overview' && (
                        <Overview 
                            activeResume={resume} 
                            setActiveTab={setActiveTab} 
                            setJobDescriptionToReRun={handleReRunJobDescription} 
                        />
                    )}
                    
                    {activeTab === 'studio' && (
                        <UploadZone 
                            token={token} 
                            API_BASE={API_BASE} 
                            onUploadSuccess={handleUploadSuccess} 
                        />
                    )}
                    
                    {activeTab === 'match' && (
                        resume ? (
                            <MatchAnalysis 
                                resumeId={resume._id} 
                                token={token} 
                                API_BASE={API_BASE} 
                                reRunJobDescription={reRunJobDescription}
                            />
                        ) : (
                            <EmptyState
                                title="Resume Profile Required"
                                description="You must upload or parse a candidate resume in the Resume Studio tab before comparing job descriptions."
                                icon={Briefcase}
                                actionLabel="Go to Resume Studio"
                                onAction={() => setActiveTab('studio')}
                            />
                        )
                    )}
                    
                    {activeTab === 'career' && (
                        resume ? (
                            <CareerGrowth 
                                resumeId={resume._id} 
                                token={token} 
                                API_BASE={API_BASE} 
                            />
                        ) : (
                            <EmptyState
                                title="Resume Profile Required"
                                description="You must upload or parse a candidate resume in the Resume Studio tab to predict career trajectories."
                                icon={Compass}
                                actionLabel="Go to Resume Studio"
                                onAction={() => setActiveTab('studio')}
                            />
                        )
                    )}
                    
                    {activeTab === 'history' && (
                        <HistoryPage 
                            setActiveTab={setActiveTab} 
                            setJobDescriptionToReRun={handleReRunJobDescription} 
                        />
                    )}
                    
                    {activeTab === 'settings' && (
                        <Settings />
                    )}
                </motion.div>
            </AnimatePresence>
        </AppShell>
    );
}
