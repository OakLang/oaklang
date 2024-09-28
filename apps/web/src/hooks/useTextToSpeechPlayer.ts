import { useCallback, useEffect, useRef, useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import { generateAudioAsync } from "~/utils/helpers";

export default function useTextToSpeechPlayer({
  input,
  autoPlay,
  playbackRate,
}: {
  input: string;
  autoPlay?: boolean;
  playbackRate?: number;
}) {
  const [isAutoPlayDone, setIsAutoPlayDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const queryClient = useQueryClient();
  const isFetching = useIsFetching({
    queryKey: ["audio", input],
  });

  const handlePlay = useCallback(async () => {
    if (!audioRef.current) {
      return;
    }
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
  }, [queryClient, input, playbackRate]);

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

  useEffect(() => {
    if (autoPlay && !isAutoPlayDone) {
      void handlePlay();
      setIsAutoPlayDone(true);
    }
  }, [autoPlay, handlePlay, isAutoPlayDone]);

  useEffect(() => {
    setIsAutoPlayDone(false);
  }, [input]);

  return {
    audioRef,
    play: handlePlay,
    pause: handlePause,
    isPlaying,
    isFetching: isFetching > 0,
  };
}
