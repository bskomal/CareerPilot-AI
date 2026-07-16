import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Shield, Mail, Lock, User, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from './ui/Toast';

export default function AuthPage({ defaultIsLogin = true }) {
    const { login, register } = useContext(AuthContext);
    const showToast = useToast();
    const [isLogin, setIsLogin] = useState(defaultIsLogin);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLogin(defaultIsLogin);
    }, [defaultIsLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                showToast('Successfully logged in!', 'success');
            } else {
                await register(name, email, password);
                showToast('Account registered successfully!', 'success');
            }
        } catch (err) {
            console.error('Authentication error:', err.message);
            const errMsg = err.response?.data?.message || 'Authentication failed. Please check your credentials.';
            setError(errMsg);
            showToast(errMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center mesh-bg px-4 relative overflow-hidden select-none">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md glass-panel p-8 relative z-10 overflow-hidden"
            >
                <div className="flex flex-col items-center mb-8">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center mb-3 text-indigo-400"
                    >
                        <Shield className="w-6 h-6" />
                    </motion.div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1 flex items-center gap-2">
                        CareerPilot <span className="text-indigo-400 font-medium">AI</span>
                    </h2>
                    <p className="text-sm text-slate-400">Recruiter-Grade Resume Matching</p>
                </div>

                {/* Tabs switcher */}
                <div className="flex bg-slate-950/60 p-1 rounded-lg mb-6 border border-slate-800/60">
                    <button
                        onClick={() => { setIsLogin(true); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Register
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.form
                        key={isLogin ? 'login' : 'register'}
                        initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleSubmit}
                        className="space-y-4 text-left"
                    >
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Alex Mercer"
                                        className="w-full !pl-10 glass-input"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@example.com"
                                    className="w-full !pl-10 glass-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full !pl-10 glass-input"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-colors mt-6"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                    <Sparkles className="w-4 h-4 text-indigo-200" />
                                </>
                            )}
                        </motion.button>
                    </motion.form>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
