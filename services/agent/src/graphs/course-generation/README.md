# Graph: Course Generation

## Purpose

A LangGraph `StateGraph` that takes a topic + difficulty + module count and returns a validated `CourseBlueprint`. Designed to tolerate LLM inconsistency by retrying up to 3 times on parse failure.

## Files

| File | Description |
|------|-------------|
| `graph.ts` | Graph definition: nodes, edges, retry conditional |
| `nodes.ts` | `makeGenerateBlueprintNode()` — the single graph node |
| `state.ts` | `CourseGenerationState` — Annotation.Root schema |

## State Schema

```typescript
{
  topic:       string,          // User-provided topic
  difficulty:  DifficultyLevel, // 'beginner' | 'intermediate' | 'advanced'
  moduleCount: number,          // Target number of modules (3–20)
  blueprint:   CourseBlueprint | null,  // Output; null until successfully parsed
  retryCount:  number,          // Incremented on each failed parse attempt
  error:       string | null,   // Last parse error message
}
```

## Graph Structure

```
START
  │
  ▼
generateBlueprint ──▶ (blueprint set?) ──▶ END
      ▲                   │ no, retryCount < 3
      └───────────────────┘
```

There are no parallel branches. The single node runs, checks its own output, and either terminates or retries. If `retryCount >= 3` and `blueprint` is still null, the graph ends with `blueprint: null` (caller receives a failed result).

## generateBlueprint Node

```typescript
1. model = llmProvider.getModel()
2. messages = [
     SystemMessage(COURSE_GENERATION_SYSTEM_PROMPT),
     HumanMessage(buildCourseGenerationPrompt({ topic, difficulty, moduleCount }))
   ]
3. response = await model.invoke(messages)
4. content = response.content as string
5. Extract JSON:
     a. Try regex: /```(?:json)?\s*([\s\S]*?)```/   ← strip markdown code block
     b. Fallback:  /(\{[\s\S]*\})/                  ← bare JSON object
6. CourseBlueprintSchema.safeParse(JSON.parse(jsonStr))
7a. Success → return { blueprint: parsed.data }
7b. Failure → return { blueprint: null, retryCount: +1, error: zodError.message }
```

## Usage

The graph is built once per Agent service startup (in `routes/generate-course.ts`) with the configured `llmProvider`:

```typescript
const graph = buildCourseGenerationGraph(llmProvider);
const result = await graph.invoke({ topic, difficulty, moduleCount, blueprint: null, retryCount: 0, error: null });
if (!result.blueprint) throw new Error('Course generation failed');
```

## Extension Points

- **Add a formatting node**: If you want the LLM to first generate raw content and then format it as JSON (two-step generation), add a second node before `generateBlueprint` and connect them with an edge.
- **Streaming**: The current graph uses `invoke()` (waits for full completion). If you want to stream partial blueprint progress to the caller, switch to `stream()` with `streamMode: 'updates'`.
- **Different LLM per node**: If course generation should use a different (cheaper) model than chat, inject a second `llmProvider` and pass it to specific nodes.
