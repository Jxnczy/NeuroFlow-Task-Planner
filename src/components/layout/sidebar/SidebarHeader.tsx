import React from 'react';
import { Settings, PanelLeftClose, Check, X, Clock, List } from 'lucide-react';

interface SidebarHeaderProps {
    onOpenSettings: () => void;
    onToggle: () => void;
    onClose: () => void;
    isMobile: boolean;
    dayViewMode?: 'list' | 'timeline';
    onDayViewModeChange?: (mode: 'list' | 'timeline') => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    onOpenSettings,
    onToggle,
    onClose,
    isMobile,
    dayViewMode,
    onDayViewModeChange
}) => {
    return (
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
                        className="btn-icon"
                        title="Close Sidebar"
                    >
                        <X size={18} />
                    </button>
                ) : (
                    <button
                        onClick={onToggle}
                        className="btn-icon"
                        title="Collapse Sidebar"
                    >
                        <PanelLeftClose size={18} />
                    </button>
                )}
                {onDayViewModeChange && (
                    <button
                        onClick={() => onDayViewModeChange(dayViewMode === 'list' ? 'timeline' : 'list')}
                        className="btn-icon"
                        title={dayViewMode === 'list' ? "Switch to Timeline View" : "Switch to List View"}
                    >
                        {dayViewMode === 'list' ? <Clock size={18} /> : <List size={18} />}
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
