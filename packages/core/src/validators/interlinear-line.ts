import { z } from "zod";

export const disappearingEnum = z.enum(["default", "sticky"]);

export const interlinearLine = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9]+(_[a-z0-9]+)*$/,
      "The name must contain only lowercase letters, numbers, and underscores. Underscores are not allowed at the beginning or end, and the ID cannot contain special characters.",
    ),
  description: z.string().min(1).max(300),
  disappearing: disappearingEnum,
  hidden: z.boolean().nullish(),
  style: z.object({
    fontFamily: z.string().nullish(),
    fontWeight: z.string().nullish(),
    fontStyle: z.string().nullish(),
    color: z.string().nullish(),
  }),
});

export type Disappearing = z.infer<typeof disappearingEnum>;
export type InterlinearLine = z.infer<typeof interlinearLine>;
