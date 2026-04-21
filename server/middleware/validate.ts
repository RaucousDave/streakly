import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(70, "Name must be at most 70 characters")
    .trim(),
  email: z
    .email("Invalid email address")
    .min(1, "Email is required")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase character")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const signInSchema = z.object({
  email: z
    .email("Invalid email address")
    .min(1, "Email is required")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

export const magicLinkSchema = z.object({
  email: z
    .email("Invalid email address")
    .min(1, "Email is required")
    .toLowerCase()
    .trim(),
});

export const passKeyRegisterSchema = z.object({
  name: z
    .string()
    .min(1, "Passkey name is required")
    .max(64, "Passkey name is too long")
    .trim()
    .optional(),
});

import type { Request, Response, NextFunction } from "express";
// import z from "zod/v3";

import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        errors,
      });
    }
    req.body = result.data;
    next();
  };
}
