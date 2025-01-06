import { toast } from "sonner";

import type { TTSBodyParams } from "~/app/api/ai/tts/route";

export const generateAudioAsync = async ({
  input,
  speed,
}: {
  input: string;
  speed?: number;
}) => {
  const body: TTSBodyParams = { input, speed };
  const res = await fetch("/api/ai/tts", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!res.ok) {
    throw res.statusText;
  }
  const buffer = await res.arrayBuffer();
  const blob = new Blob([buffer], { type: "audio/mp3" });
  return URL.createObjectURL(blob);
};

export const unimplementedToast = () => {
  toast("Unimplemented");
};
