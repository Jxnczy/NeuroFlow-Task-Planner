import React, { useState, useRef, useEffect } from 'react';
import { Plus, Settings, PanelLeftClose, Check, X, Snowflake, Clock, Calendar, ChevronDown, GripVertical, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskType, GridRow } from '../../types';
import { SidebarTaskCard } from '../tasks/SidebarTaskCard';
import { SimpleSidebarList } from './SimpleSidebarList';
import { CATEGORIES, QUICK_DURATIONS, formatDate, getAdjustedDate } from '../../constants';
import { useTaskContext } from '../../context/TaskContext';
import { MobileActionSheet, ActionSheetAction } from '../features/board/MobileActionSheet';
import { FrostOverlay } from '../ui/FrostOverlay';
import { useIceSound } from '../../hooks/useIceSound';
import { useDoomLoopDetector } from '../../hooks/useDoomLoopDetector';
import { getTaskIdFromDragEvent } from '../../utils/drag';

interface SidebarProps {
    onOpenSettings: () => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    isMobile: boolean;
    skipAutoFocus?: boolean; // Skip auto-focus for onboarding
    dayViewMode?: 'list' | 'timeline'; // Current view mode
    onDayViewModeChange?: (mode: 'list' | 'timeline') => void; // Toggle view mode
    selectedDate?: Date; // Currently selected date in timeline view
}

