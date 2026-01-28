import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VARIANTS, TRANSITION, EASING } from '../motion/motion';

interface BootOverlayProps {
    isAppReady: boolean;
    onAnimationComplete?: () => void;
}

export const BootOverlay: React.FC<BootOverlayProps> = ({ isAppReady, onAnimationComplete }) => {
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);
    const [shouldExit, setShouldExit] = useState(false);

    useEffect(() => {
        // Enforce minimum splash time to prevent flicker (550ms)
        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 550);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Only exit when app is fully ready AND minimum time has passed
        if (isAppReady && minTimeElapsed) {
            setShouldExit(true);
        }
    }, [isAppReady, minTimeElapsed]);

    return (
        <AnimatePresence onExitComplete={onAnimationComplete} mode="wait">
            {!shouldExit && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        // Ensure background color is solid for the overlay
                    }}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={VARIANTS.bootOverlay}
                >
                    <motion.div
                        className="relative flex flex-col items-center gap-6"
                    // Separate content animation if needed, but inheriting from parent varaints is fine for now
                    >
                        {/* Brand Icon Wrapper with Glow */}
                        <div className="relative">
                            <motion.div
                                className="absolute inset-[-20px] rounded-3xl opacity-30 blur-2xl"
                                style={{ background: 'var(--accent-glow)' }}
                                animate={{
                                    opacity: [0.3, 0.5, 0.3],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            <motion.div
                                className="relative flex items-center justify-center w-16 h-16 rounded-[22px] border border-cyan-500/30 backdrop-blur-md"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))',
                                }}
                                layoutId="brandmark"
                                transition={TRANSITION.emphasized}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </motion.div>
                        </div>

                        {/* Text - Fades out on exit, does not share layout */}
                        <motion.div
                            className="text-center"
                            variants={{
                                exit: { opacity: 0, y: -5, transition: { duration: 0.15 } }
                            }}
                        >
                            <h1 className="text-3xl font-extrabold tracking-tight m-0" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Week</span>
                                <span style={{ color: 'var(--text-primary)' }}>Flux</span>
                            </h1>

                            {/* Subtle Progress Bar */}
                            <div className="mt-4 h-1 w-24 bg-slate-800/50 rounded-full overflow-hidden mx-auto">
                                <motion.div
                                    className="h-full bg-cyan-400/80 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "80%" }}
                                    transition={{ duration: 0.8, ease: EASING.primary }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
