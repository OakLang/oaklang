import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { api } from '~/trpc/client';
import { Button } from './ui/button';
import { Loader2, XIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { extractWords } from '~/utils/helpers';
import pluralize from 'pluralize';
import type { TRPCError } from '@trpc/server';

const schema = z.object({
  paragraph: z.string().max(2000),
});

export default function ExtractWordsAndPhrasesFromParagraphDialog({
  onOpenChange,
  open,
  onComplete,
}: {
  onComplete?: (words: string[]) => void;
  onOpenChange?: (value: boolean) => void;
  open?: boolean;
}) {
  const [words, setWords] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      paragraph: '',
    },
    resolver: zodResolver(schema),
  });
  const extractWordsMut = api.ai.extractWords.useMutation();

  const handleSubmit = useCallback(
    async (data: z.infer<typeof schema>) => {
      setIsExtracting(true);
      try {
        const extractedWords = await extractWordsMut.mutateAsync(data.paragraph);
        setWords(extractedWords);
        toast(
          `${extractWords.length} new ${pluralize('word', extractWords.length)} and ${pluralize('phrase', extractWords.length)} extracted from the paragraph`,
        );
      } catch (error: unknown) {
        toast('Failed to extract', { description: (error as TRPCError).message });
      } finally {
        setIsExtracting(false);
      }
    },
    [extractWordsMut],
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extract Words and Phreses from Paragraph</DialogTitle>
        </DialogHeader>
        {words.length === 0 ? (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="paragraph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paragraph</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button disabled={isExtracting}>
                {isExtracting ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : null}
                Extract
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {words.map((word) => (
                <Badge key={word} variant="outline">
                  {word}
                  <Button
                    className="-mr-2 ml-0.5 h-6 w-6 rounded-full"
                    onClick={() => setWords((words) => words.filter((w) => w !== word))}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </Badge>
              ))}
            </div>

            <Button
              onClick={() => {
                onOpenChange?.(false);
                onComplete?.(words);
                setWords([]);
                form.reset();
              }}
            >
              Add Words
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
