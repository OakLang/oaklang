'use client';

import type { TrainingSession } from '~/lib/schema';
import { useForm } from 'react-hook-form';
import { api } from '~/trpc/client';
import { updateTrainingSessionInput } from '~/utils/validators';
import type { UpdateTrainingSessionInput } from '~/utils/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Checkbox } from '~/components/ui/checkbox';
import { useRouter } from 'next/navigation';

export default function UpdateTrainingSessionForm({ trainingSession }: { trainingSession: TrainingSession }) {
  const router = useRouter();
  const form = useForm<UpdateTrainingSessionInput>({
    defaultValues: {
      id: trainingSession.id,
      language: trainingSession.language,
      numberOfTimesToRepeat: trainingSession.numberOfTimesToRepeat,
      numberOfTimesToTrain: trainingSession.numberOfTimesToTrain,
      numberOfWordsToTrain: trainingSession.numberOfWordsToTrain,
      percentKnown: trainingSession.percentKnown,
      relatedPrecursor: trainingSession.relatedPrecursor,
      sentenceLength: trainingSession.sentenceLength,
    },
    resolver: zodResolver(updateTrainingSessionInput),
  });
  const updateTrainingSessionMut = api.trainingSessions.updateTrainingSession.useMutation({
    onError: (error) => {
      toast('Failed to update Training Session', { description: error.message });
    },
    onSuccess: () => {
      toast('Updated successfully');
    },
  });
  const deleteTrainingSessionMut = api.trainingSessions.deleteTrainingSession.useMutation({
    onError: (error) => {
      toast('Failed to delete Training Session', { description: error.message });
    },
    onSuccess: () => {
      toast('Updated successfully');
      router.push('/');
    },
  });

  return (
    <div className="container my-16 max-w-screen-sm">
      <h1 className="text-3xl font-bold">Update Training Session</h1>
      <Form {...form}>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((data) => updateTrainingSessionMut.mutate(data))}>
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
          <Button disabled={updateTrainingSessionMut.isPending} type="submit">
            {updateTrainingSessionMut.isPending ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : null}
            Update
          </Button>
          <Button
            disabled={deleteTrainingSessionMut.isPending || deleteTrainingSessionMut.isSuccess}
            onClick={() => deleteTrainingSessionMut.mutate(trainingSession.id)}
            type="button"
            variant="destructive"
          >
            {deleteTrainingSessionMut.isPending || deleteTrainingSessionMut.isSuccess ? (
              <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </Button>
        </form>
      </Form>
    </div>
  );
}
