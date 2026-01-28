import { Variants } from 'framer-motion';

// --- Apple-like Motion Spec ---

// Easing (single source of truth)
export const EASING = {
    primary: [0.22, 1, 0.36, 1], // Default for almost everything
    micro: [0.2, 0.8, 0.2, 1],   // Chips/hover tint changes
    exit: [0.4, 0, 1, 1]         // Dismiss/exit
} as const;

// Durations (only these)
export const DURATION = {
    press: 0.12,          // 120ms - press/tap micro interactions
    hover: 0.16,          // 160ms - hover/focus transitions
    standard: 0.2,        // 200ms - overlay fades/content entrance
    emphasized: 0.24      // 240ms - shared layout brandmark move
} as const;

// Reusable Transitions
export const TRANSITION = {
    primary: {
        duration: DURATION.standard,
        ease: EASING.primary
    },
    emphasized: {
        duration: DURATION.emphasized,
        ease: EASING.primary
    },
    exit: {
        duration: 0.16, // 160ms for exits (matches Apple spec for overlay exit logic)
        ease: EASING.exit
    }
} as const;

// Reusable Variants
export const VARIANTS = {
    // Startup Overlay
    bootOverlay: {
        initial: { opacity: 0, y: 6 },
        animate: {
            opacity: 1,
            y: 0,
            transition: { duration: DURATION.standard, ease: EASING.primary }
        },
        exit: {
            opacity: 0,
            y: -4,
            transition: { duration: 0.16, ease: EASING.exit }
        }
    },
    // Standard Content Fade In
    contentFade: {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { duration: DURATION.standard, ease: EASING.primary }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.16, ease: EASING.exit }
        }
    },
    // Press Interaction (Button/Card)
    press: {
        active: { scale: 0.985, transition: { duration: DURATION.press, ease: EASING.micro } }
    },
    hoverLift: {
        hover: { y: -1, transition: { duration: DURATION.hover, ease: EASING.micro } }
    }
};

export const SPRING = {
    // For when you need a spring (rare in this specific spec, but good to have congruent one)
    pleasant: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1
    }
};
