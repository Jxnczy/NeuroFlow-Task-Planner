import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { generateSegments, Segment, STORAGE_KEY_FOCUS_STATE, StoredFocusState } from '../utils/pomodoro';
import { Task } from '../types';

interface PhaseInfo {
    segment: Segment;
    index: number;
    remainingSeconds: number;
    progress: number;
    type: 'work' | 'break' | 'finished';
}

interface TimerContextType {
    isTimerRunning: boolean;
    activeTaskId: string | null;
    elapsedTime: number;
    totalDurationSeconds: number;
    segments: Segment[];
    currentPhaseInfo: PhaseInfo | null;
    isZenMode: boolean;
    startTask: (task: Task) => void;
    stopTask: () => void;
    toggleTimer: () => void;
    skipPhase: () => void;
    setIsZenMode: (isZen: boolean) => void;
    formatTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // -- State --
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [isZenMode, setIsZenMode] = useState(false);

    // Timer State
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // Total seconds elapsed in current session
    const [segments, setSegments] = useState<Segment[]>([]);
    const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    // -- Audio Init --
    useEffect(() => {
        audioRef.current = new Audio('/sounds/task-complete.mp3');
        audioRef.current.volume = 0.5;
    }, []);

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
    };

    // -- Timer Logic --
    useEffect(() => {
        let interval: number;
        if (isTimerRunning) {
            const startTime = Date.now() - elapsedTime * 1000;

            interval = window.setInterval(() => {
                const now = Date.now();
                const newElapsed = Math.floor((now - startTime) / 1000);
                setElapsedTime(newElapsed);

                // Persistence
                if (activeTaskId) {
                    localStorage.setItem(STORAGE_KEY_FOCUS_STATE, JSON.stringify({
                        taskId: activeTaskId,
                        elapsed: newElapsed,
                        isRunning: true,
                        lastUpdated: now,
                        totalDuration: totalDurationSeconds
                    }));
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, activeTaskId, totalDurationSeconds, elapsedTime]);

    // -- Restore State --
    // We only restore ONCE on mount of the Provider (app load)
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_FOCUS_STATE);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const now = Date.now();
                // Valid if < 12 hours old
                if (data.taskId && (now - data.lastUpdated < 12 * 60 * 60 * 1000)) {
                    // Note: We don't have access to the full task list here easily without pulling it in.
                    // But we can restore the ID and state. The UI will re-hydrate the task details if available.
                    // Or we assume the user is "resuming" and the ID is enough.
                    // However, we need 'segments' which depend on duration.
                    // Limitation: If we don't have the task object, we can't generate segments accurately unless we stored them?
                    // Let's rely on the tasks being passed to FocusMode previously. 
                    // Actually, for global context, we need to know the duration to generate segments.
                    // Let's store segments/duration in localStorage too to be safe, OR we just support basic ID restore
                    // and let the component update the details?
                    // Better: We stored `totalDuration` in localStorage (see line 91 in FocusMode prev code).

                    if (data.totalDuration) {
                        // Re-generate segments roughly (assuming standard 25/5 settings) or store them.
                        // For now, let's assume standard generating from duration.
                        // data.totalDuration is in seconds, ensure we convert back to minutes for generateSegments
                        const durationMins = data.totalDuration / 60;
                        const segs = generateSegments(durationMins);
                        setSegments(segs);
                        setTotalDurationSeconds(data.totalDuration);
                    }

                    setActiveTaskId(data.taskId);

                    if (data.isRunning) {
                        const start = data.startTime || (now - (data.elapsed * 1000));
                        const caughtUpElapsed = Math.floor((now - start) / 1000);
                        setElapsedTime(caughtUpElapsed);
                        setIsTimerRunning(true);
                    } else {
                        setElapsedTime(data.elapsed);
                        setIsTimerRunning(false);
                    }
                } else {
                    localStorage.removeItem(STORAGE_KEY_FOCUS_STATE);
                }
            } catch (e) {
                console.error('Failed to parse focus state', e);
            }
        }
    }, []);


    // -- Derived State (Core Logic) --
    const currentPhaseInfo = useMemo<PhaseInfo | null>(() => {
        if (!activeTaskId || segments.length === 0) return null;

        let timePointer = 0; // in minutes
        let currentElapsedMinutes = elapsedTime / 60;

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const segEnd = timePointer + seg.duration;

            if (currentElapsedMinutes < segEnd) {
                const timeInSegment = currentElapsedMinutes - timePointer;
                const remainingInSegment = seg.duration - timeInSegment;
                return {
                    segment: seg,
                    index: i,
                    remainingSeconds: Math.ceil(remainingInSegment * 60),
                    progress: (timeInSegment / seg.duration) * 100,
                    type: seg.type
                };
            }
            timePointer += seg.duration;
        }

        return {
            segment: segments[segments.length - 1],
            index: segments.length - 1,
            remainingSeconds: 0,
            progress: 100,
            type: 'finished'
        };
    }, [elapsedTime, segments, activeTaskId]);


    // -- Sound Logic (Global) --
    // We use a ref to track if we have "settled" the initial state.
    // Restoration happens asynchronously in useEffect, so simple mount check isn't enough.
    const isRestoringRef = useRef(true);

    // Reset restoring flag after a short delay once data is loaded
    useEffect(() => {
        const timer = setTimeout(() => {
            isRestoringRef.current = false;
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isRestoringRef.current) {
            // Sync the previous index ref to current so we don't trigger a change when restoration finishes
            // But we don't return early if we need to update state, we just block SOUND.
        }

        if (currentPhaseInfo && currentSegmentIndex !== currentPhaseInfo.index) {
            // Phase changed!
            const newType = currentPhaseInfo.type;
            const oldType = segments[currentSegmentIndex]?.type;

            // Only play sound if NOT restoring and legally transitioning
            if (!isRestoringRef.current && oldType && newType !== 'finished') {
                playSound();
            }

            setCurrentSegmentIndex(currentPhaseInfo.index);
        }
    }, [currentPhaseInfo?.index, currentSegmentIndex, segments]);


    // -- Actions --
    const startTask = (task: Task) => {
        const segs = generateSegments(task.duration);
        setSegments(segs);
        setActiveTaskId(task.id);
        setTotalDurationSeconds(task.duration * 60);
        setElapsedTime(0);
        setCurrentSegmentIndex(0);
        setIsTimerRunning(true);
    };

    const stopTask = () => {
        setIsTimerRunning(false);
        setActiveTaskId(null);
        setIsZenMode(false);
        setElapsedTime(0);
        localStorage.removeItem(STORAGE_KEY_FOCUS_STATE);
    };

    const toggleTimer = () => setIsTimerRunning(prev => !prev);

    const skipPhase = () => {
        if (!currentPhaseInfo) return;
        const remaining = currentPhaseInfo.remainingSeconds;
        setElapsedTime(e => e + remaining + 1);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <TimerContext.Provider value={{
            isTimerRunning,
            activeTaskId,
            elapsedTime,
            totalDurationSeconds,
            segments,
            currentPhaseInfo,
            isZenMode,
            startTask,
            stopTask,
            toggleTimer,
            skipPhase,
            setIsZenMode,
            formatTime
        }}>
            {children}
        </TimerContext.Provider>
    );
};
