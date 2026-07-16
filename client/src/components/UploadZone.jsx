import React, { useState, useRef, useContext } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from '../api/axios';
import { useToast } from './ui/Toast';
import { computeATSScore, categorizeSkills } from '../lib/skills';
import StatRing from './ui/StatRing';
import { ResultsContext } from '../context/ResultsContext';

export default function UploadZone({ token, API_BASE, onUploadSuccess }) {
    const showToast = useToast();
    const { resume, setResume } = useContext(ResultsContext);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragging(true);
        } else if (e.type === 'dragleave') {
            setDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (selectedFile) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx')) {
            const msg = 'Unsupported format. Please upload PDF or DOCX only.';
            setError(msg);
            showToast(msg, 'error');
            return;
        }
        
        setError('');
        setUploading(true);
        setFile(selectedFile);
        setResume(null); // Clear previous details on start of new upload
        showToast('Waking up parser... Uploading and parsing resume data (up to ~30s)...', 'info');

        const formData = new FormData();
        formData.append('resume', selectedFile);

        try {
            const res = await axios.post('/api/resumes/upload', formData);
            const resumeObj = res.data.resume;
            
            if (resumeObj && resumeObj.status === 'failed') {
                const failMsg = 'Resume uploaded but AI processing failed. Please check the content.';
                setError(failMsg);
                showToast(failMsg, 'error');
                setFile(null);
                return;
            }

            setResume(resumeObj);
            showToast('Resume successfully uploaded and parsed!', 'success');
            if (onUploadSuccess) {
                onUploadSuccess(resumeObj);
            }
        } catch (err) {
            console.error('File upload error:', err.message);
            const errMsg = err.response?.data?.message || 'Failed to parse resume. Please verify services are active.';
            setError(errMsg);
            showToast(errMsg, 'error');
        } finally {
            setUploading(false);
        }
    };

    const atsScore = resume ? computeATSScore(resume) : 0;
    const categorized = resume ? categorizeSkills(resume.extracted_skills || []) : {};
    const pieData = resume 
        ? Object.entries(categorized)
            .map(([name, list]) => ({ name, value: list.length }))
            .filter(item => item.value > 0)
        : [];

    const COLORS = {
        "Frontend": "#6366f1", // indigo
        "Backend": "#10b981", // emerald
        "DevOps": "#f59e0b", // amber
        "Data & AI": "#3b82f6", // blue
        "Tools & Agile": "#64748b" // slate
    };

    return (
        <div className="w-full space-y-6 text-left select-none">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Resume Studio</h3>
            
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`glass-panel border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/30'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                />

                <div className="relative mb-4">
                    {uploading ? (
                        <div className="w-14 h-14 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-400 relative">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 border border-indigo-500/30 rounded-full"
                            />
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : (
                        <div className={`w-14 h-14 bg-slate-950/60 rounded-full flex items-center justify-center text-slate-400 border border-slate-800 ${dragging ? 'text-indigo-400 border-indigo-500/50' : ''}`}>
                            <UploadCloud className="w-6 h-6" />
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-200">
                        {file ? file.name : (resume ? resume.originalFileName : 'Drag & drop resume file here')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Supports PDF and DOCX files (Max 5MB)
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="glass-panel border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-red-400">Processing Failed</p>
                            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
                        </div>
                    </motion.div>
                )}

                {resume && !uploading && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Summary Header */}
                        <div className="glass-panel p-5 border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        Parsed Successfully
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                        ATS Scored
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold text-white mt-1.5 truncate">
                                    {resume.extracted_name || 'Candidate Name'}
                                </h4>
                                {resume.originalFileName && (
                                    <p className="text-xs text-slate-500 truncate">Source: {resume.originalFileName}</p>
                                )}
                            </div>
                        </div>

                        {/* Visual Charts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Score ring */}
                            <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ATS Profile Score</h5>
                                <StatRing score={atsScore} label="Resume Score" size={160} />
                                <p className="text-xs text-slate-500 mt-4 leading-relaxed max-w-[220px]">
                                     ATS calibration measures profile completion, structure, and skill densities.
                                </p>
                            </div>

                            {/* Skills Distribution chart */}
                            <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skill Breakdown</h5>
                                {pieData.length > 0 ? (
                                    <div className="w-full h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#6366f1'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8, color: '#f8fafc' }}
                                                    itemStyle={{ color: '#f8fafc' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 py-12">No skills detected to categorize.</p>
                                )}

                                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2">
                                    {pieData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                            <div style={{ backgroundColor: COLORS[d.name] }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                                            <span>{d.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Raw skill categorized chips list */}
                        <div className="glass-panel p-6 space-y-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-400" />
                                <span>Grouped Competencies Map</span>
                            </h4>

                            <div className="space-y-4 border-t border-slate-900 pt-4">
                                {Object.entries(categorized).map(([catName, skillList]) => {
                                    if (skillList.length === 0) return null;
                                    return (
                                        <div key={catName} className="space-y-2">
                                            <span style={{ color: COLORS[catName] }} className="text-xs font-bold uppercase tracking-wider block">
                                                {catName} ({skillList.length})
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {skillList.map((skill, i) => (
                                                    <span key={i} className="bg-slate-900 border border-slate-800/80 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium capitalize">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
