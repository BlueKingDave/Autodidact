import { describe, it, expect } from 'vitest';
import { CreateCourseRequestSchema, CourseBlueprintSchema } from '../course.js';

describe('CreateCourseRequestSchema', () => {
  it('accepts topic of 3 characters', () => {
    expect(() => CreateCourseRequestSchema.parse({ topic: 'SQL' })).not.toThrow();
  });

  it('accepts topic of 200 characters', () => {
    expect(() => CreateCourseRequestSchema.parse({ topic: 'A'.repeat(200) })).not.toThrow();
  });

  it('rejects topic shorter than 3 characters', () => {
    const result = CreateCourseRequestSchema.safeParse({ topic: 'AB' });
    expect(result.success).toBe(false);
  });

  it('rejects topic longer than 200 characters', () => {
    const result = CreateCourseRequestSchema.safeParse({ topic: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('defaults difficulty to "beginner" when omitted', () => {
    const result = CreateCourseRequestSchema.parse({ topic: 'Python' });
    expect(result.difficulty).toBe('beginner');
  });

  it('defaults moduleCount to 5 when omitted', () => {
    const result = CreateCourseRequestSchema.parse({ topic: 'Python' });
    expect(result.moduleCount).toBe(5);
  });

  it('accepts all difficulty enum values', () => {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      expect(() =>
        CreateCourseRequestSchema.parse({ topic: 'Python', difficulty: level }),
      ).not.toThrow();
    }
  });

  it('rejects invalid difficulty string', () => {
    const result = CreateCourseRequestSchema.safeParse({ topic: 'Python', difficulty: 'expert' });
    expect(result.success).toBe(false);
  });

  it('rejects moduleCount below 3', () => {
    const result = CreateCourseRequestSchema.safeParse({ topic: 'Python', moduleCount: 2 });
    expect(result.success).toBe(false);
  });

  it('rejects moduleCount above 20', () => {
    const result = CreateCourseRequestSchema.safeParse({ topic: 'Python', moduleCount: 21 });
    expect(result.success).toBe(false);
  });

  it('accepts moduleCount of 3', () => {
    expect(() => CreateCourseRequestSchema.parse({ topic: 'Python', moduleCount: 3 })).not.toThrow();
  });

  it('accepts moduleCount of 20', () => {
    expect(() => CreateCourseRequestSchema.parse({ topic: 'Python', moduleCount: 20 })).not.toThrow();
  });
});

const validBlueprint = {
  title: 'Python Basics',
  description: 'Learn Python from scratch',
  difficulty: 'beginner' as const,
  estimatedHours: 10,
  modules: [
    {
      position: 0,
      title: 'Introduction',
      description: 'Getting started',
      objectives: ['Understand Python', 'Run scripts'],
      contentOutline: [{ title: 'Setup', points: ['Install Python'] }],
      estimatedMinutes: 60,
    },
  ],
};

describe('CourseBlueprintSchema', () => {
  it('accepts a fully valid nested blueprint', () => {
    expect(() => CourseBlueprintSchema.parse(validBlueprint)).not.toThrow();
  });

  it('rejects empty modules array (min 1)', () => {
    const result = CourseBlueprintSchema.safeParse({ ...validBlueprint, modules: [] });
    expect(result.success).toBe(false);
  });

  it('rejects module with empty objectives array', () => {
    const result = CourseBlueprintSchema.safeParse({
      ...validBlueprint,
      modules: [{ ...validBlueprint.modules[0], objectives: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects module with non-positive estimatedMinutes', () => {
    const result = CourseBlueprintSchema.safeParse({
      ...validBlueprint,
      modules: [{ ...validBlueprint.modules[0], estimatedMinutes: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects blueprint missing required title', () => {
    const { title: _t, ...withoutTitle } = validBlueprint;
    const result = CourseBlueprintSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
  });
});
