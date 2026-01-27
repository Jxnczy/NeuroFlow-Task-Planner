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
    dayViewMode: 'list' | 'timeline';
    setDayViewMode: (mode: 'list' | 'timeline') => void;
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
    dayViewMode,
    setDayViewMode,
    isSidebarOpen,
    onToggleSidebar
}) => {
    const currentWeekDays = getWeekDays(currentDate);
    const isLateNightSession = isLateNight();

    const tabs = [
        { id: 'planner', label: 'Planner', icon: CalendarDays },
        { id: 'focus', label: 'Deep Focus', icon: Target },
        { id: 'braindump', label: 'Notes', icon: Notebook },
        { id: 'habits', label: 'Habits', icon: ListChecks },
        { id: 'analytics', label: 'Stats', icon: BarChart3 },
    ];

    return (
        <div
            className="hidden md:flex justify-center border-b sticky top-0 z-50 transition-colors duration-300 backdrop-blur-md"
            style={{
                backgroundColor: 'var(--header-bg)',
                borderColor: 'var(--border)'
            }}
        >
            <div className="w-full px-6 flex items-center justify-between py-3">
                {/* LEFT: Week Navigation & Date */}
                <div className="flex items-center gap-6 pointer-events-auto min-w-0 shrink z-10">
                    {!isSidebarOpen && (
                        <button
                            onClick={onToggleSidebar}
                            className="btn-icon"
                            title="Open Sidebar"
                        >
                            <PanelLeft size={20} />
                        </button>
                    )}

                    {/* Week Switcher */}
                    <div
                        className="flex items-center gap-1 rounded-xl p-1 border shadow-sm backdrop-blur-md justify-center shrink-0"
                        style={{
                            backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)',
                            borderColor: 'var(--border-medium)'
                        }}
                    >
                        <button
                            onClick={() => onWeekChange('prev')}
                            className="px-2 py-1.5 hover:bg-white/[0.05] rounded-lg transition-colors flex items-center justify-center"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={onJumpToCurrentWeek}
                            className="px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-white/[0.05] rounded-md transition-colors cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Jump to current week"
                        >Week</button>
                        <button
                            onClick={() => onWeekChange('next')}
                            className="px-2 py-1.5 hover:bg-white/[0.05] rounded-lg transition-colors flex items-center justify-center"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-3">
                        <p className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                            {currentWeekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {currentWeekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {currentWeekDays[0].getFullYear()}
                        </p>
                    </div>
                </div>

                {/* CENTER: Navigation Tabs (Premium Dock) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10">
                    <nav className="flex items-center gap-1 p-1 bg-[#0A0C10] border border-white/10 rounded-full shadow-2xl backdrop-blur-xl">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 outline-none"
                                    style={{
                                        color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                    }}
                                >
                                    {/* Active Indicator (Pill) */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabPill"
                                            className="absolute inset-0 bg-[#1F232D] rounded-full border border-white/10 shadow-inner"
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                        />
                                    )}

                                    <Icon size={16} className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-[var(--accent)]' : ''}`} />
                                    <span className={`relative z-10 text-xs font-bold uppercase tracking-widest transition-colors duration-300`}>{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* RIGHT: View Switcher (Priority/Calendar) */}
                <div className="flex items-center gap-4 pointer-events-auto min-w-0 shrink justify-end z-20">
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
                                <span className="text-[10px] font-bold uppercase tracking-wider">Late Night</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === 'planner' && (
                        <div
                            className="flex items-center p-1 rounded-xl border shadow-sm backdrop-blur-md"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)',
                                borderColor: 'var(--border-medium)'
                            }}
                        >
                            <button
                                onClick={() => {
                                    setIsStacked(false);
                                    setDayViewMode('list');
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${dayViewMode === 'list' ? 'bg-white/[0.08] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            >
                                <ListChecks size={14} />
                                <span>Priority</span>
                            </button>
                            <button
                                onClick={() => {
                                    setDayViewMode('timeline');
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${dayViewMode === 'timeline' ? 'bg-white/[0.08] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            >
                                <CalendarDays size={14} />
                                <span>Calendar</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
