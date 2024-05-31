import { useAtom } from 'jotai';
import Link from 'next/link';
import { useState } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu';
import { knownIPAsAtom, knownTranslationsAtom, knownVocabsAtom } from '~/store';
import { cn } from '~/utils';
import type { Sentence } from '~/validators/generate-sentence';

export default function InterlinearList({ sentences }: { sentences: Sentence[] }) {
  const [knownVocabs, setKnownVocabs] = useAtom(knownVocabsAtom);
  const [knownIPAs, setKnownIPAs] = useAtom(knownIPAsAtom);
  const [knownTranslations, setKnownTranslations] = useAtom(knownTranslationsAtom);

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6">
      {sentences.map((sentence, i) =>
        sentence.lexicons.map((lexicon, j) => {
          const id = `${lexicon.lexicon}-${i}-${j}`;
          const vocabKnown = knownVocabs.includes(lexicon.lemma);

          return (
            <ListItem
              ipa={lexicon.ipa}
              ipaHidden={knownIPAs.includes(lexicon.ipa)}
              key={id}
              onHideIPA={() => setKnownIPAs([...knownIPAs, lexicon.ipa])}
              onHideTranslation={() => setKnownTranslations([...knownTranslations, lexicon.translation])}
              onMarkVocabKnown={() => setKnownVocabs([...knownVocabs, lexicon.lemma])}
              onMarkVocabUnknown={() => setKnownVocabs(knownVocabs.filter((vocab) => vocab !== lexicon.lemma))}
              translation={lexicon.translation}
              translationHidden={knownTranslations.includes(lexicon.translation)}
              vocab={lexicon.lexicon}
              vocabKnown={vocabKnown}
            />
          );
        }),
      )}
    </div>
  );
}

const ListItem = ({
  ipa,
  onHideIPA,
  onHideTranslation,
  translation,
  vocab,
  ipaHidden,
  translationHidden,
  onMarkVocabKnown,
  onMarkVocabUnknown,
  vocabKnown,
}: {
  ipa: string;
  ipaHidden?: boolean;
  onHideIPA: () => void;
  onHideTranslation: () => void;
  onMarkVocabKnown: () => void;
  onMarkVocabUnknown: () => void;
  translation: string;
  translationHidden?: boolean;
  vocab: string;
  vocabKnown?: boolean;
}) => {
  const [revealIpa, setRevealIpa] = useState(false);
  const [revealTranslation, setRevealTranslation] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            className="block text-left font-serif text-4xl font-medium"
            onClick={() => {
              setRevealIpa(true);
              setRevealTranslation(true);
            }}
            type="button"
          >
            {vocab}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {/* <ContextMenuItem>Repeat word</ContextMenuItem> */}
          {vocabKnown ? (
            <ContextMenuItem onClick={onMarkVocabUnknown}>Mark word unknown</ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={onMarkVocabKnown}>Mark word known</ContextMenuItem>
          )}
          <ContextMenuItem>
            <Link
              href={{
                host: 'en.wiktionary.org/w/index.php',
                query: {
                  title: vocab,
                },
              }}
              rel="noopener nofollow"
              target="_blank"
            >
              Search Wiktionary for &apos;{vocab}&apos;
            </Link>
          </ContextMenuItem>
          {/* <ContextMenuItem>More Practice</ContextMenuItem> */}
        </ContextMenuContent>
      </ContextMenu>
      <button
        className={cn('block text-left font-serif text-xl text-muted-foreground transition-opacity', {
          invisible: ipaHidden && !revealIpa,
        })}
        onClick={() => {
          onHideIPA();
          setRevealIpa(false);
        }}
        type="button"
      >
        {ipa}
      </button>
      <button
        className={cn('block text-left font-serif text-xl text-muted-foreground transition-opacity', {
          invisible: translationHidden && !revealTranslation,
        })}
        onClick={() => {
          onHideTranslation();
          setRevealTranslation(false);
        }}
        type="button"
      >
        {translation}
      </button>
    </div>
  );
};
