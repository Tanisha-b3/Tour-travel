import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(4000),
});

export const chatRequestSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(40),
  })
  .strict();

export const planRequestSchema = z
  .object({
    budget:        z.number().positive().max(10_000_000).optional(),
    durationDays:  z.number().int().min(1).max(60).optional(),
    style:         z.string().trim().max(40).optional(),
    group:         z.number().int().min(1).max(50).optional(),
    guests:        z.number().int().min(1).max(50).optional(),
    interest:      z.string().trim().max(60).optional(),
    type:          z.string().trim().max(40).optional(),
    month:         z.string().trim().max(20).optional(),
  })
  .strict();

export const recommendRequestSchema = z
  .object({
    prefs: planRequestSchema.partial().optional(),
    history: z
      .array(
        z.object({
          tourId:     z.union([z.number(), z.string()]).optional(),
          tourName:   z.string().max(200).optional(),
          type:       z.string().max(40).optional(),
          rating:     z.number().min(0).max(5).optional(),
        }).passthrough()
      )
      .max(20)
      .optional(),
  })
  .strict();
