import { z } from "zod";

export const disappearingEnum = z.enum(["default", "sticky"]);

export const interlinearLineActionSchema = z.object({
  action: z.string(),
  lineName: z.string().nullish(),
});

export type InterlinearLineActionType = z.infer<
  typeof interlinearLineActionSchema
>;

export const interlinearLine = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(300),
  disappearing: disappearingEnum,
  hidden: z.boolean().nullish(),
  hiddenInInspectionPanel: z.boolean().nullish(),
  onClick: interlinearLineActionSchema.nullish(),
  onDoubleClick: interlinearLineActionSchema.nullish(),
  onHover: interlinearLineActionSchema.nullish(),
  style: z.object({
    fontSize: z.number().min(12).max(48).default(16),
    fontFamily: z.string().default("Times New Roman"),
    fontWeight: z.string().default("400"),
    fontStyle: z.string().default("normal"),
    color: z.string().nullish(),
  }),
});

export type Disappearing = z.infer<typeof disappearingEnum>;
export type InterlinearLine = z.infer<typeof interlinearLine>;

export const interlinearLines = z
  .array(interlinearLine)
  .min(1)
  .refine(
    (items) => {
      let unique = true;
      const names = items.map((line) => line.name);
      names.forEach((name, i) => {
        if (names.findIndex((n) => n === name) !== i) {
          unique = false;
        }
      });
      return unique;
    },
    {
      message: "Each interlinear line name should be unique",
    },
  );

export type InterlinearLines = z.infer<typeof interlinearLines>;
