import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, LogIn, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { WeekFluxLogo } from '../../brand/WeekFluxLogo';

interface AuthOverlayProps {
    onMagicLink: (email: string) => Promise<void>;
    onSignInWithPassword?: (email: string, password: string) => Promise<void>;
    onSignUpWithPassword?: (email: string, password: string) => Promise<any>;
    onOAuth: (provider: 'google' | 'github') => Promise<void>;
    magicLinkSent: boolean;
    authError?: string | null;
    onCancel?: () => void;
    skipSplash?: boolean;
    isLoading?: boolean;
    showFeatureOverview?: boolean;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
    onMagicLink,
    onSignInWithPassword,
    onSignUpWithPassword,
    onOAuth,
    magicLinkSent,
    authError,
    onCancel,
    skipSplash = false,
    isLoading = false,
    showFeatureOverview = true
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isSignUp, setIsSignUp] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    // Start directly with Welcome screen (no long splash)
    const [showSplash, setShowSplash] = useState(false);
    const [showWelcome, setShowWelcome] = useState(showFeatureOverview);

    // Sync internal welcome state with prop if it changes
    useEffect(() => {
        setShowWelcome(showFeatureOverview);
    }, [showFeatureOverview]);

    // Hide the HTML app loader IMMEDIATELY
    useEffect(() => {
        document.body.classList.add('loaded');
    }, []);

    // State for exit animation
    const [isExiting, setIsExiting] = useState(false);

    const handleCancel = () => {
        setIsExiting(true);
        // Wait for exit animation before calling onCancel
        setTimeout(() => {
            onCancel?.();
        }, 600);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('AuthOverlay handleSubmit triggered', { isSignUp, email, hasPassword: !!password });
        if (!email) return;

        setSubmitting(true);
        try {
            if (!password) {
                throw new Error('Password is required');
            }
            if (isSignUp) {
                console.log('Calling onSignUpWithPassword');
                const result = await onSignUpWithPassword?.(email, password);
                console.log('onSignUp result:', result);
                if (result) {
                    const { user, session } = result;
                    if (user && !session) {
                        console.log('User created, verification needed');
                        setVerificationSent(true);
                    }
                }
            } else {
                console.log('Calling onSignInWithPassword');
                await onSignInWithPassword?.(email, password);
            }
        } catch (err: any) {
            console.error('Auth handler error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-[#12141a] overflow-hidden z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 1.05 : 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
            <AnimatePresence mode="wait">
                {showSplash ? (
                    /* SPLASH SCREEN - NeuroFlow Branding */
                    <motion.div
                        key="splash"
                        className="flex flex-col items-center justify-center gap-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {/* Logo Icon with Glow */}
                        <WeekFluxLogo size="5xl" showIcon={true} layout="vertical" />

                        <motion.p
                            className="text-white/50 text-sm mt-2 tracking-widest uppercase"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >

                        </motion.p>

                        {/* Loading dots */}
                        <motion.div
                            className="flex gap-1.5 mt-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-cyan-400/60"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                ) : showWelcome ? (
                    /* WELCOME SCREEN */
                    <motion.div
                        key="welcome"
                        className="relative w-full max-w-xl mx-auto p-8"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <CheckCircle className="mx-auto text-cyan-400 mb-4" size={48} strokeWidth={1.5} />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex flex-col items-center">
                                <span>Welcome to</span>
                                <WeekFluxLogo size="2xl" showIcon={false} className="mt-2" />
                            </h1>
                            <p className="text-white/60">
                                A powerful weekly planning tool
                            </p>
                        </div>

                        {/* Features */}
                        <motion.div
                            className="space-y-3 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">📊</div>
                                <div className="text-left">
                                    <div className="text-white font-medium">Visual Weekly Planner</div>
                                    <div className="text-white/50 text-sm">Drag & drop scheduling that works</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">🔥</div>
                                <div className="text-left">
                                    <div className="text-white font-medium">Deep Focus</div>
                                    <div className="text-white/50 text-sm">Stay in the flow with built-in timer</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">🧠</div>
                                <div className="text-left">
                                    <div className="text-white font-medium">Notes</div>
                                    <div className="text-white/50 text-sm">Capture thoughts, organize later</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">✨</div>
                                <div className="text-left">
                                    <div className="text-white font-medium">Habit Tracking</div>
                                    <div className="text-white/50 text-sm">Build routines with visual streaks</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">📈</div>
                                <div className="text-left">
                                    <div className="text-white font-medium">Statistics</div>
                                    <div className="text-white/50 text-sm">Visualize your productivity trends</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            className="space-y-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <button
                                onClick={() => setShowWelcome(false)}
                                className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
                            >
                                Get Started
                            </button>
                        </motion.div>
                    </motion.div>
                ) : (
                    /* LOGIN FORM */
                    <motion.div
                        key="login"
                        className="relative w-full max-w-xl mx-auto p-8"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <motion.div
                            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-10 space-y-6"
                            initial={{ boxShadow: "0 0 0 rgba(6, 182, 212, 0)" }}
                            animate={{ boxShadow: "0 0 60px rgba(6, 182, 212, 0.1)" }}
                            transition={{ duration: 1, delay: 0.3 }}
                        >
                            <motion.div
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/30">
                                    <ShieldCheck className="text-cyan-300" size={26} />
                                </div>
                                <div>
                                    <p className="uppercase tracking-[0.2em] text-xs text-white/60 font-semibold">Secure Workspace</p>
                                    <h2 className="text-3xl font-display font-bold text-white leading-tight">
                                        {isSignUp ? 'Create Account' : 'Login'}
                                    </h2>
                                </div>
                            </motion.div>

                            <motion.p
                                className="text-white/70 leading-relaxed text-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Sync your tasks across devices. Choose how you want to sign in.
                            </motion.p>

                            {/* Auth Mode Toggle Removed - Defaulting to Email/Password */}

                            <motion.form
                                onSubmit={handleSubmit}
                                className="space-y-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {isSignUp && (
                                    <div className="text-xs text-cyan-300 font-medium text-center pb-1">
                                        Creating a new account
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-white/40" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus:border-cyan-400/60 focus:bg-white/10 transition-colors outline-none text-white placeholder:text-white/30"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <ShieldCheck size={18} className="text-white/40" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={isSignUp ? "Choose a strong password" : "Your password"}
                                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus:border-cyan-400/60 focus:bg-white/10 transition-colors outline-none text-white placeholder:text-white/30"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <LogIn size={18} />
                                    {submitting ? 'Processing…' : (isSignUp ? 'Create Account' : 'Sign In')}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-xs text-white/50 hover:text-cyan-300 transition-colors underline decoration-dotted underline-offset-4"
                                    >
                                        {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                                    </button>
                                </div>
                            </motion.form>

                            <motion.div
                                className="flex flex-col gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => onOAuth('google')}
                                    className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/5 text-white font-semibold hover:border-white/30 hover:bg-white/10 transition-colors"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </button>
                            </motion.div>

                            <AnimatePresence>
                                {magicLinkSent && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-sm text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3"
                                    >
                                        Magic link sent! Check your inbox.
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {verificationSent && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-sm text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3"
                                    >
                                        Account created! Please check your email to verify.
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {authError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-sm text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3"
                                    >
                                        {authError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                className="pt-4 border-t border-white/10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isExiting}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/20 bg-white/5 text-white font-medium hover:border-white/40 hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    {isExiting ? 'Loading...' : 'Continue without sync'}
                                    <ArrowRight size={18} />
                                </button>
                                <p className="text-center text-xs text-white/50 mt-2">
                                    Your data will be saved locally on this device
                                </p>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
