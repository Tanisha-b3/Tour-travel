import { z } from "zod";
import { objectId } from "./common.js";

export const wishlistAddBody = z.object({
  destinationId: z.coerce.number().int().positive(),
});

export const wishlistSyncBody = z.object({
  items: z.array(z.coerce.number().int().positive()).max(200),
});

export const wishlistIdParam = z.object({
  destinationId: z.coerce.number().int().positive(),
});