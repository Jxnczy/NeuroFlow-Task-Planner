import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface TabTip {
    id: string;
    title: string;
    description: string;
}

const TAB_TIPS: Record<string, TabTip> = {
    focus: {
        id: 'focus',
        title: 'Deep Focus Mode',
        description: 'Start a focused work session with built-in timer. Perfect for tackling important tasks without distractions.'
    },
    braindump: {
        id: 'braindump',
        title: 'Brain Dump',
        description: 'Capture fleeting thoughts and ideas. Get them out of your head and organize them later.'
    },
    habits: {
        id: 'habits',
        title: 'Habit Tracker',
        description: 'Build consistent routines. Track daily habits and watch your streaks grow.'
    },
    analytics: {
        id: 'analytics',
        title: 'Stats & Analytics',
        description: 'See your productivity patterns. Track completion rates, time spent, and progress over time.'
    }
};

const STORAGE_KEY = 'neuroflow_tab_tips_seen';

interface TabOnboardingProps {
    activeTab: string;
}

export const TabOnboarding: React.FC<TabOnboardingProps> = ({ activeTab }) => {
    const isMobile = useIsMobile();
    const [seenTabs, setSeenTabs] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });
    const [visible, setVisible] = useState(false);
    const [currentTip, setCurrentTip] = useState<TabTip | null>(null);

    useEffect(() => {
        const tip = TAB_TIPS[activeTab];
        if (tip && !seenTabs.has(activeTab)) {
            // Small delay for smooth transition
            const timer = setTimeout(() => {
                setCurrentTip(tip);
                setVisible(true);
            }, 400);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [activeTab, seenTabs]);

    const handleDismiss = () => {
        setVisible(false);
        const newSeen = new Set(seenTabs);
        newSeen.add(activeTab);
        setSeenTabs(newSeen);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSeen]));
        } catch { }
    };

    if (!currentTip) return null;

    // Mobile: position above the bottom nav bar with slide-up animation
    // Desktop: position at top-center with slide-down animation
    const mobileStyles = {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.98 }
    };

    const desktopStyles = {
        initial: { opacity: 0, y: -10, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.98 }
    };

    const animationProps = isMobile ? mobileStyles : desktopStyles;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={animationProps.initial}
                    animate={animationProps.animate}
                    exit={animationProps.exit}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className={
                        isMobile
                            ? "fixed bottom-24 left-4 right-4 z-[100]"
                            : "fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%]"
                    }
                >
                    <div
                        className="rounded-2xl p-5 relative"
                        style={{
                            background: 'var(--bg-secondary)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                            border: '1px solid var(--border-medium)',
                            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-start gap-4">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                    background: 'var(--accent-muted)',
                                    border: '1px solid var(--accent-muted)'
                                }}
                            >
                                <span className="text-lg">✨</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4
                                    className="text-[15px] font-semibold mb-1"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {currentTip.title}
                                </h4>
                                <p
                                    className="text-[13px] leading-relaxed"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {currentTip.description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
                                style={{
                                    color: 'var(--text-secondary)',
                                    background: 'var(--accent-muted)'
                                }}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
