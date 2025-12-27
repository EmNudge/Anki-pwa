import { z } from "zod";

// The col table contains a JSON string for the conf, models, decks, and dconf fields

export const modelSchema = z.record(
  z.object({
    id: z.union([z.number(), z.string()]),
    css: z.string(),
    latexPre: z.string(),
    latexPost: z.string(),
    flds: z.array(
      z.object({
        name: z.string(),
      }),
    ),
    tmpls: z.array(
      z.object({
        name: z.string(),
        afmt: z.string(),
        qfmt: z.string(),
        ord: z.number(),
        id: z.number().nullable().optional(),
      }),
    ),
  }),
);
