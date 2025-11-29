import React, { useState, useEffect, useRef } from 'react';
import { CalendarDays, Target, Flame, Timer, ListChecks, Notebook, BarChart3, Layers, ChevronLeft, ChevronRight, Moon, ChevronDown, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { formatDate, getWeekDays, isLateNight } from '../../constants';

interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    currentDate: Date;
    onWeekChange: (direction: 'prev' | 'next') => void;
    isStacked: boolean;
    setIsStacked: (stacked: boolean) => void;
    showCompleted: boolean;
    setShowCompleted: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTab,
    setActiveTab,
    currentDate,
    onWeekChange,
    isStacked,
    setIsStacked,
    showCompleted,
    setShowCompleted
}) => {
    const currentWeekDays = getWeekDays(currentDate);
    const isLateNightSession = isLateNight();
    const [isPlannerMenuOpen, setIsPlannerMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsPlannerMenuOpen(false);
            }
        };

        if (isPlannerMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPlannerMenuOpen]);

    const tabs = [
        { id: 'planner', label: 'Planner', icon: CalendarDays },
        { id: 'focus', label: 'Deep Work', icon: Target },
        { id: 'braindump', label: 'Brain Dump', icon: Notebook },
        { id: 'habits', label: 'Habits', icon: ListChecks },
        { id: 'analytics', label: 'Stats', icon: BarChart3 },
    ];

    return (
        <div
            className="flex items-center justify-between px-6 py-4 backdrop-blur-md border-b sticky top-0 z-50"
            style={{
                backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
                borderColor: 'var(--border-medium)'
            }}
        >
            {/* LEFT: Overview & Date */}
            <div className="flex flex-col justify-center pointer-events-auto min-w-[200px]">
                <h1
                    className="text-xl font-display font-extrabold tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Overview
                </h1>
                <p className="text-[10px] font-medium ml-0.5" style={{ color: 'var(--text-muted)' }}>
                    {currentWeekDays[0].toLocaleDateString('en-US', { month: 'short' })} {currentWeekDays[0].getDate()} — {currentWeekDays[6].getDate()}, {currentWeekDays[0].getFullYear()}
                </p>
            </div>

            {/* CENTER: Navigation Tabs */}
            <div className="pointer-events-auto flex items-center gap-3 relative" ref={menuRef}>
                {/* Main Menu */}
                <div
                    className="flex items-center gap-1 p-1 rounded-2xl backdrop-blur-xl border shadow-2xl"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 70%, transparent)',
                        borderColor: 'var(--border-medium)'
                    }}
                >
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        const isPlanner = tab.id === 'planner';

                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (isPlanner && isActive) {
                                        setIsPlannerMenuOpen(!isPlannerMenuOpen);
                                    } else {
                                        setActiveTab(tab.id);
                                        if (isPlanner) setIsPlannerMenuOpen(true);
                                        else setIsPlannerMenuOpen(false);
                                    }
                                }}
                                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                                style={{
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
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
                                {isPlanner && (
                                    <ChevronDown
                                        size={12}
                                        className={`transition-transform duration-300 ${isPlannerMenuOpen && isActive ? 'rotate-180' : ''}`}
                                        style={{ opacity: 0.5 }}
                                    />
                                )}
                                {isActive && (
                                    <div
                                        className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none border"
                                        style={{ borderColor: 'var(--border-light)' }}
                                    ></div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Planner Dropdown Menu */}
                {isPlannerMenuOpen && activeTab === 'planner' && (
                    <div
                        className="absolute top-full left-0 mt-2 w-48 p-1.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-medium)'
                        }}
                    >
                        <div className="flex flex-col gap-1">
                            {/* Layout Toggle */}
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">View Layout</div>
                            <button
                                onClick={() => setIsStacked(!isStacked)}
                                className="flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group"
                                style={{
                                    backgroundColor: isStacked ? 'var(--accent-muted)' : 'transparent',
                                    color: isStacked ? 'var(--accent)' : 'var(--text-secondary)'
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {isStacked ? <Layers size={14} /> : <LayoutGrid size={14} />}
                                    <span className="text-[11px] font-medium">{isStacked ? 'Stacked' : 'Grid'}</span>
                                </div>
                                {isStacked && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </button>

                            {/* Visibility Toggle - Only show in Grid Mode */}
                            {!isStacked && (
                                <>
                                    <div className="h-px w-full my-1 bg-white/5" />
                                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">Completed Tasks</div>
                                    <button
                                        onClick={() => setShowCompleted(!showCompleted)}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group"
                                        style={{
                                            backgroundColor: !showCompleted ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                            color: !showCompleted ? '#34d399' : 'var(--text-secondary)'
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {!showCompleted ? <EyeOff size={14} /> : <Eye size={14} />}
                                            <span className="text-[11px] font-medium">{!showCompleted ? 'Fade Done' : 'Show Done'}</span>
                                        </div>
                                        {!showCompleted && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Week Navigation & Late Night Badge */}
            <div className="pointer-events-auto flex items-center gap-3">
                <div
                    className="flex items-center gap-1 rounded-xl p-1 border shadow-inner backdrop-blur-md min-w-[120px] justify-center"
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
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Week</div>
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
                {isLateNightSession && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Moon size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Late Night Session</span>
                    </div>
                )}
            </div>
        </div>
    );
};
