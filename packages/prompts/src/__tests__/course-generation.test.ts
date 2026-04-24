import { describe, it, expect } from 'vitest';
import { buildCourseGenerationPrompt, COURSE_GENERATION_SYSTEM_PROMPT } from '../course-generation.js';

describe('buildCourseGenerationPrompt()', () => {
  it('includes the topic in the output', () => {
    const result = buildCourseGenerationPrompt({ topic: 'Rust programming', difficulty: 'intermediate', moduleCount: 5 });
    expect(result).toContain('Rust programming');
  });

  it('includes the difficulty in the output', () => {
    const result = buildCourseGenerationPrompt({ topic: 'Python', difficulty: 'advanced', moduleCount: 5 });
    expect(result).toContain('advanced');
  });

  it('includes the moduleCount in the output', () => {
    const result = buildCourseGenerationPrompt({ topic: 'Python', difficulty: 'beginner', moduleCount: 7 });
    expect(result).toContain('7');
  });

  it('produces different output for different difficulties', () => {
    const beginner = buildCourseGenerationPrompt({ topic: 'Python', difficulty: 'beginner', moduleCount: 5 });
    const advanced = buildCourseGenerationPrompt({ topic: 'Python', difficulty: 'advanced', moduleCount: 5 });
    expect(beginner).not.toBe(advanced);
  });

  it('produces different output for different moduleCounts', () => {
    const small = buildCourseGenerationPrompt({ topic: 'Python', difficulty: 'beginner', moduleCount: 3 });
    const large = buildCourseGenerationPrompt({ topic: 'Python', difficulty: 'beginner', moduleCount: 10 });
    expect(small).not.toBe(large);
  });

  it('returns a non-empty string', () => {
    const result = buildCourseGenerationPrompt({ topic: 'Python', difficulty: 'beginner', moduleCount: 5 });
    expect(result.length).toBeGreaterThan(10);
  });
});

describe('COURSE_GENERATION_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof COURSE_GENERATION_SYSTEM_PROMPT).toBe('string');
    expect(COURSE_GENERATION_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it('contains instruction to return JSON', () => {
    expect(COURSE_GENERATION_SYSTEM_PROMPT.toLowerCase()).toContain('json');
  });

  it('mentions modules in the schema template', () => {
    expect(COURSE_GENERATION_SYSTEM_PROMPT).toContain('modules');
  });
});
