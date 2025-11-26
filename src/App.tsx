import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskType, Habit, GridRow, TaskStatus, AppData, BrainDumpList } from './types';
import { getWeekDays, formatDate, playSuccessSound, DAYS, getAdjustedDate } from './constants';
import { MainLayout } from './components/layout/MainLayout';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/layout/SettingsModal';
import { WeekView } from './components/features/board/WeekView';
import { FocusMode } from './components/features/dashboard/FocusMode';
import { AnalyticsDashboard } from './components/features/dashboard/AnalyticsDashboard';
import { HabitTracker } from './components/features/tools/HabitTracker';
import { BrainDump } from './components/features/tools/BrainDump';
import { themes, getThemeById, applyTheme } from './themes';

// --- Local Storage ---
const STORAGE_KEY = 'neuroflow-app-data';
const THEME_STORAGE_KEY = 'neuroflow-theme';

const saveToLocalStorage = (data: AppData) => {
    try {
        const json = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, json);
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
};

const loadFromLocalStorage = (): AppData | null => {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
            const data = JSON.parse(json);
            // Validate that it has the expected structure
            if (data && Array.isArray(data.tasks) && Array.isArray(data.habits)) {
                return data as AppData;
            }
        }
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
    }
    return null;
};

// --- Initial Data ---
const INITIAL_TASKS: Task[] = [
    { id: '1', title: 'Q3 Strategy Review', duration: 60, type: 'high', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: 'do', createdAt: Date.now() },
    { id: '2', title: 'Inbox Zero', duration: 30, type: 'low', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: 'delegate', createdAt: Date.now() },
    { id: '3', title: 'Deep Work: Coding', duration: 90, type: 'high', status: 'scheduled', dueDate: new Date().toISOString().split('T')[0], assignedRow: 'FOCUS', eisenhowerQuad: null, createdAt: Date.now() },
    { id: '4', title: 'Evening Run', duration: 45, type: 'leisure', status: 'scheduled', dueDate: new Date().toISOString().split('T')[0], assignedRow: 'LEISURE', eisenhowerQuad: null, createdAt: Date.now() },
    { id: '5', title: 'Client presentation', duration: 90, type: 'high', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '6', title: 'Fix critical bugs', duration: 180, type: 'high', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '7', title: 'Review Report', duration: 120, type: 'high', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '8', title: 'Brainstorm ideas', duration: 90, type: 'medium', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '9', title: 'Research eBay auto', duration: 120, type: 'medium', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '10', title: 'Order calendar', duration: 60, type: 'medium', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '11', title: 'Schedule dentist', duration: 15, type: 'low', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '12', title: 'Check mails', duration: 30, type: 'low', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '13', title: 'Pay electricity', duration: 10, type: 'low', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '14', title: 'Read one chapter', duration: 30, type: 'leisure', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '15', title: 'Organize Photos', duration: 180, type: 'leisure', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '16', title: 'Clean Up', duration: 15, type: 'chores', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
    { id: '17', title: 'Trash Out', duration: 5, type: 'chores', status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: null, createdAt: Date.now() },
];

const INITIAL_HABITS: Habit[] = [
    { id: 'h1', name: 'Meditation', goal: 7, checks: [false, false, true, false, false, false, false] },
    { id: 'h2', name: 'Reading', goal: 5, checks: [true, false, true, true, false, false, false] },
    { id: 'h3', name: 'Hydration', goal: 7, checks: [false, false, false, false, false, false, false] },
];

const App = () => {
    // --- State ---
    // Initialize from localStorage or use defaults
    const [tasks, setTasks] = useState<Task[]>(() => {
        const savedData = loadFromLocalStorage();
        return savedData ? savedData.tasks : INITIAL_TASKS;
    });

    const [habits, setHabits] = useState<Habit[]>(() => {
        const savedData = loadFromLocalStorage();
        return savedData ? savedData.habits.map(h => ({ ...h, goal: h.goal || 7 })) : INITIAL_HABITS;
    });

    const [brainDumpLists, setBrainDumpLists] = useState<BrainDumpList[]>(() => {
        const savedData = loadFromLocalStorage();
        if (savedData && savedData.brainDumpLists && savedData.brainDumpLists.length > 0) {
            return savedData.brainDumpLists;
        }
        // Migration: If legacy content exists, create a default list
        const legacyContent = savedData?.brainDumpContent || '';
        if (savedData && savedData.notes && savedData.notes.length > 0) {
            return [{ id: '1', title: 'Main List', content: savedData.notes.map(n => n.content).join('\n\n') }];
        }
        return [{ id: '1', title: 'Main List', content: legacyContent }];
    });

    const [activeTab, setActiveTab] = useState<string>('planner');
    const [currentDate, setCurrentDate] = useState(getAdjustedDate());
    const [isStacked, setIsStacked] = useState(false);

    // Deep Work State
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

    // Settings
    const [showSettings, setShowSettings] = useState(false);

    const [showCompleted, setShowCompleted] = useState(true);

    // Theme State
    const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
        try {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            return savedTheme || 'neuroflow';
        } catch {
            return 'neuroflow';
        }
    });

    // --- Effects ---
    // Auto-save to localStorage whenever tasks, habits, or brainDumpLists change
    useEffect(() => {
        const appData: AppData = { tasks, habits, brainDumpLists };
        saveToLocalStorage(appData);
    }, [tasks, habits, brainDumpLists]);

    // Apply theme on mount and when it changes
    useEffect(() => {
        const theme = getThemeById(currentThemeId);
        applyTheme(theme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, currentThemeId);
        } catch (error) {
            console.error('Failed to save theme to localStorage:', error);
        }
    }, [currentThemeId]);

    // Global Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                exportData();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tasks, habits, brainDumpLists]);

    // --- Handlers ---
    const addTask = (title: string, duration: number, type: TaskType) => {
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            duration,
            type,
            status: 'unscheduled',
            dueDate: null,
            assignedRow: null,
            eisenhowerQuad: null,
            createdAt: Date.now(),
        };
        setTasks([...tasks, newTask]);
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        ));
    };

    const deleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const addHabit = (name: string, goal: number) => {
        const newHabit: Habit = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            goal,
            checks: Array(7).fill(false)
        };
        setHabits(prev => [...prev, newHabit]);
    };

    const deleteHabit = (habitId: string) => {
        setHabits(prev => prev.filter(h => h.id !== habitId));
    };

    const handleReorderTasks = (sourceTaskId: string, targetTaskId: string) => {
        setTasks(prev => {
            const sourceIndex = prev.findIndex(t => t.id === sourceTaskId);
            const targetIndex = prev.findIndex(t => t.id === targetTaskId);
            if (sourceIndex === -1 || targetIndex === -1) return prev;

            const newTasks = [...prev];
            const [removed] = newTasks.splice(sourceIndex, 1);
            newTasks.splice(targetIndex, 0, removed);
            return newTasks;
        });
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDropOnGrid = (e: React.DragEvent, day: Date, row: GridRow | null) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                let targetRow = row;
                let targetType = t.type;

                if (targetRow) {
                    // Dropped on a specific row (Matrix mode)
                    switch (targetRow) {
                        case 'GOAL': targetType = 'high'; break;
                        case 'FOCUS': targetType = 'medium'; break;
                        case 'WORK': targetType = 'low'; break;
                        case 'LEISURE': targetType = 'leisure'; break;
                        case 'CHORES': targetType = 'chores'; break;
                    }
                } else {
                    // Dropped on a day column (Stacked mode)
                    switch (t.type) {
                        case 'high': targetRow = 'GOAL'; break;
                        case 'medium': targetRow = 'FOCUS'; break;
                        case 'low': targetRow = 'WORK'; break;
                        case 'leisure': targetRow = 'LEISURE'; break;
                        case 'chores': targetRow = 'CHORES'; break;
                        case 'backlog':
                        default:
                            targetType = 'medium';
                            targetRow = 'FOCUS';
                            break;
                    }
                }

                return {
                    ...t,
                    status: 'scheduled',
                    dueDate: formatDate(day),
                    assignedRow: targetRow as GridRow,
                    eisenhowerQuad: null,
                    type: targetType
                };
            }
            return t;
        }));
    };

    const handleDropOnSidebar = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status: 'unscheduled',
                    dueDate: null,
                    assignedRow: null,
                    eisenhowerQuad: null
                };
            }
            return t;
        }));
    };

    const handleDropOnEisenhower = (e: React.DragEvent, quad: 'do' | 'decide' | 'delegate' | 'delete') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: quad };
            }
            return t;
        }));
    };

    const toggleHabit = (habitId: string, dayIndex: number) => {
        setHabits(prev => prev.map(h => {
            if (h.id === habitId) {
                const newChecks = [...h.checks];
                newChecks[dayIndex] = !newChecks[dayIndex];
                return { ...h, checks: newChecks };
            }
            return h;
        }));
    };

    const toggleTaskComplete = (taskId: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const isComplete = t.status === 'completed';
                let newStatus: TaskStatus;

                if (isComplete) {
                    newStatus = (t.dueDate && t.assignedRow) ? 'scheduled' : 'unscheduled';
                } else {
                    newStatus = 'completed';
                    playSuccessSound();
                }
                return { ...t, status: newStatus };
            }
            return t;
        }));
    };

    const exportData = () => {
        const data: AppData = { tasks, habits, brainDumpLists };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Generate timestamp: YY_MM_DD(HH_MM)
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const hh = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        const timestamp = `${yy}_${mm}_${dd}(${hh}_${min})`;

        a.download = `${timestamp}-neuroflow-data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData: AppData = JSON.parse(e.target?.result as string);
                    if (importedData.tasks && importedData.habits) {
                        setTasks(importedData.tasks);
                        setHabits(importedData.habits);
                        if (importedData.brainDumpLists) {
                            setBrainDumpLists(importedData.brainDumpLists);
                        } else if (importedData.brainDumpContent) {
                            setBrainDumpLists([{ id: '1', title: 'Main List', content: importedData.brainDumpContent }]);
                        }
                        alert('Data imported successfully!');
                    } else {
                        throw new Error('Invalid data format.');
                    }
                } catch (error) {
                    console.error('Failed to import data:', error);
                    alert('Failed to import data. Please ensure it is a valid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleWeekChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));

        // Recurring Chores Logic
        if (direction === 'next') {
            const targetWeekDays = getWeekDays(newDate);
            const targetWeekStart = formatDate(targetWeekDays[0]);
            const targetWeekEnd = formatDate(targetWeekDays[6]);

            // Find chores from the current week to clone
            const currentWeekDays = getWeekDays(currentDate);
            const currentWeekStart = formatDate(currentWeekDays[0]);
            const currentWeekEnd = formatDate(currentWeekDays[6]);

            const choresToClone = tasks.filter(t =>
                t.assignedRow === 'CHORES' &&
                t.dueDate &&
                t.dueDate >= currentWeekStart &&
                t.dueDate <= currentWeekEnd &&
                t.status !== 'unscheduled'
            );

            if (choresToClone.length > 0) {
                const tasksToDelete: string[] = [];
                const tasksToUpdate: { id: string, updates: Partial<Task> }[] = [];
                const newChores: Task[] = [];

                choresToClone.forEach(chore => {
                    // 1. Check if this chore is already scheduled in the TARGET week (bug residue)
                    const targetWeekTask = tasks.find(t =>
                        t.assignedRow === 'CHORES' &&
                        t.dueDate &&
                        t.dueDate >= targetWeekStart &&
                        t.dueDate <= targetWeekEnd &&
                        t.title === chore.title
                    );

                    // 2. Check if it exists in backlog
                    const alreadyExistsInBacklog = tasks.some(t =>
                        t.type === 'chores' &&
                        t.status === 'unscheduled' &&
                        t.title === chore.title
                    );

                    if (targetWeekTask) {
                        // It exists in the target week (scheduled).
                        if (alreadyExistsInBacklog) {
                            // Duplicate! Delete the scheduled one.
                            tasksToDelete.push(targetWeekTask.id);
                        } else {
                            // Move it to backlog.
                            tasksToUpdate.push({
                                id: targetWeekTask.id,
                                updates: { status: 'unscheduled', dueDate: null, assignedRow: null, type: 'chores' }
                            });
                        }
                    } else {
                        // Not in target week.
                        if (!alreadyExistsInBacklog) {
                            // Check if we already added it to newChores in this loop
                            const alreadyInNewChores = newChores.some(nc => nc.title === chore.title);
                            if (!alreadyInNewChores) {
                                newChores.push({
                                    ...chore,
                                    id: Math.random().toString(36).substr(2, 9),
                                    status: 'unscheduled',
                                    dueDate: null,
                                    assignedRow: null,
                                    createdAt: Date.now()
                                });
                            }
                        }
                    }
                });

                if (tasksToDelete.length > 0 || tasksToUpdate.length > 0 || newChores.length > 0) {
                    setTasks(prev => {
                        let nextState = [...prev];
                        // Delete
                        if (tasksToDelete.length > 0) {
                            nextState = nextState.filter(t => !tasksToDelete.includes(t.id));
                        }
                        // Update
                        if (tasksToUpdate.length > 0) {
                            nextState = nextState.map(t => {
                                const update = tasksToUpdate.find(u => u.id === t.id);
                                return update ? { ...t, ...update.updates } : t;
                            });
                        }
                        // Add
                        if (newChores.length > 0) {
                            nextState = [...nextState, ...newChores];
                        }
                        return nextState;
                    });
                }
            }
        }

        setCurrentDate(newDate);
    };

    return (
        <>
            <MainLayout
                sidebar={
                    <Sidebar
                        tasks={tasks}
                        onDragStart={handleDragStart}
                        onDrop={handleDropOnSidebar}
                        onAddTask={addTask}
                        onUpdateTask={updateTask}
                        onDeleteTask={deleteTask}
                        onToggleTaskComplete={toggleTaskComplete}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                }
                header={
                    <Header
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        currentDate={currentDate}
                        onWeekChange={handleWeekChange}
                        isStacked={isStacked}
                        setIsStacked={setIsStacked}
                        showCompleted={showCompleted}
                        setShowCompleted={setShowCompleted}
                    />
                }
            >
                {activeTab === 'planner' && (
                    <WeekView
                        tasks={tasks}
                        currentDate={currentDate}
                        isStacked={isStacked}
                        onDropOnGrid={handleDropOnGrid}
                        onDragStart={handleDragStart}
                        onUpdateTask={updateTask}
                        onDeleteTask={deleteTask}
                        onToggleTaskComplete={toggleTaskComplete}
                        onTaskDrop={handleReorderTasks}
                        showCompleted={showCompleted}
                    />
                )}
                {activeTab === 'focus' && (
                    <FocusMode
                        tasks={tasks}
                        onDragStart={handleDragStart}
                        onToggleTaskComplete={toggleTaskComplete}
                        onStartFocus={(id) => {
                            setActiveTaskId(id);
                        }}
                        onUpdateTask={updateTask}
                        showCompleted={showCompleted}
                    />
                )}
                {activeTab === 'habits' && (
                    <HabitTracker
                        habits={habits}
                        toggleHabit={toggleHabit}
                        onDeleteHabit={deleteHabit}
                        onAddHabit={addHabit}
                    />
                )}
                {activeTab === 'braindump' && (
                    <BrainDump
                        lists={brainDumpLists}
                        onUpdateList={(id, content) => {
                            setBrainDumpLists(prev => prev.map(l => l.id === id ? { ...l, content } : l));
                        }}
                        onAddList={() => {
                            const newList: BrainDumpList = {
                                id: Math.random().toString(36).substr(2, 9),
                                title: `List ${brainDumpLists.length + 1}`,
                                content: ''
                            };
                            setBrainDumpLists(prev => [...prev, newList]);
                        }}
                        onDeleteList={(id) => {
                            setBrainDumpLists(prev => prev.filter(l => l.id !== id));
                        }}
                        onUpdateTitle={(id, title) => {
                            setBrainDumpLists(prev => prev.map(l => l.id === id ? { ...l, title } : l));
                        }}
                    />
                )}
                {activeTab === 'analytics' && (
                    <AnalyticsDashboard tasks={tasks} />
                )}
            </MainLayout>

            {showSettings && (
                <SettingsModal
                    onClose={() => setShowSettings(false)}
                    onExport={exportData}
                    onImport={importData}
                    currentThemeId={currentThemeId}
                    onThemeChange={setCurrentThemeId}
                />
            )}
        </>
    );
};

export default App;
