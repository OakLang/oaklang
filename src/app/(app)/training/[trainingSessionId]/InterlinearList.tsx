import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu';
import { cn } from '~/utils';

type InterlinearListItem = { language: string; pronunciation: string; text: string; translation: string };
const paragraph: InterlinearListItem[] = [
  {
    language: 'Spanish',
    pronunciation: 'lah vee-dah',
    text: 'La vida',
    translation: 'The life',
  },
  {
    language: 'Spanish',
    pronunciation: 'ehs',
    text: 'es',
    translation: 'is',
  },
  {
    language: 'Spanish',
    pronunciation: 'oo-nah',
    text: 'una',
    translation: 'a/an',
  },
  {
    language: 'Spanish',
    pronunciation: 'ah-ven-too-rah',
    text: 'aventura',
    translation: 'adventure',
  },
  {
    language: 'Spanish',
    pronunciation: 'fah-see-nahn-teh',
    text: 'fascinante',
    translation: 'fascinating',
  },
  {
    language: 'Spanish',
    pronunciation: 'yeh-nah',
    text: 'llena',
    translation: 'full',
  },
  {
    language: 'Spanish',
    pronunciation: 'deh',
    text: 'de',
    translation: 'of',
  },
  {
    language: 'Spanish',
    pronunciation: 'sohr-preh-sahs',
    text: 'sorpresas',
    translation: 'surprises',
  },
  {
    language: 'Spanish',
    pronunciation: 'ee',
    text: 'y',
    translation: 'and',
  },
  {
    language: 'Spanish',
    pronunciation: 'deh-sah-fee-ohs',
    text: 'desafíos',
    translation: 'challenges',
  },
  {
    language: 'Spanish',
    pronunciation: 'kah-dah',
    text: 'Cada',
    translation: 'Each',
  },
  {
    language: 'Spanish',
    pronunciation: 'dee-ah',
    text: 'día',
    translation: 'day',
  },
  {
    language: 'Spanish',
    pronunciation: 'nohs',
    text: 'nos',
    translation: 'us',
  },
  {
    language: 'Spanish',
    pronunciation: 'oh-freh-seh',
    text: 'ofrece',
    translation: 'offers',
  },
  {
    language: 'Spanish',
    pronunciation: 'nweh-bahs',
    text: 'nuevas',
    translation: 'new',
  },
  {
    language: 'Spanish',
    pronunciation: 'oh-pohr-too-nee-dah-dehs',
    text: 'oportunidades',
    translation: 'opportunities',
  },
  {
    language: 'Spanish',
    pronunciation: 'pah-rah',
    text: 'para',
    translation: 'to',
  },
  {
    language: 'Spanish',
    pronunciation: 'kreh-sehr',
    text: 'crecer',
    translation: 'grow',
  },
  {
    language: 'Spanish',
    pronunciation: 'ee',
    text: 'y',
    translation: 'and',
  },
  {
    language: 'Spanish',
    pronunciation: 'ah-prehn-dehr',
    text: 'aprender',
    translation: 'learn',
  },
  {
    language: 'Spanish',
    pronunciation: 'ehs',
    text: 'Es',
    translation: 'It is',
  },
  {
    language: 'Spanish',
    pronunciation: 'eem-por-tahn-teh',
    text: 'importante',
    translation: 'important',
  },
  {
    language: 'Spanish',
    pronunciation: 'mahn-teh-nehr',
    text: 'mantener',
    translation: 'to maintain',
  },
  {
    language: 'Spanish',
    pronunciation: 'oo-nah',
    text: 'una',
    translation: 'a/an',
  },
  {
    language: 'Spanish',
    pronunciation: 'ahk-tee-tood',
    text: 'actitud',
    translation: 'attitude',
  },
  {
    language: 'Spanish',
    pronunciation: 'poh-see-tee-vah',
    text: 'positiva',
    translation: 'positive',
  },
  {
    language: 'Spanish',
    pronunciation: 'ahn-teh',
    text: 'ante',
    translation: 'towards',
  },
  {
    language: 'Spanish',
    pronunciation: 'lohs',
    text: 'los',
    translation: 'the',
  },
  {
    language: 'Spanish',
    pronunciation: 'reh-tohs',
    text: 'retos',
    translation: 'challenges',
  },
  {
    language: 'Spanish',
    pronunciation: 'keh',
    text: 'que',
    translation: 'that',
  },
  {
    language: 'Spanish',
    pronunciation: 'seh',
    text: 'se',
    translation: 'themselves',
  },
  {
    language: 'Spanish',
    pronunciation: 'nohs',
    text: 'nos',
    translation: 'us',
  },
  {
    language: 'Spanish',
    pronunciation: 'preh-sehn-tahn',
    text: 'presentan',
    translation: 'arise',
  },
  {
    language: 'Spanish',
    pronunciation: 'ah-oon-keh',
    text: 'Aunque',
    translation: 'Although',
  },
  {
    language: 'Spanish',
    pronunciation: 'ah',
    text: 'a',
    translation: 'at',
  },
  {
    language: 'Spanish',
    pronunciation: 'veh-sehs',
    text: 'veces',
    translation: 'times',
  },
  {
    language: 'Spanish',
    pronunciation: 'pweh-dah',
    text: 'pueda',
    translation: 'may',
  },
  {
    language: 'Spanish',
    pronunciation: 'pah-reh-sehr',
    text: 'parecer',
    translation: 'seem',
  },
  {
    language: 'Spanish',
    pronunciation: 'dee-fees-eel',
    text: 'difícil',
    translation: 'difficult',
  },
  {
    language: 'Spanish',
    pronunciation: 'see-ehm-preh',
    text: 'siempre',
    translation: 'always',
  },
  {
    language: 'Spanish',
    pronunciation: 'ah-oon-ah',
    text: 'hay',
    translation: 'there is',
  },
  {
    language: 'Spanish',
    pronunciation: 'oo-nah',
    text: 'una',
    translation: 'a/an',
  },
  {
    language: 'Spanish',
    pronunciation: 'soh-loo-see-ohn',
    text: 'solución',
    translation: 'solution',
  },
  {
    language: 'Spanish',
    pronunciation: 'loh',
    text: 'Lo',
    translation: 'The',
  },
  {
    language: 'Spanish',
    pronunciation: 'eem-por-tahn-teh',
    text: 'importante',
    translation: 'important',
  },
  {
    language: 'Spanish',
    pronunciation: 'ehs',
    text: 'es',
    translation: 'is',
  },
  {
    language: 'Spanish',
    pronunciation: 'mahn-teh-nehr',
    text: 'mantener',
    translation: 'to maintain',
  },
  {
    language: 'Spanish',
    pronunciation: 'lah',
    text: 'la',
    translation: 'the',
  },
  {
    language: 'Spanish',
    pronunciation: 'ehs-peh-rahn-sah',
    text: 'esperanza',
    translation: 'hope',
  },
  {
    language: 'Spanish',
    pronunciation: 'ee',
    text: 'y',
    translation: 'and',
  },
  {
    language: 'Spanish',
    pronunciation: 'seh-geer',
    text: 'seguir',
    translation: 'to follow/to continue',
  },
  {
    language: 'Spanish',
    pronunciation: 'ah-deh-lahn-teh',
    text: 'adelante',
    translation: 'forward',
  },
  {
    language: 'Spanish',
    pronunciation: 'kohn',
    text: 'con',
    translation: 'with',
  },
  {
    language: 'Spanish',
    pronunciation: 'deh-tehr-mee-nah-syohn',
    text: 'determinación',
    translation: 'determination',
  },
];

