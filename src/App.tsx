import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppData, BrainDumpList, Habit, Task } from './types';
import { getAdjustedDate } from './constants';
import { getThemeById, applyTheme } from './themes';
import { screenTransition } from './utils/animations';
import { MainLayout } from './components/layout/MainLayout';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNavBar } from './components/layout/MobileNavBar';
import { SettingsModal } from './components/layout/SettingsModal';
import { WeekView } from './components/features/board/WeekView';
import { MobilePlanner } from './components/features/board/MobilePlanner';
import { FocusMode } from './components/features/dashboard/FocusMode';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { useHabitManager } from './hooks/useHabitManager';
import { useBrainDumpManager } from './hooks/useBrainDumpManager';
import { usePersistence } from './hooks/usePersistence';
import { useIsMobile } from './hooks/useMediaQuery';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { SupabaseDataService } from './services/supabaseDataService';
import { AuthOverlay } from './components/auth/AuthOverlay';
import { generateId } from './utils/id';
import { StorageService } from './services/StorageService';
// Lazy load components
const AnalyticsDashboard = React.lazy(() => import('./components/features/dashboard/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
const HabitTracker = React.lazy(() => import('./components/features/tools/HabitTracker').then(module => ({ default: module.HabitTracker })));
const BrainDump = React.lazy(() => import('./components/features/tools/BrainDump').then(module => ({ default: module.BrainDump })));

const LoadingScreen = ({ message }: { message: string }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="space-y-3 text-center">
            <div className="h-10 w-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/70">{message}</p>
        </div>
    </div>
);

const AppContent = ({
    userId,
    initialHabitsState,
    initialBrainDump,
    onDataImported,
    supabaseEnabled,
    onToggleSupabaseSync
}: {
    userId?: string,
    initialHabitsState: Habit[],
    initialBrainDump: BrainDumpList[],
    onDataImported: (data: AppData) => void,
    supabaseEnabled: boolean,
    onToggleSupabaseSync: (enabled: boolean) => void
}) => {
    // --- Context & Hooks ---
    const taskManager = useTaskContext();
    const habitManager = useHabitManager(initialHabitsState, userId, supabaseEnabled);
    const brainDumpManager = useBrainDumpManager(initialBrainDump, userId, supabaseEnabled);
    const persistence = usePersistence(taskManager.tasks, habitManager.habits, brainDumpManager.lists);

    // --- Responsive ---
    const isMobile = useIsMobile();

    // --- UI State ---
    const [activeTab, setActiveTab] = useState<string>('planner');
    const [currentDate, setCurrentDate] = useState(getAdjustedDate());
    const [weekDirection, setWeekDirection] = useState<'next' | 'prev'>('next');
    const [isStacked, setIsStacked] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [viewMode, setViewMode] = useState<'show' | 'fade' | 'hide'>('fade');
    // activeTaskId moved to FocusMode

    // Auto-close sidebar when switching to mobile, auto-open on desktop
    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    // --- Theme ---
    const [currentThemeId, setCurrentThemeId] = useState<string>(persistence.loadTheme());

    useEffect(() => {
        const theme = getThemeById(currentThemeId);
        applyTheme(theme);
        persistence.saveTheme(currentThemeId);
    }, [currentThemeId]);

    // --- Global Hotkeys ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                persistence.exportData();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [persistence]);

    // --- App Loader Cleanup ---
    useEffect(() => {
        const timer = setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // --- Handlers ---
    const handleWeekChange = (direction: 'prev' | 'next') => {
        setWeekDirection(direction);
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const data = await persistence.importData(e);
        if (!data) return;
        onDataImported({
            tasks: data.tasks || [],
            habits: data.habits || [],
            brainDumpLists: data.brainDumpLists || []
        });

        if (supabaseEnabled && userId) {
            try {
                await SupabaseDataService.replaceTasks(userId, data.tasks || []);
                await SupabaseDataService.replaceHabits(userId, data.habits || []);
                await SupabaseDataService.replaceNotes(userId, data.brainDumpLists || []);
            } catch (error) {
                console.error('Failed to import data into Supabase', error);
                alert('Import to Supabase failed. Local data was imported.');
            }
        }
    };

    const handleFreezeOverloaded = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        (taskManager.tasks || []).forEach(task => {
            if (!task) return;
            if (task.status === 'completed') return;
            if (!task.dueDate) return;
            if (task.dueDate > todayStr) return;

            taskManager.updateTask(task.id, {
                status: 'unscheduled',
                dueDate: null,
                assignedRow: null,
                eisenhowerQuad: null,
                isFrozen: true
            });
        });
    };

    return (
        <>
            {taskManager.isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm text-white">
                    <div className="space-y-3 text-center">
                        <div className="h-10 w-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-white/70">Syncing tasks from Supabase…</p>
                    </div>
                </div>
            )}
            <MainLayout
                sidebar={
                    <Sidebar
                        onOpenSettings={() => setShowSettings(true)}
                        isOpen={isSidebarOpen}
                        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        onClose={() => setIsSidebarOpen(false)}
                        isMobile={isMobile}
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
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                }
            >
                <AnimatePresence mode="wait">
                    {activeTab === 'planner' && (
                        <motion.div
                            key="planner"
                            variants={screenTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 80 : 0 }}
                        >
                            {isMobile ? (
                                <MobilePlanner
                                    currentDate={currentDate}
                                    viewMode={viewMode}
                                    onWeekChange={handleWeekChange}
                                    onOpenSidebar={() => setIsSidebarOpen(true)}
                                />
                            ) : (
                                <WeekView
                                    currentDate={currentDate}
                                    weekDirection={weekDirection}
                                    isStacked={isStacked}
                                    viewMode={viewMode}
                                />
                            )}
                        </motion.div>
                    )}
                    {activeTab === 'focus' && (
                        <motion.div
                            key="focus"
                            variants={screenTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 80 : 0 }}
                        >
                            <FocusMode
                                tasks={taskManager.tasks}
                                onDragStart={taskManager.handleDragStart}
                                onToggleTaskComplete={taskManager.toggleTaskComplete}
                                onUpdateTask={taskManager.updateTask}
                                showCompleted={viewMode === 'show'}
                            />
                        </motion.div>
                    )}
                    {activeTab === 'habits' && (
                        <motion.div
                            key="habits"
                            variants={screenTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 80 : 0 }}
                        >
                            <Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Loading habits...</div>}>
                                <HabitTracker
                                    habits={habitManager.habits}
                                    toggleHabit={habitManager.toggleHabit}
                                    onDeleteHabit={habitManager.deleteHabit}
                                    onAddHabit={habitManager.addHabit}
                                />
                            </Suspense>
                        </motion.div>
                    )}
                    {activeTab === 'braindump' && (
                        <motion.div
                            key="braindump"
                            variants={screenTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 80 : 0 }}
                        >
                            <Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Loading brain dump...</div>}>
                                <BrainDump
                                    lists={brainDumpManager.lists}
                                    onUpdateList={brainDumpManager.updateList}
                                    onAddList={brainDumpManager.addList}
                                    onDeleteList={brainDumpManager.deleteList}
                                    onUpdateTitle={brainDumpManager.updateTitle}
                                />
                            </Suspense>
                        </motion.div>
                    )}
                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            variants={screenTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 80 : 0 }}
                        >
                            <Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Loading analytics...</div>}>
                                <AnalyticsDashboard tasks={taskManager.tasks} />
                            </Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>
            </MainLayout>

            {showSettings && (
                <SettingsModal
                    onClose={() => setShowSettings(false)}
                    onExport={persistence.exportData}
                    onImport={handleImport}
                    onDeleteAllTasks={taskManager.deleteAllTasks}
                    onFreezeOverloaded={handleFreezeOverloaded}
                    onClearRescheduled={taskManager.clearRescheduledTasks}
                    currentThemeId={currentThemeId}
                    onThemeChange={setCurrentThemeId}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    supabaseEnabled={supabaseEnabled}
                    onToggleSupabase={onToggleSupabaseSync}
                />
            )}

            {isMobile && (
                <MobileNavBar activeTab={activeTab} onChange={setActiveTab} />
            )}
        </>
    );
};

