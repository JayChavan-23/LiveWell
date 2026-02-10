import { z } from 'zod';

export const GoalDomain = z.enum(['activity', 'hydration', 'mental', 'vaccination', 'social']);

export const AssessmentSchema = z.object({
  userId: z.string(),
  tool: z.enum(['CFS', 'FI']),
  score: z.number().min(0),
  takenAt: z.string().datetime().optional(), // ISO string; default now
});
export type AssessmentInput = z.infer<typeof AssessmentSchema>;

export const GoalSchema = z.object({
  userId: z.string(),
  domain: GoalDomain,
  title: z.string().min(1),
  target: z.record(z.any()).default({}),      // e.g., { minutesPerDay: 15 }
  cadence: z.enum(['daily','weekly','monthly']).default('daily'),
  status: z.enum(['active', 'paused', 'done']).default('active'),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});
export type GoalInput = z.infer<typeof GoalSchema>;

export const ProgressSchema = z.object({
  userId: z.string(),
  goalId: z.string(),
  value: z.record(z.any()),                   // e.g., { minutes: 10 }
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  notes: z.string().max(500).optional(),
});
export type ProgressInput = z.infer<typeof ProgressSchema>;