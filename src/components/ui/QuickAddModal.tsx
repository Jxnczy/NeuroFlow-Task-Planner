import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Plus, Zap } from 'lucide-react';
import { TaskType } from '../../types';
import { CATEGORIES } from '../../constants';

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTask: (title: string, duration: number, type: TaskType) => void;
}

const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
    isOpen,
    onClose,
    onAddTask
}) => {
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(30);
    const [type, setType] = useState<TaskType>('backlog');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDuration(30);
            setType('backlog');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAddTask(title.trim(), duration, type);
        onClose();
    };

    const selectedCategory = CATEGORIES.find(c => c.id === type);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-lg mx-4 rounded-[var(--radius-lg)] border overflow-hidden"
                    style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        boxShadow: 'var(--shadow-md)'
                    }}
                    initial={{ opacity: 0, scale: 0.98, y: -16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -16 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="flex items-center gap-2">
                            <Zap size={18} style={{ color: 'var(--accent)' }} />
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Add Task</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5" style={{ color: 'var(--text-muted)' }}>
                                Ctrl+N
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {/* Title Input */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full bg-transparent text-lg px-0 py-2 placeholder-zinc-500 focus:outline-none border-b transition-colors"
                            style={{
                                color: 'var(--text-primary)',
                                borderColor: title ? 'var(--accent)' : 'var(--border-light)'
                            }}
                            autoComplete="off"
                        />

                        {/* Duration */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                    Duration
                                </span>
                            </div>
                            <div className="grid grid-cols-6 gap-1.5">
                                {QUICK_DURATIONS.map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDuration(d)}
                                        className="py-2 rounded-[var(--radius-sm)] text-xs font-semibold transition-all"
                                        style={{
                                            backgroundColor: duration === d ? 'var(--accent)' : 'color-mix(in srgb, var(--surface2) 65%, transparent)',
                                            color: duration === d ? 'white' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {d < 60 ? `${d}m` : `${d / 60}h`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                Priority
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setType(cat.id as TaskType)}
                                        className="py-2 px-1 rounded-[var(--radius-sm)] text-[10px] font-semibold uppercase tracking-[0.18em] transition-all"
                                        style={{
                                            backgroundColor: type === cat.id ? `${cat.color}18` : 'color-mix(in srgb, var(--surface2) 55%, transparent)',
                                            color: type === cat.id ? cat.color : 'var(--text-muted)',
                                            border: type === cat.id ? `1px solid ${cat.color}40` : '1px solid transparent'
                                        }}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="w-full py-3 rounded-[var(--radius-md)] text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: title.trim() ? selectedCategory?.color : 'color-mix(in srgb, var(--surface2) 60%, transparent)',
                                color: title.trim() ? 'white' : 'var(--text-muted)'
                            }}
                        >
                            <Plus size={16} />
                            Add Task
                            <span className="text-xs opacity-60 ml-2">↵ Enter</span>
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
