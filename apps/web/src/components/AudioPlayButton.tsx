import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, PlayIcon, SquareIcon } from "lucide-react";

import { cn } from "~/utils";
import { generateAudioAsync } from "~/utils/helpers";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const AudioPlayButton = ({
  text,
  speed = 1,
  className,
  autoPlay,
  iconSize = 24,
}: {
  text: string;
  speed?: number;
  className?: string;
  autoPlay?: boolean;
  iconSize?: number;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioQuery = useQuery({
    enabled: false,
    queryFn: () => generateAudioAsync({ input: text, speed }),
    queryKey: [text, speed],
    staleTime: 1000 * 60 * 60, // 1h
  });

  const playAudio = useCallback(async () => {
    let audioUrl: string | undefined = audioQuery.data;
    if (!audioUrl && audioQuery.fetchStatus === "idle") {
      const { data } = await audioQuery.refetch();
      audioUrl = data;
    }

    if (!audioUrl) {
      return;
    }

    if (!audioRef.current) {
      return;
    }

    if (!audioRef.current.paused) {
      audioRef.current.currentTime = 0;
    } else {
      audioRef.current.src = audioUrl;
      try {
        await audioRef.current.play();
      } catch (error) {
        /* empty */
      }
    }
  }, [audioQuery]);

  const stopAudio = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) {
      return;
    }

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);

    return () => {
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    if (autoPlay) {
      void playAudio();
    }
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  return (
    <>
      <audio ref={audioRef} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn("h-14 w-14 rounded-full", className)}
            onClick={() => {
              if (isPlaying) {
                stopAudio();
              } else {
                void playAudio();
              }
            }}
            disabled={audioQuery.isFetching}
          >
            {audioQuery.isFetching ? (
              <Loader2Icon
                style={{
                  width: iconSize,
                  height: iconSize,
                }}
                className="animate-spin"
              />
            ) : isPlaying ? (
              <SquareIcon
                style={{
                  width: iconSize,
                  height: iconSize,
                }}
              />
            ) : (
              <PlayIcon
                style={{
                  width: iconSize,
                  height: iconSize,
                }}
              />
            )}
            <span className="sr-only">{isPlaying ? "Stop" : "Play"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isPlaying ? "Stop" : "Play"}</TooltipContent>
      </Tooltip>
    </>
  );
};

export default AudioPlayButton;
