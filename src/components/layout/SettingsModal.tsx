import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modal } from '../../utils/animations';
import { getDayBoundaryHour, setDayBoundaryHour } from '../../constants';

import { SettingsAppearance } from './settings/SettingsAppearance';
import { SettingsDisplay } from './settings/SettingsDisplay';
import { SettingsData } from './settings/SettingsData';
import { SettingsSecurity } from './settings/SettingsSecurity';
import { SettingsHelp } from './settings/SettingsHelp';
import { SettingsAdvanced } from './settings/SettingsAdvanced';
import { SettingsSpaces } from './settings/SettingsSpaces';

interface SettingsModalProps {
    onClose: () => void;
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteAllTasks?: () => void;

    onClearRescheduled?: () => void;
    onResetStats?: () => void;
    currentThemeId: string;
    onThemeChange: (themeId: string) => void;
    viewMode?: 'show' | 'fade' | 'hide';
    onViewModeChange?: (mode: 'show' | 'fade' | 'hide') => void;
    dayViewMode?: 'list' | 'timeline';
    onDayViewModeChange?: (mode: 'list' | 'timeline') => void;
    supabaseEnabled: boolean;
    onToggleSupabase: (enabled: boolean) => void;
    onAddSampleTasks?: () => void;
    sampleTasksAdded?: boolean;
    showSampleTasks?: boolean;
    onResetTour?: () => void;
    onLogout?: () => void;
    encryptionEnabled?: boolean;
    onEnableEncryption?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose,
    onExport,
    onImport,
    onDeleteAllTasks,

    onClearRescheduled,
    currentThemeId,
    onThemeChange,
    viewMode = 'fade',
    onViewModeChange,
    dayViewMode = 'list',
    onDayViewModeChange,
    supabaseEnabled,
    onToggleSupabase,
    onResetTour,
    onLogout,
    onResetStats,
    encryptionEnabled = false,
    onEnableEncryption
}) => {
    const [dayBoundary, setDayBoundaryState] = useState(getDayBoundaryHour);

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50"
                onClick={onClose}
            >
                <motion.div
                    variants={modal}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative w-full max-h-[90vh] md:max-h-[85vh] md:max-w-sm rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label="Close settings"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-120px)] md:max-h-[calc(85vh-120px)]">

                        <SettingsAppearance
                            currentThemeId={currentThemeId}
                            onThemeChange={onThemeChange}
                            viewMode={viewMode}
                            onViewModeChange={onViewModeChange}
                            dayViewMode={dayViewMode}
                            onDayViewModeChange={onDayViewModeChange}
                        />

                        <SettingsDisplay
                            dayBoundary={dayBoundary}
                            onDayBoundaryChange={(hour) => {
                                setDayBoundaryState(hour);
                                setDayBoundaryHour(hour);
                            }}
                        />

                        <SettingsData
                            supabaseEnabled={supabaseEnabled}
                            onToggleSupabase={onToggleSupabase}
                            onExport={onExport}
                            onImport={onImport}
                            onLogout={onLogout}
                            onClose={onClose}
                        />

                        <SettingsSpaces supabaseEnabled={supabaseEnabled} />

                        <SettingsSecurity
                            encryptionEnabled={encryptionEnabled}
                            onEnableEncryption={onEnableEncryption}
                        />

                        <SettingsHelp
                            onResetTour={onResetTour}
                            onClose={onClose}
                        />

                        <SettingsAdvanced
                            onClearRescheduled={onClearRescheduled}
                            onResetStats={onResetStats}
                            onDeleteAllTasks={onDeleteAllTasks}
                        />
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            WeekFlux v1.3
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
