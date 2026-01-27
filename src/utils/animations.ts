import { Variants } from 'framer-motion';

/**
 * Shared spring configuration for subtle, professional animations
 * Apple-like: Responsive but highly damped (no bounce)
 */
export const springConfig = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
};

/**
 * Shared easing tokens for consistent animations
 * The "Apple curve" (default easeOut)
 */
export const easingTokens = {
    easeOut: [0.25, 0.1, 0.25, 1.0] as const, // Calm, precise
    easeInOut: [0.42, 0, 0.58, 1] as const,
    easeIn: [0.42, 0, 1, 1] as const,
};

/**
 * Default fade + lift animation for general UI elements
 * Use: Task cards, list items, general mounting elements
 */
export const fadeLift: Variants = {
    initial: { opacity: 0, y: 4 }, // Reduced movement
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2, // 200ms
            ease: easingTokens.easeOut
        }
    },
    exit: {
        opacity: 0,
        y: 2,
        transition: {
            duration: 0.16, // 160ms
            ease: easingTokens.easeIn
        }
    },
};

/**
 * Week navigation animation with direction support
 * Use: WeekView week grid container
 */
export const weekSwitch = (direction: 'next' | 'prev'): Variants => ({
    initial: {
        opacity: 0,
        x: direction === 'next' ? 10 : -10 // Reduced distance
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.24, // 240ms (screen transition)
            ease: easingTokens.easeOut
        }
    },
    exit: {
        opacity: 0,
        x: direction === 'next' ? -10 : 10,
        transition: {
            duration: 0.2, // 200ms
            ease: easingTokens.easeIn
        }
    },
});

/**
 * Screen/tab transition animation
 * Use: Main screen changes when switching between Planner, Deep Work, etc.
 */
export const screenTransition: Variants = {
    initial: { opacity: 0, y: 5 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.24, // 240ms
            ease: easingTokens.easeOut
        }
    },
    exit: {
        opacity: 0,
        y: 5,
        transition: {
            duration: 0.2,
            ease: easingTokens.easeIn
        }
    },
};

/**
 * Dropdown/menu animation with scale + fade
 * Use: Dropdown panels, context menus, popovers
 */
export const dropdown: Variants = {
    initial: {
        opacity: 0,
        scale: 0.98,
        y: 2
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.16, // 160ms (fast UI)
            ease: easingTokens.easeOut
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        y: 2,
        transition: {
            duration: 0.16,
            ease: easingTokens.easeIn
        }
    },
};

/**
 * Modal overlay animation
 * Use: Settings modal, confirmation dialogs
 */
export const modal: Variants = {
    initial: {
        opacity: 0,
        scale: 0.96,
        y: 8
    },
    animate: {
        opacity: 1,
        scale: 1.0,
        y: 0,
        transition: {
            duration: 0.24, // 240ms (larger element)
            ease: easingTokens.easeOut
        }
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        y: 6,
        transition: {
            duration: 0.2,
            ease: easingTokens.easeIn
        }
    },
};

/**
 * Backdrop fade animation
 * Use: Modal backdrops, overlay backgrounds
 */
export const backdrop: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 0.4,
        transition: {
            duration: 0.22,
            ease: easingTokens.easeOut
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2,
            ease: easingTokens.easeIn
        }
    },
};

/**
 * Subtle hover effect for cards
 * Use: Task cards, interactive panels
 */
export const cardHover = {
    scale: 1.01,
    transition: {
        duration: 0.15,
        ease: easingTokens.easeOut
    },
};

/**
 * Checkbox/completion animation
 * Use: Task completion checkboxes, habit dots
 */
export const checkbox = {
    tap: { scale: 0.94 },
    success: {
        scale: [1, 1.02, 1],
        rotate: [0, 3, 0],
        transition: {
            duration: 0.14,
            ease: easingTokens.easeOut
        },
    },
};

/**
 * Pulse scale animation for toggles
 * Use: Late Night Session toggle, action buttons
 */
export const pulseScale = {
    scale: [1, 1.05, 1],
    transition: {
        duration: 0.18,
        ease: easingTokens.easeInOut
    },
};

/**
 * Stagger container for list items
 * Use: Wrapping container for staggered children
 */
export const staggerContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02,
        },
    },
};

/**
 * Staggered item animation
 * Use: Individual items within a staggered container
 */
export const staggerItem: Variants = {
    initial: { opacity: 0, y: 4 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: easingTokens.easeOut
        }
    },
};

/**
 * Slide in from side animation
 * Use: Brain Dump columns, side panels
 */
export const slideIn: Variants = {
    initial: {
        opacity: 0,
        x: 8
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.22,
            ease: easingTokens.easeOut
        }
    },
    exit: {
        opacity: 0,
        x: -8,
        transition: {
            duration: 0.18,
            ease: easingTokens.easeIn
        }
    },
};

/**
 * Active tab indicator animation
 * Use: Header tab navigation
 */
export const tabIndicator = {
    layout: true,
    transition: {
        duration: 0.2,
        ease: easingTokens.easeInOut
    },
};
