import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, Maximize2, Minimize2, Clock, Pause, X, Coffee, Brain, SkipForward } from 'lucide-react';
import { Task } from '../../../types';
import { BoardTaskCard } from '../../tasks/BoardTaskCard';
import { formatDate, getAdjustedDate } from '../../../constants';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { useTimer } from '../../../context/TimerContext';

interface FocusModeProps {
    tasks: Task[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onToggleTaskComplete: (taskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    showCompleted: boolean;
}

export const FocusMode: React.FC<FocusModeProps> = ({ tasks, onDragStart, onToggleTaskComplete, onUpdateTask, showCompleted }) => {
    const todayStr = formatDate(getAdjustedDate());
    const isMobile = useIsMobile();

    // Consume Global Timer Context
    const {
        isTimerRunning,
        activeTaskId,
        elapsedTime,
        totalDurationSeconds,
        segments,
        currentPhaseInfo,
        isZenMode,
        startTask,
        stopTask,
        toggleTimer,
        skipPhase,
        setIsZenMode,
        formatTime
    } = useTimer();

    // -- Helpers --
    const priorityOrder: Record<string, number> = {
        'high': 1, 'medium': 2, 'low': 3, 'leisure': 4, 'backlog': 5, 'chores': 6
    };

    const focusTasks = (tasks || []).filter(t =>
        t.status === 'scheduled' &&
        t.dueDate === todayStr &&
        (showCompleted || t.status !== 'completed')
    ).sort((a, b) => {
        const pA = priorityOrder[a.type] || 99;
        const pB = priorityOrder[b.type] || 99;
        return pA - pB;
    });

    const activeTask = (tasks || []).find(t => t.id === activeTaskId);

    const handleCompleteActiveTask = () => {
        if (activeTaskId) {
            onToggleTaskComplete(activeTaskId);
            stopTask();
        }
    };

    // -- Derived State (Display Logic) --
    // Most logic moved to Context, purely UI here.

    // Timeline Render
    const renderTimeline = () => {
        if (!activeTask || segments.length === 0) return null;

        return (
            <div className="w-full h-8 flex items-center gap-1 mt-6 px-2">
                {segments.map((seg, idx) => {
                    const isActive = idx === (currentPhaseInfo?.index ?? -1);
                    const isPast = idx < (currentPhaseInfo?.index ?? -1);
                    const isFuture = idx > (currentPhaseInfo?.index ?? -1);

                    return (
                        <div
                            key={idx}
                            style={{ flexGrow: seg.duration, flexBasis: 0 }}
                            className={`
                                h-4 rounded-full relative transition-all duration-500
                                ${seg.type === 'break' ? 'mx-1' : ''}
                                ${isActive ? (seg.type === 'work' ? 'bg-emerald-500' : 'bg-blue-400') : ''}
                                ${isPast ? (seg.type === 'work' ? 'bg-emerald-900/40' : 'bg-blue-900/40') : ''}
                                ${isFuture ? (seg.type === 'work' ? 'bg-slate-700/30' : 'bg-slate-700/30') : ''}
                                ${isActive ? 'ring-2 ring-white/20 scale-y-125' : ''}
                            `}
                            title={`${seg.type.toUpperCase()}: ${seg.duration}m`}
                        >
                            {/* Marker lines for work blocks */}
                            {seg.type === 'work' && isActive && (
                                <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full" />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const displayTime = currentPhaseInfo?.remainingSeconds ?? 0;

    const realWorkRemaining = useMemo(() => {
        if (!currentPhaseInfo) return 0;
        let futureWork = 0;
        // Add full duration of future work segments
        for (let i = currentPhaseInfo.index + 1; i < segments.length; i++) {
            if (segments[i].type === 'work') futureWork += segments[i].duration;
        }
        // Add remaining of current if work
        if (currentPhaseInfo.segment.type === 'work') {
            futureWork += (currentPhaseInfo.remainingSeconds / 60);
        }
        return Math.floor(futureWork * 60);
    }, [currentPhaseInfo, segments]);


    if (isZenMode && activeTask) {
        // ... Zen Mode Implementation ... 
        // Reusing previous Zen structure but adapting values
        const isBreak = currentPhaseInfo?.type === 'break';
        const colorClass = isBreak ? 'text-blue-400' : 'text-emerald-400';
        const phaseLabel = isBreak ? 'Brain Break' : 'Deep Work';

        return (
            <div className="fixed inset-0 z-50 bg-[#0f1219] flex flex-col min-h-[100dvh] p-6 md:p-10">
                <div className="flex justify-end">
                    <button onClick={() => setIsZenMode(false)} className="p-3 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]">
                        <Minimize2 size={24} />
                    </button>
                </div>

                <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-between text-center gap-8 md:gap-12">
                    <div className="space-y-2 px-2">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border ${isBreak ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'}`}>
                            {isBreak ? <Coffee size={14} /> : <Brain size={14} />}
                            {phaseLabel}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight mt-4">
                            {activeTask.title}
                        </h1>
                        <p className="text-slate-500 text-sm md:text-lg flex items-center justify-center gap-2">
                            <Clock size={16} /> Total Remaining: {formatTime(realWorkRemaining)}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-full max-w-[300px] md:max-w-[360px]">
                            {/* Simple Circle or just Big Text for now to ensure robustness */}
                            <div className={`text-[18vw] md:text-9xl font-mono font-bold leading-none tracking-tighter tabular-nums text-white`}>
                                {formatTime(displayTime)}
                            </div>
                            {renderTimeline()}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
                        <button onClick={skipPhase} className="p-4 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all">
                            <SkipForward size={24} />
                        </button>
                        <button onClick={toggleTimer} className="p-5 md:p-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all border border-white/[0.1]">
                            {isTimerRunning ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                        </button>
                        <button onClick={handleCompleteActiveTask} className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-white font-bold text-base md:text-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3">
                            <CheckCircle2 size={20} /> Mark Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main UI
    // Summary stats
    const totalTasks = focusTasks.length;
    const totalMinutes = focusTasks.reduce((acc, t) => acc + t.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return (
        <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
            <div className={`max-w-7xl mx-auto ${isMobile ? 'mt-6' : 'mt-8'} w-full px-2 sm:px-6`}>
                <div className="mb-8 text-center flex flex-col items-center gap-1">
                    <h2 className="text-3xl font-display font-bold text-white mb-1">Deep Focus</h2>
                    <p className="text-sm text-slate-500 font-medium">
                        Today total: {totalTasks} tasks · {timeString} planned
                    </p>
                    <p className="text-xs text-slate-500/80 max-w-lg mx-auto mt-2 leading-relaxed">
                        Pomodoro-style work cycles: structured focus blocks and short recovery breaks that help you concentrate longer and make steady progress.
                    </p>
                </div>

                <div className="space-y-8 max-w-4xl mx-auto w-full px-2">
                    {activeTaskId && activeTask ? (
                        <div className="w-full">
                            <div className="relative group">
                                <div className={`absolute inset-0 blur-xl rounded-3xl transition-colors duration-1000 ${currentPhaseInfo?.type === 'break' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}></div>
                                <div className="relative bg-theme-secondary border border-theme rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            {currentPhaseInfo ? (
                                                <AnimatePresence mode="wait">
                                                    <motion.span
                                                        key={currentPhaseInfo.type}
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        transition={{ duration: 0.3 }}
                                                        className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${currentPhaseInfo.type === 'break' ? 'text-blue-400' : 'text-emerald-400'}`}
                                                    >
                                                        {currentPhaseInfo.type === 'break' ? <Coffee size={14} /> : <Brain size={14} />}
                                                        {currentPhaseInfo.type === 'break' ? 'Break Phase' : 'Focus Phase'}
                                                    </motion.span>
                                                </AnimatePresence>
                                            ) : (
                                                <span className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-emerald-400">
                                                    <Brain size={14} />
                                                    Focus Phase
                                                </span>
                                            )}
                                            <h3 className="text-2xl font-bold text-theme-primary leading-tight">{activeTask.title}</h3>
                                        </div>
                                        <button onClick={() => setIsZenMode(true)} className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-strong rounded-lg">
                                            <Maximize2 size={20} />
                                        </button>
                                    </div>

                                    {/* Timer Display */}
                                    <div className="flex flex-col items-center py-4">
                                        <div className={`font-mono text-6xl md:text-7xl font-bold tabular-nums mb-2 text-theme-primary`}>
                                            {formatTime(displayTime)}
                                        </div>
                                        <p className="text-theme-secondary text-sm font-medium flex items-center gap-2">
                                            <Clock size={14} /> Total Work Remaining: {formatTime(realWorkRemaining)}
                                        </p>

                                        {renderTimeline()}
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-center gap-4 mt-6">
                                        <button onClick={skipPhase} className="p-3 text-theme-secondary hover:text-theme-primary transition-colors" title="Skip Phase">
                                            <SkipForward size={20} />
                                        </button>

                                        <button onClick={toggleTimer} className="h-14 w-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-secondary)] flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
                                            {isTimerRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                        </button>

                                        <button onClick={handleCompleteActiveTask} className="p-3 text-emerald-500 hover:text-emerald-400 transition-colors" title="Mark Done">
                                            <CheckCircle2 size={24} />
                                        </button>
                                        <button onClick={stopTask} className="p-3 text-theme-secondary hover:text-rose-400 transition-colors" title="Stop">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full border-dashed border-2 border-slate-800/50 bg-slate-900/20 rounded-2xl p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-slate-800/30 flex items-center justify-center mb-4 text-slate-600">
                                <Play size={32} fill="currentColor" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-500 mb-2">Ready to focus?</h3>
                            <p className="text-slate-600">Pick a task below to start a deep work session</p>
                        </div>
                    )}

                    {/* Queue List */}
                    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 px-4 md:px-0">
                        {focusTasks.filter(t => t.id !== activeTaskId).map((task) => (
                            <div key={task.id} className="flex items-center gap-3 w-full">
                                <div className="flex-1 min-w-0">
                                    <BoardTaskCard
                                        task={task}
                                        onDragStart={() => { }}
                                        onToggleComplete={onToggleTaskComplete}
                                        onUpdateTask={onUpdateTask}
                                        viewMode={showCompleted ? 'show' : 'fade'}
                                    />
                                </div>
                                <button
                                    onClick={() => startTask(task)}
                                    className="h-10 w-10 rounded-full bg-zinc-100 text-emerald-500/80 hover:bg-emerald-500 hover:text-white transition-all shrink-0 flex items-center justify-center shadow-sm"
                                >
                                    <Play size={18} fill="currentColor" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
