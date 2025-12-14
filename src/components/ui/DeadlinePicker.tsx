import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, Sun, Sunrise, CalendarDays } from 'lucide-react';

interface DeadlinePickerProps {
    value: string; // ISO date string YYYY-MM-DD or empty
    onChange: (value: string) => void;
    placeholder?: string;
}

// Helper to format date as YYYY-MM-DD
const formatDateISO = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Helper to get relative date label
const getRelativeLabel = (dateStr: string): string => {
    if (!dateStr) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === 7) return 'Next week';
    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 7) {
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        return weekday;
    }

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Quick action type
interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    getDate: () => string;
    color: string;
}

export const DeadlinePicker: React.FC<DeadlinePickerProps> = ({
    value,
    onChange,
    placeholder = 'Add deadline'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(() => {
        if (value) return new Date(value);
        return new Date();
    });

    // Quick actions
    const quickActions: QuickAction[] = [
        {
            id: 'today',
            label: 'Today',
            icon: <Sun size={16} />,
            getDate: () => formatDateISO(new Date()),
            color: '#22c55e' // green
        },
        {
            id: 'tomorrow',
            label: 'Tomorrow',
            icon: <Sunrise size={16} />,
            getDate: () => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return formatDateISO(d);
            },
            color: '#3b82f6' // blue
        },
        {
            id: 'nextweek',
            label: 'Next week',
            icon: <CalendarDays size={16} />,
            getDate: () => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                return formatDateISO(d);
            },
            color: '#8b5cf6' // purple
        }
    ];

    // Calendar generation
    const generateCalendarDays = () => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Start from Monday (1) instead of Sunday (0)
        let startPadding = firstDay.getDay() - 1;
        if (startPadding < 0) startPadding = 6;

        const days: (Date | null)[] = [];

        // Add padding for days before month starts
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Add actual days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date): boolean => {
        if (!value) return false;
        return formatDateISO(date) === value;
    };

    const isPast = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleQuickAction = (action: QuickAction) => {
        onChange(action.getDate());
        setIsOpen(false);
    };

    const handleDayClick = (date: Date) => {
        onChange(formatDateISO(date));
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const navigateMonth = (delta: number) => {
        setViewMonth(prev => {
            const next = new Date(prev);
            next.setMonth(next.getMonth() + delta);
            return next;
        });
    };

    const displayLabel = value ? getRelativeLabel(value) : placeholder;
    const hasValue = Boolean(value);

    return (
        <div className="relative">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left
                    ${hasValue ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10 bg-white/5'}
                    hover:border-cyan-500/30 hover:bg-white/[0.07]
                `}
            >
                <Calendar
                    size={16}
                    className={hasValue ? 'text-cyan-400' : 'text-zinc-500'}
                />
                <span className={`flex-1 text-sm ${hasValue ? 'text-cyan-400 font-medium' : 'text-zinc-500'}`}>
                    {displayLabel}
                </span>
                {hasValue && (
                    <button
                        onClick={handleClear}
                        className="p-0.5 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
                    >
                        <X size={14} />
                    </button>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Picker panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                        >
                            {/* Quick actions */}
                            <div className="p-2 border-b border-white/5">
                                <div className="flex gap-1.5">
                                    {quickActions.map(action => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleQuickAction(action)}
                                            className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all hover:bg-white/10"
                                            style={{ color: action.color }}
                                        >
                                            {action.icon}
                                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                                                {action.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Month navigation */}
                            <div className="flex items-center justify-between px-3 py-2">
                                <button
                                    onClick={() => navigateMonth(-1)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-semibold text-zinc-200">
                                    {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    onClick={() => navigateMonth(1)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 px-2">
                                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                                    <div
                                        key={day}
                                        className="text-center text-[10px] font-semibold text-zinc-500 py-1"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-0.5 p-2 pt-0">
                                {generateCalendarDays().map((date, i) => (
                                    <div key={i} className="aspect-square">
                                        {date && (
                                            <button
                                                onClick={() => handleDayClick(date)}
                                                disabled={isPast(date) && !isToday(date)}
                                                className={`
                                                    w-full h-full flex items-center justify-center rounded-lg text-sm transition-all
                                                    ${isSelected(date)
                                                        ? 'bg-cyan-500 text-white font-bold'
                                                        : isToday(date)
                                                            ? 'bg-cyan-500/20 text-cyan-400 font-semibold ring-1 ring-cyan-500/50'
                                                            : isPast(date)
                                                                ? 'text-zinc-600 cursor-not-allowed'
                                                                : 'text-zinc-300 hover:bg-white/10'
                                                    }
                                                `}
                                            >
                                                {date.getDate()}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Clear button */}
                            {hasValue && (
                                <div className="p-2 pt-0">
                                    <button
                                        onClick={handleClear}
                                        className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-all"
                                    >
                                        Remove deadline
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
