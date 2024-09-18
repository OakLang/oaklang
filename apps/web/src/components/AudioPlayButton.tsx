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
}: {
  text: string;
  speed?: number;
  className?: string;
  autoPlay?: boolean;
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

    audioRef.current.src = audioUrl;
    void audioRef.current.play();
  }, [audioQuery]);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

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
              <Loader2Icon className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <SquareIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6" />
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
