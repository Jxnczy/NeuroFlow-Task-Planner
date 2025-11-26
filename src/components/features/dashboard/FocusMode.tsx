import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Maximize2, Minimize2, Clock, Pause, RotateCcw, X } from 'lucide-react';
import { Task } from '../../../types';
import { TaskCard } from '../../TaskCard';
import { formatDate, getAdjustedDate } from '../../../constants';

interface FocusModeProps {
    tasks: Task[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onToggleTaskComplete: (taskId: string) => void;
    onStartFocus: (taskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    showCompleted: boolean;
}

export const FocusMode: React.FC<FocusModeProps> = ({ tasks, onDragStart, onToggleTaskComplete, onStartFocus, onUpdateTask, showCompleted }) => {
    // Use adjusted date so Focus Mode shows "Yesterday's" tasks until 5 AM
    const todayStr = formatDate(getAdjustedDate());
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [isZenMode, setIsZenMode] = useState(false);
    const [timer, setTimer] = useState(25 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const priorityOrder: Record<string, number> = {
        'high': 1,
        'medium': 2,
        'low': 3,
        'leisure': 4,
        'backlog': 5,
        'chores': 6
    };

    const focusTasks = tasks.filter(t =>
        t.status === 'scheduled' &&
        t.dueDate === todayStr &&
        (showCompleted || t.status !== 'completed')
    ).sort((a, b) => {
        const pA = priorityOrder[a.type] || 99;
        const pB = priorityOrder[b.type] || 99;
        return pA - pB;
    });

    const activeTask = tasks.find(t => t.id === activeTaskId);

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
        } else if (timer === 0) {
            setIsTimerRunning(false);
            // Optional: Play sound
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartTask = (taskId: string) => {
        setActiveTaskId(taskId);
        setTimer(25 * 60);
        setIsTimerRunning(true);
        onStartFocus(taskId);
    };

    const handleCompleteActiveTask = () => {
        if (activeTaskId) {
            onToggleTaskComplete(activeTaskId);
            setActiveTaskId(null);
            setIsTimerRunning(false);
            setIsZenMode(false);
        }
    };

    const handleStopTask = () => {
        setIsTimerRunning(false);
        setActiveTaskId(null);
        setIsZenMode(false);
    };

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimer(25 * 60);
    };

    if (isZenMode && activeTask) {
        return (
            <div className="fixed inset-0 z-50 bg-[#0f1219] flex flex-col items-center justify-center p-8">
                <button
                    onClick={() => setIsZenMode(false)}
                    className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <Minimize2 size={24} />
                </button>

                <div className="max-w-4xl w-full text-center space-y-8">
                    <div className="space-y-2">
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
                        <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
                            {activeTask.title}
                        </h1>
                    </div>

                    <div className="flex flex-col items-center gap-8">
                        <div className="text-[12rem] font-mono font-bold text-slate-200 leading-none tracking-tighter tabular-nums">
                            {formatTime(timer)}
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={toggleTimer}
                                className="p-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all border border-white/[0.1]"
                            >
                                {isTimerRunning ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
                            </button>
                            <button
                                onClick={handleCompleteActiveTask}
                                className="px-12 py-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3"
                            >
                                <CheckCircle2 size={24} />
                                Mark Done
                            </button>
                            <button
                                onClick={handleStopTask}
                                className="p-6 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                                title="Stop Focus"
                            >
                                <X size={32} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto mt-10 px-8">
                <div className="mb-8 text-center md:text-left flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white mb-1">Deep Focus Mode</h2>
                        <p className="text-sm text-slate-500 font-medium">
                            Today total: {totalTasks} tasks · {timeString} planned
                        </p>
                    </div>
                    {/* Optional: Start First Task Button if idle */}
                    {!activeTask && focusTasks.length > 0 && (
                        <button
                            onClick={() => handleStartTask(focusTasks[0].id)}
                            className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-bold flex items-center gap-2"
                        >
                            <Play size={16} fill="currentColor" />
                            Start first task
                        </button>
                    )}
                </div>

                <div className="space-y-8">
                    {/* Active Task Section */}
                    {activeTask ? (
                        <div className="w-full">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-3xl"></div>
                                <div className="relative bg-[#1e2338] border border-emerald-500/50 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">Active Now</span>
                                            <h3 className="text-2xl font-bold text-white leading-tight">{activeTask.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => setIsZenMode(true)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
                                        >
                                            <Maximize2 size={20} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between bg-[#0f1219]/50 rounded-xl p-4 border border-white/[0.05]">
                                        <div className="font-mono text-3xl font-bold text-emerald-400 tabular-nums">
                                            {formatTime(timer)}
                                        </div>
                                        <div className="flex items-center gap-2">
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
                        /* Idle State Placeholder */
                        <div className="w-full border-dashed border-2 border-emerald-400/30 bg-slate-900/40 rounded-2xl p-8 text-center">
                            <h3 className="text-xl font-bold text-slate-300 mb-2">No active deep work session</h3>
                            <p className="text-slate-500">Pick a task from your queue to start</p>
                        </div>
                    )}

                    {/* Queue List */}
                    <div className="space-y-4">
                        {focusTasks.filter(t => t.id !== activeTaskId).map((task, index) => (
                            <div key={task.id} className="flex items-center gap-4 group">
                                <div className="flex-1">
                                    <TaskCard
                                        task={task}
                                        variant="deepwork"
                                        index={index}
                                        onUpdate={onUpdateTask}
                                        onDelete={() => { }}
                                        onToggleComplete={onToggleTaskComplete}
                                        onDragStart={onDragStart}
                                    />
                                </div>
                                <button
                                    onClick={() => handleStartTask(task.id)}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-bold flex items-center gap-2 shrink-0"
                                >
                                    <Play size={16} fill="currentColor" />
                                    Start
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
                </div>
            </div>
        </div>
    );
};
