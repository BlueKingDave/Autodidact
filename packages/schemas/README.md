# @autodidact/schemas

## Purpose

Zod validation schemas for API request bodies and LLM-generated data structures. Used for runtime validation at service boundaries — HTTP request parsing and LLM response parsing.

## Consumers

| Consumer | Usage |
|----------|-------|
| `services/api` | `ZodValidationPipe` on controller methods |
| `services/agent` | `CourseBlueprintSchema.safeParse()` on LLM output |

## Public API

```typescript
import {
  // Course domain
  CreateCourseRequestSchema,   // POST /courses body
  CourseBlueprintSchema,       // LLM output validation
  ModuleBlueprintSchema,
  DifficultyLevelSchema,
  ContentSectionSchema,

  // Chat domain
  SendMessageSchema,           // POST /chat/sessions/:id/stream body
  CreateChatSessionSchema,     // POST /chat/sessions body

  // Auth domain
  SignInSchema,
  SignUpSchema,

  // Inferred TypeScript types
  type CreateCourseRequest,
  type CourseBlueprintInput,
  type ModuleBlueprintInput,
} from '@autodidact/schemas';
```

## Internal Structure

```
packages/schemas/src/
├── course.ts       # Course creation request + LLM blueprint schemas
├── chat.ts         # Chat session and message schemas
├── auth.ts         # Sign-in / sign-up schemas
└── index.ts        # Re-exports all schemas and inferred types
```

## Validation Rules

### `CreateCourseRequestSchema`
```typescript
{
  topic:       z.string().min(3).max(200),
  difficulty:  z.enum(['beginner','intermediate','advanced']).optional().default('beginner'),
  moduleCount: z.number().int().min(3).max(20).optional().default(5),
}
```

### `CourseBlueprintSchema`
Used by the Agent service to validate LLM-generated JSON before saving to the database.
```typescript
{
  title:          z.string().min(1),
  description:    z.string().min(1),
  difficulty:     DifficultyLevelSchema,
  estimatedHours: z.number().positive(),
  modules:        z.array(ModuleBlueprintSchema).min(1),
}
```

### `SendMessageSchema`
```typescript
{
  content: z.string().min(1).max(4000),
}
```

## Usage Example

**In NestJS controller** (via `ZodValidationPipe`):
```typescript
@Post()
@UsePipes(new ZodValidationPipe(CreateCourseRequestSchema))
create(@Body() dto: CreateCourseRequest) {
  return this.coursesService.createOrReuse(user.id, dto);
}
```

**In LangGraph node** (LLM output parsing):
```typescript
const parsed = CourseBlueprintSchema.safeParse(JSON.parse(jsonStr));
if (parsed.success) {
  return { blueprint: parsed.data };
}
return { blueprint: null, retryCount: state.retryCount + 1 };
```

## Change Safety Notes

- **Schema ↔ type alignment**: Schemas in this package validate the same data shapes as the TypeScript types in `@autodidact/types`. If you change a type (e.g., add a required field to `ModuleBlueprint`), add the corresponding validation rule to `ModuleBlueprintSchema` and update the prompt in `@autodidact/prompts`.
- **`moduleCount` default**: The default of 5 modules is set here, not in the frontend. If you change the default, the mobile app's UI will need a matching update to show the correct selected value.
- **`CourseBlueprintSchema` is permissive on `id`**: `ModuleBlueprintSchema.id` is `z.string().optional()` because some LLM responses omit the `id` field. The database assigns its own UUIDs — the blueprint `id` field is not used after parsing.
