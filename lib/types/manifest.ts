import { z } from "zod"

const configVariableSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean(),
  default: z.string().optional(),
})

export const manifestSchema = z.object({
  platform: z.string().min(1).optional(),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      "Must be lowercase alphanumeric with hyphens, starting with a letter or number"
    ),
  description: z.string().min(1).max(500),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Must follow semver (e.g. 1.0.0)"),
  author: z.string().min(1),
  skills: z
    .array(z.object({ name: z.string(), description: z.string() }))
    .optional()
    .default([]),
  plugins: z.array(z.string()).optional().default([]),
  modelPreferences: z
    .object({
      primary: z.string().optional(),
      fallback: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional().default([]),
  coverImage: z.string().optional(),
  demoVideoUrl: z.string().url().optional(),
  configVariables: z.array(configVariableSchema).optional().default([]),
})

export type ManifestInput = z.input<typeof manifestSchema>
export type ManifestOutput = z.output<typeof manifestSchema>
