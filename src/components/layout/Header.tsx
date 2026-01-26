import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Target, ListChecks, Notebook, BarChart3, ChevronLeft, ChevronRight, Moon, PanelLeft } from 'lucide-react';
import { formatDate, getWeekDays, isLateNight } from '../../constants';
import { pulseScale } from '../../utils/animations';
interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    currentDate: Date;
    onWeekChange: (direction: 'prev' | 'next') => void;
    onJumpToCurrentWeek?: () => void;
    isStacked: boolean;
    setIsStacked: (stacked: boolean) => void;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTab,
    setActiveTab,
    currentDate,
    onWeekChange,
    onJumpToCurrentWeek,
    isStacked,
    setIsStacked,
    isSidebarOpen,
    onToggleSidebar
}) => {
    const currentWeekDays = getWeekDays(currentDate);
    const isLateNightSession = isLateNight();

    const tabs = [
        { id: 'planner', label: 'Planner', icon: CalendarDays },
        { id: 'focus', label: 'Deep Focus', icon: Target },
        { id: 'braindump', label: 'Brain Dump', icon: Notebook },
        { id: 'habits', label: 'Habits', icon: ListChecks },
        { id: 'analytics', label: 'Stats', icon: BarChart3 },
    ];

    return (
        <div
            className="hidden md:flex items-center justify-between px-6 py-4 border-b sticky top-0 z-50 transition-colors duration-300"
            style={{
                backgroundColor: 'var(--bg-glass)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderColor: 'var(--border-light)'
            }}
        >
            {/* LEFT: Overview & Date */}
            <div className="flex items-center gap-2 lg:gap-4 pointer-events-auto min-w-0 shrink">
                {!isSidebarOpen && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-xl transition-colors hover:bg-white/10 text-zinc-400 hover:text-white"
                        title="Open Sidebar"
                    >
                        <PanelLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <h1
                        className="text-xl font-display font-extrabold tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Overview:
                    </h1>
                    <p className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                        {currentWeekDays[0].toLocaleDateString('en-US', { month: 'short' })} {currentWeekDays[0].getDate()} — {currentWeekDays[6].getDate()}, {currentWeekDays[0].getFullYear()}
                    </p>
                </div>
            </div>

            {/* CENTER: Navigation Tabs */}
            <div className="pointer-events-auto flex items-center gap-3 relative">
                {/* Main Menu */}
                <div
                    className="flex items-center gap-1 p-1 rounded-2xl backdrop-blur-md border shadow-2xl"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)',
                        borderColor: 'var(--border-medium)'
                    }}
                >
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                                style={{
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                                    transform: isActive ? 'scale(1.02)' : 'scale(1)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--text-muted)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <Icon size={14} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none border"
                                        style={{ borderColor: 'var(--border-light)' }}
                                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                    ></motion.div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT: Week Navigation & Late Night Badge */}
            <div className="pointer-events-auto flex items-center gap-3">
                <div
                    className="flex items-center gap-1 rounded-xl p-1 border shadow-inner backdrop-blur-md justify-center shrink-0"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)',
                        borderColor: 'var(--border-medium)'
                    }}
                >
                    <button
                        onClick={() => onWeekChange('prev')}
                        className="px-3 py-1.5 hover:bg-white/[0.05] rounded-lg transition-colors flex items-center justify-center"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={onJumpToCurrentWeek}
                        className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-white/[0.05] rounded-md transition-colors cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Jump to current week"
                    >Week</button>
                    <button
                        onClick={() => onWeekChange('next')}
                        className="px-3 py-1.5 hover:bg-white/[0.05] rounded-lg transition-colors flex items-center justify-center"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Late Night Badge */}
                <AnimatePresence>
                    {isLateNightSession && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                        >
                            <Moon size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Late Night Session</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
