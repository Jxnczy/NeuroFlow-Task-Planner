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
            className="hidden md:flex items-center justify-between px-6 py-4 backdrop-blur-md border-b sticky top-0 z-50"
            style={{
                backgroundColor: 'color-mix(in srgb, var(--surface) 92%, transparent)',
                borderColor: 'var(--border)'
            }}
        >
            {/* LEFT: Overview & Date */}
            <div className="flex items-center gap-2 lg:gap-4 pointer-events-auto min-w-0 shrink">
                {!isSidebarOpen && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-[var(--radius-sm)] transition-colors hover:bg-white/5 text-zinc-400 hover:text-white"
                        title="Open Sidebar"
                    >
                        <PanelLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <h1
                        className="text-xl font-display font-semibold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Overview:
                    </h1>
                    <p className="text-xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {currentWeekDays[0].toLocaleDateString('en-US', { month: 'short' })} {currentWeekDays[0].getDate()} — {currentWeekDays[6].getDate()}, {currentWeekDays[0].getFullYear()}
                    </p>
                </div>
            </div>

            {/* CENTER: Navigation Tabs */}
            <div className="pointer-events-auto flex items-center gap-3 relative">
                {/* Main Menu */}
                <div
                    className="flex items-center gap-1 p-1 rounded-[var(--radius-lg)] backdrop-blur-md border"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--surface2) 80%, transparent)',
                        borderColor: 'var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="relative flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-200"
                                style={{
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'color-mix(in srgb, var(--surface) 80%, transparent)' : 'transparent',
                                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--surface2) 70%, transparent)';
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
                                        className="absolute inset-0 rounded-[var(--radius-sm)] pointer-events-none border"
                                        style={{ borderColor: 'var(--border-light)' }}
                                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
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
                    className="flex items-center gap-1 rounded-[var(--radius-lg)] p-1 border backdrop-blur-md justify-center shrink-0"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--surface2) 80%, transparent)',
                        borderColor: 'var(--border)'
                    }}
                >
                    <button
                        onClick={() => onWeekChange('prev')}
                        className="px-3 py-1.5 hover:bg-white/[0.05] rounded-[var(--radius-sm)] transition-colors flex items-center justify-center"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={onJumpToCurrentWeek}
                        className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] hover:bg-white/[0.05] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Jump to current week"
                    >Week</button>
                    <button
                        onClick={() => onWeekChange('next')}
                        className="px-3 py-1.5 hover:bg-white/[0.05] rounded-[var(--radius-sm)] transition-colors flex items-center justify-center"
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
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-indigo-400"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--surface2) 75%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)'
                            }}
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
