import AudioPlayButton from "./AudioPlayButton";
import { Button } from "./ui/button";

export default function WordInspectionPanel({ word }: { word: string }) {
  const openWindow = (url: string, target: string) => {
    window.open(url, target, "width=720,height=480");
  };

  return (
    <div>
      <div className="flex items-center gap-4 border-b p-4">
        <AudioPlayButton text={word} className="h-12 w-12" autoPlay />
        <p>{word}</p>
      </div>
      <div className="p-4">
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold">Dictionaries</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              openWindow(`https://en.wiktionary.org/wiki/${word}`, "wiktionary")
            }
          >
            Wiktionary (popup)
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              openWindow(
                `https://slovnik.seznam.cz/preklad/cesky_anglicky/${word}`,
                "seznam",
              )
            }
          >
            Seznam (popup)
          </Button>
        </div>
      </div>
      <div className="p-4 pt-0">
        <Button variant="outline">Mark Known</Button>
      </div>
    </div>
  );
}
