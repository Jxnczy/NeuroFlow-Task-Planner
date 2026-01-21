import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Task } from '../../../types';
import { useTaskContext } from '../../../context/TaskContext';
import { getTaskIdFromDragEvent } from '../../../utils/drag';
import { TimelineBlock } from './TimelineBlock';

// ============================================================================
// Types
// ============================================================================

interface DayTimelineViewProps {
    tasks: Task[];
    selectedDate: Date;
    todayStr: string;
    viewMode: 'show' | 'fade' | 'hide';
    onToggleComplete: (taskId: string) => void;
    onOpenActionSheet?: (task: Task) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    isMobile?: boolean; // When true, show only selected day
}

interface TimeSlot {
    hour: number;
    label: string;
}

// ============================================================================
// Constants
// ============================================================================

const HOUR_HEIGHT = 120; // pixels per hour
const START_HOUR = 6;   // 6 AM
const END_HOUR = 23;    // 11 PM

// Generate time slots
const TIME_SLOTS: TimeSlot[] = [];
for (let h = START_HOUR; h <= END_HOUR; h++) {
    TIME_SLOTS.push({
        hour: h,
        label: h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
    });
}

// ============================================================================
// Utility Functions
// ============================================================================

function parseTime(timeStr: string | undefined): { hour: number; minute: number } | null {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) };
}

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ============================================================================
// Components
// ============================================================================

const NowLine: React.FC<{ currentMinutes: number }> = ({ currentMinutes }) => {
    const startMinutes = START_HOUR * 60;
    const offset = ((currentMinutes - startMinutes) / 60) * HOUR_HEIGHT;

    if (currentMinutes < startMinutes || currentMinutes > END_HOUR * 60 + 59) return null;

    return (
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: offset }}>
            <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
            </div>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

