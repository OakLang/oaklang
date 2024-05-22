import Link from 'next/link';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu';
import { cn } from '~/utils';
import type { Sentence } from '~/validators/generate-sentence';

export default function InterlinearList({
  sentences,
  knownWords,
}: {
  knownWords: string[];
  onKnownWordsChange: (words: string[]) => void;
  sentences: Sentence[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6">
      {sentences.map((sentence, i) =>
        sentence.lexicons.map((lexiocn, j) => {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div className="flex flex-col" key={`${lexiocn.lexicon}-${i}-${j}`}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <button className="block text-left font-serif text-xl font-medium" type="button">
                    {lexiocn.lexicon}
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Repeat word</ContextMenuItem>
                  <ContextMenuItem>Mark word known</ContextMenuItem>
                  <ContextMenuItem>
                    <Link
                      href={{
                        host: 'en.wiktionary.org/w/index.php',
                        query: {
                          title: lexiocn.lexicon,
                        },
                      }}
                      rel="noopener nofollow"
                      target="_blank"
                    >
                      Search Wiktionary for &apos;{lexiocn.lexicon}&apos;
                    </Link>
                  </ContextMenuItem>
                  <ContextMenuItem>More Practice</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
              <button
                className={cn('block text-left font-serif text-muted-foreground transition-opacity', {
                  'pointer-events-none opacity-0': knownWords.includes(lexiocn.ipa),
                })}
                type="button"
              >
                {lexiocn.ipa}
              </button>
              <button
                className={cn('block text-left font-serif text-muted-foreground transition-opacity', {
                  'pointer-events-none opacity-0': knownWords.includes(lexiocn.translation),
                })}
                type="button"
              >
                {lexiocn.translation}
              </button>
            </div>
          );
        }),
      )}
    </div>
  );
}
