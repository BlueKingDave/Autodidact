import { z } from 'zod';

export const DifficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const ContentSectionSchema = z.object({
  title: z.string(),
  points: z.array(z.string()),
});

export const ModuleBlueprintSchema = z.object({
  id: z.string().optional(),
  position: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string().min(1),
  objectives: z.array(z.string()).min(1),
  contentOutline: z.array(ContentSectionSchema),
  estimatedMinutes: z.number().int().positive(),
});

export const CourseBlueprintSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: DifficultyLevelSchema,
  estimatedHours: z.number().positive(),
  modules: z.array(ModuleBlueprintSchema).min(1),
});

export const CreateCourseRequestSchema = z.object({
  topic: z.string().min(3).max(200),
  difficulty: DifficultyLevelSchema.optional().default('beginner'),
  moduleCount: z.number().int().min(3).max(20).optional().default(5),
});

export type CourseBlueprintInput = z.infer<typeof CourseBlueprintSchema>;
export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;
export type ModuleBlueprintInput = z.infer<typeof ModuleBlueprintSchema>;
