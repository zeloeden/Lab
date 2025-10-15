import { z } from 'zod';

const Env = z.object({
  VITE_APP_VERSION: z.string().default('dev'),
  VITE_API_BASE: z.string().url().optional(),
});

export const env = Env.parse(import.meta.env);


