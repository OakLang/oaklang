import { z } from "zod";

export const disappearingEnum = z.enum(["default", "sticky"]);

export const interlinearLine = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(300),
  disappearing: disappearingEnum,
  hidden: z.boolean().nullish(),
  style: z.object({
    fontSize: z.number().default(16),
    fontFamily: z.string().default("Times New Roman"),
    fontWeight: z.string().default("400"),
    fontStyle: z.string().default("normal"),
    color: z.string().nullish(),
  }),
});

export type Disappearing = z.infer<typeof disappearingEnum>;
export type InterlinearLine = z.infer<typeof interlinearLine>;

export const DEFAULT_INTERLINEAR_LINE_STYLE: InterlinearLine["style"] = {
  fontFamily: "Times New Roman",
  fontSize: 16,
  fontStyle: "normal",
  fontWeight: "400",
  color: null,
};

export const DEFAULT_INTERLINEAR_LINES: InterlinearLine[] = [
  {
    id: "01J8JCN4RNPKJZG64219443K5W",
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
  },
  {
    id: "01J8JCN8ZV0F4VN91GDSN4Q4HR",
    name: "word",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description:
      "word in {{PRACTICE_LANGUAGE}} without whitespace or punctuation or capitalization",
    disappearing: "default",
    hidden: true,
  },
  {
    id: "01J8JCND9FJ5AHP5PAXADQVGT9",
    name: "lemma",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "word in lemma form",
    disappearing: "default",
    hidden: false,
  },
  {
    id: "01J8MK2PME54VJ9R80W10TZ7V7",
    name: "translation",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "word translation in {{NATIVE_LANGUAGE}}",
    disappearing: "default",
    hidden: false,
  },
  {
    id: "01J8JCNHPZMM9M0WPP8DHFSNR5",
    name: "ipa",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "word pronunciation in IPA format",
    disappearing: "default",
    hidden: false,
  },
  {
    id: "01J8JCNNZYACY187W8TE7M7S9B",
    name: "pronunciation",
    style: DEFAULT_INTERLINEAR_LINE_STYLE,
    description: "phonetic word pronunciation in {{NATIVE_LANGUAGE}}",
    disappearing: "default",
    hidden: false,
  },
  {
    id: "01J8JCNVPVTAXM8XF81M5ZM2YJ",
    name: "grammar",
    style: { ...DEFAULT_INTERLINEAR_LINE_STYLE, fontStyle: "italic" },
    description:
      "Provide an abbreviated grammatical analysis of the word in this context using standard grammatical abbreviations (e.g., adj m s nom), including part of speech, gender, number, case, tense, and other relevant details.",
    disappearing: "default",
    hidden: true,
  },
];
