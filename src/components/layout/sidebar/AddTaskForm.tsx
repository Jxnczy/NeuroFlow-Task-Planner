import React, { useState, useRef, useEffect } from 'react';
import { Plus, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskType } from '../../../types';
import { CATEGORIES, formatDate } from '../../../constants';
import { useSpaceCategories } from '../../../hooks/useSpaceCategories';

interface AddTaskFormProps {
    onAdd: (task: {
        title: string;
        duration: number;
        type: TaskType;
        scheduledTime?: string;
        date?: string;
    }) => void;
    selectedDate?: Date;
    autoFocus?: boolean;
    isMobile?: boolean; // Used to refine auto-focus behavior if needed
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({
    onAdd,
    selectedDate,
    autoFocus = false,
    isMobile = false
}) => {
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState<number | null>(null);
    const [type, setType] = useState<TaskType>('backlog');
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduledTime, setScheduledTime] = useState<string>('');
    const [date, setDate] = useState<string>('');

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus logic
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Small delay to ensure animation has started/completed
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [autoFocus]);

    const categories = useSpaceCategories();

    const handleAdd = () => {
        if (!title.trim()) return;

        onAdd({
            title: title.trim(),
            duration: duration || 30, // Default to 30 if not set
            type,
            scheduledTime: scheduledTime || undefined,
            date: date || undefined
        });

        // Reset form
        setTitle('');
        setDuration(null);
        setScheduledTime('');
        setDate('');
        setIsScheduleOpen(false);
    };

    const selectedCategory = categories.find(c => c.id === type);

    return (
        <div className="px-3 pb-4" data-tour="add-task">

            <div className="rounded-xl p-4 bg-transparent border-t" style={{ borderColor: 'var(--border)' }}>
                {/* 1. Title Input */}
                <div className="mb-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Add new task..."
                        className="w-full bg-transparent text-sm px-3 py-2.5 rounded-lg placeholder-zinc-500 focus:outline-none border focus:border-cyan-400/50 transition-colors"
                        style={{
                            color: 'var(--text)',
                            borderColor: 'var(--border)',
                            backgroundColor: 'var(--bg)'
                        }}
                    />
                </div>

                {/* 2. Priority */}
                <div className="mb-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Priority
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setType(cat.id as TaskType)}
                                className="py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border"
                                style={{
                                    backgroundColor: type === cat.id ? `${cat.color}20` : 'var(--bg)',
                                    color: type === cat.id ? cat.color : 'var(--text-muted)',
                                    border: type === cat.id ? `1px solid ${cat.color}` : '1px solid transparent'
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Duration */}
                <div className="mb-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Duration
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                        {[15, 30, 45].map(d => (
                            <button
                                key={d}
                                onClick={() => setDuration(d)}
                                className="py-1.5 rounded-md text-[10px] font-semibold transition-all border"
                                style={{
                                    backgroundColor: duration === d ? 'var(--accent)' : 'transparent',
                                    borderColor: duration === d ? 'var(--accent)' : 'var(--border)',
                                    color: duration === d ? 'white' : 'var(--text-muted)'
                                }}
                            >
                                {d}m
                            </button>
                        ))}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    if (duration && ![15, 30, 45].includes(duration)) {
                                        // If already custom, clear it to toggle input focus or reset?
                                        // For now, just keep it as selecting "custom" mode visual
                                    }
                                    // Focus input if exists
                                    const input = document.getElementById('custom-duration-input');
                                    if (input) input.focus();
                                }}
                                className="w-full h-full py-1.5 rounded-md text-[10px] font-semibold transition-all border flex items-center justify-center p-0"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: (duration && ![15, 30, 45].includes(duration)) ? 'var(--accent)' : 'var(--border)',
                                    color: (duration && ![15, 30, 45].includes(duration)) ? 'var(--accent)' : 'var(--text-muted)'
                                }}
                            >
                                {(duration && ![15, 30, 45].includes(duration)) ? (
                                    <input
                                        id="custom-duration-input"
                                        type="number"
                                        min="1"
                                        max="999"
                                        value={duration}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val > 0) setDuration(val);
                                            else setDuration(null);
                                        }}
                                        className="w-full h-full bg-transparent text-center focus:outline-none"
                                        style={{ color: 'inherit' }}
                                        placeholder="Set"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span onClick={() => setDuration(60)}>Set</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Schedule Toggle */}
                <button
                    onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                    className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-1 py-2 mb-2 transition-colors"
                    style={{ color: (scheduledTime || isScheduleOpen) ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                    <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {scheduledTime ? `Scheduled at ${scheduledTime}` : 'Schedule (Optional)'}
                    </span>
                    <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${isScheduleOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* 5. Collapsible Schedule Section */}
                <AnimatePresence>
                    {isScheduleOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-3 pb-2">
                                {/* Date */}
                                <div>
                                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Date</div>
                                    <input
                                        type="date"
                                        value={date || (selectedDate ? formatDate(selectedDate) : formatDate(new Date()))}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full text-xs px-2 py-1.5 rounded-lg focus:outline-none border"
                                        style={{
                                            color: 'var(--text)',
                                            backgroundColor: 'var(--surface2)',
                                            borderColor: 'var(--border)'
                                        }}
                                    />
                                </div>

                                {/* Time */}
                                <div>
                                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Time</div>
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full text-xs px-2 py-1.5 rounded-lg focus:outline-none border"
                                        style={{
                                            color: 'var(--text)',
                                            backgroundColor: 'var(--surface2)',
                                            borderColor: 'var(--border)'
                                        }}
                                    />
                                    {/* Quick Times */}
                                    <div className="flex gap-1 mt-1.5">
                                        {['09:00', '13:00', '17:00'].map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setScheduledTime(time)}
                                                className="flex-1 py-1 rounded text-[9px] font-mono border transition-colors"
                                                style={{
                                                    borderColor: scheduledTime === time ? 'var(--accent)' : 'transparent',
                                                    backgroundColor: scheduledTime === time ? 'rgba(34,211,238,0.1)' : 'var(--surface2)',
                                                    color: scheduledTime === time ? 'var(--accent)' : 'var(--text-muted)'
                                                }}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 6. Add Button */}
                <button
                    onClick={handleAdd}
                    disabled={!title.trim()}
                    className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2"
                    style={{
                        backgroundColor: title.trim()
                            ? (scheduledTime ? 'var(--accent)' : selectedCategory?.color)
                            : 'var(--surface2)',
                        color: title.trim() ? 'white' : 'var(--text-muted)',
                        opacity: title.trim() ? 1 : 0.5
                    }}
                >
                    {scheduledTime ? (
                        <>
                            <Clock size={14} />
                            Schedule Task
                        </>
                    ) : (
                        <>
                            <Plus size={14} />
                            Add
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
