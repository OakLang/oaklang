import { Loader2Icon, PauseIcon, PlayIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import useTextToSpeechPlayer from "~/hooks/useTextToSpeechPlayer";
import { useAppStore } from "~/store/app-store";

export default function AudioPlayButton({
  text,
  autoPlay,
}: {
  text: string;
  autoPlay?: boolean;
}) {
  const playgroundPlaybackSpeed = useAppStore(
    (state) => state.playgroundPlaybackSpeed,
  );
  const setPlaygroundPlaybackSpeed = useAppStore(
    (state) => state.setPlaygroundPlaybackSpeed,
  );
  const { audioRef, isFetching, isPlaying, pause, play } =
    useTextToSpeechPlayer({
      input: text,
      autoPlay,
      playbackRate: playgroundPlaybackSpeed,
    });

  return (
    <>
      <audio ref={audioRef} />
      <Button
        className="h-14 w-14 rounded-full"
        size="icon"
        variant="outline"
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
          <Loader2Icon className="h-6 w-6 animate-spin" />
        ) : isPlaying ? (
          <PauseIcon className="h-6 w-6" />
        ) : (
          <PlayIcon className="h-6 w-6" />
        )}
      </Button>
      <Select
        value={String(playgroundPlaybackSpeed)}
        onValueChange={(rate) => setPlaygroundPlaybackSpeed(parseFloat(rate))}
      >
        <SelectTrigger className="w-fit gap-2 rounded-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <SelectItem key={String(rate)} value={String(rate)}>
              {rate}x
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