export default function InterlinearList() {
  const [interlinearList] = useState(paragraph);
  const [knownLexicons, setLexicons] = useState<string[]>([]);

  const hideWord = useCallback(
    (word: string) => {
      if (!knownLexicons.includes(word)) {
        setLexicons([...knownLexicons, word]);
      }
    },
    [knownLexicons],
  );

  const showWords = useCallback(
    (lexicons: string[]) => {
      setLexicons(knownLexicons.filter((l) => !lexicons.includes(l)));
    },
    [knownLexicons],
  );

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6">
      {interlinearList.map((item) => (
        <div className="flex flex-col" key={item.text}>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button
                className="block text-left text-xl font-medium"
                onClick={() => showWords([item.pronunciation, item.translation])}
                type="button"
              >
                {item.text}
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
                      title: item.text,
                    },
                  }}
                  rel="noopener nofollow"
                  target="_blank"
                >
                  Search Wiktionary for &apos;{item.text}&apos;
                </Link>
              </ContextMenuItem>
              <ContextMenuItem>More Practice</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <button
            className={cn('block text-left text-muted-foreground transition-opacity', {
              'pointer-events-none opacity-0': knownLexicons.includes(item.pronunciation),
            })}
            onClick={() => hideWord(item.pronunciation)}
            type="button"
          >
            {item.pronunciation}
          </button>
          <button
            className={cn('block text-left text-muted-foreground transition-opacity', {
              'pointer-events-none opacity-0': knownLexicons.includes(item.translation),
            })}
            onClick={() => hideWord(item.translation)}
            type="button"
          >
            {item.translation}
          </button>
        </div>
      ))}
    </div>
  );
}
