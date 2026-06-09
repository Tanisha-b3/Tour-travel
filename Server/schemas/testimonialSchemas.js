import { z } from "zod";
import { pagination } from "./common.js";

export const listTestimonialsQuery = pagination.extend({});

const userCreateBody = z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid bookingId"),
  text:      z.string().trim().min(10, "Review must be at least 10 characters").max(1000),
  rating:    z.coerce.number().int().min(1).max(5).default(5),
  location:  z.string().trim().max(120).optional(),
});

const adminCreateBody = z.object({
  name:     z.string().trim().min(1).max(80),
  avatar:   z.string().trim().max(2000).optional(),
  location: z.string().trim().min(1).max(120),
  text:     z.string().trim().min(1).max(1000),
  rating:   z.coerce.number().min(1).max(5).default(5),
});

export const createTestimonialBody = z.union([userCreateBody, adminCreateBody]);

export const updateTestimonialBody = z.object({
  name:     z.string().trim().min(1).max(80).optional(),
  avatar:   z.string().trim().max(2000).optional(),
  location: z.string().trim().min(1).max(120).optional(),
  text:     z.string().trim().min(1).max(1000).optional(),
  rating:   z.coerce.number().min(1).max(5).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "No updatable fields supplied" });