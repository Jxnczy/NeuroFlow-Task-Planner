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
    id: 'northern-lights',
    name: 'Northern Lights',
    description: 'Aurora borealis inspired blues & purples',
    colors: {
      bgPrimary: '#0d1117',
      bgSecondary: '#161b22',
      bgTertiary: '#21262d',
      bgGlow: 'rgba(88, 166, 255, 0.12)',
      bgSurfaceSubtle: 'rgba(255, 255, 255, 0.03)',
      bgSurfaceStrong: 'rgba(255, 255, 255, 0.08)',
      bgGlass: 'rgba(22, 27, 46, 0.6)',
      textPrimary: 'rgba(255, 255, 255, 0.87)',
      textSecondary: 'rgba(255, 255, 255, 0.60)',
      textMuted: 'rgba(255, 255, 255, 0.38)',
      accent: 'hsl(220, 70%, 55%)',
      accentGlow: 'rgba(88, 166, 255, 0.5)',
      accentMuted: 'rgba(88, 166, 255, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      borderSubtle: 'transparent', // Only visible in light theme
      success: '#3fb950',
      warning: '#d29922',
      error: '#f85149',
    },
    fonts: {
      sans: "'Inter', 'Manrope', sans-serif",
      display: "'Inter', 'Manrope', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'neuroflow',
    name: 'NeuroFlow',
    description: 'Default dark navy with cyan accents',
    colors: {
      bgPrimary: '#121212',
      bgSecondary: '#1C1C1E',
      bgTertiary: '#242428',
      bgGlow: 'rgba(56, 189, 248, 0.15)',
      bgSurfaceSubtle: 'rgba(255, 255, 255, 0.03)',
      bgSurfaceStrong: 'rgba(255, 255, 255, 0.08)',
      bgGlass: 'rgba(28, 28, 30, 0.7)',
      textPrimary: 'rgba(255, 255, 255, 0.87)',
      textSecondary: 'rgba(255, 255, 255, 0.60)',
      textMuted: 'rgba(255, 255, 255, 0.38)',
      accent: 'hsl(185, 70%, 55%)',
      accentGlow: 'rgba(6, 182, 212, 0.5)',
      accentMuted: 'rgba(6, 182, 212, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      borderSubtle: 'transparent', // Only visible in light theme
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    fonts: {
      sans: "'Inter', 'Manrope', sans-serif",
      display: "'Inter', 'Manrope', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    description: 'Eye-friendly dark with subtle accents',
    colors: {
      bgPrimary: '#0a0a0f',
      bgSecondary: '#121218',
      bgTertiary: '#1a1a24',
      bgGlow: 'rgba(255, 255, 255, 0.02)',
      bgSurfaceSubtle: 'rgba(255, 255, 255, 0.02)',
      bgSurfaceStrong: 'rgba(255, 255, 255, 0.06)',
      bgGlass: 'rgba(18, 18, 24, 0.7)',
      textPrimary: 'rgba(255, 255, 255, 0.87)',
      textSecondary: 'rgba(255, 255, 255, 0.60)',
      textMuted: 'rgba(255, 255, 255, 0.38)',
      accent: 'hsl(185, 70%, 55%)',
      accentGlow: 'rgba(82, 167, 255, 0.3)',
      accentMuted: 'rgba(82, 167, 255, 0.08)',
      borderLight: 'rgba(255, 255, 255, 0.04)',
      borderMedium: 'rgba(255, 255, 255, 0.08)',
      borderSubtle: 'transparent', // Only visible in light theme
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    fonts: {
      sans: "'Inter', 'Manrope', sans-serif",
      display: "'Inter', 'Manrope', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'daylight',
    name: 'Light Mode',
    description: 'Clean, readable light theme with semantic tokens',
    isLight: true,
    colors: {
      // Canvas & Surfaces (v2 semantic tokens)
      bgPrimary: '#F6F7F9', // --bg (app canvas)
      bgSecondary: '#FFFFFF', // --panel (surfaces)
      bgTertiary: '#F2F4F7', // --surface-alt (hover/alt)
      bgGlow: 'transparent', // No glow in v2
      bgSurfaceSubtle: 'rgba(0, 0, 0, 0.02)',
      bgSurfaceStrong: 'rgba(0, 0, 0, 0.05)',
      bgGlass: '#FFFFFF', // Solid, no blur
      // Typography (High Contrast >= 4.5:1)
      textPrimary: '#101828', // --text
      textSecondary: '#475467', // --text-muted
      textMuted: '#667085', // --text-subtle
      // Accent
      accent: '#2563EB', // --primary (brand blue)
      accentGlow: 'rgba(37, 99, 235, 0.2)',
      accentMuted: 'rgba(37, 99, 235, 0.1)',
      // Borders (Visible structure)
      borderLight: '#E4E7EC', // --border
      borderMedium: '#D0D5DD', // --border-strong
      borderSubtle: '#F2F4F7', // Very subtle
      // Status
      success: '#16a34a',
      warning: '#ea580c',
      error: '#dc2626',
    },
    fonts: {
      sans: "'Inter', '-apple-system', 'SF Pro Text', system-ui, sans-serif",
      display: "'Inter', '-apple-system', 'SF Pro Display', system-ui, sans-serif",
      mono: "'SF Mono', 'Menlo', monospace",
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

