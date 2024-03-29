'use client';

import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { LuArrowRight, LuLoader2 } from 'react-icons/lu';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useToast } from '~/components/ui/use-toast';
import { api } from '~/trpc/client';

export default function TaskDetails({ task }: { task: string }) {
  const taskQuery = api.admin.getTask.useQuery(task);
  const execTask = api.admin.executeBackgroundTask.useMutation();
  const [args, setArgs] = useState<(string | undefined)[]>([]);
  const [error, setError] = useState(undefined as string | undefined);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(undefined);

      if (!taskQuery.isSuccess) {
        return;
      }
      if (!task) {
        setError('Task not found');
        return;
      }
      if (args.filter(Boolean).length !== taskQuery.data?.args.length) {
        setError('Please provide all args');
        return;
      }

      setIsLoading(true);

      try {
        await execTask.mutateAsync({ args, task: taskQuery.data.name });
        toast({ title: `${taskQuery.data.name}(${taskQuery.data.args.join(', ')}) task is now running on background` });
      } catch (ex) {
        setError(String(ex));
      } finally {
        setIsLoading(false);
      }
    },
    [taskQuery.isSuccess, taskQuery.data?.args, taskQuery.data?.name, task, args, execTask, toast],
  );

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      {taskQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : taskQuery.isError ? (
        <div className="text-muted-foreground">
          <p>{taskQuery.error.message}</p>
        </div>
      ) : !taskQuery.data ? (
        <div className="text-muted-foreground">
          <p>Repo not found!</p>
        </div>
      ) : (
        <>
          <div>
            <div className="text-lg font-semibold">
              {taskQuery.data.name}({taskQuery.data.args.join(', ')})
            </div>
          </div>

          <hr className="h-px bg-border" />

          <form className="space-y-4" onSubmit={onSubmit}>
            {taskQuery.data.args.map((arg, i) => (
              <fieldset className="space-y-1" key={arg}>
                <Label htmlFor={arg}>{arg}</Label>
                <Input
                  id={arg}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    setError(undefined);
                    setArgs((args) => {
                      const argsCopy = [...args];
                      argsCopy[i] = value ? value : undefined;
                      return argsCopy;
                    });
                  }}
                />
              </fieldset>
            ))}

            <fieldset className="space-y-1">
              <Label htmlFor="preview">Preview</Label>
              <Input
                id="preview"
                readOnly
                value={`${taskQuery.data.name}(${taskQuery.data.args.map((arg, i) => args[i] ?? 'undefined').join(', ')})`}
              />
              {error ? <p className="font-medium text-destructive">{error}</p> : null}
            </fieldset>

            <Button disabled={isLoading} type="submit">
              {isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5" /> : null}
              Run Task
              {!isLoading ? <LuArrowRight className="-mr-1 ml-2 h-5 w-5" /> : null}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
