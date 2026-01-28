import React from 'react';
import { Settings, PanelLeftClose, X, Clock, List } from 'lucide-react';
import { WeekFluxLogo } from '../../../brand/WeekFluxLogo';
import { useLanguage } from '../../../context/LanguageContext';

interface SidebarHeaderProps {
    onOpenSettings: () => void;
    onToggle: () => void;
    onClose: () => void;
    isMobile: boolean;
    dayViewMode?: 'list' | 'timeline';
    onDayViewModeChange?: (mode: 'list' | 'timeline') => void;
    onLogoClick?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    onOpenSettings,
    onToggle,
    onClose,
    isMobile,
    dayViewMode,
    onDayViewModeChange,
    onLogoClick
}) => {
    const { t } = useLanguage();
    return (
        <div className="p-4 pb-3 flex items-center justify-between">
            <button
                onClick={onLogoClick}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title={t.header.planner}
            >
                <WeekFluxLogo size="lg" showIcon={true} layoutId="brandmark" />
            </button>
            <div className="flex items-center gap-1">
                {isMobile ? (
                    <button
                        onClick={onClose}
                        className="btn-icon"
                        title={t.sidebar.cancel}
                    >
                        <X size={18} />
                    </button>
                ) : (
                    <button
                        onClick={onToggle}
                        className="btn-icon"
                        title={t.header.openSidebar}
                    >
                        <PanelLeftClose size={18} />
                    </button>
                )}

                <button
                    onClick={onOpenSettings}
                    className="btn-icon"
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
};
