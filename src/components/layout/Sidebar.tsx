import React, { useState } from 'react';
import { LayoutGrid, Plus, ChevronRight, Settings, LogOut } from 'lucide-react';
import { Task, TaskType } from '../../types';
import { TaskCard } from '@/components/TaskCard';

interface SidebarProps {
    tasks: Task[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDrop: (e: React.DragEvent) => void;
    onAddTask: (title: string, duration: number, type: TaskType) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onToggleTaskComplete: (taskId: string) => void;
    onOpenSettings: () => void;
}

const SIDEBAR_CATEGORIES = [
    { id: 'high', label: 'High Prio', color: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' },
    { id: 'medium', label: 'Medium Prio', color: 'bg-orange-500 text-white' },
    { id: 'low', label: 'Low Prio', color: 'bg-amber-400 text-black' },
    { id: 'leisure', label: 'Leisure', color: 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' },
    { id: 'backlog', label: 'BACKLOG', color: 'bg-slate-600 text-slate-200' },
    { id: 'chores', label: 'Chores', color: 'bg-zinc-500 text-white' },
];

export const Sidebar: React.FC<SidebarProps> = ({
    tasks,
    onDragStart,
    onDrop,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onToggleTaskComplete,
    onOpenSettings
}) => {
    // Local State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDuration, setNewTaskDuration] = useState(30);
    const [newTaskType, setNewTaskType] = useState<TaskType>('backlog');

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'high': true, 'medium': true, 'low': false, 'leisure': false, 'backlog': true, 'chores': false
    });

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        onAddTask(newTaskTitle, newTaskDuration, newTaskType);
        setNewTaskTitle('');
        // Auto-expand the category
        setExpandedCategories(prev => ({ ...prev, [newTaskType]: true }));
    };

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    return (
        <div
            className="w-[325px] h-full flex flex-col border-r border-white/[0.08] bg-[#1a1f35]/80 backdrop-blur-xl relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.3)]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
        >
            {/* Logo Area */}
            <div className="p-4 pb-0">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <LayoutGrid size={16} className="text-white" />
                    </div>
                    <h1 className="text-xl font-display font-bold tracking-tight text-white">
                        Neuro<span className="text-cyan-400">Flow</span>
                    </h1>
                </div>
                <p className="text-[10px] text-slate-400 font-medium ml-9">ADHD Productivity OS</p>
            </div>

            {/* Quick Add Task */}
            <div className="p-4 border-b border-white/[0.05]">
                {/* Row 1: Inputs */}
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        placeholder="New Task..."
                        className="flex-1 bg-white/[0.03] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                    <div className="relative w-20">
                        <input
                            type="number"
                            value={newTaskDuration}
                            onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                            className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg pl-3 pr-6 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50 transition-all text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">min</span>
                    </div>
                </div>

                {/* Row 2 & 3: Type Grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[
                        { id: 'high', label: 'HIGH', activeColor: 'text-rose-500 border-rose-500/30 bg-rose-500/10' },
                        { id: 'medium', label: 'MEDIUM', activeColor: 'text-orange-500 border-orange-500/30 bg-orange-500/10' },
                        { id: 'low', label: 'LOW', activeColor: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
                        { id: 'leisure', label: 'LEISURE', activeColor: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
                        { id: 'backlog', label: 'BACKLOG', activeColor: 'text-slate-400 border-slate-400/30 bg-slate-400/10' },
                        { id: 'chores', label: 'CHORES', activeColor: 'text-zinc-200 border-zinc-200/30 bg-zinc-200/10' }
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setNewTaskType(type.id as TaskType)}
                            className={`
                                py-2 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all border
                                ${newTaskType === type.id
                                    ? `${type.activeColor}`
                                    : 'bg-white/[0.02] border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
                                }
                            `}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Row 4: Big Add Button */}
                <button
                    onClick={handleAddTask}
                    className="w-full py-3 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs font-bold text-slate-300 uppercase tracking-widest hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2 group shadow-lg"
                >
                    <Plus size={14} className="group-hover:scale-125 transition-transform duration-300" />
                    Add Task
                </button>
            </div>

            {/* Categories / Backlog List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-hide mask-image-b">
                {SIDEBAR_CATEGORIES.map(cat => {
                    const catTasks = tasks.filter(t => t.type === cat.id && t.status === 'unscheduled');
                    const isExpanded = expandedCategories[cat.id];

                    if (catTasks.length === 0 && cat.id !== 'backlog') return null;

                    return (
                        <div key={cat.id} className="group">
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center justify-between py-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-1"
                            >
                                <div className="flex items-center gap-1.5">
                                    <ChevronRight size={10} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                    <span>{cat.label}</span>
                                </div>
                                <span className="bg-white/[0.05] text-slate-400 px-1.5 py-0.5 rounded text-[9px] min-w-[18px] text-center">
                                    {catTasks.length}
                                </span>
                            </button>

                            <div className={`space-y-1.5 transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {catTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        variant="sidebar"
                                        onDragStart={onDragStart}
                                        onUpdateTask={onUpdateTask}
                                        onDeleteTask={onDeleteTask}
                                        onToggleComplete={onToggleTaskComplete}
                                    />
                                ))}
                                {catTasks.length === 0 && (
                                    <div className="text-[9px] text-slate-600 italic pl-5 py-1">No tasks</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* User / Settings Footer */}
            <div className="p-3 border-t border-white/[0.05] flex items-center justify-between bg-[#15192b]/50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 border-2 border-white/10 shadow-lg"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-200">User</span>
                        <span className="text-[9px] text-slate-500">Pro Plan</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors">
                        <Settings size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-rose-400 transition-colors">
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