export const Sidebar: React.FC<SidebarProps> = ({
    onOpenSettings,
    isOpen,
    onToggle,
    onClose,
    isMobile,
    skipAutoFocus = false,
    dayViewMode = 'list',
    onDayViewModeChange,
    selectedDate
}) => {
    const {
        tasks,
        addTask,
        updateTask,
        scheduleTask,
        deleteTask,
        toggleTaskComplete,
        handleDragStart,
        handleDragEnd,
        handleDropOnSidebar,
        isDragging
    } = useTaskContext();
    const [sheetTask, setSheetTask] = useState<Task | null>(null);
    const [freezing, setFreezing] = useState(false);
    const doom = useDoomLoopDetector(tasks);
    const iceSound = useIceSound();

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDuration, setNewTaskDuration] = useState<number | null>(null); // null = not set for timeline mode validation
    const [newTaskType, setNewTaskType] = useState<TaskType>('backlog');
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [newTaskScheduledTime, setNewTaskScheduledTime] = useState<string>('');
    const [newTaskDate, setNewTaskDate] = useState<string>(''); // For timeline mode date selection
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'high': true, 'medium': true, 'low': true, 'leisure': false, 'backlog': true, 'chores': false
    });
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
    const dragCounters = useRef<Record<string, number>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when sidebar opens on mobile (skip during onboarding)
    useEffect(() => {
        if (isOpen && isMobile && inputRef.current && !skipAutoFocus) {
            // Small delay to ensure sidebar animation has started
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, isMobile, skipAutoFocus]);

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;

        // Default duration to 30 if not set
        const duration = newTaskDuration || 30;

        // Schedule Logic: If time set OR date set (and we are explicit), add as scheduled
        // Simplification: If scheduledTime is set, it's definitely scheduled. 
        // If only date is set, it's scheduled for that date (no specific time).
        const hasSchedule = !!newTaskScheduledTime || (!!newTaskDate && isScheduleOpen);

        if (hasSchedule) {
            // Use newTaskDate if set, otherwise selectedDate, otherwise today
            let dateStr: string;
            if (newTaskDate) {
                dateStr = newTaskDate;
            } else if (selectedDate) {
                dateStr = formatDate(selectedDate);
            } else {
                dateStr = formatDate(new Date());
            }

            // Map priority to assignedRow for sync visibility
            let assignedRow: GridRow = 'FOCUS'; // Default
            switch (newTaskType) {
                case 'high': assignedRow = 'GOAL'; break;
                case 'medium': assignedRow = 'FOCUS'; break;
                case 'low': assignedRow = 'WORK'; break;
                case 'leisure': assignedRow = 'LEISURE'; break;
                case 'chores': assignedRow = 'CHORES'; break;
            }

            const newTask = addTask(newTaskTitle.trim(), duration, newTaskType);
            updateTask(newTask.id, {
                dueDate: dateStr,
                scheduledTime: newTaskScheduledTime || undefined,
                assignedRow: assignedRow,
                status: 'scheduled'
            });
        } else {
            // Backlog
            const newTask = addTask(newTaskTitle.trim(), duration, newTaskType);
        }

        setNewTaskTitle('');
        setNewTaskScheduledTime('');
        setNewTaskDate('');
        setNewTaskDuration(null);
        setIsScheduleOpen(false);
        setExpandedCategories(prev => ({ ...prev, [newTaskType]: true }));
    };

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const handleCategoryDragEnter = (e: React.DragEvent, categoryId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragCounters.current[categoryId]) {
            dragCounters.current[categoryId] = 0;
        }
        dragCounters.current[categoryId]++;
        setDragOverCategory(categoryId);
    };

    const handleCategoryDragLeave = (e: React.DragEvent, categoryId: string) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounters.current[categoryId]--;
        if (dragCounters.current[categoryId] === 0) {
            setDragOverCategory(null);
        }
    };

    const handleCategoryDrop = (e: React.DragEvent, categoryId: string) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounters.current[categoryId] = 0;
        setDragOverCategory(null);

        const taskId = getTaskIdFromDragEvent(e);
        if (taskId && updateTask) {
            updateTask(taskId, {
                type: categoryId as TaskType,
                status: 'unscheduled',
                dueDate: null,
                assignedRow: null
            });
            setExpandedCategories(prev => ({ ...prev, [categoryId]: true }));
        }
    };

    const handleSidebarDrop = (e: React.DragEvent) => {
        if (!dragOverCategory) {
            handleDropOnSidebar(e);
        }
    };

    const selectedCategory = CATEGORIES.find(c => c.id === newTaskType);

    // Defensive check for tasks
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const visibleTasks = safeTasks.filter(t => !t.isFrozen);
    const iceboxTasks = safeTasks.filter(t => t.isFrozen);
    const [iceboxOpen, setIceboxOpen] = useState(false);
    const dragEnabled = !isMobile;

    const handleSheetAction = (action: ActionSheetAction, task: Task) => {
        const today = getAdjustedDate();
        switch (action) {
            case 'complete':
                toggleTaskComplete(task.id);
                break;
            case 'move-tomorrow': {
                const date = new Date(today);
                date.setDate(date.getDate() + 1);
                scheduleTask(task.id, date, null, task.type);
                break;
            }
            case 'move-yesterday': {
                // Treat as move to today for backlog convenience
                const date = new Date(today);
                scheduleTask(task.id, date, null, task.type);
                break;
            }
            case 'reschedule': {
                const input = window.prompt('Pick a date (YYYY-MM-DD):', formatDate(today));
                if (input) {
                    const parsed = new Date(input);
                    if (!isNaN(parsed.getTime())) {
                        scheduleTask(task.id, parsed, null, task.type);
                    }
                }
                break;
            }
            case 'reschedule-to-date': {
                const taskWithDate = task as Task & { _rescheduleDate?: string };
                if (taskWithDate._rescheduleDate) {
                    updateTask(task.id, { dueDate: taskWithDate._rescheduleDate });
                }
                break;
            }
            case 'set-time': {
                const taskWithTime = task as Task & { _scheduledTime?: string };
                updateTask(task.id, {
                    scheduledTime: taskWithTime._scheduledTime || undefined
                });
                break;
            }
            case 'delete':
                deleteTask(task.id);
                break;
            default:
                break;
        }
        setSheetTask(null);
        onClose?.();
    };

    const handleFreeze = () => {
        if (freezing) return;
        iceSound.play();
        setFreezing(true);

        // Apply freeze logic after short delay
        setTimeout(() => {
            const todayStr = formatDate(getAdjustedDate());
            safeTasks.forEach(t => {
                if (t.status !== 'completed' && t.dueDate && t.dueDate <= todayStr) {
                    updateTask(t.id, {
                        status: 'unscheduled',
                        dueDate: null,
                        assignedRow: null,
                        eisenhowerQuad: null,
                        isFrozen: true
                    });
                }
            });
        }, 500);

        setTimeout(() => setFreezing(false), 1500);
    };

    const sidebarContent = (
        <div className="w-full h-full flex flex-col">
            {/* Logo */}
            <div className="p-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Check size={32} strokeWidth={4} style={{ color: 'var(--accent)' }} />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-display font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            Neuro<span style={{ color: 'var(--accent)' }}>Flow</span>
                        </h1>
                        <p className="text-[9px] font-medium tracking-[0.2em] uppercase leading-none mt-1" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>
                            Task Planner
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {isMobile ? (
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-strong)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Close Sidebar"
                        >
                            <X size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={onToggle}
                            className="p-2.5 rounded-xl transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-strong)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Collapse Sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}
                    {onDayViewModeChange && (
                        <button
                            onClick={() => onDayViewModeChange(dayViewMode === 'list' ? 'timeline' : 'list')}
                            className="p-2.5 rounded-xl transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-strong)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={dayViewMode === 'list' ? "Switch to Timeline View" : "Switch to List View"}
                        >
                            {dayViewMode === 'list' ? <Clock size={18} /> : <List size={18} />}
                        </button>
                    )}
                    <button
                        onClick={onOpenSettings}
                        className="p-2.5 rounded-xl transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Add Task Section */}
            <div className="px-3 pb-4" data-tour="add-task">
                <div className="rounded-xl p-4 bg-transparent border" style={{ borderColor: 'var(--border-light)' }}>

                    {/* 1. Title Input (Essential) */}
                    <div className="mb-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            placeholder="Add new task..."
                            className="w-full bg-transparent text-sm px-3 py-2.5 rounded-lg placeholder-zinc-500 focus:outline-none border focus:border-cyan-400/50 transition-colors"
                            style={{
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-light)'
                            }}
                        />
                    </div>

                    {/* 2. Priority (Restored to full grid) */}
                    <div className="mb-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                            Priority
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setNewTaskType(cat.id as TaskType)}
                                    className="py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border"
                                    style={{
                                        backgroundColor: newTaskType === cat.id ? `${cat.color}20` : 'var(--bg-surface-subtle)',
                                        color: newTaskType === cat.id ? cat.color : 'var(--text-muted)',
                                        border: newTaskType === cat.id ? `1px solid ${cat.color}40` : '1px solid transparent'
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Duration (Moved after Priority) */}
                    <div className="mb-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                            Duration
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            {[15, 30, 45, 60].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setNewTaskDuration(d)}
                                    className="py-1.5 rounded-md text-[10px] font-semibold transition-all border"
                                    style={{
                                        backgroundColor: newTaskDuration === d ? 'var(--accent)' : 'transparent',
                                        borderColor: newTaskDuration === d ? 'var(--accent)' : 'var(--border-light)',
                                        color: newTaskDuration === d ? 'white' : 'var(--text-muted)'
                                    }}
                                >
                                    {d}m
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Schedule Toggle */}
                    <button
                        onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                        className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-1 py-2 mb-2 transition-colors"
                        style={{ color: (newTaskScheduledTime || isScheduleOpen) ? 'var(--accent)' : 'var(--text-muted)' }}
                    >
                        <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {newTaskScheduledTime ? `Scheduled at ${newTaskScheduledTime}` : 'Schedule (Optional)'}
                        </span>
                        <ChevronDown
                            size={12}
                            className={`transition-transform duration-200 ${isScheduleOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* 4. Collapsible Schedule Section */}
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
                                            value={newTaskDate || (selectedDate ? formatDate(selectedDate) : formatDate(new Date()))}
                                            onChange={(e) => setNewTaskDate(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded-lg focus:outline-none border"
                                            style={{
                                                color: 'var(--text-primary)',
                                                backgroundColor: 'var(--bg-surface-strong)',
                                                borderColor: 'var(--border-light)'
                                            }}
                                        />
                                    </div>

                                    {/* Time */}
                                    <div>
                                        <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Time</div>
                                        <input
                                            type="time"
                                            value={newTaskScheduledTime}
                                            onChange={(e) => setNewTaskScheduledTime(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded-lg focus:outline-none border"
                                            style={{
                                                color: 'var(--text-primary)',
                                                backgroundColor: 'var(--bg-surface-strong)',
                                                borderColor: 'var(--border-light)'
                                            }}
                                        />
                                        {/* Quick Times */}
                                        <div className="flex gap-1 mt-1.5">
                                            {['09:00', '13:00', '17:00'].map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => setNewTaskScheduledTime(time)}
                                                    className="flex-1 py-1 rounded text-[9px] font-mono border transition-colors"
                                                    style={{
                                                        borderColor: newTaskScheduledTime === time ? 'var(--accent)' : 'transparent',
                                                        backgroundColor: newTaskScheduledTime === time ? 'rgba(34,211,238,0.1)' : 'var(--bg-surface-subtle)',
                                                        color: newTaskScheduledTime === time ? 'var(--accent)' : 'var(--text-muted)'
                                                    }}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Duration REMOVED as per user request */}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 5. Add Button */}
                    <button
                        onClick={handleAddTask}
                        disabled={!newTaskTitle.trim()}
                        className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2"
                        style={{
                            backgroundColor: newTaskTitle.trim()
                                ? (newTaskScheduledTime ? 'var(--accent)' : selectedCategory?.color)
                                : 'var(--bg-surface-subtle)',
                            color: newTaskTitle.trim() ? 'white' : 'var(--text-muted)',
                            opacity: newTaskTitle.trim() ? 1 : 0.5
                        }}
                    >
                        {newTaskScheduledTime ? (
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

            {/* Main Task Lists + Icebox in shared scroll area */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pb-6" data-tour="brain-dump">
                <div className="flex-1 min-h-0">
                    <SimpleSidebarList
                        tasks={visibleTasks}
                        expandedCategories={expandedCategories}
                        toggleCategory={toggleCategory}
                        dragOverCategory={dragOverCategory}
                        onCategoryDragEnter={handleCategoryDragEnter}
                        onCategoryDragLeave={handleCategoryDragLeave}
                        onCategoryDrop={handleCategoryDrop}
                        onDragStart={dragEnabled ? handleDragStart : () => { }}
                        onDragEnd={dragEnabled ? handleDragEnd : () => { }}
                        onUpdateTask={updateTask}
                        onDeleteTask={deleteTask}
                        onToggleComplete={toggleTaskComplete}
                        onScheduleTask={scheduleTask}
                        isMobile={isMobile}
                        onCloseSidebar={isMobile ? onClose : undefined}
                        onLongPressTask={isMobile ? setSheetTask : undefined}
                    />
                </div>
            </div>

            {/* Footer */}
            <div
                className="p-3 border-t flex items-center justify-between"
                style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
            >
                <div className="flex items-center gap-2">
                    <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>v1.2</div>
                </div>
                <div
                    className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    style={{
                        backgroundColor: 'rgba(251, 191, 36, 0.15)',
                        color: 'rgba(251, 191, 36, 0.7)',
                        border: '1px solid rgba(251, 191, 36, 0.2)'
                    }}
                >
                    DEV
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <AnimatePresence>
                {isOpen && [
                    <motion.div
                        key="sidebar-backdrop"
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />,
                    <motion.div
                        key="sidebar-panel"
                        className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[300px] bg-zinc-900 shadow-2xl border-r border-zinc-800 overflow-hidden"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleSidebarDrop}
                    >
                        <div className="h-full overflow-y-auto pb-24">
                            {sidebarContent}
                        </div>
                        <FrostOverlay isVisible={freezing} />
                    </motion.div>,
                    <MobileActionSheet
                        key="sidebar-action-sheet"
                        task={sheetTask}
                        onAction={handleSheetAction}
                        onClose={() => setSheetTask(null)}
                    />
                ]}
            </AnimatePresence>
        );
    }

    // Get computed CSS variable value for animation
    const sidebarWidth = typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() || '320px'
        : '320px';

    return (
        <motion.div
            initial={{ width: sidebarWidth }}
            animate={{ width: isOpen ? sidebarWidth : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full flex flex-col border-r relative z-20 overflow-hidden"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-medium)'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleSidebarDrop}
        >
            {sidebarContent}
            <FrostOverlay isVisible={freezing} />
            <MobileActionSheet
                task={sheetTask}
                onAction={handleSheetAction}
                onClose={() => setSheetTask(null)}
            />
        </motion.div>
    );
};
