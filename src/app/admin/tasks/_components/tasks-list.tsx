'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useDebounce } from 'usehooks-ts';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import Link from 'next/link';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';

export default function TasksList() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce<string>(q, 300);
  const tasksQuery = api.admin.searchTasks.useQuery({ q: debouncedQ });
  const { data: isDisabled, refetch } = api.admin.getTasksEnabledStatus.useQuery();
  const disableTasks = api.admin.setTasksEnabledStatus.useMutation();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
  };

  const onClickDisable = async (isDisabled: boolean) => {
    await disableTasks.mutateAsync({ isDisabled });
    await refetch();
  };

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <div>
        <Switch
          autoCorrect="off"
          checked={isDisabled}
          className="mr-2"
          id="toggle-background-tasks"
          onCheckedChange={(val) => void onClickDisable(val)}
        />
        <Label className="relative -top-1 text-sm text-muted-foreground" htmlFor="toggle-background-tasks">
          Disable all background tasks
        </Label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Input className="max-w-sm flex-1" id="search" onChange={onChange} placeholder="Search users…" />
        {tasksQuery.isSuccess ? (
          <p className="text-muted-foreground">{formatNumberWithSuffix(tasksQuery.data.total, 'task')}</p>
        ) : (
          <Skeleton className="h-6 w-32" />
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksQuery.isLoading ? (
              [1, 2, 3, 4].map((x) => {
                return (
                  <TableRow key={x}>
                    {[1, 2, 3, 4].map((y) => (
                      <TableCell key={y}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : tasksQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">{tasksQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : tasksQuery.data.total === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">No users</p>
                </TableCell>
              </TableRow>
            ) : (
              tasksQuery.data.tasks.map((task) => {
                return (
                  <TableRow key={task.name}>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/admin/tasks/${task.name}`}>{`${task.name}(${task.args.join(
                        ', ',
                      )})`}</Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
