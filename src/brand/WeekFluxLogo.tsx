import React from 'react';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeekFluxLogoProps {
    className?: string;
    showIcon?: boolean;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
    iconClassName?: string;
    layout?: 'horizontal' | 'vertical';
    layoutId?: string;
}

export const WeekFluxLogo: React.FC<WeekFluxLogoProps> = ({
    className = '',
    showIcon = true,
    showText = true,
    size = '4xl',
    iconClassName = '',
    layout = 'horizontal',
    layoutId
}) => {
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl',
        '2xl': 'text-4xl',
        '4xl': 'text-5xl',
        '5xl': 'text-6xl',
    };

    const iconSizes = {
        sm: 18,
        md: 20,
        lg: 24,
        xl: 32,
        '2xl': 40,
        '4xl': 48,
        '5xl': 64,
    };

    const flexDirection = layout === 'vertical' ? 'flex-col' : 'flex-row';

    return (
        <div className={`flex ${flexDirection} items-center gap-3 ${className}`}>
            {showIcon && (
                <motion.div
                    className={`relative ${iconClassName}`}
                    layoutId={layoutId}
                >
                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md scale-110" />
                    <CheckCircle
                        className="text-cyan-400 relative z-10"
                        size={iconSizes[size]}
                        strokeWidth={1.5}
                    />
                </motion.div>
            )}

            {showText && (
                <h1 className={`${sizeClasses[size]} font-brand font-bold tracking-tight leading-none`}>
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        Week
                    </span>
                    <span className="text-white">Flux</span>
                </h1>
            )}
        </div>
    );
};
