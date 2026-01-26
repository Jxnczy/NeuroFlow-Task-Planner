import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskType, GridRow } from '../../types';

import { SimpleSidebarList } from './SimpleSidebarList';
import { AddTaskForm } from './sidebar/AddTaskForm';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { CATEGORIES, formatDate, getAdjustedDate } from '../../constants';
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
    } = useTaskContext();
    const [sheetTask, setSheetTask] = useState<Task | null>(null);
    const [freezing, setFreezing] = useState(false);
    useDoomLoopDetector(tasks); // Used for effect
    const iceSound = useIceSound();

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'high': true, 'medium': true, 'low': true, 'leisure': false, 'backlog': true, 'chores': false
    });
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
    const dragCounters = useRef<Record<string, number>>({});

    const handleAddTask = (taskData: {
        title: string;
        duration: number;
        type: TaskType;
        scheduledTime?: string;
        date?: string;
    }) => {
        const { title, duration, type, scheduledTime, date } = taskData;

        // Schedule Logic: If time set OR date set (and we are explicit), add as scheduled
        const hasSchedule = !!scheduledTime || !!date;

        if (hasSchedule) {
            // Use newTaskDate if set, otherwise selectedDate, otherwise today
            let dateStr: string;
            if (date) {
                dateStr = date;
            } else if (selectedDate) {
                dateStr = formatDate(selectedDate);
            } else {
                dateStr = formatDate(new Date());
            }

            // Map priority to assignedRow for sync visibility
            let assignedRow: GridRow = 'FOCUS'; // Default
            switch (type) {
                case 'high': assignedRow = 'GOAL'; break;
                case 'medium': assignedRow = 'FOCUS'; break;
                case 'low': assignedRow = 'WORK'; break;
                case 'leisure': assignedRow = 'LEISURE'; break;
                case 'chores': assignedRow = 'CHORES'; break;
            }

            const newTask = addTask(title, duration, type);
            updateTask(newTask.id, {
                dueDate: dateStr,
                scheduledTime: scheduledTime || undefined,
                assignedRow: assignedRow,
                status: 'scheduled'
            });
        } else {
            // Backlog
            addTask(title, duration, type);
        }

        setExpandedCategories(prev => ({ ...prev, [type]: true }));
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

    // Defensive check for tasks
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const visibleTasks = safeTasks.filter(t => !t.isFrozen);
    const iceboxTasks = safeTasks.filter(t => t.isFrozen); // kept variable if needed later
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
            <SidebarHeader
                onOpenSettings={onOpenSettings}
                onToggle={onToggle}
                onClose={onClose}
                isMobile={isMobile}
                dayViewMode={dayViewMode}
                onDayViewModeChange={onDayViewModeChange}
            />

            {/* Add Task Form */}
            <AddTaskForm
                onAdd={handleAddTask}
                selectedDate={selectedDate}
                autoFocus={isOpen && isMobile && !skipAutoFocus}
                isMobile={isMobile}
            />

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

            <SidebarFooter />
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
                backgroundColor: 'var(--bg-glass)',
                borderColor: 'var(--border-light)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)'
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
