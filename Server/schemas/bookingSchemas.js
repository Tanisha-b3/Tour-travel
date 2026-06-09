import { z } from "zod";
import { pagination } from "./common.js";

export const listBookingsQuery = pagination.extend({
  status: z.enum(["confirmed", "cancelled", "pending"]).optional(),
});

const paymentSchema = z.object({
  name:    z.string().trim().min(1).max(80),
  number:  z.string().trim().regex(/^[\d\s]{13,23}$/, "Invalid card number"),
  expiry:  z.string().trim().regex(/^\d{2}\s*\/\s*\d{2}$/, "Expiry must be MM/YY"),
  cvc:     z.string().trim().regex(/^\d{3,4}$/, "Invalid CVC"),
});

export const createBookingBody = z.object({
  tourId:          z.coerce.number().int().positive(),
  tourName:        z.string().trim().min(1).max(120),
  name:            z.string().trim().min(2).max(80),
  email:           z.string().trim().toLowerCase().email().max(120),
  confirmEmail:    z.string().trim().toLowerCase().email().max(120),
  phone:           z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  address:         z.string().trim().min(5).max(300),
  nationality:     z.string().trim().min(2).max(80),
  checkIn:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date"),
  checkOut:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date"),
  guests:          z.coerce.number().int().min(1).max(20),
  tripType:        z.string().trim().min(1).max(40).default("couple"),
  specialRequests: z.string().trim().max(1000).optional(),
  total:           z.coerce.number().min(0).max(100_000_000),
  currency:        z.string().trim().length(3).max(3).default("INR"),
  payment:         paymentSchema,
}).refine((d) => d.email === d.confirmEmail, {
  message: "Emails do not match",
  path: ["confirmEmail"],
});

export const updateBookingStatusBody = z.object({
  status: z.enum(["confirmed", "cancelled", "pending"]),
});

export const bookingIdParam = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid booking id") });