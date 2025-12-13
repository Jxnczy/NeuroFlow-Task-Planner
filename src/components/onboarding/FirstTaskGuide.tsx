import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check, GripVertical, MousePointer2 } from 'lucide-react';

interface FirstTaskGuideProps {
    onComplete: () => void;
    hasAnyTasks: boolean;
}

type GuideStep = 'type' | 'drag' | 'done';

const STORAGE_KEY = 'neuroflow_first_task_guide_completed';

export const FirstTaskGuide: React.FC<FirstTaskGuideProps> = ({ onComplete, hasAnyTasks }) => {
    const [isCompleted, setIsCompleted] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });
    const [step, setStep] = useState<GuideStep>('type');
    const [visible, setVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Don't show if already completed
    useEffect(() => {
        if (!isCompleted && !hasAnyTasks) {
            const timer = setTimeout(() => setVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, hasAnyTasks]);

    // Track task creation
    useEffect(() => {
        if (hasAnyTasks && step === 'type') {
            setStep('drag');
        }
    }, [hasAnyTasks, step]);

    // Find target element for current step
    useEffect(() => {
        const findTarget = () => {
            let selector = '';
            if (step === 'type') {
                selector = '[data-tour="add-task"] input';
            } else if (step === 'drag') {
                // Find the first task card in sidebar
                selector = '[data-tour="brain-dump"] [draggable="true"]';
            }

            if (selector) {
                const target = document.querySelector(selector);
                if (target) {
                    setTargetRect(target.getBoundingClientRect());
                }
            }
        };

        const timer = setTimeout(findTarget, 300);
        window.addEventListener('resize', findTarget);
        const interval = setInterval(findTarget, 500); // Keep updating position

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', findTarget);
        };
    }, [step]);

    // Listen for drop on grid to complete
    useEffect(() => {
        if (step !== 'drag') return;

        const checkForScheduledTask = () => {
            // Check if any task was scheduled (has a due date set)
            const scheduledTasks = document.querySelectorAll('[data-tour="week-view"] [draggable="true"]');
            if (scheduledTasks.length > 0) {
                setStep('done');
                setTimeout(() => {
                    handleComplete();
                }, 2000);
            }
        };

        const interval = setInterval(checkForScheduledTask, 500);
        return () => clearInterval(interval);
    }, [step]);

    const handleComplete = useCallback(() => {
        setVisible(false);
        setIsCompleted(true);
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch { }
        onComplete();
    }, [onComplete]);

    const handleSkip = useCallback(() => {
        handleComplete();
    }, [handleComplete]);

    if (isCompleted || !visible) return null;

    const getTooltipContent = () => {
        switch (step) {
            case 'type':
                return {
                    icon: <Sparkles size={20} className="text-amber-400" />,
                    title: 'Create your first task',
                    description: 'Type something like "Plan my day" and press Enter',
                    showPulse: true
                };
            case 'drag':
                return {
                    icon: <GripVertical size={20} className="text-cyan-400" />,
                    title: 'Now drag it to your schedule',
                    description: 'Grab your task and drop it onto any day in the planner',
                    showPulse: true
                };
            case 'done':
                return {
                    icon: <Check size={20} className="text-emerald-400" />,
                    title: 'Perfect! You\'re all set',
                    description: 'You just learned the core workflow. Keep going!',
                    showPulse: false
                };
        }
    };

    const content = getTooltipContent();
    const PAD = 16;

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        if (!targetRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            };
        }

        if (step === 'type') {
            return {
                top: targetRect.bottom + PAD,
                left: targetRect.left + targetRect.width / 2,
                transform: 'translateX(-50%)'
            };
        } else if (step === 'drag') {
            return {
                top: targetRect.top + targetRect.height / 2,
                left: targetRect.right + PAD + 8,
                transform: 'translateY(-50%)'
            };
        }

        return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        };
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9997] pointer-events-none"
                >
                    {/* Pulsing ring around target */}
                    {targetRect && content.showPulse && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute pointer-events-none"
                            style={{
                                top: targetRect.top - 6,
                                left: targetRect.left - 6,
                                width: targetRect.width + 12,
                                height: targetRect.height + 12,
                                borderRadius: 12
                            }}
                        >
                            {/* Pulsing animation */}
                            <motion.div
                                className="absolute inset-0 rounded-xl border-2 border-cyan-400"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.8, 0.4, 0.8]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            {/* Glow */}
                            <div
                                className="absolute inset-0 rounded-xl"
                                style={{
                                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)'
                                }}
                            />
                        </motion.div>
                    )}

                    {/* Tooltip */}
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="fixed z-[10000] pointer-events-auto"
                        style={{ ...getTooltipStyle(), width: 280 }}
                    >
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, rgba(35, 35, 42, 0.98) 0%, rgba(25, 25, 32, 0.98) 100%)',
                                backdropFilter: 'blur(40px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}
                                    >
                                        {content.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-semibold text-white mb-1">
                                            {content.title}
                                        </h4>
                                        <p className="text-[13px] text-white/50 leading-relaxed">
                                            {content.description}
                                        </p>
                                    </div>
                                </div>

                                {step !== 'done' && (
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <button
                                            onClick={handleSkip}
                                            className="text-[12px] text-white/30 hover:text-white/50 transition-colors"
                                        >
                                            Skip tutorial
                                        </button>

                                        {/* Progress dots */}
                                        <div className="flex gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${step === 'type' ? 'bg-cyan-400' : 'bg-cyan-400/50'}`} />
                                            <div className={`w-1.5 h-1.5 rounded-full ${step === 'drag' ? 'bg-cyan-400' : 'bg-white/20'}`} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Arrow pointer */}
                        {step === 'type' && targetRect && (
                            <div
                                className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
                                style={{
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderBottom: '8px solid rgba(35, 35, 42, 0.98)'
                                }}
                            />
                        )}
                    </motion.div>

                    {/* Drag animation hint */}
                    {step === 'drag' && targetRect && (
                        <motion.div
                            className="fixed pointer-events-none"
                            initial={{ opacity: 0, x: 0, y: 0 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                x: [0, 100, 200, 200],
                                y: [0, -20, 0, 0]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                repeatDelay: 1
                            }}
                            style={{
                                top: targetRect.top + targetRect.height / 2 - 12,
                                left: targetRect.left + targetRect.width / 2 - 12
                            }}
                        >
                            <MousePointer2 size={24} className="text-white/60" />
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
