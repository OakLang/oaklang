'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '~/trpc/client';
import { createTrainingSessionInput } from '~/utils/validators';
import type { CreateTrainingSessionInput } from '~/utils/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Checkbox } from '~/components/ui/checkbox';

export default function CreateTrainingSessionPage() {
  const session = useSession({ required: true });
  const form = useForm<CreateTrainingSessionInput>({
    defaultValues: {
      language: 'en',
      numberOfTimesToRepeat: 0,
      numberOfTimesToTrain: 0,
      numberOfWordsToTrain: 0,
      percentKnown: 0,
      relatedPrecursor: false,
      sentenceLength: null,
    },
    resolver: zodResolver(createTrainingSessionInput),
  });
  const router = useRouter();
  const createSessionMut = api.trainingSessions.createTrainingSession.useMutation({
    onError: (error) => {
      toast('Failed to create Training Session', { description: error.message });
    },
    onSuccess: (trainingSession) => {
      router.push(`/training/${trainingSession.id}`);
    },
  });

  if (session.status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div className="container my-16 max-w-screen-sm">
      <h1 className="text-3xl font-bold">Create Training Session</h1>
      <Form {...form}>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((data) => createSessionMut.mutate(data))}>
          <FormField
            control={form.control}
            name="language"
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
              <FormItem>
                <FormLabel>Percent Known</FormLabel>
                <FormControl>
                  <Checkbox checked={value} onCheckedChange={() => form.setValue(field.name, !value)} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={createSessionMut.isPending || createSessionMut.isSuccess} type="submit">
            {createSessionMut.isPending || createSessionMut.isSuccess ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : null}
            Start
          </Button>
        </form>
      </Form>
    </div>
  );
}
