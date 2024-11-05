import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon, TrashIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type {
  CreateTrainingSessoin,
  Exercise1FormData,
  Exercise2FormData,
  Exercise3FormData,
  ModuleData,
} from "@acme/core/validators";
import {
  ALL_EXERCISES,
  COMPLEXITY_LIST,
  Exercises,
  TRAINING_SESSION_TOPICS,
} from "@acme/core/constants";
import { createTrainingSessionSchema } from "@acme/core/validators";

import type { LanguageCodeParams } from "~/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import CreateModuleForm from "../forms/create-module-form";
import { FieldRequiredIndecator } from "../ui/label";
import NumberInput from "../ui/number-input";
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

  const form = useForm<CreateTrainingSessoin>({
    resolver: zodResolver(createTrainingSessionSchema),
    defaultValues: {
      languageCode,
      data: {
        complexity: "A1",
        words: [],
        numberOfSentences: 5,
        numberOfWords: 10,
        eachWordPracticeCount: 2,
      },
    },
  });

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

  const exercise = form.watch("exercise");
  const learnFrom = form.watch("data.learnFrom");

  const topicField = useCallback(
    (required?: boolean) => (
      <FormField
        control={form.control}
        name="data.topic"
        render={({ field }) => (
          <FormItem className="grid w-full">
            <FormLabel>Topic{required && <FieldRequiredIndecator />}</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Type a topic or choose from the list to generate sentences (e.g., Travel, Cooking, Space Exploration...)"
                {...field}
                value={field.value}
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
                      form.setValue(field.name, topic.topic);
                      form.setFocus("data.topic");
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
    ),
    [form],
  );

  const complexityField = useCallback(
    (required?: boolean) => (
      <FormField
        control={form.control}
        name="data.complexity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Complexity
              {required && <FieldRequiredIndecator />}
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) =>
                  form.setValue(
                    field.name,
                    value as Exercise1FormData["data"]["complexity"],
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
    ),
    [form],
  );

  const wordsField = useCallback(
    (required?: boolean) => (
      <FormField
        control={form.control}
        name="data.words"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Words
              {required && <FieldRequiredIndecator />}
            </FormLabel>
            <FormControl>
              <WordsList
                value={field.value ?? []}
                onChange={(words) => form.setValue(field.name, words)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    [form],
  );

  const onSubmit = useCallback(
    (data: CreateTrainingSessoin) => {
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

  useEffect(() => {
    const tilte = form.getValues("title");
    if (open && !tilte && practiceLanguage.data?.name) {
      form.setValue("title", `Learn ${practiceLanguage.data.name}`);
    }
  }, [form, open, practiceLanguage.data?.name]);

  useEffect(() => {
    const exercise = form.getValues("exercise");
    if (exercise === Exercises.exercise1) {
      const words = form.getValues("data.words");
      if (open && (!words || words.length === 0) && initWords) {
        form.setValue("data.words", initWords);
      }
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
            <DialogDescription>
              Select your preferred exercise type and complete the form to
              create a personalized training session tailored to your learning
              goals.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (error) => {
                console.log({ error });
              })}
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

              <FormField
                control={form.control}
                name="exercise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Exercise
                      <FieldRequiredIndecator />
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          form.setValue(
                            field.name,
                            value as CreateTrainingSessoin["exercise"],
                          );
                          form.clearErrors();
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_EXERCISES.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {exercise === Exercises.exercise1 && (
                <>
                  {topicField(true)}
                  {complexityField(true)}
                  {wordsField()}
                </>
              )}

              {exercise === Exercises.exercise2 && (
                <>
                  <FormField
                    control={form.control}
                    name="data.learnFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Learn From
                          <FieldRequiredIndecator />
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              form.setValue(
                                field.name,
                                value as Exercise2FormData["data"]["learnFrom"],
                              );
                              form.clearErrors();
                            }}
                            {...field}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="list-of-words">
                                List of Words
                              </SelectItem>
                              <SelectItem value="number-of-words">
                                Number of Words
                              </SelectItem>
                              <SelectItem value="number-of-sentences">
                                Number of Sentences
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {learnFrom === "list-of-words" && (
                    <>
                      {wordsField(true)}

                      <FormField
                        control={form.control}
                        name="data.eachWordPracticeCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Each Word Practice Count
                              <FieldRequiredIndecator />
                            </FormLabel>
                            <FormControl>
                              <NumberInput
                                {...field}
                                aria-label={field.name}
                                onChange={(value) =>
                                  form.setValue(field.name, value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {complexityField(true)}
                    </>
                  )}

                  {learnFrom === "number-of-words" && (
                    <>
                      <FormField
                        control={form.control}
                        name="data.numberOfWords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Number Of Words
                              <FieldRequiredIndecator />
                            </FormLabel>
                            <FormControl>
                              <NumberInput
                                {...field}
                                aria-label={field.name}
                                onChange={(value) =>
                                  form.setValue(field.name, value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data.eachWordPracticeCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Each Word Practice Count
                              <FieldRequiredIndecator />
                            </FormLabel>
                            <FormControl>
                              <NumberInput
                                {...field}
                                aria-label={field.name}
                                onChange={(value) =>
                                  form.setValue(field.name, value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {topicField(true)}
                      {complexityField(true)}
                    </>
                  )}

                  {learnFrom === "number-of-sentences" && (
                    <>
                      <FormField
                        control={form.control}
                        name="data.numberOfSentences"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Number Of Sentences
                              <FieldRequiredIndecator />
                            </FormLabel>
                            <FormControl>
                              <NumberInput
                                {...field}
                                aria-label={field.name}
                                onChange={(value) =>
                                  form.setValue(field.name, value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {topicField(true)}
                      {complexityField(true)}
                    </>
                  )}
                </>
              )}

              {exercise === Exercises.exercise3 && (
                <>
                  <FormField
                    control={form.control}
                    name="data.learnFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Learn From
                          <FieldRequiredIndecator />
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              form.setValue(
                                field.name,
                                value as Exercise3FormData["data"]["learnFrom"],
                              );
                              form.clearErrors();
                            }}
                            {...field}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="content">Content</SelectItem>
                              <SelectItem value="ask-ai">Ask AI</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {learnFrom === "content" && (
                    <FormField
                      control={form.control}
                      name="data.content"
                      render={({ field }) => (
                        <FormItem className="grid w-full">
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type a paragraph..."
                              {...field}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {learnFrom === "ask-ai" && (
                    <>
                      {topicField(true)}
                      {complexityField(true)}
                    </>
                  )}

                  {learnFrom === "number-of-sentences" && (
                    <FormField
                      control={form.control}
                      name="data.numberOfSentences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number Of Sentences</FormLabel>
                          <FormControl>
                            <NumberInput
                              {...field}
                              aria-label={field.name}
                              onChange={(value) =>
                                form.setValue(field.name, value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="reset">
                    Cancel
                  </Button>
                </DialogClose>

                <div className="flex space-x-px">
                  <Button
                    disabled={
                      startTrainingSession.isPending ||
                      startTrainingSession.isSuccess
                    }
                    // className="rounded-r-none"
                  >
                    {(startTrainingSession.isPending ||
                      startTrainingSession.isSuccess) && (
                      <Loader2Icon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                    )}
                    Start Training
                  </Button>
                  {/* <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        className="rounded-l-none"
                        disabled={
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
                  </DropdownMenu> */}
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AddWordsDialog
        open={showAddWordsToPracticeListDialog}
        onOpenChange={setShowAddWordsToPracticeListDialog}
        action={{
          onClick: (list) => {
            const words = form.getValues("data.words");
            form.setValue("data.words", [
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
                topic: form.getValues("data.topic"),
                complexity: form.getValues("data.complexity"),
                words: form.getValues("data.words"),
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

const WordsList = ({
  onChange,
  value,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) => {
  const [
    showAddWordsToPracticeListDialog,
    setShowAddWordsToPracticeListDialog,
  ] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((word) => (
        <div
          key={word}
          className="text-muted-foreground flex items-center gap-1 rounded-full border p-1 pl-3 text-sm"
        >
          {word}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={() => {
              onChange(value.filter((w) => w !== word));
            }}
            type="button"
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <Button
        onClick={() => setShowAddWordsToPracticeListDialog(true)}
        variant="outline"
        className="text-muted-foreground h-8 rounded-full px-3"
        type="button"
      >
        <PlusIcon className="-ml-1 mr-1.5 h-4 w-4" />
        Add Words
      </Button>

      {value.length > 0 && (
        <Button
          onClick={() => {
            onChange([]);
          }}
          variant="outline"
          className="text-muted-foreground h-8 rounded-full px-3"
          type="button"
        >
          <TrashIcon className="-ml-1 mr-1.5 h-4 w-4" />
          Clear All
        </Button>
      )}

      <AddWordsDialog
        open={showAddWordsToPracticeListDialog}
        onOpenChange={setShowAddWordsToPracticeListDialog}
        action={{
          onClick: (list) => {
            onChange([
              ...new Set([...value, ...list.map((word) => word.word)]),
            ]);
            setShowAddWordsToPracticeListDialog(false);
          },
          title: "Add Words",
        }}
      />
    </div>
  );
};
