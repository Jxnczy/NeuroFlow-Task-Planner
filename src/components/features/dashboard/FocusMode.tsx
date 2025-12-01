import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Maximize2, Minimize2, Clock, Pause, RotateCcw, X } from 'lucide-react';
import { Task } from '../../../types';
import { BoardTaskCard } from '../../tasks/BoardTaskCard';
import { formatDate, getAdjustedDate } from '../../../constants';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { useRef } from 'react';

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
    const wakeLockRef = useRef<any>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [isZenMode, setIsZenMode] = useState(false);
    const [timer, setTimer] = useState(0); // Will be set based on task duration
    const [initialDuration, setInitialDuration] = useState(0); // Store initial duration for reset
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const priorityOrder: Record<string, number> = {
        'high': 1,
        'medium': 2,
        'low': 3,
        'leisure': 4,
        'backlog': 5,
        'chores': 6
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

    // Calculate summary stats
    const totalTasks = focusTasks.length;
    const totalMinutes = focusTasks.reduce((acc, t) => acc + t.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    useEffect(() => {
        let interval: number;
        if (isTimerRunning && timer > 0) {
            interval = window.setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && isTimerRunning) {
            setIsTimerRunning(false);
            // Timer finished - could add notification here
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    // Keep screen awake during focus timer
    useEffect(() => {
        let cancelled = false;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator && isTimerRunning) {
                    const sentinel = await (navigator as any).wakeLock.request('screen');
                    if (!cancelled) {
                        wakeLockRef.current = sentinel;
                        sentinel.addEventListener('release', () => {
                            wakeLockRef.current = null;
                        });
                    } else {
                        await sentinel.release();
                    }
                }
            } catch {
                // Ignore wake lock errors
            }
        };
        requestWakeLock();
        return () => {
            cancelled = true;
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => {});
                wakeLockRef.current = null;
            }
        };
    }, [isTimerRunning]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate progress percentage
    const timerProgress = initialDuration > 0 ? ((initialDuration - timer) / initialDuration) * 100 : 0;

    const handleStartTask = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const durationSeconds = task.duration * 60; // Convert minutes to seconds
            setActiveTaskId(taskId);
            setTimer(durationSeconds);
            setInitialDuration(durationSeconds);
            setIsTimerRunning(true);
            onStartFocus(taskId);
        }
    };

    const handleCompleteActiveTask = () => {
        if (activeTaskId) {
            onToggleTaskComplete(activeTaskId);
            setActiveTaskId(null);
            setIsTimerRunning(false);
            setIsZenMode(false);
            setTimer(0);
            setInitialDuration(0);
        }
    };

    const handleStopTask = () => {
        setIsTimerRunning(false);
        setActiveTaskId(null);
        setIsZenMode(false);
        setTimer(0);
        setInitialDuration(0);
    };

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimer(initialDuration);
    };

    // Zen Mode (fullscreen focus)
    if (isZenMode && activeTask) {
        return (
            <div className="fixed inset-0 z-50 bg-[#0f1219] flex flex-col min-h-[100dvh] p-6 md:p-10">
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsZenMode(false)}
                        className="p-3 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]"
                        aria-label="Exit Zen mode"
                    >
                        <Minimize2 size={24} />
                    </button>
                </div>

                <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-between text-center gap-8 md:gap-12">
                    <div className="space-y-2 px-2">
                        <span
                            className="inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border"
                            style={{
                                backgroundColor: 'var(--accent-muted)',
                                color: 'var(--accent)',
                                borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)'
                            }}
                        >
                            Current Focus
                        </span>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
                            {activeTask.title}
                        </h1>
                        <p className="text-slate-500 text-sm md:text-lg flex items-center justify-center gap-2">
                            <Clock size={16} />
                            Estimated: {activeTask.duration} minutes
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-full max-w-[300px] md:max-w-[360px]">
                            <svg className="w-full h-auto aspect-square -rotate-90">
                                <circle
                                    cx="160"
                                    cy="160"
                                    r="140"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="160"
                                    cy="160"
                                    r="140"
                                    fill="none"
                                    stroke="var(--accent)"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 140}
                                    strokeDashoffset={2 * Math.PI * 140 * (1 - timerProgress / 100)}
                                    className="transition-all duration-1000 ease-linear"
                                    style={{ filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-[18vw] md:text-9xl font-mono font-bold text-slate-200 leading-none tracking-tighter tabular-nums">
                                    {formatTime(timer)}
                                </div>
                        </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
                        <button
                            onClick={resetTimer}
                            className="p-4 md:p-5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all border border-white/[0.1]"
                            title="Reset Timer"
                        >
                            <RotateCcw size={24} />
                        </button>
                        <button
                            onClick={toggleTimer}
                            className="p-5 md:p-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all border border-white/[0.1]"
                        >
                            {isTimerRunning ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                        </button>
                        <button
                            onClick={handleCompleteActiveTask}
                            className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-white font-bold text-base md:text-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3 border border-emerald-500/40"
                        >
                            <CheckCircle2 size={20} />
                            Mark Done
                        </button>
                        <button
                            onClick={handleStopTask}
                            className="p-4 md:p-5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                            title="Stop Focus"
                        >
                            <X size={26} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
            <div className={`max-w-7xl mx-auto ${isMobile ? 'mt-6' : 'mt-8'} w-full px-2 sm:px-6`}>
                <div className="mb-8 text-center flex flex-col items-center gap-1">
                    <h2 className="text-3xl font-display font-bold text-white mb-1">Deep Focus</h2>
                    <p className="text-sm text-slate-500 font-medium">
                        Today total: {totalTasks} tasks · {timeString} planned
                    </p>
                </div>

                <div className="space-y-8 max-w-4xl mx-auto w-full px-2">
                    {/* Active Task Section */}
                    {activeTask ? (
                        <div className="w-full">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-3xl"></div>
                                <div className="relative bg-[#1e2338] border border-emerald-500/50 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">Active Now · Task 1 of {focusTasks.length}</span>
                                            <h3 className="text-2xl font-bold text-white leading-tight">{activeTask.title}</h3>
                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                                <Clock size={14} />
                                                {activeTask.duration} min estimated
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsZenMode(true)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
                                        >
                                            <Maximize2 size={20} />
                                        </button>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-4">
                                        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-linear"
                                                style={{ width: `${timerProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                            <span>{Math.round(timerProgress)}% complete</span>
                                            <span>{Math.ceil(timer / 60)} min remaining</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-[#0f1219]/50 rounded-xl p-4 border border-white/[0.05]">
                                        <div className="font-mono text-3xl font-bold text-emerald-400 tabular-nums">
                                            {formatTime(timer)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={resetTimer}
                                                className="p-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                                                title="Reset Timer"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                            <button
                                                onClick={toggleTimer}
                                                className="p-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors"
                                            >
                                                {isTimerRunning ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                                            </button>
                                            <button
                                                onClick={handleCompleteActiveTask}
                                                className="px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-colors flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={16} />
                                                Done
                                            </button>
                                            <button
                                                onClick={handleStopTask}
                                                className="p-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                                title="Stop Focus"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full border-dashed border-2 border-slate-800/50 bg-slate-900/20 rounded-2xl p-8 text-center">
                            <h3 className="text-xl font-bold text-slate-500 mb-2">No active deep work session</h3>
                            <p className="text-slate-600">Pick a task from your queue to start</p>
                        </div>
                    )}

                    {/* Queue List */}
                    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 px-4 md:px-0">
                        {focusTasks.filter(t => t.id !== activeTaskId).map((task, index) => (
                            <div key={task.id} className="flex items-center gap-3 w-full">
                                <div className="flex-1 min-w-0">
                                    <BoardTaskCard
                                        task={task}
                                        onDragStart={() => {}}
                                        onToggleComplete={onToggleTaskComplete}
                                        onUpdateTask={onUpdateTask}
                                        viewMode={showCompleted ? 'show' : 'fade'}
                                    />
                                </div>
                                <button
                                    onClick={() => handleStartTask(task.id)}
                                    className="h-12 w-12 md:h-10 md:w-10 rounded-full bg-slate-800/50 text-slate-500 hover:bg-emerald-500 hover:text-white transition-all shrink-0 flex items-center justify-center"
                                    title={`Start: ${task.title}`}
                                >
                                    <Play size={20} fill="currentColor" />
                                </button>
                            </div>
                        ))}
                        {focusTasks.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-lg">No focus tasks for today.</p>
                                <p className="text-sm mt-2">Schedule tasks to "Focus" or "Goal" to see them here.</p>
                            </div>
                        )}
                    </div>
                </div >
            </div >
        </div >
    );
};
