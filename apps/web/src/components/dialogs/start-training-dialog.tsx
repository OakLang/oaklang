import type { DialogProps } from "@radix-ui/react-dialog";
import type { UseFormReturn } from "react-hook-form";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type {
  CreateTrainingSessoin,
  ExerciseFormData,
} from "@acme/core/validators";
import { createTrainingSessionSchema } from "@acme/core/validators";

import type { UseDialogHookValue } from "./types";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { usePracticeLanguage } from "~/providers/practice-language-provider";
import { api } from "~/trpc/react";
import ExerciseDataForm from "../forms/exercise-data-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FieldRequiredIndecator } from "../ui/label";
import AddWordsDialog from "./add-words-dialog";
import { useCreateModuleDialog } from "./create-module-dialog";

export type StartTrainingSessionDialogProps = Omit<DialogProps, "children"> & {
  words?: string[];
};

export default function StartTrainingSessionDialog({
  words,
  ...props
}: StartTrainingSessionDialogProps) {
  return (
    <>
      <Dialog {...props}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new Training Session</DialogTitle>
            <DialogDescription>
              Select your preferred exercise type and complete the form to
              create a personalized training session tailored to your learning
              goals.
            </DialogDescription>
          </DialogHeader>
          <CreateTrainingSessionForm initialWords={words} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateTrainingSessionForm({
  initialWords,
}: {
  initialWords?: string[];
}) {
  const { language } = usePracticeLanguage();

  const [
    showAddWordsToPracticeListDialog,
    setShowAddWordsToPracticeListDialog,
  ] = useState(false);

  const [
    CreateModuleDialog,
    _createModuleDialogOpen,
    setCreateModuleDialogOpen,
  ] = useCreateModuleDialog();

  const router = useRouter();

  const form = useForm<CreateTrainingSessoin>({
    resolver: zodResolver(createTrainingSessionSchema),
    defaultValues: {
      title: `Learn ${language.name}`,
      languageCode: language.code,
      exercise: {
        data: {
          complexity: "A1",
          words: initialWords ?? [],
          numberOfSentences: 5,
          numberOfWords: 10,
          eachWordPracticeCount: 2,
        },
      },
    },
  });

  const title = form.watch("title");
  const exercise = form.watch("exercise");

  const utils = api.useUtils();

  const createTrainingSessionMut =
    api.trainingSessions.createTrainingSession.useMutation({
      onSuccess: (data) => {
        void utils.trainingSessions.getTrainingSessions.invalidate({
          languageCode: data.languageCode,
        });
        router.push(`/app/${data.languageCode}/training/${data.id}`);
      },
      onError: (error) => {
        toast("Faield to create a new training session", {
          description: error.message,
        });
      },
    });

  const onSubmit = useCallback(
    (data: CreateTrainingSessoin) => {
      createTrainingSessionMut.mutate(data);
    },
    [createTrainingSessionMut],
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onReset={() => form.reset()}
        className="grid gap-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title
                <FieldRequiredIndecator />
              </FormLabel>
              <FormControl>
                <Input placeholder="Learning German" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ExerciseDataForm
          form={
            form as unknown as UseFormReturn<{ exercise: ExerciseFormData }>
          }
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" type="reset">
              Cancel
            </Button>
          </DialogClose>

          <div className="flex space-x-px">
            <Button
              disabled={
                !form.formState.isValid ||
                createTrainingSessionMut.isPending ||
                createTrainingSessionMut.isSuccess
              }
              className="rounded-r-none"
            >
              {(createTrainingSessionMut.isPending ||
                createTrainingSessionMut.isSuccess) && (
                <Loader2Icon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
              )}
              Start Training
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="rounded-l-none"
                  disabled={
                    !form.formState.isValid ||
                    createTrainingSessionMut.isPending ||
                    createTrainingSessionMut.isSuccess
                  }
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setCreateModuleDialogOpen(true);
                  }}
                >
                  Save as Module
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogFooter>
      </form>

      <AddWordsDialog
        open={showAddWordsToPracticeListDialog}
        onOpenChange={setShowAddWordsToPracticeListDialog}
        action={{
          onClick: (list) => {
            const words = form.getValues("exercise.data.words");
            form.setValue("exercise.data.words", [
              ...new Set([...(words ?? []), ...list.map((word) => word.word)]),
            ]);
            setShowAddWordsToPracticeListDialog(false);
          },
          title: "Add Words",
        }}
      />

      <CreateModuleDialog
        name={title}
        exercise={
          {
            exercise: exercise.exercise,
            data: exercise.data,
          } as ExerciseFormData
        }
        onCreated={() => {
          setCreateModuleDialogOpen(false);
          toast("Module Created");
        }}
      />
    </Form>
  );
}

export function useStartTrainingSessionDialog(): UseDialogHookValue<StartTrainingSessionDialogProps> {
  const [open, setOpen] = useState(false);

  const Dialog = useCallback(
    (props: StartTrainingSessionDialogProps) => (
      <StartTrainingSessionDialog
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    ),
    [open],
  );

  return [Dialog, open, setOpen];
}
