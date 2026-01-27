import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Pause, Play, Coffee, Brain } from 'lucide-react';
import { useTimer } from '../../../context/TimerContext';
import { useTaskContext } from '../../../context/TaskContext';

export const GlobalFocusBar: React.FC = () => {
    const {
        isTimerRunning,
        activeTaskId,
        currentPhaseInfo,
        isZenMode,
        toggleTimer,
        stopTask,
        formatTime
    } = useTimer();

    const { tasks, updateTask } = useTaskContext();

    const activeTask = tasks.find(t => t.id === activeTaskId);
    const displayTime = currentPhaseInfo?.remainingSeconds ?? 0;

    const handleCompleteActiveTask = () => {
        if (activeTaskId) {
            updateTask(activeTaskId, { status: 'completed' });
            stopTask();
        }
    };

    // Don't show if no active task, or if in Zen Mode (Zen mode has its own UI)
    if (!activeTaskId || !activeTask || isZenMode) return null;

    // Only show if running or paused (active session)
    // The prompt requested "show up on every tab...". Usually if session is active.
    // We'll show it whenever there is an activeTaskId (Session Active).

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-[100] pointer-events-auto"
            >
                <div className="bg-[#1a1f2e]/95 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center justify-between gap-6 ring-1 ring-black/20">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${currentPhaseInfo?.type === 'break' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {currentPhaseInfo?.type === 'break' ? <Coffee size={18} /> : <Brain size={18} />}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-0.5 flex items-center gap-2">
                                {currentPhaseInfo?.type === 'break' ? 'Break Phase' : 'Focusing'}
                                {isTimerRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                <span className="tabular-nums text-white/90">{formatTime(displayTime)}</span>
                            </div>
                            <div className="text-sm font-bold text-white truncate">{activeTask.title}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={toggleTimer}
                            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        >
                            {isTimerRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>
                        <button
                            onClick={handleCompleteActiveTask}
                            className="h-10 w-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 flex items-center justify-center transition-colors"
                        >
                            <CheckCircle2 size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
