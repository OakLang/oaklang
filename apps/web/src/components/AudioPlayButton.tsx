import { forwardRef } from "react";
import { Loader2Icon, PauseIcon, PlayIcon } from "lucide-react";

import type { ButtonProps } from "./ui/button";
import useTextToSpeechPlayer from "~/hooks/useTextToSpeechPlayer";
import { cn } from "~/utils";
import { Button } from "./ui/button";

export interface AudioPlayButton
  extends Omit<ButtonProps, "children" | "onClick"> {
  asChild?: boolean;
  value: string;
  className?: string;
  autoPlay?: boolean;
}

const AudioPlayButton = forwardRef<HTMLButtonElement, AudioPlayButton>(
  (
    {
      value,
      autoPlay,
      className,
      size = "icon",
      variant = "secondary",
      ...props
    },
    ref,
  ) => {
    const { audioRef, isFetching, isPlaying, pause, play } =
      useTextToSpeechPlayer({ input: value, autoPlay });

    return (
      <>
        <audio ref={audioRef} />
        <Button
          className={cn("rounded-full", className)}
          size={size}
          variant={variant}
          {...props}
          ref={ref}
          onClick={() => {
            if (isPlaying) {
              pause();
            } else {
              void play();
            }
          }}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
        </Button>
      </>
    );
  },
);

export default AudioPlayButton;
