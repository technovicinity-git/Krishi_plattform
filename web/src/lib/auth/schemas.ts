import { z } from "zod";
import { isValidBDPhone } from "./phone";

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine(isValidBDPhone, "Enter a valid Bangladeshi mobile number");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    phone: phoneSchema,
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;