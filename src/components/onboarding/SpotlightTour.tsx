import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

interface TourStep {
    target: string;
    title: string;
    subtitle: string;
    position: 'right' | 'left' | 'bottom' | 'top';
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="brain-dump"]',
        title: 'Your Task Inbox',
        subtitle: 'Capture ideas here. Drag to your schedule when ready.',
        position: 'right'
    },
    {
        target: '[data-tour="week-view"]',
        title: 'Weekly Overview',
        subtitle: 'See your week at a glance. Drop tasks to schedule them.',
        position: 'left'
    },
    {
        target: '[data-tour="add-task"]',
        title: 'Quick Add',
        subtitle: 'Type a task and press Enter. That\'s it.',
        position: 'right'
    }
];

interface SpotlightTourProps {
    onComplete: () => void;
    onSkip?: () => void;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;
    const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

    // Padding around target element
    const PAD = 12;
    const RADIUS = 12;

    // Find and measure target element
    useEffect(() => {
        const findTarget = () => {
            const target = document.querySelector(step.target);
            if (target) {
                const rect = target.getBoundingClientRect();
                setTargetRect(rect);
            }
        };

        const timer = setTimeout(findTarget, 200);
        window.addEventListener('resize', findTarget);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', findTarget);
        };
    }, [step.target]);

    const handleNext = useCallback(() => {
        if (isLastStep) {
            setIsExiting(true);
            setTimeout(() => {
                setIsVisible(false);
                onComplete();
            }, 400);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    }, [isLastStep, onComplete]);

    const handleSkip = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onSkip?.();
            onComplete();
        }, 400);
    }, [onComplete, onSkip]);

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const padding = 20;
        const tooltipWidth = 300;

        switch (step.position) {
            case 'right':
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.right + PAD + padding,
                    transform: 'translateY(-50%)'
                };
            case 'left':
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left - PAD - tooltipWidth - padding,
                    transform: 'translateY(-50%)'
                };
            case 'bottom':
                return {
                    top: targetRect.bottom + PAD + padding,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)'
                };
            case 'top':
                return {
                    top: targetRect.top - PAD - padding - 140,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)'
                };
            default:
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
    };

    if (!isVisible) return null;

    // Calculate cutout dimensions
    const cutout = targetRect ? {
        x: targetRect.left - PAD,
        y: targetRect.top - PAD,
        w: targetRect.width + PAD * 2,
        h: targetRect.height + PAD * 2
    } : null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExiting ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed inset-0 z-[9998]"
                >
                    {/* Dark overlay with rectangular cutout using clip-path */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.82)',
                            clipPath: cutout
                                ? `polygon(
                                    0% 0%, 
                                    0% 100%, 
                                    ${cutout.x}px 100%, 
                                    ${cutout.x}px ${cutout.y}px, 
                                    ${cutout.x + cutout.w}px ${cutout.y}px, 
                                    ${cutout.x + cutout.w}px ${cutout.y + cutout.h}px, 
                                    ${cutout.x}px ${cutout.y + cutout.h}px, 
                                    ${cutout.x}px 100%, 
                                    100% 100%, 
                                    100% 0%
                                  )`
                                : undefined
                        }}
                    />

                    {/* Glowing border around target */}
                    {cutout && (
                        <motion.div
                            key={`border-${currentStep}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="fixed pointer-events-none"
                            style={{
                                top: cutout.y,
                                left: cutout.x,
                                width: cutout.w,
                                height: cutout.h,
                                borderRadius: RADIUS,
                                border: '2px solid rgba(34, 211, 238, 0.5)',
                                boxShadow: `
                                    0 0 0 1px rgba(34, 211, 238, 0.1),
                                    0 0 30px rgba(34, 211, 238, 0.2),
                                    inset 0 0 30px rgba(34, 211, 238, 0.05)
                                `
                            }}
                        />
                    )}

                    {/* Tooltip Card - Ultra polished */}
                    <motion.div
                        key={`tooltip-${currentStep}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{
                            duration: 0.4,
                            delay: 0.05,
                            ease: [0.25, 0.1, 0.25, 1]
                        }}
                        className="fixed z-[10000]"
                        style={{ ...getTooltipStyle(), width: 300 }}
                    >
                        <div
                            className="rounded-[20px] overflow-hidden"
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
                            {/* Progress bar */}
                            <div className="h-[3px] bg-white/[0.04]">
                                <motion.div
                                    className="h-full"
                                    style={{
                                        background: 'linear-gradient(90deg, #22d3ee 0%, #3b82f6 50%, #8b5cf6 100%)'
                                    }}
                                    initial={{ width: `${((currentStep) / TOUR_STEPS.length) * 100}%` }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                />
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Step indicator */}
                                <div
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-4"
                                    style={{
                                        background: 'rgba(34, 211, 238, 0.1)',
                                        color: 'rgba(34, 211, 238, 0.8)',
                                        border: '1px solid rgba(34, 211, 238, 0.15)'
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    {currentStep + 1} of {TOUR_STEPS.length}
                                </div>

                                {/* Title */}
                                <h3 className="text-[20px] font-semibold text-white tracking-tight mb-2 leading-tight">
                                    {step.title}
                                </h3>

                                {/* Subtitle */}
                                <p className="text-[15px] text-white/50 leading-relaxed mb-6">
                                    {step.subtitle}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={handleSkip}
                                        className="text-[13px] font-medium text-white/35 hover:text-white/60 transition-all duration-200"
                                    >
                                        Skip
                                    </button>

                                    <motion.button
                                        onClick={handleNext}
                                        whileHover={{ scale: 1.03, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all"
                                        style={{
                                            background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
                                            boxShadow: '0 4px 14px rgba(34, 211, 238, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        {isLastStep ? (
                                            <>
                                                Get Started
                                                <Check size={15} strokeWidth={2.5} />
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight size={15} strokeWidth={2.5} />
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
