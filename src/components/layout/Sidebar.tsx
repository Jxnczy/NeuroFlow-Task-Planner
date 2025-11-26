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

// Category config with accent colors for headers
const SIDEBAR_CATEGORIES = [
    { id: 'high', label: 'High Priority', accentColor: '#f43f5e' },      // rose-500
    { id: 'medium', label: 'Medium Priority', accentColor: '#f97316' },  // orange-500
    { id: 'low', label: 'Low Priority', accentColor: '#facc15' },        // yellow-400
    { id: 'leisure', label: 'Leisure', accentColor: '#22d3ee' },         // cyan-400
    { id: 'backlog', label: 'Backlog', accentColor: '#94a3b8' },         // slate-400
    { id: 'chores', label: 'Chores', accentColor: '#a1a1aa' },           // zinc-400
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
        setExpandedCategories(prev => ({ ...prev, [newTaskType]: true }));
    };

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    return (
        <div
            className="w-[325px] h-full flex flex-col border-r backdrop-blur-xl relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.3)]"
            style={{
                backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 85%, transparent)',
                borderColor: 'var(--border-medium)'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
        >
            {/* Logo Area */}
            <div className="p-4 pb-0">
                <div className="flex items-center gap-2 mb-1">
                    <div 
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{
                            backgroundColor: 'var(--accent)',
                            boxShadow: '0 0 15px var(--accent-glow)'
                        }}
                    >
                        <LayoutGrid size={16} className="text-white" />
                    </div>
                    <h1 className="text-xl font-display font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Neuro<span style={{ color: 'var(--accent)' }}>Flow</span>
                    </h1>
                </div>
                <p className="text-[10px] font-medium ml-9" style={{ color: 'var(--text-muted)' }}>ADHD Productivity OS</p>
            </div>

            {/* Quick Add Task */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        placeholder="New Task..."
                        className="flex-1 bg-white/[0.03] border rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none transition-all"
                        style={{ 
                            borderColor: 'var(--border-medium)',
                            color: 'var(--text-primary)'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-medium)'}
                    />
                    <div className="relative w-20">
                        <input
                            type="number"
                            value={newTaskDuration}
                            onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                            className="w-full bg-white/[0.03] border rounded-lg pl-3 pr-6 py-2.5 text-sm font-mono focus:outline-none transition-all text-right"
                            style={{ 
                                borderColor: 'var(--border-medium)',
                                color: 'var(--text-primary)'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-medium)'}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px]" style={{ color: 'var(--text-muted)' }}>min</span>
                    </div>
                </div>

                {/* Type Grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
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

                {/* Add Button */}
                <button
                    onClick={handleAddTask}
                    className="w-full py-3 rounded-lg bg-white/[0.05] border text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-lg"
                    style={{ 
                        borderColor: 'var(--border-medium)',
                        color: 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-muted)';
                        e.currentTarget.style.color = 'var(--accent)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                    }}
                >
                    <Plus size={14} className="group-hover:scale-125 transition-transform duration-300" />
                    Add Task
                </button>
            </div>

            {/* Categories / Backlog List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-hide">
                {SIDEBAR_CATEGORIES.filter(c => c.id !== 'chores').map(cat => {
                    const catTasks = tasks.filter(t => t.type === cat.id && t.status === 'unscheduled');
                    const isExpanded = expandedCategories[cat.id];

                    if (catTasks.length === 0 && cat.id !== 'backlog') return null;

                    return (
                        <div key={cat.id} className="group">
                            {/* Category Header - Brighter & More Visible */}
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center justify-between py-2 px-2 rounded-lg transition-all mb-2 hover:bg-white/[0.03]"
                            >
                                <div className="flex items-center gap-2">
                                    {/* Colored dot indicator */}
                                    <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: cat.accentColor }}
                                    />
                                    <ChevronRight 
                                        size={12} 
                                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                                        style={{ color: 'var(--text-secondary)' }}
                                    />
                                    {/* Label - Brighter */}
                                    <span 
                                        className="text-[11px] font-bold uppercase tracking-widest"
                                        style={{ color: cat.accentColor }}
                                    >
                                        {cat.label}
                                    </span>
                                </div>
                                {/* Count badge */}
                                <span 
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center"
                                    style={{ 
                                        backgroundColor: `${cat.accentColor}20`,
                                        color: cat.accentColor
                                    }}
                                >
                                    {catTasks.length}
                                </span>
                            </button>

                            {/* Tasks with better separation */}
                            <div className={`space-y-2 pl-1 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                    <div className="text-[10px] italic pl-6 py-2" style={{ color: 'var(--text-muted)' }}>
                                        No tasks yet
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Fixed Chores Section */}
            {(() => {
                const choresCat = SIDEBAR_CATEGORIES.find(c => c.id === 'chores')!;
                const choresTasks = tasks.filter(t => t.type === 'chores' && t.status === 'unscheduled');
                const isExpanded = expandedCategories['chores'];

                return (
                    <div 
                        className="px-3 py-3 border-t backdrop-blur-md"
                        style={{
                            borderColor: 'var(--border-light)',
                            backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 60%, transparent)'
                        }}
                    >
                        <button
                            onClick={() => toggleCategory('chores')}
                            className="w-full flex items-center justify-between py-2 px-2 rounded-lg transition-all mb-2 hover:bg-white/[0.03]"
                        >
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: choresCat.accentColor }}
                                />
                                <ChevronRight 
                                    size={12} 
                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                                    style={{ color: 'var(--text-secondary)' }}
                                />
                                <span 
                                    className="text-[11px] font-bold uppercase tracking-widest"
                                    style={{ color: choresCat.accentColor }}
                                >
                                    {choresCat.label}
                                </span>
                            </div>
                            <span 
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center"
                                style={{ 
                                    backgroundColor: `${choresCat.accentColor}20`,
                                    color: choresCat.accentColor
                                }}
                            >
                                {choresTasks.length}
                            </span>
                        </button>

                        <div className={`space-y-2 pl-1 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-hide space-y-2">
                                {choresTasks.map(task => (
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
                                {choresTasks.length === 0 && (
                                    <div className="text-[10px] italic pl-6 py-2" style={{ color: 'var(--text-muted)' }}>
                                        No chores yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* User / Settings Footer */}
            <div 
                className="p-3 border-t flex items-center justify-between"
                style={{
                    borderColor: 'var(--border-light)',
                    backgroundColor: 'color-mix(in srgb, var(--bg-primary) 50%, transparent)'
                }}
            >
                <div className="flex items-center gap-2">
                    <div 
                        className="w-7 h-7 rounded-full border-2 shadow-lg"
                        style={{
                            background: 'linear-gradient(to top right, var(--accent), var(--warning))',
                            borderColor: 'var(--border-medium)'
                        }}
                    ></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>User</span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Pro Plan</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={onOpenSettings} 
                        className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <Settings size={16} />
                    </button>
                    <button 
                        className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
