export const COMPLETION_EVALUATOR_SYSTEM_PROMPT = `You are an educational assessment AI. Your job is to evaluate whether a student has demonstrated sufficient understanding of a module's learning objectives based on their conversation history.

Analyze the conversation and return a JSON object with this exact structure:
{
  "completed": true|false,
  "score": <0-100>,
  "feedback": "Brief feedback message for the student"
}

Scoring guide:
- 90-100: Excellent understanding, can explain concepts clearly
- 70-89: Good understanding, minor gaps
- 50-69: Partial understanding, some misconceptions
- Below 50: Insufficient understanding

Return ONLY valid JSON.`;

export function buildCompletionEvaluatorPrompt(objectives: string[]): string {
  const objectivesList = objectives.map((o, i) => `${i + 1}. ${o}`).join('\n');
  return `Evaluate whether the student has demonstrated understanding of these objectives:\n\n${objectivesList}\n\nAnalyze the conversation above and return your assessment as JSON.`;
}
