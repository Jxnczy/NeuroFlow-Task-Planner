import React from 'react';
import { CalendarDays, Target, Flame, Timer, ListChecks, Notebook, BarChart3, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, getWeekDays } from '../../constants';

interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    currentDate: Date;
    onWeekChange: (direction: 'prev' | 'next') => void;
    isStacked: boolean;
    setIsStacked: (stacked: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTab,
    setActiveTab,
    currentDate,
    onWeekChange,
    isStacked,
    setIsStacked
}) => {
    const currentWeekDays = getWeekDays(currentDate);

    const tabs = [
        { id: 'planner', label: 'Planner', icon: CalendarDays },
        { id: 'focus', label: 'Deep Work', icon: Target },
        { id: 'braindump', label: 'Brain Dump', icon: Notebook },
        { id: 'habits', label: 'Habits', icon: ListChecks },
        { id: 'analytics', label: 'Stats', icon: BarChart3 },
    ];

    return (
        <div className="flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#0f1219]/80 border-b border-white/[0.08] sticky top-0 z-50">
            {/* LEFT: Overview & Date */}
            <div className="flex flex-col justify-center pointer-events-auto min-w-[200px]">
                <h1 className="text-xl font-display font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                    Overview
                </h1>
                <p className="text-[10px] text-slate-400 font-medium ml-0.5">
                    {currentWeekDays[0].toLocaleDateString('en-US', { month: 'short' })} {currentWeekDays[0].getDate()} — {currentWeekDays[6].getDate()}, {currentWeekDays[0].getFullYear()}
                </p>
            </div>

            {/* CENTER: Navigation Tabs & Stack Toggle */}
            <div className="pointer-events-auto flex items-center gap-3">
                {/* Stack Toggle (Only visible on Planner tab) */}
                {activeTab === 'planner' && (
                    <button
                        onClick={() => setIsStacked(!isStacked)}
                        className={`
                            flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-300 shadow-lg backdrop-blur-md
                            ${isStacked
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                                : 'bg-[#1e2338]/70 border-white/[0.1] text-slate-400 hover:text-white hover:bg-white/[0.1]'
                            }
                        `}
                    >
                        <Layers size={14} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">{isStacked ? 'Unstack' : 'Stack'}</span>
                    </button>
                )}

                {/* Main Menu */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#1e2338]/70 backdrop-blur-xl border border-white/[0.1] shadow-2xl">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300
                                    ${isActive
                                        ? 'text-white shadow-lg bg-white/[0.08]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                                    }
                                `}
                            >
                                <Icon size={14} className={isActive ? 'text-cyan-400' : ''} />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none border border-white/[0.05]"></div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT: Week Navigation */}
            <div className="pointer-events-auto flex items-center gap-1 bg-[#1e2338]/70 rounded-xl p-1 border border-white/[0.1] shadow-inner backdrop-blur-md min-w-[120px] justify-center">
                <button onClick={() => onWeekChange('prev')} className="px-3 py-1.5 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                    <ChevronLeft size={14} />
                </button>
                <div className="px-2 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Week</div>
                <button onClick={() => onWeekChange('next')} className="px-3 py-1.5 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};
