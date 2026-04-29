# Module: Progress

## Responsibility

Tracks and updates per-user progress through a course's modules. Handles the sequential unlock mechanic that gates access to future modules until the current one is completed.

## Files

| File | Description |
|------|-------------|
| `progress.controller.ts` | `GET /progress/:courseId`, `POST /progress/:moduleId/start` |
| `progress.service.ts` | Module status transitions, sequential unlock, enrollment completion |
| `progress.module.ts` | NestJS module wiring |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/progress/:courseId` | Returns all `module_progress` rows for the user/course pair, ordered by module position |
| `POST` | `/progress/:moduleId/start` | Transitions a module from `available` → `in_progress` |

`completeModule()` is not exposed as an HTTP endpoint — it is called internally by `ChatModule` when the AI signals completion.

## Module Status Transitions

```
locked ──▶ available ──▶ in_progress ──▶ completed
            (enrolled)   (start called)   (AI score >= 60)
```

- **`locked`**: Default state on enrollment. Module is not accessible to the user.
- **`available`**: Module can be entered. Set on enrollment for module 0; set by unlock logic for subsequent modules.
- **`in_progress`**: User has entered the module chat. Set via `POST /progress/:moduleId/start`.
- **`completed`**: AI evaluated the conversation and score ≥ 60.

## Sequential Unlock

When `completeModule()` is called, a single SQL UPDATE unlocks the next module:

```sql
UPDATE module_progress mp
SET status = 'available'
FROM modules m
WHERE mp.module_id = m.id
  AND mp.user_id = $userId
  AND mp.course_id = $courseId
  AND mp.status = 'locked'
  AND m.position = (
    SELECT position + 1
    FROM modules
    WHERE id = $completedModuleId
  );
```

This atomically finds the next locked module (by position + 1) and sets it to `available`. If the completed module is the last one, no row is updated.

## Enrollment Completion

After unlocking the next module, `completeModule()` checks if all modules for the enrollment are now `completed`:

```typescript
const allProgress = await db.select({ status }).from(moduleProgress).where(...);
if (allProgress.every(p => p.status === 'completed')) {
  await db.update(enrollments).set({ completedAt: new Date() }).where(...);
}
```

This stamps `enrollments.completed_at`, marking the course as fully finished for the user.

## Caller Pattern

`ProgressModule` is imported by `ChatModule` (the only consumer of `ProgressService`). The cross-module call happens inside `ChatService.streamMessage()` after the SSE stream closes, once the completion score is known.
