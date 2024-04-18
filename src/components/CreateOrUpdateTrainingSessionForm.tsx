import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { api } from '~/trpc/client';
import { createTrainingSessionInput } from '~/utils/validators';
import type { CreateTrainingSessionInput } from '~/utils/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Loader2, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { extractComaSeperatedWords } from '~/utils/helpers';
import { useCallback, useRef, useState } from 'react';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import pluralize from 'pluralize';
import { Switch } from './ui/switch';
import type { PublicTrainingSession } from '~/utils/types';
import ExtractWordsAndPhrasesFromParagraphDialog from './ExtractWordsAndPhrasesFromParagraphDialog';

export default function CreateOrUpdateTrainingSessionForm({
  update,
  onSuccess,
}: {
  onSuccess: (session: PublicTrainingSession) => void;
  update?: PublicTrainingSession;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const session = useSession({ required: true });
  const form = useForm<CreateTrainingSessionInput>({
    defaultValues: {
      languageId: 'en',
      numberOfTimesToRepeat: 0,
      numberOfTimesToTrain: 0,
      numberOfWordsToTrain: 0,
      percentKnown: 0,
      relatedPrecursor: false,
      sentenceLength: null,
      ...(update ?? {}),
      words: update ? update.words.map((word) => word.word) : [],
    },
    resolver: zodResolver(createTrainingSessionInput),
  });
  const [wordsInputText, setWordsInputText] = useState('');
  const wordsInputFieldRef = useRef<HTMLInputElement>(null);
  const [showExtractWordsModal, setShowExtractWordsModal] = useState(false);
  const words = form.watch('words');

  const createSessionMut = api.trainingSessions.createTrainingSession.useMutation({
    onError: (error) => {
      toast('Failed to create Training Session', { description: error.message });
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSettled: () => {
      setIsLoading(false);
    },
    onSuccess,
  });
  const updateSessionMut = api.trainingSessions.updateTrainingSession.useMutation({
    onError: (error) => {
      toast('Failed to update Training Session', { description: error.message });
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSettled: () => {
      setIsLoading(false);
    },
    onSuccess,
  });

  const addWords = useCallback(
    (newWords: string[]) => {
      const uniqueWords = newWords.filter((word) => !words.includes(word));
      form.setValue('words', [...words, ...uniqueWords]);
      toast(
        `${uniqueWords.length} new unique ${pluralize('word', uniqueWords.length)} and ${pluralize('phrase', uniqueWords.length)} added to the list.`,
      );
    },
    [form, words],
  );

  const handleExtractWords = useCallback(() => {
    const words = extractComaSeperatedWords(wordsInputText);
    addWords(words);
    setWordsInputText('');
    wordsInputFieldRef.current?.blur();
  }, [addWords, wordsInputText]);

  const handleSubmit = useCallback(
    (data: CreateTrainingSessionInput) => {
      if (update) {
        updateSessionMut.mutate({ ...data, id: update.id });
      } else {
        createSessionMut.mutate(data);
      }
    },
    [createSessionMut, update, updateSessionMut],
  );

  if (session.status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Form {...form}>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="languageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Input placeholder="en" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfTimesToRepeat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of times to repeat</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      form.setValue(field.name, value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfTimesToTrain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of times to train</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      form.setValue(field.name, value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfWordsToTrain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of words to train</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      form.setValue(field.name, value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="percentKnown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percent Known</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.currentTarget.value);
                      form.setValue(field.name, value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="relatedPrecursor"
            render={({ field: { value, onChange: _, ...field } }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Related Precursor</FormLabel>
                <FormControl>
                  <Switch checked={value} onCheckedChange={() => form.setValue(field.name, !value)} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label htmlFor="words-input">
              Words{words.length > 0 ? ` (${words.length.toFixed()} ${pluralize('word', words.length)})` : null}
            </Label>
            <div className="flex flex-wrap gap-2">
              {words.length === 0 ? (
                <p className="text-sm text-muted-foreground">No words...</p>
              ) : (
                words.map((word) => (
                  <Badge key={word} variant="outline">
                    {word}
                    <Button
                      className="-mr-2 ml-0.5 h-6 w-6 rounded-full"
                      onClick={() =>
                        form.setValue(
                          'words',
                          words.filter((w) => w !== word),
                        )
                      }
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
                id="words-input"
                onChange={(e) => setWordsInputText(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.code === 'Enter') {
                    e.preventDefault();
                    handleExtractWords();
                  }
                }}
                placeholder="word1, word2, word3..."
                ref={wordsInputFieldRef}
                value={wordsInputText}
              />
              <Button onClick={handleExtractWords} type="button">
                Add All
              </Button>
            </div>
            <Button className="h-fit p-0" onClick={() => setShowExtractWordsModal(true)} type="button" variant="link">
              Extract words and phrases from paragraph
            </Button>
          </div>
          <Button disabled={isLoading} type="submit">
            {isLoading ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : null}
            {update ? 'Save' : 'Start Session'}
          </Button>
        </form>
      </Form>

      <ExtractWordsAndPhrasesFromParagraphDialog
        onComplete={addWords}
        onOpenChange={setShowExtractWordsModal}
        open={showExtractWordsModal}
      />
    </>
  );
}
