import { z } from "zod";

export const registerSchema = z.object({
  name:     z.string().trim().min(2,  "Name must be at least 2 characters").max(80),
  email:    z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
});

export const loginSchema = z.object({
  email:    z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(200),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).max(2000),
});

export const optionalRefreshSchema = z
  .object({ refreshToken: z.string().min(10).max(2000).optional() })
  .strict();

export const logoutSchema = z.object({
  refreshToken: z.string().min(10).max(2000).optional(),
});

export const updateProfileSchema = z
  .object({
    name:  z.string().trim().min(2).max(80).optional(),
    phone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .refine(
        (v) => !v || /^[+]?[\d\s()-]{7,20}$/.test(v),
        { message: "Enter a valid phone number" }
      ),
  })
  .strict()
  .refine((d) => d.name !== undefined || d.phone !== undefined, {
    message: "Provide a name or phone to update",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword:     z.string().min(6, "New password must be at least 6 characters").max(200),
});