import { TaskType, GridRow } from './types';
import React from 'react';
import { Target, Flame, Briefcase, Gamepad2, Brush } from 'lucide-react';

// Updated to match specific request: Red, Orange, Yellow, Cyan, Grey, White
export const TYPE_COLORS: Record<TaskType, string> = {
  backlog: 'text-zinc-400 border-white/20', // Grey
  high: 'text-rose-500 border-white/20', // ASAP (Red)
  medium: 'text-orange-500 border-white/20', // SOON (Orange)
  low: 'text-yellow-400 border-white/20', // LATER (Yellow)
  leisure: 'text-cyan-400 border-white/20', // LEISURE (Cyan)
  chores: 'text-zinc-200 border-white/20', // BASICS (White/Zinc)
};

// Solid colors for the vertical indicators
export const TYPE_INDICATOR_COLORS: Record<TaskType, string> = {
  backlog: 'bg-zinc-600',
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-yellow-400',
  leisure: 'bg-cyan-400',
  chores: 'bg-white',
};

// Colors for the left border of board task cards
export const TASK_CARD_BORDER_COLORS: Record<TaskType, string> = {
  backlog: 'border-l-zinc-600',
  high: 'border-l-rose-500',
  medium: 'border-l-orange-500',
  low: 'border-l-yellow-400',
  leisure: 'border-l-cyan-400',
  chores: 'border-l-slate-500', // Changed from white to slate for a more neutral grey/blue feel
};

export const getWeekDays = (startDate: Date = new Date()) => {
  const startOfWeek = new Date(startDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startOfWeek.setDate(diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const TARGET_HOURS_PER_DAY = 6; // User-defined target for daily capacity

// --- Sound Utility ---
export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Create a pleasant "Major Chord" arpeggio (C6, E6, G6)
    const frequencies = [1046.50, 1318.51, 1567.98];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Stagger start times slightly for an arpeggio effect
      const startTime = now + (i * 0.05);

      // Envelope: Fast attack, smooth decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// Enhanced Row Configuration with Icons and Subtitles - Using Flex weights for dynamic scaling
// Reduced min-heights to fit more on screen
export const ROW_CONFIG: Record<GridRow, {
  label: string,
  sub: string,
  icon: React.ElementType,
  color: string,
  barColor: string,
  flexClass: string,
  description: string
}> = {
  'GOAL': { label: 'GOAL', sub: 'High impact', icon: Target, color: 'text-rose-400', barColor: 'bg-rose-500', flexClass: 'flex-[1] min-h-[70px]', description: 'One major objective that moves the needle.' },
  'FOCUS': { label: 'FOCUS', sub: 'Deep work', icon: Flame, color: 'text-orange-400', barColor: 'bg-orange-500', flexClass: 'flex-[3] min-h-[100px]', description: ' uninterrupted blocks for complex tasks.' },
  'WORK': { label: 'WORK', sub: 'Business', icon: Briefcase, color: 'text-amber-400', barColor: 'bg-amber-400', flexClass: 'flex-[3] min-h-[100px]', description: 'Standard operational tasks and meetings.' },
  'LEISURE': { label: 'LEISURE', sub: 'Recharge', icon: Gamepad2, color: 'text-cyan-400', barColor: 'bg-cyan-400', flexClass: 'flex-[3] min-h-[100px]', description: 'Time to rest, play, and recover.' },
  'CHORES': { label: 'CHORES', sub: 'Life admin', icon: Brush, color: 'text-slate-400', barColor: 'bg-slate-500', flexClass: 'flex-[3] min-h-[100px]', description: 'Maintenance, errands, and cleaning.' },
};

export const ROW_LABELS: GridRow[] = ['GOAL', 'FOCUS', 'WORK', 'LEISURE', 'CHORES'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];