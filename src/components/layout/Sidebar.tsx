import React, { useState, useRef } from 'react';
import { Plus, Settings, PanelLeftClose, Check, X, Snowflake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskType } from '../../types';
import { SidebarTaskCard } from '../tasks/SidebarTaskCard';
import { VirtualSidebarList } from './VirtualSidebarList';
import { CATEGORIES } from '../../constants';
import { useTaskContext } from '../../context/TaskContext';
import { MobileActionSheet, ActionSheetAction } from '../features/board/MobileActionSheet';
import { formatDate, getAdjustedDate } from '../../constants';
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
}

// 6 buttons for even grid
const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

export const Sidebar: React.FC<SidebarProps> = ({
    onOpenSettings,
    isOpen,
    onToggle,
    onClose,
    isMobile
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
    const [newTaskDuration, setNewTaskDuration] = useState(30);
    const [newTaskType, setNewTaskType] = useState<TaskType>('backlog');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'high': true, 'medium': true, 'low': true, 'leisure': false, 'backlog': true, 'chores': false
    });
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
    const dragCounters = useRef<Record<string, number>>({});

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        addTask(newTaskTitle.trim(), newTaskDuration, newTaskType);
        setNewTaskTitle('');
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
        <div className="w-full max-w-[320px] h-full flex flex-col">
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
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
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
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Collapse Sidebar"
                        >
                            <PanelLeftClose size={18} />
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
            <div className="px-3 pb-4">
                <div className="rounded-xl p-4 bg-transparent">
                    {/* Input Row */}
                    <div className="mb-4">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            placeholder="Add new task..."
                            className="w-full bg-transparent text-sm px-3 py-2.5 rounded-lg placeholder-zinc-500 focus:outline-none border"
                            style={{
                                color: 'var(--text-primary)',
                                borderColor: newTaskTitle ? 'var(--accent)' : 'var(--border-light)'
                            }}
                        />
                    </div>

                    {/* Duration Label + Buttons */}
                    <div className="mb-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                            Duration
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                            {QUICK_DURATIONS.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setNewTaskDuration(d)}
                                    className="py-2 rounded-lg text-[11px] font-semibold transition-all"
                                    style={{
                                        backgroundColor: newTaskDuration === d ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                        color: newTaskDuration === d ? 'white' : 'var(--text-secondary)'
                                    }}
                                >
                                    {d < 60 ? `${d}m` : `${d / 60}h`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Type Label + Grid */}
                    <div className="mb-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                            Priority
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setNewTaskType(cat.id as TaskType)}
                                    className="py-2.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                                    style={{
                                        backgroundColor: newTaskType === cat.id ? `${cat.color}20` : 'rgba(255,255,255,0.03)',
                                        color: newTaskType === cat.id ? cat.color : 'var(--text-muted)',
                                        border: newTaskType === cat.id ? `1px solid ${cat.color}40` : '1px solid transparent'
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddTask}
                        disabled={!newTaskTitle.trim()}
                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                        style={{
                            backgroundColor: newTaskTitle.trim() ? selectedCategory?.color : 'rgba(255,255,255,0.05)',
                            color: newTaskTitle.trim() ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        <Plus size={16} />
                        Add Task
                    </button>
                </div>
            </div>

            {/* Main Task Lists + Icebox in shared scroll area */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pb-6">
                <div className="flex-1 min-h-0">
                    <VirtualSidebarList
                        tasks={visibleTasks}
                        expandedCategories={expandedCategories}
                        toggleCategory={toggleCategory}
                        dragOverCategory={dragOverCategory}
                        onCategoryDragEnter={handleCategoryDragEnter}
                        onCategoryDragLeave={handleCategoryDragLeave}
                        onCategoryDrop={handleCategoryDrop}
                        isDragging={dragEnabled ? isDragging : false}
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

                {iceboxTasks.length > 0 && (
                    <div className="px-3 pb-3 mt-auto">
                        <button
                            onClick={() => setIceboxOpen(!iceboxOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-left"
                        >
                            <span className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                <Snowflake size={16} /> Icebox ({iceboxTasks.length})
                            </span>
                            <span className="text-xs text-zinc-500">{iceboxOpen ? 'Hide' : 'Show'}</span>
                        </button>
                        <AnimatePresence initial={false}>
                            {iceboxOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-3 space-y-2"
                                >
                                    {iceboxTasks.map(t => (
                                        <SidebarTaskCard
                                            key={t.id}
                                            task={t}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onUpdateTask={updateTask}
                                            onDeleteTask={deleteTask}
                                            onToggleComplete={toggleTaskComplete}
                                            onScheduleTask={scheduleTask}
                                            isMobile={isMobile}
                                            onCloseSidebar={isMobile ? onClose : undefined}
                                            onLongPress={isMobile ? setSheetTask : undefined}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
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
                <motion.button
                    onClick={handleFreeze}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                    animate={doom.state === 'critical' ? { scale: [1, 1.05, 1] } : undefined}
                    transition={{ repeat: doom.state === 'critical' ? Infinity : 0, duration: 2, ease: 'easeInOut' }}
                    title={doom.state === 'critical' ? 'Schedule overloaded. Freeze tasks?' : 'Freeze backlog'}
                >
                    <Snowflake
                        size={18}
                        className={doom.state === 'critical' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}
                        style={{
                            color: doom.state === 'critical' ? '#22d3ee' : doom.state === 'risk' ? '#cbd5e1' : 'rgba(148,163,184,0.2)',
                            opacity: doom.state === 'safe' ? 0.2 : 1
                        }}
                    />
                    <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{
                            color: doom.state === 'critical' ? '#22d3ee' : doom.state === 'risk' ? '#cbd5e1' : 'rgba(148,163,184,0.6)',
                            opacity: doom.state === 'safe' ? 0.4 : 1
                        }}
                    >
                        Ice Box
                    </span>
                </motion.button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />
                        <motion.div
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
                        </motion.div>
                        <MobileActionSheet
                            task={sheetTask}
                            onAction={handleSheetAction}
                            onClose={() => setSheetTask(null)}
                        />
                    </>
                )}
            </AnimatePresence>
        );
    }

    return (
        <motion.div
            initial={{ width: 320 }}
            animate={{ width: isOpen ? 320 : 0 }}
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
