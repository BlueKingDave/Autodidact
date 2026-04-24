import { describe, it, expect } from 'vitest';
import { buildCompletionEvaluatorPrompt, COMPLETION_EVALUATOR_SYSTEM_PROMPT } from '../completion-evaluator.js';

describe('buildCompletionEvaluatorPrompt()', () => {
  it('numbers objectives starting at 1', () => {
    const result = buildCompletionEvaluatorPrompt(['Understand variables', 'Write functions']);
    expect(result).toContain('1. Understand variables');
    expect(result).toContain('2. Write functions');
  });

  it('handles a single objective', () => {
    const result = buildCompletionEvaluatorPrompt(['Learn Python']);
    expect(result).toContain('1. Learn Python');
  });

  it('numbers N objectives as 1 through N', () => {
    const objectives = ['Obj A', 'Obj B', 'Obj C', 'Obj D'];
    const result = buildCompletionEvaluatorPrompt(objectives);
    for (let i = 1; i <= objectives.length; i++) {
      expect(result).toContain(`${i}.`);
    }
  });

  it('includes all objective texts', () => {
    const objectives = ['Alpha', 'Beta', 'Gamma'];
    const result = buildCompletionEvaluatorPrompt(objectives);
    for (const obj of objectives) {
      expect(result).toContain(obj);
    }
  });

  it('handles empty objectives array gracefully', () => {
    const result = buildCompletionEvaluatorPrompt([]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string with evaluation instructions', () => {
    const result = buildCompletionEvaluatorPrompt(['Learn X']);
    expect(result.toLowerCase()).toMatch(/evaluat|assess|analyz/);
  });
});

describe('COMPLETION_EVALUATOR_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof COMPLETION_EVALUATOR_SYSTEM_PROMPT).toBe('string');
    expect(COMPLETION_EVALUATOR_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it('mentions score in the expected JSON structure', () => {
    expect(COMPLETION_EVALUATOR_SYSTEM_PROMPT).toContain('score');
  });

  it('mentions completed in the expected JSON structure', () => {
    expect(COMPLETION_EVALUATOR_SYSTEM_PROMPT).toContain('completed');
  });
});
