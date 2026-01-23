import { describe, it, expect } from 'vitest';
import { generateSegments } from './pomodoro';

describe('generateSegments', () => {
    it('should generate a single work segment for short tasks', () => {
        const segments = generateSegments(25);
        expect(segments).toHaveLength(1);
        expect(segments[0]).toEqual({
            type: 'work',
            duration: 25,
            startTime: 0,
            endTime: 25
        });
    });

    it('should generate a single work segment for very short tasks', () => {
        const segments = generateSegments(10);
        expect(segments).toHaveLength(1);
        expect(segments[0]).toEqual({
            type: 'work',
            duration: 10,
            startTime: 0,
            endTime: 10
        });
    });

    it('should generate work-break-work for tasks longer than work duration', () => {
        // 35 mins total: 25 work -> 5 break -> 10 work
        const segments = generateSegments(35);
        expect(segments).toHaveLength(3);

        expect(segments[0]).toMatchObject({ type: 'work', duration: 25 });
        expect(segments[1]).toMatchObject({ type: 'break', duration: 5 });
        expect(segments[2]).toMatchObject({ type: 'work', duration: 10 });
    });

    it('should handle exact multiples correctly (no trailing break)', () => {
        // 50 mins total: 25 work -> 5 break -> 25 work (END)
        const segments = generateSegments(50);
        expect(segments).toHaveLength(3);

        expect(segments[0]).toMatchObject({ type: 'work', duration: 25 });
        expect(segments[1]).toMatchObject({ type: 'break', duration: 5 });
        expect(segments[2]).toMatchObject({ type: 'work', duration: 25 });
    });

    it('should handle complex long tasks', () => {
        // 60 mins total: 25w -> 5b -> 25w -> 5b -> 10w
        const segments = generateSegments(60);
        expect(segments).toHaveLength(5);

        expect(segments[0].type).toBe('work');
        expect(segments[1].type).toBe('break');
        expect(segments[2].type).toBe('work');
        expect(segments[3].type).toBe('break');
        expect(segments[4].type).toBe('work');

        expect(segments[4].duration).toBe(10);
    });

    it('should respect custom settings', () => {
        const settings = { workDuration: 10, breakDuration: 2 };
        // 25 mins total with 10/2 split:
        // 10w -> 2b -> 10w -> 2b -> 5w
        const segments = generateSegments(25, settings);
        expect(segments).toHaveLength(5);

        expect(segments[0].duration).toBe(10);
        expect(segments[1].duration).toBe(2);
        expect(segments[2].duration).toBe(10);
        expect(segments[4].duration).toBe(5);
    });
});
