import { useCallback, useEffect, useRef, useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import { generateAudioAsync } from "~/utils/helpers";

export default function usePlayTextToSpeech({
  playbackRate,
}: {
  playbackRate?: number;
} = {}) {
  const [inputText, setInputText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const queryClient = useQueryClient();

  const isFetching = useIsFetching({ queryKey: ["audio", inputText] });

  const handlePlay = useCallback(
    async (input: string) => {
      if (!audioRef.current) {
        return;
      }
      setInputText(input);
      try {
        const src = await queryClient.ensureQueryData({
          queryFn: () => generateAudioAsync({ input }),
          queryKey: ["audio", input],
          staleTime: 1000 * 60 * 60, // 1h
        });
        audioRef.current.src = src;
        audioRef.current.playbackRate = playbackRate ?? 1;
        await audioRef.current.play();
      } catch (error) {
        /* empty */
      }
    },
    [queryClient, playbackRate],
  );

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) {
      return;
    }

    const onPlay = () => {
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
    };

    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);

    return () => {
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
    };
  }, []);

  return {
    audioRef,
    play: handlePlay,
    pause: handlePause,
    isPlaying,
    isFetching: isFetching > 0,
  };
}