const App = () => {
    const storage = StorageService.getInstance();
    const localData = React.useMemo(() => storage.load(), []);
    const [useSupabaseSync, setUseSupabaseSync] = useState<boolean>(() => storage.loadSyncPreference());

    const { user, isAuthReady, authError, magicLinkSent, signInWithEmail, signInWithOAuth } = useSupabaseAuth();
    const [initialTasksState, setInitialTasksState] = useState<Task[]>(localData?.tasks || []);
    const [initialHabitsState, setInitialHabitsState] = useState<Habit[]>(localData?.habits?.map(h => ({ ...h, goal: h.goal || 7 })) || []);
    const [initialBrainDumpState, setInitialBrainDumpState] = useState<BrainDumpList[]>(
        (localData?.brainDumpLists && localData.brainDumpLists.length > 0)
            ? localData.brainDumpLists
            : [{ id: generateId(), title: 'Main List', content: localData?.brainDumpContent || '' }]
    );
    const [isDataLoading, setIsDataLoading] = useState<boolean>(useSupabaseSync);
    const [dataError, setDataError] = useState<string | null>(null);
    const hasLocalData = (localData?.tasks?.length || 0) > 0 || (localData?.habits?.length || 0) > 0 || (localData?.brainDumpLists?.length || 0) > 0;

    const pushLocalToSupabase = async (data: AppData) => {
        if (!useSupabaseSync || !user) return;
        try {
            await SupabaseDataService.replaceTasks(user.id, data.tasks || []);
            await SupabaseDataService.replaceHabits(user.id, data.habits || []);
            await SupabaseDataService.replaceNotes(user.id, data.brainDumpLists || []);
        } catch (error) {
            console.error('Failed to push local data to Supabase', error);
        }
    };

    useEffect(() => {
        if (!useSupabaseSync) {
            setIsDataLoading(false);
            return;
        }
        if (!user) {
            setIsDataLoading(false);
            return;
        }
        let active = true;
        const load = async () => {
            setIsDataLoading(true);
            setDataError(null);
            try {
                const [tasks, habits, notes] = await Promise.all([
                    SupabaseDataService.fetchTasks(user.id),
                    SupabaseDataService.fetchHabits(user.id),
                    SupabaseDataService.fetchNotes(user.id)
                ]);
                if (!active) return;
                const remoteEmpty = (!tasks.length && !habits.length && !notes.length);
                if (remoteEmpty && hasLocalData) {
                    const fallbackData: AppData = {
                        tasks: localData?.tasks || [],
                        habits: localData?.habits || [],
                        brainDumpLists: localData?.brainDumpLists || []
                    };
                    setInitialTasksState(fallbackData.tasks);
                    setInitialHabitsState(fallbackData.habits);
                    setInitialBrainDumpState(fallbackData.brainDumpLists.length ? fallbackData.brainDumpLists : [{ id: generateId(), title: 'Main List', content: '' }]);
                    storage.save(fallbackData);
                    void pushLocalToSupabase(fallbackData);
                } else {
                    setInitialTasksState(tasks);
                    setInitialHabitsState(habits);
                    setInitialBrainDumpState(notes.length ? notes : [{ id: generateId(), title: 'Main List', content: '' }]);
                    storage.save({ tasks, habits, brainDumpLists: notes });
                }
            } catch (error) {
                console.error('Failed to load Supabase data', error);
                if (active) {
                    setDataError('Unable to load data from Supabase.');
                }
            } finally {
                if (active) {
                    setIsDataLoading(false);
                }
            }
        };
        load();
        return () => { active = false; };
    }, [user, useSupabaseSync, hasLocalData, localData]);

    const handleDataImported = (data: AppData) => {
        const normalized: AppData = {
            tasks: data.tasks || [],
            habits: (data.habits || []).map(h => ({ ...h, goal: h.goal || 7 })),
            brainDumpLists: (data.brainDumpLists && data.brainDumpLists.length > 0)
                ? data.brainDumpLists
                : [{ id: generateId(), title: 'Main List', content: '' }]
        };
        setInitialTasksState(normalized.tasks);
        setInitialHabitsState(normalized.habits);
        setInitialBrainDumpState(normalized.brainDumpLists);
        storage.save(normalized);
        void pushLocalToSupabase(normalized);
    };

    const handleToggleSupabaseSync = (enabled: boolean) => {
        setUseSupabaseSync(enabled);
        storage.saveSyncPreference(enabled);
        if (!enabled) {
            setDataError(null);
            setIsDataLoading(false);
        } else {
            setIsDataLoading(true);
        }
    };

    if (useSupabaseSync) {
        if (!isAuthReady) {
            return <LoadingScreen message="Checking your session..." />;
        }

        if (!user) {
            return (
                <AuthOverlay
                    onMagicLink={signInWithEmail}
                    onOAuth={signInWithOAuth}
                    magicLinkSent={magicLinkSent}
                    authError={authError}
                />
            );
        }

        if (dataError) {
            return <LoadingScreen message={dataError} />;
        }

        if (isDataLoading) {
            return <LoadingScreen message="Loading your workspace from Supabase..." />;
        }

        return (
            <TaskProvider initialTasks={initialTasksState} userId={user.id} supabaseEnabled={true}>
            <AppContent
                userId={user.id}
                initialHabitsState={initialHabitsState}
                initialBrainDump={initialBrainDumpState}
                onDataImported={handleDataImported}
                supabaseEnabled={true}
                onToggleSupabaseSync={handleToggleSupabaseSync}
            />
        </TaskProvider>
    );
}

// Local-only mode (no Supabase auth required)
return (
    <TaskProvider initialTasks={initialTasksState} supabaseEnabled={false}>
        <AppContent
            initialHabitsState={initialHabitsState}
            initialBrainDump={initialBrainDumpState}
            onDataImported={handleDataImported}
            supabaseEnabled={false}
            onToggleSupabaseSync={handleToggleSupabaseSync}
        />
    </TaskProvider>
);
};

export default App;
