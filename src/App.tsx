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
import { WelcomePrompt, getOnboardingChoice } from './components/onboarding/WelcomePrompt';
import { generateId } from './utils/id';
import { StorageService } from './services/StorageService';
import { supabaseAvailable, supabaseUrl } from './lib/supabase';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { QuickAddModal } from './components/ui/QuickAddModal';
import { KeyboardShortcutsHelp } from './components/ui/KeyboardShortcutsHelp';
import { CommandPalette } from './components/ui/CommandPalette';
import { VaultUnlockScreen } from './components/auth/VaultUnlockScreen';
import { useEncryption } from './hooks/useEncryption';
import { CryptoService } from './services/CryptoService';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { useEntryRouting } from './hooks/useEntryRouting';

// Lazy load components
const AnalyticsDashboard = React.lazy(() => import('./components/features/dashboard/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
const HabitTracker = React.lazy(() => import('./components/features/tools/HabitTracker').then(module => ({ default: module.HabitTracker })));
const BrainDump = React.lazy(() => import('./components/features/tools/BrainDump').then(module => ({ default: module.BrainDump })));

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
    onLogout,
    onEnableEncryption
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
    onLogout?: () => void,
    onEnableEncryption?: () => void
}) => {
    // --- Context & Hooks ---
    const taskManager = useTaskContext();
    const habitManager = useHabitManager(initialHabitsState, userId, supabaseEnabled);
    const brainDumpManager = useBrainDumpManager(initialBrainDump, userId, supabaseEnabled);

    // UI State for stats reset baseline
    const [statsResetAt, setStatsResetAt] = useState<number>(initialStatsResetAt);

    // Check if encryption is enabled for the encryptionEnabled prop
    const encryptionEnabled = StorageService.getInstance().isEncryptionEnabled();
    const persistence = usePersistence(taskManager.tasks, habitManager.habits, brainDumpManager.lists, statsResetAt, encryptionEnabled);

    // --- Responsive ---
    const isMobile = useIsMobile();

    // --- UI State ---
    const [activeTab, setActiveTab] = useState<string>(() => {
        try {
            // Priority 1: Restore last visited tab
            const storedTab = localStorage.getItem('neuroflow_active_tab');
            if (storedTab) return storedTab;

            // Priority 2: Fallback to focus if active session exists (legacy safety)
            const storedFocus = localStorage.getItem('neuroflow_focus_state');
            if (storedFocus) {
                const data = JSON.parse(storedFocus);
                if (data.taskId && (Date.now() - (data.lastUpdated || 0) < 12 * 60 * 60 * 1000)) {
                    return 'focus';
                }
            }
        } catch (e) {
            console.error('Failed to restore active tab', e);
        }
        return 'planner';
    });

    // Persist active tab
    useEffect(() => {
        localStorage.setItem('neuroflow_active_tab', activeTab);
    }, [activeTab]);

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
    // Check if user has made an onboarding choice (yes/no to tour)
    const [onboardingChoice, setOnboardingChoice] = useState<'yes' | 'no' | null>(() => {
        if (isReturningUser) return 'no'; // Skip for returning users
        return getOnboardingChoice();
    });

    // Show welcome prompt for new users who haven't made a choice yet
    const [showWelcomePrompt, setShowWelcomePrompt] = useState(() => {
        if (isReturningUser) return false;
        return getOnboardingChoice() === null;
    });

    // Only show onboarding if user explicitly accepted the tour
    const onboardingEnabled = onboardingChoice === 'yes';

    // Don't show tour for returning users (those who completed onboarding before)
    const [showTour, setShowTour] = useState(() => {
        // Skip tour entirely for returning logged-in users or if they declined
        if (isReturningUser) return false;
        if (getOnboardingChoice() === 'no') return false;
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
            localStorage.removeItem('neuroflow_onboarding_choice');
            localStorage.removeItem('neuroflow_first_task_guide_completed');
            localStorage.removeItem('neuroflow_tab_tips_seen');
        } catch { }
        setOnboardingChoice('yes');
        setShowWelcomePrompt(false);
        setShowTour(true);
        setFirstGuideComplete(false);
    }, []);

    const handleWelcomeAccept = useCallback(() => {
        setOnboardingChoice('yes');
        setShowWelcomePrompt(false);
    }, []);

    const handleWelcomeDecline = useCallback(() => {
        setOnboardingChoice('no');
        setShowWelcomePrompt(false);
        setShowTour(false);
        setFirstGuideComplete(true);
    }, []);

    // Force hide onboarding if user is identified as returning (loaded from DB)
    useEffect(() => {
        if (isReturningUser) {
            setShowWelcomePrompt(false);
            setOnboardingChoice('no');
            setShowTour(false);
            setFirstGuideComplete(true);
        }
    }, [isReturningUser]);


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
        }, 2500); // Show splash for 2.5s for smooth transition (new users only)
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

            {/* Welcome Prompt - ask new users if they want a tour */}
            {showWelcomePrompt && (
                <WelcomePrompt
                    onAccept={handleWelcomeAccept}
                    onDecline={handleWelcomeDecline}
                />
            )}

            {/* Onboarding Spotlight Tour - only on desktop when sidebar is open AND user accepted tour */}
            {onboardingEnabled && showTour && !isMobile && isSidebarOpen && (
                <SpotlightTour onComplete={handleTourComplete} />
            )}

            {/* Per-tab first-visit tooltips - show on mobile regardless of tour (tour is desktop-only) */}
            {/* Only show if user accepted tour and don't show planner tab tip when FirstTaskGuide is active */}
            {onboardingEnabled && (!showTour || isMobile) && (activeTab !== 'planner' || firstGuideComplete) && !isReturningUser && <TabOnboarding activeTab={activeTab} />}

            {/* First task creation guide - shows after spotlight tour (mobile-responsive) */}
            {/* Only show if user accepted tour */}
            {onboardingEnabled && (!showTour || isMobile) && activeTab === 'planner' && (
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
                        onDayViewModeChange={handleDayViewModeChange}
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
                    encryptionEnabled={encryptionEnabled}
                    onEnableEncryption={onEnableEncryption}
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

    // --- Auth & Routing ---
    const { user, isAuthReady, authError, magicLinkSent, signInWithEmail, signInWithOAuth, signOut } = useSupabaseAuth();

    // --- Encryption State ---
    const encryption = useEncryption();
    const [encryptionSkipped, setEncryptionSkipped] = useState(false);
    const [showVaultSetup, setShowVaultSetup] = useState(false);

    // --- User State ---
    const [isReturningUser, setIsReturningUser] = useState<boolean>(() => {
        try {
            return localStorage.getItem('neuroflow_is_returning_user') === 'true';
        } catch {
            return false;
        }
    });

    // --- Restore State (Hoisted for routing) ---
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const [statsResetAt, setStatsResetAt] = useState<number>(0);

    const { currentRoute, markFeatureOverviewSeen } = useEntryRouting({
        isAuthReady,
        user,
        isVaultSetup: encryption.isVaultSetup || StorageService.getInstance().isEncryptionEnabled() || showRestorePrompt,
        isUnlocked: encryption.isUnlocked,
        isReturningUser
    });

    const hasUnencryptedData = storage.hasUnencryptedData();

    // Always load plaintext data as fallback
    const plaintextData = React.useMemo(() => storage.load(), []);

    const [encryptedDataLoaded, setEncryptedDataLoaded] = useState(false);
    const [decryptedLocalData, setDecryptedLocalData] = useState<AppData | null>(null);

    // Load encrypted data after vault unlock
    useEffect(() => {
        if (encryption.isUnlocked && storage.isEncryptionEnabled() && !encryptedDataLoaded) {
            storage.loadEncrypted().then(data => {
                setDecryptedLocalData(data);
                setEncryptedDataLoaded(true);

                // Self-healing: If we successfully loaded encrypted data, ensure any leftover plaintext is gone
                // This fixes the "zombie data" issue where plaintext might persist after migration
                if (storage.hasUnencryptedData()) {
                    console.log('Cleanup: Removing leftover plaintext data after successful encrypted load');
                    storage.clearPlaintextData();
                }
            }).catch(err => {
                console.error('Failed to load encrypted data:', err);
                setEncryptedDataLoaded(true);
            });
        }
    }, [encryption.isUnlocked]);

    // Migrate unencrypted data after vault setup
    useEffect(() => {
        if (encryption.isUnlocked && hasUnencryptedData) {
            storage.migrateToEncrypted().then(success => {
                if (success) {
                    console.log('Data migrated to encrypted storage');
                }
            });
        }
    }, [encryption.isUnlocked, hasUnencryptedData]);

    // Close vault setup screen after successful setup
    useEffect(() => {
        if (encryption.isUnlocked && showVaultSetup) {
            setShowVaultSetup(false);
        }
    }, [encryption.isUnlocked, showVaultSetup]);

    // Effective local data:
    // - If encryption enabled AND vault unlocked -> use decrypted data
    // - If encryption enabled BUT skipped/locked -> use NULL (empty view) - DO NOT fallback to plaintext
    // - If encryption NOT enabled -> use plaintext
    const effectiveLocalData = React.useMemo(() => {
        // CRITICAL SECURITY: If vault exists (isVaultSetup), we are in Encrypted Mode.
        // We must ignore the storage flag if it conflicts, to prevents "zombie" plaintext leaks.
        const isEncryptedMode = encryption.isVaultSetup || storage.isEncryptionEnabled();

        if (isEncryptedMode) {
            if (encryption.isUnlocked) {
                // Vault unlocked - use decrypted data
                return decryptedLocalData;
            } else {
                // Vault exists/enabled but locked -> Return NULL (empty)
                // DO NOT fallback to plaintextData, as that leaks the "zombie" data
                return null;
            }
        }
        // Only fallback to plaintext data if NO encryption is set up at all
        return plaintextData;
    }, [encryption.isUnlocked, encryption.isVaultSetup, decryptedLocalData, plaintextData]);

    // Check stored preference: null = first visit, false = chose local, true = chose sync
    const storedPref = React.useMemo(() => storage.loadSyncPreference(), []);
    const isFirstVisit = storedPref === null;

    // Only show login/splash if: first visit OR user previously enabled sync
    const shouldShowSync = supabaseAvailable && (isFirstVisit || storedPref === true);

    const [useSupabaseSync, setUseSupabaseSync] = useState<boolean>(shouldShowSync);
    const [supabaseHealthy, setSupabaseHealthy] = useState<boolean | null>(null);
    const [authTimeoutReached, setAuthTimeoutReached] = useState(false);

    // useSupabaseAuth hoisted to top
    const [initialTasksState, setInitialTasksState] = useState<Task[]>(effectiveLocalData?.tasks || []);
    const [initialHabitsState, setInitialHabitsState] = useState<Habit[]>(effectiveLocalData?.habits?.map(h => ({ ...h, goal: h.goal || 7 })) || []);
    const [initialBrainDumpState, setInitialBrainDumpState] = useState<BrainDumpList[]>(
        (effectiveLocalData?.brainDumpLists && effectiveLocalData.brainDumpLists.length > 0)
            ? effectiveLocalData.brainDumpLists
            : [{ id: generateId(), title: 'Main List', content: effectiveLocalData?.brainDumpContent || '' }]
    );
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
    const [dataError, setDataError] = useState<string | null>(null);

    // Sync state when effectiveLocalData changes (handles encryption skip/unlock)
    useEffect(() => {
        if (effectiveLocalData) {
            setInitialTasksState(effectiveLocalData.tasks || []);
            setInitialHabitsState(effectiveLocalData.habits?.map(h => ({ ...h, goal: h.goal || 7 })) || []);
            setInitialBrainDumpState(
                (effectiveLocalData.brainDumpLists && effectiveLocalData.brainDumpLists.length > 0)
                    ? effectiveLocalData.brainDumpLists
                    : [{ id: generateId(), title: 'Main List', content: '' }]
            );
        }
    }, [effectiveLocalData]);

    const hasLocalData = (effectiveLocalData?.tasks?.length || 0) > 0 || (effectiveLocalData?.habits?.length || 0) > 0 || (effectiveLocalData?.brainDumpLists?.length || 0) > 0;
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

        // Security: If vault is locked, DO NOT fetch data from Supabase.
        // This prevents loading encrypted data into the initial state.
        if (encryption.isVaultSetup && !encryption.isUnlocked) {
            setIsDataLoading(false);
            return;
        }

        let active = true;
        const load = async () => {
            if (!user) return; // Guard for TS, though effect shouldn't allow it if we depend on userId
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
                if (onboardingDone) {
                    localStorage.setItem('neuroflow_is_returning_user', 'true');
                }

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
                    // Auto-detect encrypted data for fresh logins
                    // If vault is locked, SupabaseDataService returns the placeholder string
                    const LOCKED_CONTENT_PLACEHOLDER = '[Encrypted - Unlock vault to view]';
                    const hasEncryptedData = tasks.some(t => t.title === LOCKED_CONTENT_PLACEHOLDER) ||
                        habits.some(h => h.name === LOCKED_CONTENT_PLACEHOLDER) ||
                        notes.some(n => n.title === LOCKED_CONTENT_PLACEHOLDER || n.content === LOCKED_CONTENT_PLACEHOLDER);

                    if (hasEncryptedData && !encryption.isVaultSetup) {
                        console.log('Detected encrypted data with no local keys - triggering restore prompt');
                        setShowRestorePrompt(true);
                    }

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
    }, [user?.id, useSupabaseSync, fallbackToLocal, storage, checkSupabaseHealth, withTimeout, encryption.isVaultSetup, encryption.isUnlocked]);

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

    const handleLogout = useCallback(async () => {
        await signOut();
        setUseSupabaseSync(false);
        storage.saveSyncPreference(false);
        setIsReturningUser(false);
    }, [signOut, storage]);

    // Handle enabling encryption - shows vault setup screen
    const handleEnableEncryption = useCallback(() => {
        // Show the vault setup screen
        setShowVaultSetup(true);
        setEncryptionSkipped(false);
    }, []);

    const handleRestoreVault = async (passphrase: string): Promise<boolean> => {
        try {
            if (!user) return false;
            // Fetch raw encrypted sample to extract salt
            const sample = await SupabaseDataService.fetchRawEncryptedSample(user.id);
            if (!sample) {
                console.error('No encrypted data found to restore from');
                return false;
            }

            // Try to restore
            const success = await encryption.restoreVaultFromData(passphrase, sample);
            if (success) {
                // Refresh data to decrypt it
                window.location.reload();
                // Note: Reload is robust ensuring all hooks reset with unlocked vault
                // But seamless unlock is also possible if we re-fetch data.
                // For now, let's keep reload or try seamless re-fetch?
                // Step 364 removed reload. Let's do seamless.

                // Correction: The seamless unlock requires us to re-run the `load` effect
                // which skips if loaded. But since window.location.reload() was removed in step 364...
                // Wait, step 364 simply removed reload. The data was already loaded as "Encrypted placeholder".
                // We need to RE-FETCH the data to decrypt it!
                // Or just reload. Reload is safer for "restored from scratch".
                // Let's stick to the Polished version: Remove reload, but we MUST re-fetch.
                // The `load` effect dependency include `encryption.isUnlocked`.
                // If we unlock, `encryption.isUnlocked` changes, so `load` might re-run?
                // Let's check `load` dependencies.
                // [user, useSupabaseSync, fallbackToLocal, storage, checkSupabaseHealth, withTimeout]
                // It does NOT depend on `encryption.isUnlocked` directly, but the code checks it inside.
                // We should probably trigger a reload to be safe, OR add `encryption.isUnlocked` to deps.
                // Adding `encryption.isUnlocked` to deps is risky (infinite loops).
                // Let's stick to reloading for the Restore Case to be 100% sure, OR just return true and let user refresh.
                // The original "Polish" task removed reload.
                // Let's try to just return true.
            }
            return success;
        } catch (e) {
            console.error('Restore failed', e);
            return false;
        }
    };

    // HTML loader handles the splash screen - no React SplashScreen needed

    // --- RENDER BASED ON ROUTE ---
    switch (currentRoute) {
        case 'loading':
            return <LoadingScreen message="Checking session..." />;

        case 'feature-overview':
            return (
                <AuthOverlay
                    isLoading={false}
                    authError={null}
                    onMagicLink={(email) => signInWithEmail(email)}
                    onOAuth={(provider) => signInWithOAuth(provider)}
                    onCancel={() => {
                        // "Get Started" clicked - mark seen and go to login
                        markFeatureOverviewSeen();
                    }}
                    showFeatureOverview={true}
                    magicLinkSent={false}
                />
            );

        case 'login':
            return (
                <AuthOverlay
                    isLoading={isDataLoading || !isAuthReady}
                    authError={authError || dataError}
                    onMagicLink={(email) => signInWithEmail(email)}
                    onOAuth={(provider) => signInWithOAuth(provider)}
                    onCancel={() => {
                        // "Continue as Guest" / Skip Sync
                        setUseSupabaseSync(false);
                        storage.saveSyncPreference(false);
                    }}
                    magicLinkSent={magicLinkSent}
                    showFeatureOverview={false}
                />
            );

        case 'unlock':
            return (
                <VaultUnlockScreen
                    isVaultSetup={encryption.isVaultSetup && !showRestorePrompt}
                    isRestoreMode={showRestorePrompt}
                    isLoading={encryption.isLoading}
                    error={encryption.error}
                    onSetup={async (pass) => {
                        if (showRestorePrompt) {
                            const success = await handleRestoreVault(pass);
                            if (success) {
                                setShowRestorePrompt(false);
                                window.location.reload();
                            }
                            return success;
                        }
                        return encryption.setupVault(pass);
                    }}
                    onUnlock={encryption.unlock}
                    onReset={() => {
                        encryption.resetVault();
                        storage.clearEncryptedData();
                        setShowVaultSetup(false);
                        setShowRestorePrompt(false);
                    }}
                    onSkip={() => {
                        setEncryptionSkipped(true);
                        setShowVaultSetup(false);
                        setShowRestorePrompt(false);
                    }}
                />
            );

        case 'app':
            // Provide data context to the app
            return (
                <TaskProvider initialTasks={initialTasksState} userId={user?.id} supabaseEnabled={useSupabaseSync && !!user}>
                    <AppContent
                        userId={user?.id}
                        initialHabitsState={initialHabitsState}
                        initialBrainDump={initialBrainDumpState}
                        initialStatsResetAt={statsResetAt}
                        onDataImported={handleDataImported}
                        onDeleteAllTasks={async () => {
                            if (user && useSupabaseSync) {
                                await SupabaseDataService.replaceTasks(user.id, []);
                                await SupabaseDataService.replaceHabits(user.id, []);
                                await SupabaseDataService.replaceNotes(user.id, []);
                            }
                            storage.save({ tasks: [], habits: [], brainDumpLists: [] });
                        }}
                        supabaseEnabled={useSupabaseSync && !!user}
                        onToggleSupabaseSync={handleToggleSupabaseSync}
                        isReturningUser={isReturningUser}
                        onOnboardingComplete={handleOnboardingComplete}
                        onLogout={handleLogout}
                        onEnableEncryption={handleEnableEncryption}
                    />
                </TaskProvider>
            );
        default:
            return <LoadingScreen message="Initializing..." />;
    }
};

export default App;
