import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from 'src/components/shared/Dialog';
import { Button } from 'src/components/ui/button';
import { DialogClose } from 'src/components/ui/dialog';
import { updateListSchema } from '~/utils/validators';
import type { UpdateListDto } from '~/utils/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'src/components/ui/form';
import { Input } from 'src/components/ui/input';
import { Textarea } from 'src/components/ui/textarea';
import { useToast } from 'src/components/ui/use-toast';
import type { TRPCError } from '@trpc/server';
import { Checkbox } from 'src/components/ui/checkbox';
import type { PublicList } from '~/utils/types';
import { useRouter } from 'next/navigation';
import { LuLoader2 } from 'react-icons/lu';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function EditListDialog({ children, list }: { children: ReactNode; list: PublicList }) {
  const { currentUser } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const form = useForm<UpdateListDto>({
    defaultValues: {
      description: list.description ?? undefined,
      id: list.id,
      isPrivate: list.isPrivate,
      name: list.name,
    },
    resolver: zodResolver(updateListSchema),
  });
  const formRef = useRef<HTMLFormElement>(null);
  const updateListMut = api.list.updateList.useMutation();
  const deleteListMut = api.list.deleteList.useMutation();
  const { toast } = useToast();
  const utils = api.useUtils();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (data: UpdateListDto) => {
      try {
        await updateListMut.mutateAsync(data);
        toast({ title: 'List Created' });
        void utils.list.getList.invalidate({ listId: list.id });
        setShowDialog(false);
      } catch (error: unknown) {
        console.error(error);
        toast({ description: (error as TRPCError).message, title: 'Failed to create list', variant: 'destructive' });
      }
    },
    [updateListMut, toast, utils.list.getList, list.id],
  );

  const handleDeleteList = useCallback(async () => {
    try {
      await deleteListMut.mutateAsync({ listId: list.id });
      toast({ title: 'List deleted' });
      void router.push(`/${currentUser?.username}/lists`);
    } catch (error: unknown) {
      toast({ description: (error as TRPCError).message, title: 'Failed to delete list', variant: 'destructive' });
    }
  }, [currentUser?.username, deleteListMut, list.id, router, toast]);

  useEffect(() => {
    form.setValue('id', list.id);
    form.setValue('name', list.name);
    form.setValue('description', list.description ?? undefined);
    form.setValue('isPrivate', list.isPrivate);
  }, [form, list.description, list.id, list.isPrivate, list.name]);

  return (
    <Dialog onOpenChange={setShowDialog} open={showDialog} title="Edit List" trigger={children}>
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
          <div className="space-y-4">
            <Button className="w-full" type="submit">
              Update List
            </Button>
            <Dialog
              description="This can’t be undone and you’ll lose your List."
              footer={
                <>
                  <DialogClose>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button disabled={deleteListMut.isLoading} onClick={() => handleDeleteList()} type="button" variant="destructive">
                    {deleteListMut.isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : null}
                    Delete
                  </Button>
                </>
              }
              title="Delete List?"
              trigger={
                <Button className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" type="button" variant="ghost">
                  Delete List
                </Button>
              }
            />
          </div>
        </form>
      </Form>
    </Dialog>
  );
}
