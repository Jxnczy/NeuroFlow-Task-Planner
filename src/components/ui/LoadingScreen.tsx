import React from 'react';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => (
    <div className="min-h-screen flex items-center justify-center bg-[#12141a] text-white">
        <div className="space-y-3 text-center">
            <div className="h-10 w-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/70 font-medium">{message}</p>
        </div>
    </div>
);
