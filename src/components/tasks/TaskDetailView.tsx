import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, CalendarDays, Flag, Plus, Trash2, GripVertical, CornerDownRight } from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';
import { Task, TaskType, GridRow } from '../../types';
import { formatDate } from '../../constants';
import { clsx } from 'clsx'; // Assuming clsx or similar utility, or just check if it exists. Reverting to template literals to be safe.

interface TaskDetailViewProps {
    taskId: string;
    onClose: () => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({ taskId, onClose }) => {
    const { tasks, updateTask, addTask, deleteTask, toggleTaskComplete } = useTaskContext();
    const task = tasks.find(t => t.id === taskId);

    // Derived state
    const subtasks = useMemo(() => {
        return tasks
            .filter(t => t.parent_id === taskId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [tasks, taskId]);

    // Local state for notes to handle debounce
    const [notes, setNotes] = useState(task?.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const notesDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync notes if task changes externally (careful not to overwrite user typing)
    useEffect(() => {
        if (task?.notes !== undefined && task.notes !== notes && !isSavingNotes) {
            setNotes(task.notes);
        }
    }, [task?.notes]);

    // Autosave notes
    useEffect(() => {
        if (!task) return;

        // Skip initial load
        if (notes === (task.notes || '')) return;

        setIsSavingNotes(true);
        if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);

        notesDebounceRef.current = setTimeout(() => {
            updateTask(task.id, { notes });
            setIsSavingNotes(false);
        }, 800); // 800ms debounce

        return () => {
            if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
        };
    }, [notes, task?.id, updateTask]);

    if (!task) return null;

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        // Create task with parent_id immediately to prevent it from appearing as a main task then disappearing
        addTask(newSubtaskTitle, 15, task.type, undefined, undefined, taskId);
        setNewSubtaskTitle('');
    };

    const handlePriorityChange = (type: TaskType) => {
        updateTask(taskId, { type });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateTask(taskId, { title: e.target.value });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                layoutId={`task-${taskId}`} // Optional shared layout ID if we want to hook it up to card
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#12141a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-zinc-800/50">
                    <div className="flex items-start gap-4 flex-1">
                        <button
                            onClick={() => toggleTaskComplete(taskId)}
                            className={`mt-1 p-1 rounded-full border-2 transition-colors ${task.status === 'completed'
                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                : 'border-zinc-600 hover:border-zinc-400 text-transparent'
                                }`}
                        >
                            <Check size={14} strokeWidth={3} />
                        </button>
                        <div className="flex-1 space-y-1">
                            <input
                                type="text"
                                value={task.title}
                                onChange={handleTitleChange}
                                className="w-full bg-transparent text-xl font-semibold text-white focus:outline-none placeholder:text-zinc-600"
                                placeholder="Task title"
                            />
                            <div className="flex items-center gap-3 text-xs text-zinc-400">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/50">
                                    <Clock size={12} />
                                    <span>{task.duration}m</span>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${task.type === 'high' ? 'bg-red-500/20 text-red-400' :
                                    task.type === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    <Flag size={12} fill="currentColor" />
                                    <span className="capitalize">{task.type} Priority</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 -mt-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Notes Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Notes</h3>
                            {isSavingNotes && <span className="text-xs text-emerald-500 animate-pulse">Saving...</span>}
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add details, notes, or links..."
                            className="w-full min-h-[120px] bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-y placeholder:text-zinc-700"
                        />
                    </div>

                    {/* Subtasks Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Subtasks</h3>

                        <div className="space-y-1">
                            {subtasks.map(subtask => (
                                <div key={subtask.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
                                    <CornerDownRight size={14} className="text-zinc-600" />
                                    <button
                                        onClick={() => toggleTaskComplete(subtask.id)}
                                        className={`p-0.5 rounded border transition-colors ${subtask.status === 'completed'
                                            ? 'bg-emerald-500 border-emerald-500 text-black'
                                            : 'border-zinc-600 group-hover:border-zinc-400 text-transparent'
                                            }`}
                                    >
                                        <Check size={10} strokeWidth={4} />
                                    </button>
                                    <span className={`flex-1 text-sm ${subtask.status === 'completed' ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                                        {subtask.title}
                                    </span>
                                    <button
                                        onClick={() => deleteTask(subtask.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Subtask Input */}
                        <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pl-2">
                            <Plus size={16} className="text-zinc-500" />
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                placeholder="Add a subtask..."
                                className="flex-1 bg-transparent border-none py-2 text-sm text-white focus:outline-none placeholder:text-zinc-600"
                            />
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
