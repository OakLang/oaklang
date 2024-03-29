'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from 'src/components/shared/Dialog';
import { Button } from 'src/components/ui/button';
import { DialogClose } from 'src/components/ui/dialog';
import { createNewListSchema } from '~/utils/validators';
import type { CreateNewListDto } from '~/utils/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'src/components/ui/form';
import { Input } from 'src/components/ui/input';
import { Textarea } from 'src/components/ui/textarea';
import { useToast } from 'src/components/ui/use-toast';
import { LuLoader2 } from 'react-icons/lu';
import type { TRPCError } from '@trpc/server';
import { Checkbox } from 'src/components/ui/checkbox';
import { api } from '~/trpc/client';

export default function CreateNewListDialog({ children }: { children: ReactNode }) {
  const [showDialog, setShowDialog] = useState(false);
  const form = useForm<CreateNewListDto>({
    defaultValues: {
      description: '',
      isPrivate: false,
      name: '',
    },
    resolver: zodResolver(createNewListSchema),
  });
  const formRef = useRef<HTMLFormElement>(null);
  const createListMut = api.list.createList.useMutation();
  const { toast } = useToast();
  const utils = api.useUtils();

  const handleSubmit = useCallback(
    async (data: CreateNewListDto) => {
      try {
        await createListMut.mutateAsync(data);
        toast({ title: 'List Created' });
        void utils.list.getListsForUser.invalidate();
        form.reset();
        setShowDialog(false);
      } catch (error: unknown) {
        console.error(error);
        toast({ description: (error as TRPCError).message, title: 'Failed to create list', variant: 'destructive' });
      }
    },
    [createListMut, form, toast, utils.list.getListsForUser],
  );

  return (
    <Dialog
      footer={
        <>
          <DialogClose asChild>
            <Button
              disabled={createListMut.isLoading}
              onClick={() => {
                formRef.current?.reset();
              }}
              type="reset"
              variant="secondary"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={createListMut.isLoading}
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
            type="submit"
          >
            {createListMut.isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5" /> : null}
            Create
          </Button>
        </>
      }
      onOpenChange={setShowDialog}
      open={showDialog}
      title="Create a new List"
      trigger={children}
    >
      <Form {...form}>
        <form className="space-y-6 p-6 pt-0" onReset={() => form.reset()} onSubmit={form.handleSubmit(handleSubmit)} ref={formRef}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem className="items-top flex gap-2 space-y-0">
                <div className="grid flex-1 gap-1.5 leading-none">
                  <FormLabel>Make Private</FormLabel>
                  <p className="text-sm text-muted-foreground">When you make a List private, only you can see it.</p>
                </div>
                <FormControl>
                  <Checkbox
                    {...field}
                    checked={field.value}
                    onChange={undefined}
                    onCheckedChange={(checked) => {
                      form.setValue('isPrivate', checked === true);
                    }}
                    value={undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  );
}
