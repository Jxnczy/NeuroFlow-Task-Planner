import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Target, ListChecks, Notebook, BarChart3, ChevronLeft, ChevronRight, Moon, PanelLeft } from 'lucide-react';
import { formatDate, getWeekDays, isLateNight } from '../../constants';
import { pulseScale } from '../../utils/animations';
import { getSpacesEnabled } from '../../state/features';
import { getSpace, setSpace } from '../../state/space';

import { WeekFluxLogo } from '../../brand/WeekFluxLogo';
import { useLanguage } from '../../context/LanguageContext';
import { useCalendarEnabled } from '../../hooks/useCalendarEnabled';

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

    // Spaces Hooks
    const spacesEnabled = getSpacesEnabled();
    const currentSpace = getSpace();
    // Force re-render on storage events (handled slightly differently in React usually, 
    // but we can use a simple listener or just rely on parent re-renders if state was lifted. 
    // For now, let's use a local effect to listen to the custom event we dispatch)
    const [spaceState, setSpaceState] = useState(currentSpace);
    const [spacesEnabledState, setSpacesEnabledState] = useState(spacesEnabled);
    const { t, language } = useLanguage();
    const { isCalendarEnabled, isPriorityOnly, isTimelineOnly } = useCalendarEnabled();

    useEffect(() => {
        const handleStorage = () => {
            setSpaceState(getSpace());
            setSpacesEnabledState(getSpacesEnabled());
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const tabs = [
        { id: 'planner', label: t.header.planner, icon: CalendarDays },
        { id: 'focus', label: t.header.focus, icon: Target },
        { id: 'braindump', label: t.header.notes, icon: Notebook },
        { id: 'habits', label: t.header.habits, icon: ListChecks },
        { id: 'analytics', label: t.header.stats, icon: BarChart3 },
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
                <div className="flex items-center gap-3 pointer-events-auto min-w-0 shrink z-10 w-fit">
                    {!isSidebarOpen && (
                        <>
                            <div className="mr-2">
                                <WeekFluxLogo size="md" showText={false} layoutId="brandmark" />
                            </div>
                            <button
                                onClick={onToggleSidebar}
                                className="btn-icon"
                                title={t.header.openSidebar}
                            >
                                <PanelLeft size={20} />
                            </button>
                        </>
                    )}

                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <p className="text-sm lg:text-base font-display font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                            {currentWeekDays[0].toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' })} — {currentWeekDays[6].toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' })}, {currentWeekDays[0].getFullYear()}
                        </p>
                    </div>

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
                            className="px-1.5 py-1 hover:bg-white/[0.05] rounded-lg transition-colors flex items-center justify-center"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={onJumpToCurrentWeek}
                            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Jump to current week"
                        >{t.header.week}</button>
                        <button
                            onClick={() => onWeekChange('next')}
                            className="px-1.5 py-1 hover:bg-white/[0.05] rounded-lg transition-colors flex items-center justify-center"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Spaces Switcher */}
                    {spacesEnabledState && (
                        <div
                            className="flex items-center p-1 rounded-xl border shadow-sm backdrop-blur-md shrink-0"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)',
                                borderColor: 'var(--border-medium)'
                            }}
                        >
                            <button
                                onClick={() => setSpace('private')}
                                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 whitespace-nowrap ${spaceState === 'private'
                                    ? 'bg-white/[0.08] text-[var(--text-primary)] shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
                            >
                                {t.header.private}
                            </button>
                            <button
                                onClick={() => setSpace('work')}
                                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 whitespace-nowrap ${spaceState === 'work'
                                    ? 'bg-white/[0.08] text-[var(--text-primary)] shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
                            >
                                {t.header.work}
                            </button>
                        </div>
                    )}
                </div>

                {/* CENTER: Navigation Tabs (Premium Dock) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-0">
                    <nav
                        className="flex items-center gap-1 p-1 rounded-full shadow-lg backdrop-blur-xl border transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-surface-strong)',
                            borderColor: 'var(--border)'
                        }}
                    >
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 outline-none"
                                    style={{
                                        color: isActive ? 'var(--text)' : 'var(--text-muted)',
                                    }}
                                >
                                    {/* Active Indicator (Pill) */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabPill"
                                            className="absolute inset-0 rounded-full border shadow-sm"
                                            style={{
                                                backgroundColor: 'var(--surface)',
                                                borderColor: 'var(--border)'
                                            }}
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                        />
                                    )}

                                    <Icon size={14} className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-[var(--accent)]' : ''}`} />
                                    <span className={`relative z-10 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300`}>{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* RIGHT: View Switcher (Priority/Calendar) */}
                <div className="flex items-center gap-4 pointer-events-auto min-w-0 shrink justify-end z-20 flex-1 xl:flex-none">
                    {/* Late Night Badge */}
                    <AnimatePresence>
                        {isLateNightSession && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 whitespace-nowrap"
                            >
                                <Moon size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t.header.lateNight}</span>
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
                            {/* Priority View Button: Show if NOT Timeline Only */}
                            {!isTimelineOnly && (
                                <button
                                    onClick={() => {
                                        setIsStacked(false);
                                        setDayViewMode('list');
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${dayViewMode === 'list' ? 'bg-white/[0.08] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'} ${isPriorityOnly ? 'cursor-default pointer-events-none' : ''}`}
                                >
                                    <ListChecks size={14} />
                                    <span>{t.header.priority}</span>
                                </button>
                            )}

                            {/* Calendar View Button: Show if NOT Priority Only */}
                            {!isPriorityOnly && (
                                <button
                                    onClick={() => {
                                        setDayViewMode('timeline');
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${dayViewMode === 'timeline' ? 'bg-white/[0.08] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'} ${isTimelineOnly ? 'cursor-default pointer-events-none' : ''}`}
                                >
                                    <CalendarDays size={14} />
                                    <span>{t.header.calendar}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
