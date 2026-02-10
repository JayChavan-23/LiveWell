// src/schemas/memory.js
import { z } from "zod";

/**
 * One memory fact extracted from chat.
 * Example: { type: "health_condition", key: "diabetes.type", value: "type1", confidence: 0.9 }
 */
export const MemoryItemSchema = z.object({
  type: z.enum([
    "health_condition",
    "allergy",
    "diet",
    "medication",
    "preference",
    "mood",
    "note",
  ]),
  key: z.string().min(1),
  value: z.union([z.string(), z.boolean(), z.number()]),
  confidence: z.number().min(0).max(1).default(1),
  source: z
    .object({
      kind: z.enum(["chat", "system"]).default("chat"),
      chatId: z.string().optional(),
      msgId: z.string().optional(),
    })
    .optional(),
  active: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * Derived user profile built from many memories.
 * This is what we inject into the chat context.
 */
export const AiProfileSchema = z.object({
  health: z
  .record(
    z.string(),
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
      z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    ])
  )
  .optional(),
  allergies: z
  .array(
    z.object({
      allergen: z.string(),
      severity: z.string().optional(),
      confirmed: z.boolean().optional()
    })
  )
  .optional(),
  diet: z
  .array(
    z.object({
      type: z.string(),
      since: z.string().optional(),
      strict: z.boolean().optional(),
    })
  )
  .optional(),
  preferences: z
  .record(
    z.string(),
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    ])
  )
  .optional(),

  mood: z
  .object({
    current: z.string().optional(),
    confidence: z.number().optional(),
    updatedAt: z.string().optional(),
    source: z.string().optional(),
  })
  .optional(),
  updatedAt: z.string().optional(),
});

/**
 * Normalize raw memory item values into consistent keys/values.
 */
export function normalizeMemory(raw) {
  const data = MemoryItemSchema.parse(raw);
  
  if (data.key === "diabetes.type" && typeof data.value === "string") {
    const val = data.value.toLowerCase();
    if (val.includes("1")) data.value = "type1";
    else if (val.includes("2")) data.value = "type2";
    else data.value = "";
  }
  
  if (data.key.startsWith("allergy.")) {
    data.value = true;
  }
  
  return {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}