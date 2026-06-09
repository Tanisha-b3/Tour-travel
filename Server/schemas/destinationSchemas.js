import { z } from "zod";
import { pagination, destinationSort, priceBucket, tourType } from "./common.js";

export const listDestinationsQuery = pagination.extend({
  search:       z.string().trim().max(200).optional(),
  type:         z.union([z.literal("all"), tourType]).optional(),
  price:        priceBucket.optional(),
  rating:       z.union([z.literal("all"), z.coerce.number().min(0).max(5)]).optional(),
  minPrice:     z.coerce.number().min(0).max(1_000_000).optional(),
  maxPrice:     z.coerce.number().min(0).max(1_000_000).optional(),
  minDuration:  z.coerce.number().int().min(0).max(365).optional(),
  maxDuration:  z.coerce.number().int().min(0).max(365).optional(),
  location:     z.string().trim().max(200).optional(),
  sort:         destinationSort.optional(),
});

const arrayOrUndefined = (schema) =>
  z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      try { return JSON.parse(v); } catch { return v.split(",").map((s) => s.trim()).filter(Boolean); }
    }
    return v;
  }, z.array(z.string().trim().min(1).max(200)).optional());

export const destinationBody = z.object({
  name:        z.string().trim().min(2).max(120),
  image:       z.string().trim().min(1).max(2000),
  images:      arrayOrUndefined(z.string()),
  description: z.string().trim().min(2).max(5000),
  price:       z.coerce.number().min(0).max(1_000_000),
  duration:    z.string().trim().min(1).max(80),
  rating:      z.coerce.number().min(0).max(5).optional(),
  category:    z.string().trim().min(1).max(80),
  type:        tourType,
  location:    z.string().trim().min(1).max(200),
  region:      z.string().trim().max(120).optional(),
  facilities:  arrayOrUndefined(z.string()),
  highlights:  arrayOrUndefined(z.string()),
});

export const destinationPatch = destinationBody.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: "No updatable fields supplied" }
);