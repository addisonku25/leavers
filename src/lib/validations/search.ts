import { z } from "zod";

export const searchSchema = z.object({
  company: z.string().min(1, "Company name is required").max(100),
  role: z.string().min(1, "Role title is required").max(100),
});

export type SearchInput = z.infer<typeof searchSchema>;