const DayTimelineView: React.FC<DayTimelineViewProps> = ({
    tasks,
    selectedDate,
    todayStr,
    viewMode,
    onToggleComplete,
    onUpdateTask,
    onOpenActionSheet,
    isMobile = false
}) => {
    const { handleDragStart } = useTaskContext();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Week Dates Calculation - on mobile, show only selected day
    const weekDates = useMemo(() => {
        if (isMobile) {
            return [selectedDate];
        }
        const start = getStartOfWeek(selectedDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [selectedDate, isMobile]);

    // Current Time Logic
    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.getHours() * 60 + now.getMinutes());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Drag Preview State
    const [preview, setPreview] = useState<{ dayDate: string, top: number, label: string } | null>(null);

    // Scroll to 8 AM on mount
    useEffect(() => {
        if (scrollRef.current) {
            const scrollPos = (8 - START_HOUR) * HOUR_HEIGHT;
            scrollRef.current.scrollTop = scrollPos;
        }
    }, []);

    // Drag Handlers
    const handleDragOver = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const minutesFromTop = (y / HOUR_HEIGHT) * 60;
        const totalMinutes = (START_HOUR * 60) + minutesFromTop;
        const roundedMinutes = Math.round(totalMinutes / 15) * 15;

        const hour = Math.floor(roundedMinutes / 60);
        const minute = roundedMinutes % 60;

        if (hour < START_HOUR || hour > END_HOUR) return;

        const top = ((roundedMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
        const h = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const m = minute.toString().padStart(2, '0');

        setPreview({
            dayDate: dateStr,
            top,
            label: `${h}:${m} ${ampm}`
        });
    };

    const handleDrop = async (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        setPreview(null);
        const taskId = getTaskIdFromDragEvent(e);
        if (!taskId) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const minutesFromTop = (y / HOUR_HEIGHT) * 60;
        const totalMinutes = (START_HOUR * 60) + minutesFromTop;
        const roundedMinutes = Math.round(totalMinutes / 15) * 15;
        const hour = Math.floor(roundedMinutes / 60);
        const minute = roundedMinutes % 60;

        if (hour < START_HOUR || hour > END_HOUR) return;

        const scheduledTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        // Determine assignedRow if not already set, ensuring sync with Grid View
        const task = tasks.find(t => t.id === taskId);
        let assignedRow = task?.assignedRow;

        if (!assignedRow && task) {
            switch (task.type) {
                case 'high': assignedRow = 'GOAL'; break;
                case 'medium': assignedRow = 'FOCUS'; break;
                case 'low': assignedRow = 'WORK'; break;
                case 'leisure': assignedRow = 'LEISURE'; break;
                case 'chores': assignedRow = 'CHORES'; break;
                default: assignedRow = 'FOCUS';
            }
        }

        onUpdateTask(taskId, {
            scheduledTime,
            dueDate: dateStr,
            status: 'scheduled',
            assignedRow: assignedRow as any // Cast to satisfy type if strict (GridRow is string union)
        });
    };

    // Filter tasks for the week
    const weekTasks = useMemo(() => {
        return tasks.filter(t => {
            if (!t.dueDate) return false;
            // Basic range check
            const date = new Date(t.dueDate);
            if (isNaN(date.getTime())) return false;
            // We could optimize this, but filter is fast enough for ~100 tasks
            return true;
        });
    }, [tasks]);

    const timelineHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

    return (
        <div
            className="flex flex-row h-full overflow-hidden rounded-2xl border transition-colors duration-200"
            style={{
                borderColor: 'var(--border-light)'
            }}
        >
            {/* Scrollable Timeline */}
            <div
                className="flex-1 overflow-y-auto relative scrollbar-hide border-l transition-colors duration-200"
                ref={scrollRef}
                style={{ borderColor: 'var(--border-light)' }}
            >
                <div className="flex w-full h-full">
                    {/* Time Labels Column */}
                    <div
                        className="w-20 flex-shrink-0 sticky left-0 z-20 backdrop-blur-sm border-r pt-0 transition-colors duration-200"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-light)'
                        }}
                    >
                        {TIME_SLOTS.map(slot => (
                            <div
                                key={slot.hour}
                                className="absolute right-0 w-full text-right pr-2 text-[10px] font-medium transform -translate-y-1/2"
                                style={{
                                    top: (slot.hour - START_HOUR) * HOUR_HEIGHT,
                                    color: 'var(--text-muted)'
                                }}
                            >
                                {slot.label}
                            </div>
                        ))}
                        {/* Spacer depending on height */}
                        <div style={{ height: timelineHeight }}></div>
                    </div>

                    {/* Day Columns */}
                    {weekDates.map(date => {
                        const dateStr = formatDate(date);
                        const isToday = dateStr === todayStr;
                        const dayTasks = weekTasks.filter(t => t.dueDate === dateStr);

                        // Process Scheduled Tasks
                        const scheduled = dayTasks
                            .filter(t => parseTime(t.scheduledTime))
                            .map(task => {
                                const parsed = parseTime(task.scheduledTime)!;
                                const startMinutes = parsed.hour * 60 + parsed.minute;
                                const topOffset = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                                const height = (task.duration / 60) * HOUR_HEIGHT;
                                return { task, topOffset, height };
                            });

                        return (
                            <div
                                key={dateStr}
                                className="flex-1 w-0 min-w-0 border-r relative last:border-r-0 group transition-colors duration-200"
                                style={{
                                    height: timelineHeight,
                                    borderColor: 'var(--border-light)'
                                }}
                                onDragOver={(e) => handleDragOver(e, dateStr)}
                                onDragLeave={() => setPreview(null)}
                                onDrop={(e) => handleDrop(e, dateStr)}
                            >
                                {/* Horizontal Hour Lines */}
                                {TIME_SLOTS.map(slot => (
                                    <div
                                        key={slot.hour}
                                        className="absolute w-full border-b transition-colors duration-200"
                                        style={{
                                            top: (slot.hour - START_HOUR) * HOUR_HEIGHT,
                                            height: HOUR_HEIGHT,
                                            borderColor: 'var(--border-light)',
                                            opacity: 0.6
                                        }}
                                    />
                                ))}

                                {/* Now Line */}
                                {isToday && <NowLine currentMinutes={currentTime} />}

                                {/* Preview Line */}
                                {preview && preview.dayDate === dateStr && (
                                    <div
                                        className="absolute left-0 right-0 z-50 pointer-events-none flex items-center px-1"
                                        style={{ top: preview.top }}
                                    >
                                        <div className="text-[10px] font-bold text-accent bg-zinc-900 px-1 rounded mr-2">
                                            {preview.label}
                                        </div>
                                        <div className="flex-1 h-[2px] border-t-2 border-dashed border-accent/50" />
                                    </div>
                                )}

                                {/* Tasks */}
                                <AnimatePresence>
                                    {scheduled.map(({ task, topOffset, height }) => (
                                        <TimelineBlock
                                            key={task.id}
                                            task={task}
                                            topOffset={topOffset}
                                            height={height}
                                            viewMode={viewMode}
                                            onToggleComplete={onToggleComplete}
                                            onTap={(t) => onOpenActionSheet?.(t)}
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

DayTimelineView.displayName = 'DayTimelineView';
export default DayTimelineView;
