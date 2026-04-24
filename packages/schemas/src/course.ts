import { z } from 'zod';

export const DifficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const CreateCourseRequestSchema = z.object({
  topic: z.string().min(3).max(200),
  difficulty: DifficultyLevelSchema.optional().default('beginner'),
  preferredModuleCount: z.number().int().min(3).max(20).optional().default(6),
});

export const ContentOutlineItemSchema = z.object({
  topic: z.string(),
  subtopics: z.array(z.string()),
});

export const ModuleBlueprintSchema = z.object({
  position: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string().min(1),
  objectives: z.array(z.string()).min(1),
  contentOutline: z.array(ContentOutlineItemSchema).min(1),
  estimatedMinutes: z.number().int().min(5),
});

export const CourseBlueprintSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  difficulty: DifficultyLevelSchema,
  estimatedHours: z.number().min(0.5),
  modules: z.array(ModuleBlueprintSchema).min(1),
});

export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;
export type CourseBlueprint = z.infer<typeof CourseBlueprintSchema>;
export type ModuleBlueprintInput = z.infer<typeof ModuleBlueprintSchema>;
