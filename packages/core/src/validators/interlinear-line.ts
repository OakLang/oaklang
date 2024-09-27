import { z } from "zod";

export const disappearingEnum = z.enum(["default", "sticky"]);

export const InterlinearLineAction = {
  inspectWord: "inspect-word",
  markWordKnown: "mark-word-known",
  showLineInTooltip: "show-line-in-tooltip",
  readoutLine: "readout-line",
  readoutFullSentence: "readout-full-sentence",
} as const;

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

export const NON_EDITABLE_LINE_NAMES = ["word", "lemma", "text"];

export const DEFAULT_INTERLINEAR_LINE_STYLE: InterlinearLine["style"] = {
  fontFamily: "Times New Roman",
  fontSize: 16,
  fontStyle: "normal",
  fontWeight: "400",
  color: null,
};

export const DEFAULT_INTERLINEAR_LINES: InterlinearLine[] = [
  {
    id: "fzFShZlh8Cilj3tBnNvBz",
    name: "text",
    style: {
      ...DEFAULT_INTERLINEAR_LINE_STYLE,
      fontSize: 32,
      fontWeight: "600",
    },
    description:
      "whitespace delimited text associated with word from the full sentence including capitalization and punctuation",
    disappearing: "default",
    hidden: false,
    onClick: {
      action: InterlinearLineAction.inspectWord,
    },
  },
  {
    id: "3OQ_IriDgK0JXH4VVxJkl",
    name: "word",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description:
      "word in {PRACTICE_LANGUAGE} without whitespace or punctuation or capitalization",
    disappearing: "default",
    hidden: true,
  },
  {
    id: "g5H0tIRQK0nN9GZF1B-aW",
    name: "lemma",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "word in lemma form",
    disappearing: "default",
    hidden: false,
  },
  {
    id: "d2nK5RVUhmIk6owFxvIkn",
    name: "translation",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "word translation in {NATIVE_LANGUAGE}",
    disappearing: "default",
    hidden: false,
  },
  {
    id: "MXta_2mUvmlKvQaPtM-Ad",
    name: "ipa",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "word pronunciation in IPA format",
    disappearing: "default",
    hidden: false,
  },
  {
    id: "ZZwf15A56jNMgxxaVT_Gs",
    name: "pronunciation",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "phonetic word pronunciation in {NATIVE_LANGUAGE}",
    disappearing: "default",
    hidden: false,
    onHover: {
      action: InterlinearLineAction.showLineInTooltip,
      lineName: "grammar",
    },
  },
  {
    id: "eBGG0RysMUSQVCfD7YZmA",
    name: "grammar",
    style: { ...DEFAULT_INTERLINEAR_LINE_STYLE, fontStyle: "italic" },
    description:
      "Provide an abbreviated grammatical analysis of the word in this context using standard grammatical abbreviations (e.g., adj m s nom), including part of speech, gender, number, case, tense, and other relevant details.",
    disappearing: "default",
    hidden: true,
  },
];
