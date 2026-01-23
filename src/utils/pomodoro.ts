export type SegmentType = 'work' | 'break';

export interface Segment {
    type: SegmentType;
    duration: number; // in minutes
    startTime?: number; // accumulated start time in minutes from the beginning
    endTime?: number; // accumulated end time in minutes
}

export interface PomodoroSettings {
    workDuration: number;
    breakDuration: number;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
    workDuration: 25,
    breakDuration: 5
};

/**
 * Generates a schedule of work and break segments for a given total work duration.
 * 
 * Rules:
 * 1. Work phases are at most `workDuration` (default 25m).
 * 2. Break phases are `breakDuration` (default 5m) explicitly inserted AFTER a completed work phase.
 * 3. Work phases continue until totalWorkMinutes is exhausted.
 * 4. RWT (Remaining Work Time) is what drives the schedule.
 * 5. No break after the very last work segment.
 * 
 * @param totalWorkMinutes Total estimated minutes for the task
 * @param settings Optional settings for work/break durations
 * @returns Array of segments
 */
export const generateSegments = (
    totalWorkMinutes: number,
    settings: PomodoroSettings = DEFAULT_SETTINGS
): Segment[] => {
    const segments: Segment[] = [];
    let remainingWork = totalWorkMinutes;
    let accumulatedTime = 0;

    if (totalWorkMinutes <= 0) return [];

    while (remainingWork > 0) {
        // Calculate next work segment duration
        const currentWorkDuration = Math.min(remainingWork, settings.workDuration);

        // Add work segment
        segments.push({
            type: 'work',
            duration: currentWorkDuration,
            startTime: accumulatedTime,
            endTime: accumulatedTime + currentWorkDuration
        });

        remainingWork -= currentWorkDuration;
        accumulatedTime += currentWorkDuration;

        // If there is still work remaining, add a break
        if (remainingWork > 0) {
            segments.push({
                type: 'break',
                duration: settings.breakDuration,
                startTime: accumulatedTime,
                endTime: accumulatedTime + settings.breakDuration
            });
            accumulatedTime += settings.breakDuration;
        }
    }

    return segments;
};

// State persistence keys
export const STORAGE_KEY_FOCUS_STATE = 'neuroflow_focus_state';

export interface StoredFocusState {
    taskId: string;
    startTime: number; // Timestamp when the timer started (or resumed)
    pausedAt: number | null; // Timestamp if paused
    rwtAtStart: number; // RWT value at the moment start/resume happened
    currentSegmentIndex: number;
    phaseTimeAtStart: number; // Time remaining in current phase at start
    totalDurationIncludingBreaks: number; // Calculated total horizon
}
