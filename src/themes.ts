export interface Theme {
  id: string;
  name: string;
  description: string;
  isLight?: boolean; // true for light themes, false/undefined for dark
  colors: {
    // Background colors
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgGlow: string;
    bgSurfaceSubtle: string; // NEW: For subtle hover states
    bgSurfaceStrong: string; // NEW: For active states/cards
    bgGlass: string;      // NEW: For glassmorphism

    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Accent colors
    accent: string;
    accentGlow: string;
    accentMuted: string;

    // Border colors
    borderLight: string;
    borderMedium: string;
    borderSubtle: string; // NEW: Ultra faint borders

    // Status colors (kept consistent across themes)
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    sans: string;
    display: string;
    mono: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'neuroflow',
    name: 'Dark Mode',
    description: 'The ultimate dark experience. Deep contrasts, refined functionality.',
    colors: {
      bgPrimary: '#000000', // Pure OLED Black
      bgSecondary: '#1C1C1E', // Apple Card Dark Gray
      bgTertiary: '#2C2C2E', // Lighter Gray for hover
      bgGlow: 'rgba(56, 189, 248, 0.05)', // Very subtle cyan glow
      bgSurfaceSubtle: 'rgba(255, 255, 255, 0.05)',
      bgSurfaceStrong: 'rgba(255, 255, 255, 0.1)',
      bgGlass: 'rgba(28, 28, 30, 0.75)', // Glassy dark surface

      textPrimary: '#FFFFFF',
      textSecondary: '#EBEBF5', // Apple iOS Secondary
      textMuted: '#98989D', // Apple iOS Tertiary

      accent: 'hsl(195, 85%, 55%)', // NeuroFlow Cyan (Refined)
      accentGlow: 'rgba(6, 182, 212, 0.4)',
      accentMuted: 'rgba(6, 182, 212, 0.15)',

      borderLight: 'rgba(255, 255, 255, 0.12)',
      borderMedium: 'rgba(255, 255, 255, 0.18)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',

      success: '#32D74B', // Apple Green Dark
      warning: '#FF9F0A', // Apple Orange Dark
      error: '#FF453A', // Apple Red Dark
    },
    fonts: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      display: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      mono: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
    },
  },
  {
    id: 'daylight',
    name: 'Light Mode',
    description: 'Clean, modern, Apple-inspired aesthetic',
    isLight: true,
    colors: {
      // Canvas & Surfaces (Apple Style: #F5F5F7 bg, #FFFFFF cards)
      bgPrimary: '#F5F5F7', // System Gray 6 (Base background)
      bgSecondary: '#FFFFFF', // Clean White (Card surfaces)
      bgTertiary: '#FFFFFF', // Secondary surfaces (also white for clean look)
      bgGlow: 'transparent',
      bgSurfaceSubtle: 'rgba(0, 0, 0, 0.02)', // Very faint gray for hover
      bgSurfaceStrong: 'rgba(0, 0, 0, 0.04)', // Slightly darker for active
      bgGlass: 'rgba(255, 255, 255, 0.85)', // High opacity glass

      // Typography (High Contrast, Ink-like)
      textPrimary: '#1D1D1F', // Apple "nearly black"
      textSecondary: '#86868B', // Apple "medium gray"
      textMuted: '#A1A1A6', // Apple "light gray"

      // Accent (Refined Blue)
      accent: '#0071E3', // Apple System Blue
      accentGlow: 'rgba(0, 113, 227, 0.15)', // Subtle glow
      accentMuted: 'rgba(0, 113, 227, 0.08)', // Very subtle tint

      // Borders (Hairlines)
      borderLight: 'rgba(0, 0, 0, 0.04)', // Barely visible separator
      borderMedium: 'rgba(0, 0, 0, 0.08)', // Structural border
      borderSubtle: 'rgba(0, 0, 0, 0.02)',

      // Status (Pastel/Vibrant mix)
      success: '#34C759', // Apple Green
      warning: '#FF9500', // Apple Orange
      error: '#FF3B30', // Apple Red
    },
    fonts: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      display: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      mono: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
    },
  },
];

export const getThemeById = (id: string): Theme => {
  return themes.find(t => t.id === id) || themes[0];
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;

  // Apply colors
  root.style.setProperty('--bg-primary', theme.colors.bgPrimary);
  root.style.setProperty('--bg-secondary', theme.colors.bgSecondary);
  root.style.setProperty('--bg-tertiary', theme.colors.bgTertiary);
  root.style.setProperty('--bg-glow', theme.colors.bgGlow);
  root.style.setProperty('--bg-surface-subtle', theme.colors.bgSurfaceSubtle);
  root.style.setProperty('--bg-surface-strong', theme.colors.bgSurfaceStrong);
  root.style.setProperty('--bg-glass', theme.colors.bgGlass);

  root.style.setProperty('--text-primary', theme.colors.textPrimary);
  root.style.setProperty('--text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--text-muted', theme.colors.textMuted);

  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--accent-glow', theme.colors.accentGlow);
  root.style.setProperty('--accent-muted', theme.colors.accentMuted);

  root.style.setProperty('--border-light', theme.colors.borderLight);
  root.style.setProperty('--border-medium', theme.colors.borderMedium);
  root.style.setProperty('--border-subtle', theme.colors.borderSubtle);

  root.style.setProperty('--success', theme.colors.success);
  root.style.setProperty('--warning', theme.colors.warning);
  root.style.setProperty('--error', theme.colors.error);

  // Apply fonts
  root.style.setProperty('--font-sans', theme.fonts.sans);
  root.style.setProperty('--font-display', theme.fonts.display);
  root.style.setProperty('--font-mono', theme.fonts.mono);

  // Set theme mode as data attribute for CSS selectors (light/dark)
  root.setAttribute('data-theme', theme.isLight ? 'light' : 'dark');
  root.setAttribute('data-theme-id', theme.id);
};

