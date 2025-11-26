export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    // Background colors
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgGlow: string;
    
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
    name: 'NeuroFlow',
    description: 'Default dark navy with cyan accents',
    colors: {
      bgPrimary: '#161b2e',
      bgSecondary: '#1a1f35',
      bgTertiary: '#1e2338',
      bgGlow: 'rgba(56, 189, 248, 0.15)',
      textPrimary: '#e2e8f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      accent: '#22d3ee',
      accentGlow: 'rgba(6, 182, 212, 0.5)',
      accentMuted: 'rgba(6, 182, 212, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep purple with violet accents',
    colors: {
      bgPrimary: '#0f0a1a',
      bgSecondary: '#1a1228',
      bgTertiary: '#251a38',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      textPrimary: '#e2e0f0',
      textSecondary: '#a8a3c4',
      textMuted: '#6b6589',
      accent: '#a78bfa',
      accentGlow: 'rgba(167, 139, 250, 0.5)',
      accentMuted: 'rgba(167, 139, 250, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep greens with emerald accents',
    colors: {
      bgPrimary: '#0a1410',
      bgSecondary: '#0f1f18',
      bgTertiary: '#142a20',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      textPrimary: '#d1fae5',
      textSecondary: '#a7d7c5',
      textMuted: '#5e9980',
      accent: '#34d399',
      accentGlow: 'rgba(52, 211, 153, 0.5)',
      accentMuted: 'rgba(52, 211, 153, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm tones with orange-pink accents',
    colors: {
      bgPrimary: '#1a0f0f',
      bgSecondary: '#261515',
      bgTertiary: '#331c1c',
      bgGlow: 'rgba(251, 146, 60, 0.15)',
      textPrimary: '#fef3e2',
      textSecondary: '#d4b896',
      textMuted: '#9a7a5c',
      accent: '#fb923c',
      accentGlow: 'rgba(251, 146, 60, 0.5)',
      accentMuted: 'rgba(251, 146, 60, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#fb7185',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'Arctic, bluish calm palette',
    colors: {
      bgPrimary: '#2e3440',
      bgSecondary: '#3b4252',
      bgTertiary: '#434c5e',
      bgGlow: 'rgba(136, 192, 208, 0.15)',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textMuted: '#7b88a1',
      accent: '#88c0d0',
      accentGlow: 'rgba(136, 192, 208, 0.5)',
      accentMuted: 'rgba(136, 192, 208, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      success: '#a3be8c',
      warning: '#ebcb8b',
      error: '#bf616a',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'rosepine',
    name: 'Rosé Pine',
    description: 'Soft muted rose and pine',
    colors: {
      bgPrimary: '#191724',
      bgSecondary: '#1f1d2e',
      bgTertiary: '#26233a',
      bgGlow: 'rgba(235, 188, 186, 0.12)',
      textPrimary: '#e0def4',
      textSecondary: '#908caa',
      textMuted: '#6e6a86',
      accent: '#ebbcba',
      accentGlow: 'rgba(235, 188, 186, 0.5)',
      accentMuted: 'rgba(235, 188, 186, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.08)',
      success: '#9ccfd8',
      warning: '#f6c177',
      error: '#eb6f92',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'light',
    name: 'Daylight',
    description: 'Clean light mode for daytime',
    colors: {
      bgPrimary: '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgTertiary: '#e2e8f0',
      bgGlow: 'rgba(14, 165, 233, 0.1)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      accent: '#0ea5e9',
      accentGlow: 'rgba(14, 165, 233, 0.3)',
      accentMuted: 'rgba(14, 165, 233, 0.1)',
      borderLight: 'rgba(0, 0, 0, 0.05)',
      borderMedium: 'rgba(0, 0, 0, 0.1)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      mono: "'Manrope', monospace",
    },
  },
  {
    id: 'mono',
    name: 'Monochrome',
    description: 'Pure grayscale minimalism',
    colors: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#141414',
      bgTertiary: '#1f1f1f',
      bgGlow: 'rgba(255, 255, 255, 0.05)',
      textPrimary: '#fafafa',
      textSecondary: '#a3a3a3',
      textMuted: '#525252',
      accent: '#e5e5e5',
      accentGlow: 'rgba(255, 255, 255, 0.3)',
      accentMuted: 'rgba(255, 255, 255, 0.05)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderMedium: 'rgba(255, 255, 255, 0.1)',
      success: '#a3a3a3',
      warning: '#d4d4d4',
      error: '#737373',
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Inter', sans-serif",
      mono: "'Manrope', monospace",
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
  
  root.style.setProperty('--text-primary', theme.colors.textPrimary);
  root.style.setProperty('--text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--text-muted', theme.colors.textMuted);
  
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--accent-glow', theme.colors.accentGlow);
  root.style.setProperty('--accent-muted', theme.colors.accentMuted);
  
  root.style.setProperty('--border-light', theme.colors.borderLight);
  root.style.setProperty('--border-medium', theme.colors.borderMedium);
  
  root.style.setProperty('--success', theme.colors.success);
  root.style.setProperty('--warning', theme.colors.warning);
  root.style.setProperty('--error', theme.colors.error);
  
  // Apply fonts
  root.style.setProperty('--font-sans', theme.fonts.sans);
  root.style.setProperty('--font-display', theme.fonts.display);
  root.style.setProperty('--font-mono', theme.fonts.mono);
  
  // Set theme id as data attribute for potential CSS selectors
  root.setAttribute('data-theme', theme.id);
};

