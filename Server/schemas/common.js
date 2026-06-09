import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const pagination = z.object({
  page:  z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const destinationSort = z.enum([
  "default", "recommended",
  "price-asc", "price-desc",
  "rating-desc", "rating-asc",
  "duration-asc", "duration-desc",
  "name-asc", "name-desc",
  "newest",
]).default("default");

export const priceBucket = z.enum(["all", "low", "mid", "high"]).default("all");

export const tourType = z.string().min(1).max(40);

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const searchString = z.string().trim().min(1).max(200);