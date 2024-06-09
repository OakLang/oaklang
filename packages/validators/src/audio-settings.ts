import { z } from "zod";

export const voiceEnum = z.enum([
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
]);
export type VoiceEnum = z.infer<typeof voiceEnum>;

export const audioSettingsSchema = z.object({
  speed: z.number().min(0.25).max(4),
  voice: voiceEnum,
});

export type AudioSettings = z.infer<typeof audioSettingsSchema>;

export const initialAudioSettings: AudioSettings = {
  speed: 1,
  voice: "alloy",
};
