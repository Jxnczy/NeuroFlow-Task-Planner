import React from 'react';

interface MainLayoutProps {
    sidebar: React.ReactNode;
    header: React.ReactNode;
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ sidebar, header, children }) => {
    return (
        <div 
            className="flex h-screen w-full bg-transparent font-sans overflow-hidden"
            style={{ 
                color: 'var(--text-secondary)',
                // Selection color uses accent
            }}
        >
            <style>{`
                ::selection {
                    background-color: color-mix(in srgb, var(--accent) 30%, transparent);
                }
            `}</style>
            {sidebar}
            <div className="flex-1 flex flex-col relative min-w-0 z-10">
                {header}
                {/* Increased Top Padding to 20 (5rem) to create gap below h-16 (4rem) header */}
                <div className="flex-1 overflow-hidden relative pt-5">
                    {children}
                </div>
            </div>
        </div>
    );
};
