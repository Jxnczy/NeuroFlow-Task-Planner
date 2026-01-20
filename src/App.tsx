import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppData, BrainDumpList, Habit, Task, TaskType, GridRow } from './types';
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
import { SpotlightTour } from './components/onboarding/SpotlightTour';
import { TabOnboarding } from './components/onboarding/TabOnboarding';
import { FirstTaskGuide } from './components/onboarding/FirstTaskGuide';
import { generateId } from './utils/id';
import { StorageService } from './services/StorageService';
import { supabaseAvailable, supabaseUrl } from './lib/supabase';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { QuickAddModal } from './components/ui/QuickAddModal';
import { KeyboardShortcutsHelp } from './components/ui/KeyboardShortcutsHelp';
import { CommandPalette } from './components/ui/CommandPalette';
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
    initialStatsResetAt,
    onDataImported,
    onDeleteAllTasks,
    supabaseEnabled,
    onToggleSupabaseSync,
    isReturningUser = false,
    onOnboardingComplete,
    onLogout
}: {
    userId?: string,
    initialHabitsState: Habit[],
    initialBrainDump: BrainDumpList[],
    initialStatsResetAt: number,
    onDataImported: (data: AppData) => void,
    onDeleteAllTasks: () => Promise<void>,
    supabaseEnabled: boolean,
    onToggleSupabaseSync: (enabled: boolean) => void,
    isReturningUser?: boolean,
    onOnboardingComplete?: () => void,
    onLogout?: () => void
}) => {
    // --- Context & Hooks ---
    const taskManager = useTaskContext();
    const habitManager = useHabitManager(initialHabitsState, userId, supabaseEnabled);
    const brainDumpManager = useBrainDumpManager(initialBrainDump, userId, supabaseEnabled);

    // UI State for stats reset baseline
    const [statsResetAt, setStatsResetAt] = useState<number>(initialStatsResetAt);

    const persistence = usePersistence(taskManager.tasks, habitManager.habits, brainDumpManager.lists, statsResetAt);

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
    const [dayViewMode, setDayViewMode] = useState<'list' | 'timeline'>(() => {
        return StorageService.getInstance().loadDayViewMode();
    });
    // activeTaskId moved to FocusMode
    const today = getAdjustedDate();
    const [sampleTasksAdded, setSampleTasksAdded] = useState(false);
    const hasAnyTasks = (taskManager.tasks?.length || 0) > 0;
    const hasScheduledTask = (taskManager.tasks || []).some(t => t.dueDate !== null && t.dueDate !== undefined);

    // --- Keyboard Shortcuts State ---
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    // --- Onboarding Tour ---
    // Don't show tour for returning users (those who completed onboarding before)
    const [showTour, setShowTour] = useState(() => {
        // Skip tour entirely for returning logged-in users
        if (isReturningUser) return false;
        try {
            return localStorage.getItem('neuroflow_tour_completed') !== 'true';
        } catch {
            return true;
        }
    });

    // Track first task guide completion for proper onboarding order
    const [firstGuideComplete, setFirstGuideComplete] = useState(() => {
        // Skip for returning users
        if (isReturningUser) return true;
        try {
            return localStorage.getItem('neuroflow_first_task_guide_completed') === 'true';
        } catch {
            return false;
        }
    });

    const handleTourComplete = useCallback(() => {
        try {
            localStorage.setItem('neuroflow_tour_completed', 'true');
        } catch { }
        setShowTour(false);
        // Persist onboarding completion to Supabase for cross-device sync
        onOnboardingComplete?.();
    }, [onOnboardingComplete]);

    const handleResetTour = useCallback(() => {
        try {
            localStorage.removeItem('neuroflow_tour_completed');
        } catch { }
        setShowTour(true);
    }, []);


    useEffect(() => {
        if (hasAnyTasks) {
            setSampleTasksAdded(true);
        }
    }, [hasAnyTasks]);

    // Fetch stats reset baseline
    useEffect(() => {
        if (!userId || !supabaseEnabled) return;
        const fetchBaseline = async () => {
            try {
                const baseline = await SupabaseDataService.fetchStatsResetAt(userId);
                if (baseline) setStatsResetAt(baseline);
            } catch (error) {
                console.error('Failed to fetch stats reset baseline', error);
            }
        };
        fetchBaseline();
    }, [userId, supabaseEnabled]);

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

    // --- Keyboard Shortcuts ---
    useKeyboardShortcuts({
        onQuickAdd: () => setShowQuickAdd(true),
        onToggleFocus: () => setActiveTab(activeTab === 'focus' ? 'planner' : 'focus'),
        onNavigatePrev: () => handleWeekChange('prev'),
        onNavigateNext: () => handleWeekChange('next'),
        onShowHelp: () => setShowShortcutsHelp(prev => !prev),
        onToggleSidebar: () => setIsSidebarOpen(prev => !prev),
        onCommandPalette: () => setShowCommandPalette(prev => !prev),
    }, !showSettings && !showQuickAdd && !showCommandPalette);

    // --- App Loader Cleanup ---
    useEffect(() => {
        // Skip splash delay for returning logged-in users
        if (userId) {
            document.body.classList.add('loaded');
            return;
        }
        const timer = setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1200); // Show splash for 1.2s for smooth transition (new users only)
        return () => clearTimeout(timer);
    }, [userId]);

    // --- Handlers ---
    const handleWeekChange = (direction: 'prev' | 'next') => {
        setWeekDirection(direction);
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const handleJumpToCurrentWeek = () => {
        setCurrentDate(new Date());
    };

    const handleDayViewModeChange = (mode: 'list' | 'timeline') => {
        setDayViewMode(mode);
        StorageService.getInstance().saveDayViewMode(mode);
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

    const handleAddSampleTasks = () => {
        const sampleSpecs: Array<{ title: string; duration: number; type: TaskType; offsetDays?: number; row?: GridRow }> = [
            { title: 'Plan the week', duration: 25, type: 'high', offsetDays: 0, row: 'GOAL' },
            { title: 'Deep work: main project', duration: 90, type: 'medium', offsetDays: 0, row: 'FOCUS' },
            { title: 'Quick wins inbox', duration: 30, type: 'low', offsetDays: 1, row: 'WORK' },
            { title: 'Reach out to partner', duration: 20, type: 'medium', offsetDays: 2, row: 'FOCUS' },
            { title: 'Move & recharge', duration: 30, type: 'leisure' }
        ];

        sampleSpecs.forEach(spec => {
            const newTask = taskManager.addTask(spec.title, spec.duration, spec.type);
            if (spec.offsetDays !== undefined && spec.row) {
                const target = new Date(today);
                target.setDate(target.getDate() + spec.offsetDays);
                taskManager.scheduleTask(newTask.id, target, spec.row, spec.type);
            }
        });
        setActiveTab('planner');
        setSampleTasksAdded(true);
    };

    const handleDeleteAllTasks = async () => {
        // Clear locally
        taskManager.deleteAllTasks();
        habitManager.clearHabits();
        brainDumpManager.clearLists();
        setSampleTasksAdded(true);
        // Delegate storage and remote clearing to App component
        await onDeleteAllTasks();
    };

    const handleResetStats = () => {
        const now = Date.now();
        setStatsResetAt(now);
        taskManager.resetStats();
        if (userId && supabaseEnabled) {
            void SupabaseDataService.setStatsResetAt(userId, now);
        }
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

            {/* Onboarding Spotlight Tour - only on desktop when sidebar is open */}
            {showTour && !isMobile && isSidebarOpen && (
                <SpotlightTour onComplete={handleTourComplete} />
            )}

            {/* Per-tab first-visit tooltips - show on mobile regardless of tour (tour is desktop-only) */}
            {/* Don't show planner tab tip when FirstTaskGuide is active/incomplete */}
            {(!showTour || isMobile) && (activeTab !== 'planner' || firstGuideComplete) && !isReturningUser && <TabOnboarding activeTab={activeTab} />}

            {/* First task creation guide - shows after spotlight tour (mobile-responsive) */}
            {(!showTour || isMobile) && activeTab === 'planner' && (
                <FirstTaskGuide
                    onComplete={() => setFirstGuideComplete(true)}
                    hasAnyTasks={hasAnyTasks}
                    hasScheduledTask={hasScheduledTask}
                    isSidebarOpen={isSidebarOpen}
                />
            )}
            <MainLayout
                sidebar={
                    <Sidebar
                        onOpenSettings={() => setShowSettings(true)}
                        isOpen={isSidebarOpen}
                        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        onClose={() => setIsSidebarOpen(false)}
                        isMobile={isMobile}
                        skipAutoFocus={isMobile && !firstGuideComplete}
                        dayViewMode={dayViewMode}
                        selectedDate={currentDate}
                    />
                }
                header={
                    <Header
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        currentDate={currentDate}
                        onWeekChange={handleWeekChange}
                        onJumpToCurrentWeek={handleJumpToCurrentWeek}
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
                                    dayViewMode={dayViewMode}
                                    onDayViewModeChange={handleDayViewModeChange}
                                    onWeekChange={handleWeekChange}
                                    onOpenSidebar={() => setIsSidebarOpen(true)}
                                />
                            ) : (
                                <WeekView
                                    currentDate={currentDate}
                                    weekDirection={weekDirection}
                                    isStacked={isStacked}
                                    viewMode={viewMode}
                                    dayViewMode={dayViewMode}
                                    onDayViewModeChange={handleDayViewModeChange}
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
                                <AnalyticsDashboard tasks={taskManager.tasks} statsResetAt={statsResetAt} />
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
                    onDeleteAllTasks={handleDeleteAllTasks}
                    onFreezeOverloaded={handleFreezeOverloaded}
                    onClearRescheduled={taskManager.clearRescheduledTasks}
                    onResetStats={handleResetStats}
                    currentThemeId={currentThemeId}
                    onThemeChange={setCurrentThemeId}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    dayViewMode={dayViewMode}
                    onDayViewModeChange={handleDayViewModeChange}
                    supabaseEnabled={supabaseEnabled}
                    onToggleSupabase={onToggleSupabaseSync}
                    onAddSampleTasks={handleAddSampleTasks}
                    sampleTasksAdded={sampleTasksAdded}
                    showSampleTasks={!sampleTasksAdded && !hasAnyTasks}
                    onResetTour={handleResetTour}
                    onLogout={onLogout}
                />
            )}

            {isMobile && (
                <MobileNavBar activeTab={activeTab} onChange={setActiveTab} />
            )}

            {/* Quick Add Modal (Ctrl+N) */}
            <QuickAddModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                onAddTask={(title, duration, type) => {
                    taskManager.addTask(title, duration, type);
                }}
            />

            {/* Command Palette (Ctrl+K) */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                onNewTask={() => {
                    setShowCommandPalette(false);
                    setShowQuickAdd(true);
                }}
                onOpenSettings={() => {
                    setShowCommandPalette(false);
                    setShowSettings(true);
                }}
                onGoToToday={() => {
                    setCurrentDate(getAdjustedDate());
                    setActiveTab('planner');
                }}
                onOpenBrainDump={() => {
                    setActiveTab('braindump');
                }}
            />

            {/* Keyboard Shortcuts Help (?) */}
            <KeyboardShortcutsHelp
                isOpen={showShortcutsHelp}
                onClose={() => setShowShortcutsHelp(false)}
            />
        </>
    );
};

const App = () => {
    const storage = StorageService.getInstance();
    const localData = React.useMemo(() => storage.load(), []);

    // Check stored preference: null = first visit, false = chose local, true = chose sync
    const storedPref = React.useMemo(() => storage.loadSyncPreference(), []);
    const isFirstVisit = storedPref === null;

    // Only show login/splash if: first visit OR user previously enabled sync
    const shouldShowSync = supabaseAvailable && (isFirstVisit || storedPref === true);

    const [useSupabaseSync, setUseSupabaseSync] = useState<boolean>(shouldShowSync);
    const [supabaseHealthy, setSupabaseHealthy] = useState<boolean | null>(null);
    const [authTimeoutReached, setAuthTimeoutReached] = useState(false);

    const { user, isAuthReady, authError, magicLinkSent, signInWithEmail, signInWithOAuth, signOut } = useSupabaseAuth();
    const [initialTasksState, setInitialTasksState] = useState<Task[]>(localData?.tasks || []);
    const [initialHabitsState, setInitialHabitsState] = useState<Habit[]>(localData?.habits?.map(h => ({ ...h, goal: h.goal || 7 })) || []);
    const [initialBrainDumpState, setInitialBrainDumpState] = useState<BrainDumpList[]>(
        (localData?.brainDumpLists && localData.brainDumpLists.length > 0)
            ? localData.brainDumpLists
            : [{ id: generateId(), title: 'Main List', content: localData?.brainDumpContent || '' }]
    );
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
    const [dataError, setDataError] = useState<string | null>(null);
    const [isReturningUser, setIsReturningUser] = useState<boolean>(false);
    const hasLocalData = (localData?.tasks?.length || 0) > 0 || (localData?.habits?.length || 0) > 0 || (localData?.brainDumpLists?.length || 0) > 0;
    const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race<T>([
            promise,
            // Increased timeout to 15s to handle Supabase cold starts on free tier
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Supabase fetch timed out')), ms))
        ]);
    }, []);

    const checkSupabaseHealth = useCallback(async (): Promise<boolean> => {
        if (!supabaseAvailable || !supabaseUrl) return false;
        try {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), 4000);
            // Use the REST API endpoint with a simple query to check connectivity
            // Only use apikey header - the sb_publishable_ key is NOT a JWT and cannot be used as Bearer token
            const res = await fetch(`${supabaseUrl}/rest/v1/`, {
                signal: controller.signal,
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
                }
            });
            window.clearTimeout(timer);
            // 200 means accessible, 401/403 means auth issues but server is up
            return res.status === 200 || res.status === 401 || res.status === 403;
        } catch {
            // Network error or timeout - Supabase may be down
            return false;
        }
    }, []);

    const fallbackToLocal = useCallback((reason?: string) => {
        console.warn('Supabase unavailable, switching to local mode.', reason);
        setUseSupabaseSync(false);
        storage.saveSyncPreference(false);
        setDataError(null);
        setIsDataLoading(false);
        // Use fresh local data instead of stale localData from initial mount
        const freshLocal = storage.load();
        setInitialTasksState(freshLocal?.tasks || []);
        setInitialHabitsState(freshLocal?.habits?.map(h => ({ ...h, goal: h.goal || 7 })) || []);
        setInitialBrainDumpState(
            (freshLocal?.brainDumpLists && freshLocal.brainDumpLists.length > 0)
                ? freshLocal.brainDumpLists
                : [{ id: generateId(), title: 'Main List', content: freshLocal?.brainDumpContent || '' }]
        );
    }, [storage]);

    const pushLocalToSupabase = async (data: AppData) => {
        if (!useSupabaseSync || !user) return;
        await Promise.all([
            withTimeout(SupabaseDataService.replaceTasks(user.id, data.tasks || []), 4000),
            withTimeout(SupabaseDataService.replaceHabits(user.id, data.habits || []), 4000),
            withTimeout(SupabaseDataService.replaceNotes(user.id, data.brainDumpLists || []), 4000)
        ]);
    };

    // Early health check on mount - auto fallback to local if Supabase is unreachable
    useEffect(() => {
        if (!useSupabaseSync || !supabaseAvailable) {
            setSupabaseHealthy(false);
            setIsDataLoading(false);
            return;
        }

        let cancelled = false;
        const runHealthCheck = async () => {
            try {
                const healthy = await checkSupabaseHealth();
                if (cancelled) return;

                setSupabaseHealthy(healthy);
                if (!healthy) {
                    console.warn('Supabase health check failed on startup - falling back to local-only mode.');
                    fallbackToLocal('Supabase is not reachable from this environment (localhost may not be in allowed origins).');
                }
            } catch {
                if (cancelled) return;
                setSupabaseHealthy(false);
                fallbackToLocal('Error checking Supabase connectivity.');
            }
        };

        runHealthCheck();
        return () => { cancelled = true; };
    }, []); // Run only on mount

    useEffect(() => {
        if (!useSupabaseSync) return;
        setAuthTimeoutReached(false);
        const timer = window.setTimeout(() => setAuthTimeoutReached(true), 5000);
        return () => window.clearTimeout(timer);
    }, [useSupabaseSync]);

    useEffect(() => {
        if (!useSupabaseSync) return;
        // Keep auth overlay visible instead of silently falling back; errors are shown in the overlay.
        if (authError || !user || (authTimeoutReached && !isAuthReady)) {
            setIsDataLoading(false);
        }
    }, [authError, authTimeoutReached, isAuthReady, useSupabaseSync, user]);

    useEffect(() => {
        if (!useSupabaseSync) {
            setIsDataLoading(false);
            return;
        }
        if (!supabaseAvailable) {
            fallbackToLocal('Supabase is not configured.');
            return;
        }
        if (!user) {
            // Allow auth fallback effect to handle switching modes
            return;
        }
        let active = true;
        const load = async () => {
            setIsDataLoading(true);
            setDataError(null);
            try {
                const healthy = await checkSupabaseHealth();
                if (!healthy) {
                    console.warn('Supabase health check failed; attempting to load anyway.');
                }
                const [tasks, habits, notes, onboardingDone] = await Promise.all([
                    withTimeout(SupabaseDataService.fetchTasks(user.id), 15000),
                    withTimeout(SupabaseDataService.fetchHabits(user.id), 15000),
                    withTimeout(SupabaseDataService.fetchNotes(user.id), 15000),
                    withTimeout(SupabaseDataService.fetchOnboardingCompleted(user.id), 15000).catch(() => false)
                ]);
                if (!active) return;

                // Mark as returning user if they've completed onboarding before
                setIsReturningUser(onboardingDone);

                const remoteEmpty = (!tasks.length && !habits.length && !notes.length);
                if (remoteEmpty) {
                    // Remote is empty - use fresh local data (not stale localData from mount)
                    const freshLocal = storage.load();
                    const hasAnyLocalData = (freshLocal?.tasks?.length || 0) > 0 ||
                        (freshLocal?.habits?.length || 0) > 0 ||
                        (freshLocal?.brainDumpLists?.length || 0) > 0;
                    if (hasAnyLocalData) {
                        const fallbackData: AppData = {
                            tasks: freshLocal?.tasks || [],
                            habits: freshLocal?.habits || [],
                            brainDumpLists: freshLocal?.brainDumpLists || []
                        };
                        setInitialTasksState(fallbackData.tasks);
                        setInitialHabitsState(fallbackData.habits);
                        setInitialBrainDumpState(fallbackData.brainDumpLists.length ? fallbackData.brainDumpLists : [{ id: generateId(), title: 'Main List', content: '' }]);
                        storage.save(fallbackData);
                        void pushLocalToSupabase(fallbackData);
                    } else {
                        // No local data either - start fresh
                        setInitialTasksState([]);
                        setInitialHabitsState([]);
                        setInitialBrainDumpState([{ id: generateId(), title: 'Main List', content: '' }]);
                    }
                } else {
                    setInitialTasksState(tasks);
                    setInitialHabitsState(habits);
                    setInitialBrainDumpState(notes.length ? notes : [{ id: generateId(), title: 'Main List', content: '' }]);
                    storage.save({ tasks, habits, brainDumpLists: notes });
                }
            } catch (error) {
                console.error('Failed to load Supabase data', error);
                if (active) {
                    fallbackToLocal('Unable to load data from Supabase.');
                }
            } finally {
                if (active) {
                    setIsDataLoading(false);
                }
            }
        };
        load();
        return () => { active = false; };
    }, [user, useSupabaseSync, fallbackToLocal, storage, checkSupabaseHealth, withTimeout]);

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
        if (useSupabaseSync && user) {
            pushLocalToSupabase(normalized).catch(err => {
                console.error('Failed to sync imported data to Supabase', err);
                setDataError('Imported locally. Supabase sync failed.');
            });
        }
    };

    const handleDeleteAllTasks = async () => {
        // Reset local state
        setInitialTasksState([]);
        setInitialHabitsState([]);
        setInitialBrainDumpState([]);
        storage.save({ tasks: [], habits: [], brainDumpLists: [] });

        // Best-effort remote clear with timeout
        if (useSupabaseSync && user) {
            try {
                await Promise.all([
                    withTimeout(SupabaseDataService.replaceTasks(user.id, []), 4000),
                    withTimeout(SupabaseDataService.replaceHabits(user.id, []), 4000),
                    withTimeout(SupabaseDataService.replaceNotes(user.id, []), 4000)
                ]);
            } catch (error) {
                console.error('Failed to clear Supabase data', error);
            }
        }
    };

    const handleToggleSupabaseSync = async (enabled: boolean) => {
        if (enabled && !supabaseAvailable) {
            alert('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sync.');
            setUseSupabaseSync(false);
            storage.saveSyncPreference(false);
            setDataError(null);
            setIsDataLoading(false);
            return;
        }
        if (enabled) {
            const healthy = await checkSupabaseHealth();
            if (!healthy) {
                console.warn('Supabase health check failed; proceeding to attempt sync.');
            }
        }
        setUseSupabaseSync(enabled);
        storage.saveSyncPreference(enabled);
        if (!enabled) {
            setDataError(null);
            setIsDataLoading(false);
        } else {
            setIsDataLoading(true);
        }
    };

    // Persist onboarding completion to Supabase
    const handleOnboardingComplete = useCallback(() => {
        if (user && useSupabaseSync) {
            SupabaseDataService.setOnboardingCompleted(user.id).catch(err => {
                console.error('Failed to save onboarding status', err);
            });
        }
    }, [user, useSupabaseSync]);

    // Handle logout: sign out and switch to local mode
    const handleLogout = useCallback(async () => {
        await signOut();
        setUseSupabaseSync(false);
        storage.saveSyncPreference(false);
        setIsReturningUser(false);
    }, [signOut, storage]);

    // HTML loader handles the splash screen - no React SplashScreen needed

    if (useSupabaseSync) {
        // Always surface the auth overlay when sync is requested and there is no session,
        // even if auth is still warming up.
        if (!user) {
            return (
                <AuthOverlay
                    onMagicLink={signInWithEmail}
                    onOAuth={signInWithOAuth}
                    magicLinkSent={magicLinkSent}
                    authError={authTimeoutReached && !isAuthReady ? (authError || 'Supabase is slow to respond. Try signing in or continue without sync.') : authError}
                    onCancel={() => handleToggleSupabaseSync(false)}
                    skipSplash={true}
                />
            );
        }

        // If auth somehow still isn't ready after we have a user, show a brief loader.
        if (!isAuthReady) {
            return <LoadingScreen message="Checking your session..." />;
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
                    initialStatsResetAt={localData?.statsResetAt || 0}
                    onDataImported={handleDataImported}
                    onDeleteAllTasks={handleDeleteAllTasks}
                    supabaseEnabled={true}
                    onToggleSupabaseSync={handleToggleSupabaseSync}
                    isReturningUser={isReturningUser}
                    onOnboardingComplete={handleOnboardingComplete}
                    onLogout={handleLogout}
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
                initialStatsResetAt={localData?.statsResetAt || 0}
                onDataImported={handleDataImported}
                onDeleteAllTasks={handleDeleteAllTasks}
                supabaseEnabled={false}
                onToggleSupabaseSync={handleToggleSupabaseSync}
            />
        </TaskProvider>
    );
};

export default App;
