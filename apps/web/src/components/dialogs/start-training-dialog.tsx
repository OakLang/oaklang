import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDownIcon,
  Loader2Icon,
  PaintbrushIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ModuleData } from "@acme/core/validators";
import type { CreateTrainingSessionInput } from "@acme/db/validators";
import { COMPLEXITY_LIST, TRAINING_SESSION_TOPICS } from "@acme/core/constants";
import { createTrainingSessionInput } from "@acme/db/validators";

import type { LanguageCodeParams } from "~/types";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import CreateModuleForm from "../forms/create-module-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import AddWordsDialog from "./add-words-dialog";

export default function StartTrainingDialog({
  open,
  onOpenChange,
  words: initWords,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  words?: string[];
}) {
  const [
    showAddWordsToPracticeListDialog,
    setShowAddWordsToPracticeListDialog,
  ] = useState(false);
  const [showCreacteModuleDialog, setShowCreacteModuleDialog] = useState(false);
  const { languageCode } = useParams<LanguageCodeParams>();
  const router = useRouter();

  const form = useForm<CreateTrainingSessionInput>({
    resolver: zodResolver(createTrainingSessionInput),
    defaultValues: {
      title: "",
      topic: "",
      complexity: "A1",
      languageCode,
      words: initWords ?? [],
    },
  });
  const words = form.watch("words");

  const utils = api.useUtils();
  const practiceLanguage = api.languages.getPracticeLanguage.useQuery({
    languageCode,
  });

  const startTrainingSession =
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
    (data: CreateTrainingSessionInput) => {
      startTrainingSession.mutate(data);
    },
    [startTrainingSession],
  );

  const handleCloseDialog = useCallback(() => {
    setShowCreacteModuleDialog(false);
    setShowAddWordsToPracticeListDialog(false);
    form.reset();
    startTrainingSession.reset();
    onOpenChange(false);
  }, [form, onOpenChange, startTrainingSession]);

  const handleRemoveWord = useCallback(
    (word: string) => {
      const words = form.getValues("words");
      form.setValue("words", words?.filter((w) => w !== word) ?? [], {
        shouldValidate: true,
      });
    },
    [form],
  );

  useEffect(() => {
    const tilte = form.getValues("title");
    if (open && !tilte && practiceLanguage.data?.name) {
      form.setValue("title", `Learn ${practiceLanguage.data.name}`, {
        shouldValidate: true,
      });
    }
  }, [form, open, practiceLanguage.data?.name]);

  useEffect(() => {
    const words = form.getValues("words");
    if (open && (!words || words.length === 0) && initWords) {
      form.setValue("words", initWords, { shouldValidate: true });
    }
  }, [form, initWords, open]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new Training Session</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onReset={() => form.reset()}
            className="grid gap-6"
          >
            <Form {...form}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Learning German" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem className="grid w-full">
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type a topic or choose from the list to generate sentences (e.g., Travel, Cooking, Space Exploration...)"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                    <ScrollArea className="max-w-full overflow-x-auto">
                      <div className="flex w-max gap-2 pb-2">
                        {TRAINING_SESSION_TOPICS.map((topic) => (
                          <Button
                            variant="outline"
                            size="sm"
                            key={topic.name}
                            onClick={() => {
                              form.setValue(field.name, topic.topic, {
                                shouldValidate: true,
                              });
                              form.setFocus("topic");
                            }}
                            type="button"
                            className="text-muted-foreground h-8 rounded-full px-3 py-0 text-sm"
                          >
                            {topic.name}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complexity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complexity</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          form.setValue(
                            field.name,
                            value as CreateTrainingSessionInput["complexity"],
                            {
                              shouldValidate: true,
                            },
                          )
                        }
                        {...field}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLEXITY_LIST.map((item) => (
                            <SelectItem value={item} key={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Words</Label>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    {words && words.length > 0 && (
                      <Button
                        type="button"
                        onClick={() => {
                          form.setValue("words", [], { shouldValidate: true });
                        }}
                        className="h-8 w-8"
                        variant="outline"
                        size="icon"
                      >
                        <PaintbrushIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      className="h-8 w-8"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAddWordsToPracticeListDialog(true)}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {words && words.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {words.map((word) => (
                      <div
                        key={word}
                        className="text-muted-foreground flex items-center gap-1 rounded-full border p-1 pl-3 text-sm"
                      >
                        {word}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => handleRemoveWord(word)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground text-sm">No words...</p>
                    <p className="text-muted-foreground text-sm">
                      If no words are provided, we’ll automatically select words
                      from your practice list, tailored to the topic you’ve
                      chosen.
                    </p>
                  </div>
                )}
              </div>

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
                      startTrainingSession.isPending ||
                      startTrainingSession.isSuccess
                    }
                    className="rounded-r-none"
                  >
                    {(startTrainingSession.isPending ||
                      startTrainingSession.isSuccess) && (
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
                          startTrainingSession.isPending ||
                          startTrainingSession.isSuccess
                        }
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          setShowCreacteModuleDialog(true);
                        }}
                      >
                        Save as Module
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogFooter>
            </Form>
          </form>
        </DialogContent>
      </Dialog>

      <AddWordsDialog
        open={showAddWordsToPracticeListDialog}
        onOpenChange={setShowAddWordsToPracticeListDialog}
        action={{
          onClick: (list) => {
            const words = form.getValues("words");
            form.setValue("words", [
              ...new Set([...(words ?? []), ...list.map((word) => word.word)]),
            ]);
            setShowAddWordsToPracticeListDialog(false);
          },
          title: "Add Words",
        }}
      />

      <Dialog
        open={showCreacteModuleDialog}
        onOpenChange={setShowCreacteModuleDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Module</DialogTitle>
          </DialogHeader>
          <CreateModuleForm
            defaultName={form.getValues("title")}
            data={
              {
                type: "exercise-1",
                topic: form.getValues("topic"),
                complexity: form.getValues("complexity"),
                words: form.getValues("words"),
              } satisfies ModuleData
            }
            onSuccess={() => {
              setShowCreacteModuleDialog(false);
              handleCloseDialog();
            }}
          >
            {({ form, isLoading }) => (
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="reset">
                    Cancel
                  </Button>
                </DialogClose>
                <Button disabled={!form.formState.isValid || isLoading}>
                  {isLoading && <Loader2Icon className="-ml-1 mr-2 h-4 w-4" />}
                  Create Module
                </Button>
              </DialogFooter>
            )}
          </CreateModuleForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
