import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDownIcon,
  Loader2Icon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ModuleData } from "@acme/core/validators";
import {
  COMPLEXITY_LIST,
  Exercises,
  EXERCISES,
  TRAINING_SESSION_TOPICS,
} from "@acme/core/constants";

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
import NumberInput from "../ui/number-input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import AddWordsDialog from "./add-words-dialog";

const baseSchema = z.object({
  title: z.string().min(1, "title required"),
  languageCode: z.string().min(1, "languageCode required"),
});

const exercise1Schema = z.object({
  exercise: z.literal(Exercises.exercies1),
  data: z.object({
    topic: z.string().min(1, "Topic is required").max(300),
    complexity: z.enum(COMPLEXITY_LIST),
    words: z.array(z.string()).optional(),
  }),
});

type Exercise1FormData = z.infer<typeof exercise1Schema>;

const exercise2Schema = z.object({
  exercise: z.literal(Exercises.exercies2),
  data: z.discriminatedUnion("learnFrom", [
    z.object({
      learnFrom: z.literal("list-of-words"),
      words: z.array(z.string()).min(1, "Minimum 1 words required").max(50),
    }),
    z.object({
      learnFrom: z.literal("number-of-words"),
      numberOfWords: z
        .number({ message: "Number of words required" })
        .int()
        .min(1)
        .max(50),
    }),
    z.object({
      learnFrom: z.literal("number-of-sentences"),
      numberOfSentences: z
        .number({ message: "Number of sentences required" })
        .int()
        .min(1)
        .max(50),
    }),
  ]),
});

type Exercise2FormData = z.infer<typeof exercise2Schema>;

const exercise3Schema = z.object({
  exercise: z.literal(Exercises.exercies3),
  data: z.discriminatedUnion("learnFrom", [
    z.object({
      learnFrom: z.literal("content"),
      content: z.string().min(1).max(1000),
    }),
    z.object({
      learnFrom: z.literal("ask-ai"),
      topic: z.string().min(1).max(300),
    }),
  ]),
});

type Exercise3FormData = z.infer<typeof exercise3Schema>;

const schema = z
  .discriminatedUnion("exercise", [
    exercise1Schema,
    exercise2Schema,
    exercise3Schema,
  ])
  .and(baseSchema);

type FormData = z.infer<typeof schema>;

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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      languageCode,
      exercise: Exercises.exercies1,
      data: {
        complexity: "A1",
        topic: "",
        words: [],
      },
    },
  });

  const exercise = form.getValues("exercise");

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

  const onSubmit = useCallback((data: FormData) => {
    // startTrainingSession.mutate(data);
    console.log({ data });
  }, []);

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
      form.setValue("title", `Learn ${practiceLanguage.data.name}`, {
        shouldValidate: true,
      });
    }
  }, [form, open, practiceLanguage.data?.name]);

  useEffect(() => {
    const exercise = form.getValues("exercise");
    if (exercise === Exercises.exercies1) {
      const words = form.getValues("data.words");
      if (open && (!words || words.length === 0) && initWords) {
        form.setValue("data.words", initWords, { shouldValidate: true });
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
                name="exercise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          console.log(value);
                          form.setValue(
                            field.name,
                            value as FormData["exercise"],
                            { shouldValidate: true },
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXERCISES.map((exercise) => (
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

              {exercise === Exercises.exercies1 && (
                <>
                  <FormField
                    control={form.control}
                    name="data.topic"
                    render={({ field }) => (
                      <FormItem className="grid w-full">
                        <FormLabel>Topic</FormLabel>
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
                                  form.setValue(field.name, topic.topic, {
                                    shouldValidate: true,
                                  });
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

                  <FormField
                    control={form.control}
                    name="data.complexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complexity</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              form.setValue(
                                field.name,
                                value as Exercise1FormData["data"]["complexity"],
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

                  <FormField
                    control={form.control}
                    name="data.words"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Words</FormLabel>
                        <FormControl>
                          <WordsList
                            value={field.value ?? []}
                            onChange={(words) =>
                              form.setValue(field.name, words, {
                                shouldValidate: true,
                              })
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {exercise === Exercises.exercies2 && (
                <>
                  <FormField
                    control={form.control}
                    name="data.learnFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learn From</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              form.setValue(
                                field.name,
                                value as Exercise2FormData["data"]["learnFrom"],
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

                  {form.getValues("data.learnFrom") === "list-of-words" && (
                    <FormField
                      control={form.control}
                      name="data.words"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Words</FormLabel>
                          <FormControl>
                            <WordsList
                              value={field.value ?? []}
                              onChange={(words) =>
                                form.setValue(field.name, words, {
                                  shouldValidate: true,
                                })
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.getValues("data.learnFrom") === "number-of-words" && (
                    <FormField
                      control={form.control}
                      name="data.numberOfWords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number Of Words</FormLabel>
                          <FormControl>
                            <NumberInput
                              {...field}
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

                  {form.getValues("data.learnFrom") ===
                    "number-of-sentences" && (
                    <FormField
                      control={form.control}
                      name="data.numberOfSentences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number Of Sentences</FormLabel>
                          <FormControl>
                            <NumberInput
                              {...field}
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

              {exercise === Exercises.exercies3 && (
                <>
                  <FormField
                    control={form.control}
                    name="data.learnFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learn From</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              form.setValue(
                                field.name,
                                value as Exercise3FormData["data"]["learnFrom"],
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
                              <SelectItem value="content">Content</SelectItem>
                              <SelectItem value="ask-ai">Ask AI</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.getValues("data.learnFrom") === "content" && (
                    <FormField
                      control={form.control}
                      name="data.content"
                      render={({ field }) => (
                        <FormItem className="grid w-full">
                          <FormLabel>Topic</FormLabel>
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

                  {form.getValues("data.learnFrom") === "ask-ai" && (
                    <FormField
                      control={form.control}
                      name="data.topic"
                      render={({ field }) => (
                        <FormItem className="grid w-full">
                          <FormLabel>Topic</FormLabel>
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
                                    form.setValue(field.name, topic.topic, {
                                      shouldValidate: true,
                                    });
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
                  )}

                  {form.getValues("data.learnFrom") ===
                    "number-of-sentences" && (
                    <FormField
                      control={form.control}
                      name="data.numberOfSentences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number Of Sentences</FormLabel>
                          <FormControl>
                            <NumberInput
                              {...field}
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
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <Button
        onClick={() => setShowAddWordsToPracticeListDialog(true)}
        variant="outline"
        className="text-muted-foreground h-8 rounded-full px-3"
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
