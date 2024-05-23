import React, { useCallback, useId, useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import pluralize from 'pluralize';
import { Badge } from './ui/badge';
import { XIcon } from 'lucide-react';
import ExtractLexicondsAndPhrasesFromParagraphDialog from './ExtractWordsAndPhrasesFromParagraphDialog';

export default function WordsList({ words, onWordsChange }: { onWordsChange: (words: string[]) => void; words: string[] }) {
  const [input, setInput] = useState('');
  const [showExtractWordsModal, setShowExtractWordsModal] = useState(false);
  const id = useId();

  const handleAddWrods = useCallback(
    (newWords: string[]) => {
      const uniqueWords = newWords.filter((w) => !words.includes(w));
      onWordsChange([...words, ...uniqueWords]);
    },
    [onWordsChange, words],
  );

  const handleAddAll = useCallback(() => {
    const newWords = input.split(',').map((e) => e.trim());
    handleAddWrods(newWords);
    setInput('');
  }, [handleAddWrods, input]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Wrods{words.length > 0 ? ` (${words.length.toFixed()} ${pluralize('word', words.length)})` : null}</Label>
      <div className="flex flex-wrap gap-2">
        {words.length === 0 ? (
          <p className="text-sm text-muted-foreground">No words...</p>
        ) : (
          words.map((word) => (
            <Badge key={word} variant="outline">
              {word}
              <Button
                className="-mr-2 ml-0.5 h-6 w-6 rounded-full"
                onClick={() => {
                  onWordsChange(words.filter((w) => w !== word));
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          className="flex-1"
          id={id}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              e.preventDefault();
              handleAddAll();
            }
          }}
          placeholder="Dog, Cat, Piece of cake, ..."
          value={input}
        />
        <Button onClick={handleAddAll} type="button">
          Add All
        </Button>
      </div>
      {/* <Button className="h-fit p-0" onClick={() => setShowExtracLexiconsModal(true)} type="button" variant="link">
        Extract words from paragraph
      </Button> */}

      <ExtractLexicondsAndPhrasesFromParagraphDialog
        onComplete={handleAddWrods}
        onOpenChange={setShowExtractWordsModal}
        open={showExtractWordsModal}
      />
    </div>
  );
}
