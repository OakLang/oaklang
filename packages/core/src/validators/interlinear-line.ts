import { z } from "zod";

export const disappearingEnum = z.enum(["default", "sticky"]);

export const interlinearLine = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
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
