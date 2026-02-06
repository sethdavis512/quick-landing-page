import { z } from "zod";

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  campaign: z.string().min(1, "Campaign is required"),
  name: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
