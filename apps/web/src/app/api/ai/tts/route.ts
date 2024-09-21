import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { openai } from "@acme/api/openai";
import { auth } from "@acme/auth";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { userSettings } from "@acme/db/schema";

const bodySchema = z.object({
  input: z.string().min(0).max(4096),
  speed: z.number().min(0.25).max(4).optional(),
});

export type TTSBodyParams = z.infer<typeof bodySchema>;

const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
type Voice = (typeof voices)[number];

export const POST = async (req: NextRequest) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body = await req.json();
  const { input, speed } = await bodySchema.parseAsync(body);

  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [settings] = await db
    .select({
      ttsVoice: userSettings.ttsVoice,
      ttsSpeed: userSettings.ttsSpeed,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));
  if (!settings) {
    return new NextResponse("User settings not found", { status: 404 });
  }

  if (!voices.includes(settings.ttsVoice as Voice)) {
    settings.ttsVoice = voices[0];
  }

  const mp3 = await openai.audio.speech.create({
    input,
    model: "tts-1",
    speed: Math.min(4, Math.max(0.25, speed ?? settings.ttsSpeed)),
    voice: settings.ttsVoice as Voice,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  return new NextResponse(buffer);
};
