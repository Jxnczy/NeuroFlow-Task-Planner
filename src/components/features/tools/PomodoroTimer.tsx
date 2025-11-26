import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Task } from '../../../types';

interface PomodoroTimerProps {
    pomodoroTime: number;
    setPomodoroTime: React.Dispatch<React.SetStateAction<number>>;
    isTimerRunning: boolean;
    setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
    activeTaskId: string | null;
    tasks: Task[];
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
    pomodoroTime, setPomodoroTime, isTimerRunning, setIsTimerRunning, activeTaskId, tasks
}) => {
    const activeTask = tasks.find(t => t.id === activeTaskId);
    const progress = 1 - (pomodoroTime / (25 * 60));

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-full flex items-center justify-center p-8 flex-col">
            <div className="relative w-96 h-96 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" className="text-slate-700/30" fill="transparent" />
                    <circle
                        cx="50%" cy="50%" r="45%" stroke="var(--accent)" strokeWidth="8"
                        className="transition-all duration-1000"
                        fill="transparent"
                        strokeDasharray="283%"
                        strokeDashoffset={`${283 * (1 - progress)}%`}
                        strokeLinecap="round"
                    />
                </svg>

                <div className="text-center z-10">
                    <div className="text-8xl font-mono font-bold text-white tracking-tighter mb-4">
                        {formatTime(pomodoroTime)}
                    </div>
                    {activeTask ? (
                        <div className="text-slate-400 text-lg max-w-[200px] mx-auto truncate animate-pulse">
                            Focusing on: <br /> <span className="font-bold" style={{ color: 'var(--accent)' }}>{activeTask.title}</span>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)' }}>Select a task to focus</div>
                    )}
                </div>
            </div>

            <div className="flex gap-6 mt-12">
                <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-6 rounded-full bg-white/[0.05] border transition-all scale-100 hover:scale-110 active:scale-95"
                    style={{ borderColor: 'var(--border-medium)' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-muted)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                        e.currentTarget.style.color = 'inherit';
                    }}
                >
                    {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                <button
                    onClick={() => { setPomodoroTime(25 * 60); setIsTimerRunning(false); }}
                    className="p-6 rounded-full bg-white/[0.05] border border-white/[0.1] hover:bg-rose-500/20 hover:border-rose-400 hover:text-rose-300 transition-all scale-100 hover:scale-110 active:scale-95"
                >
                    <RotateCcw size={32} />
                </button>
            </div>
        </div>
    );
};
