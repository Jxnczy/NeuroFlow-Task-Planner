import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X, Calendar } from 'lucide-react';

interface WelcomePromptProps {
    onAccept: () => void;
    onDecline: () => void;
}

const STORAGE_KEY = 'neuroflow_onboarding_choice';

export const getOnboardingChoice = (): 'yes' | 'no' | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'yes' || stored === 'no') return stored;
        return null;
    } catch {
        return null;
    }
};

export const setOnboardingChoice = (choice: 'yes' | 'no') => {
    try {
        localStorage.setItem(STORAGE_KEY, choice);
    } catch { }
};

export const markAllOnboardingComplete = () => {
    try {
        // Mark all onboarding steps as completed
        localStorage.setItem('neuroflow_tour_completed', 'true');
        localStorage.setItem('neuroflow_first_task_guide_completed', 'true');
        // Mark all tab tips as seen
        localStorage.setItem('neuroflow_tab_tips_seen', JSON.stringify([
            'planner', 'focus', 'braindump', 'habits', 'analytics'
        ]));
    } catch { }
};

type PromptStep = 'ask' | 'intro';

export const WelcomePrompt: React.FC<WelcomePromptProps> = ({ onAccept, onDecline }) => {
    const [step, setStep] = useState<PromptStep>('ask');

    const handleAcceptTour = () => {
        setOnboardingChoice('yes');
        // Show intro step before starting the tour
        setStep('intro');
    };

    const handleStartTour = () => {
        onAccept();
    };

    const handleDecline = () => {
        setOnboardingChoice('no');
        markAllOnboardingComplete();
        onDecline();
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            >
                <AnimatePresence mode="wait">
                    {step === 'ask' ? (
                        <motion.div
                            key="ask"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                            className="relative w-[90%] max-w-md rounded-2xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, rgba(35, 35, 42, 0.98) 0%, rgba(25, 25, 32, 0.98) 100%)',
                                backdropFilter: 'blur(60px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: `
                                    0 32px 64px -12px rgba(0, 0, 0, 0.6),
                                    0 0 0 1px rgba(255, 255, 255, 0.04),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.06)
                                `
                            }}
                        >
                            {/* Decline button in corner */}
                            <button
                                onClick={handleDecline}
                                className="absolute top-4 right-4 p-2 rounded-lg transition-all hover:bg-white/10"
                                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                                aria-label="Skip tour"
                            >
                                <X size={18} />
                            </button>

                            {/* Content */}
                            <div className="p-8 text-center">
                                {/* Icon */}
                                <div
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                                        border: '1px solid rgba(34, 211, 238, 0.2)'
                                    }}
                                >
                                    <Sparkles size={28} className="text-cyan-400" />
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                    Welcome to NeuroFlow! 👋
                                </h2>

                                {/* Description */}
                                <p className="text-[15px] text-white/50 leading-relaxed mb-8 max-w-sm mx-auto">
                                    Would you like a quick tour to discover how to organize your tasks and boost your productivity?
                                </p>

                                {/* Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <motion.button
                                        onClick={handleAcceptTour}
                                        whileHover={{ scale: 1.03, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all"
                                        style={{
                                            background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
                                            boxShadow: '0 4px 14px rgba(34, 211, 238, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        Yes, show me around
                                        <ArrowRight size={16} strokeWidth={2.5} />
                                    </motion.button>

                                    <button
                                        onClick={handleDecline}
                                        className="px-6 py-3 rounded-xl text-[14px] font-medium transition-all"
                                        style={{
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}
                                    >
                                        No thanks, I'll explore
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                            className="relative w-[90%] max-w-md rounded-2xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, rgba(35, 35, 42, 0.98) 0%, rgba(25, 25, 32, 0.98) 100%)',
                                backdropFilter: 'blur(60px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: `
                                    0 32px 64px -12px rgba(0, 0, 0, 0.6),
                                    0 0 0 1px rgba(255, 255, 255, 0.04),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.06)
                                `
                            }}
                        >
                            {/* Content */}
                            <div className="p-8 text-center">
                                {/* Icon */}
                                <div
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                                        border: '1px solid rgba(34, 211, 238, 0.2)'
                                    }}
                                >
                                    <Calendar size={28} className="text-cyan-400" />
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                    Weekly Planner
                                </h2>

                                {/* Description */}
                                <p className="text-[15px] text-white/50 leading-relaxed mb-8 max-w-sm mx-auto">
                                    Your command center. Add tasks, drag them to schedule, and stay on top of your week.
                                </p>

                                {/* Continue Button */}
                                <motion.button
                                    onClick={handleStartTour}
                                    whileHover={{ scale: 1.03, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
                                        boxShadow: '0 4px 14px rgba(34, 211, 238, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                                    }}
                                >
                                    Okay
                                    <ArrowRight size={16} strokeWidth={2.5} />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

