import Link from 'next/link';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu';
import { cn } from '~/utils';
import type { Sentence } from '~/validators/generate-sentence';

export default function InterlinearList({
  sentences,
  onKnownWordsChange,
  knownWords,
}: {
  knownWords: string[];
  onKnownWordsChange: (words: string[]) => void;
  sentences: Sentence[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6">
      {sentences.map((sentence, i) =>
        sentence.lexicons.map((lexicon, j) => {
          const isKnownVocab = knownWords.includes(lexicon.lemma);
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div className="flex flex-col" key={`${lexicon.lexicon}-${i}-${j}`}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <button className="block text-left font-serif text-xl font-medium" type="button">
                    {lexicon.lexicon}
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {/* <ContextMenuItem>Repeat word</ContextMenuItem> */}
                  {isKnownVocab ? (
                    <ContextMenuItem onClick={() => onKnownWordsChange(knownWords.filter((word) => word !== lexicon.lemma))}>
                      Mark word unknown
                    </ContextMenuItem>
                  ) : (
                    <ContextMenuItem onClick={() => onKnownWordsChange([...knownWords, lexicon.lemma])}>Mark word known</ContextMenuItem>
                  )}
                  <ContextMenuItem>
                    <Link
                      href={{
                        host: 'en.wiktionary.org/w/index.php',
                        query: {
                          title: lexicon.lexicon,
                        },
                      }}
                      rel="noopener nofollow"
                      target="_blank"
                    >
                      Search Wiktionary for &apos;{lexicon.lexicon}&apos;
                    </Link>
                  </ContextMenuItem>
                  {/* <ContextMenuItem>More Practice</ContextMenuItem> */}
                </ContextMenuContent>
              </ContextMenu>
              <button className={cn('block text-left font-serif text-muted-foreground transition-opacity')} type="button">
                {lexicon.ipa}
              </button>
              <button className={cn('block text-left font-serif text-muted-foreground transition-opacity')} type="button">
                {lexicon.translation}
              </button>
            </div>
          );
        }),
      )}
    </div>
  );
}
