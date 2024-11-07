import type { UseFormReturn } from "react-hook-form";
import React, { useCallback, useState } from "react";
import { PlusIcon, TrashIcon, XIcon } from "lucide-react";

import type {
  Exercise1FormData,
  Exercise2FormData,
  Exercise3FormData,
  ExerciseFormData,
} from "@acme/core/validators";
import {
  ALL_EXERCISES,
  COMPLEXITY_LIST,
  Exercises,
  TRAINING_SESSION_TOPICS,
} from "@acme/core/constants";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import AddWordsDialog from "../dialogs/add-words-dialog";
import { Button } from "../ui/button";
import { FieldRequiredIndecator } from "../ui/label";
import NumberInput from "../ui/number-input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

export default function ExerciseDataForm({
  form,
}: {
  form: UseFormReturn<{ exercise: ExerciseFormData }>;
}) {
  const exercise = form.watch("exercise.exercise");
  const learnFrom = form.watch("exercise.data.learnFrom");

  const topicField = useCallback(
    (required?: boolean) => (
      <FormField
        control={form.control}
        name="exercise.data.topic"
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
                      field.onBlur();
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
        name="exercise.data.complexity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Complexity
              {required && <FieldRequiredIndecator />}
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => {
                  form.setValue(
                    field.name,
                    value as Exercise1FormData["data"]["complexity"],
                  );
                  field.onBlur();
                }}
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
        name="exercise.data.words"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Words
              {required && <FieldRequiredIndecator />}
            </FormLabel>
            <FormControl>
              <WordsList
                value={field.value ?? []}
                onChange={(words) => {
                  form.setValue(field.name, words);
                  field.onBlur();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    [form],
  );

  return (
    <>
      <FormField
        control={form.control}
        name="exercise.exercise"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Exercise
              <FieldRequiredIndecator />
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => {
                  form.setValue(
                    field.name,
                    value as ExerciseFormData["exercise"],
                  );
                  field.onBlur();
                }}
                {...field}
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
            name="exercise.data.learnFrom"
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
                      field.onBlur();
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
                name="exercise.data.eachWordPracticeCount"
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
                        onChange={(value) => form.setValue(field.name, value)}
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
                name="exercise.data.numberOfWords"
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
                        onChange={(value) => form.setValue(field.name, value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exercise.data.eachWordPracticeCount"
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
                        onChange={(value) => form.setValue(field.name, value)}
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
                name="exercise.data.numberOfSentences"
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
                        onChange={(value) => form.setValue(field.name, value)}
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
            name="exercise.data.learnFrom"
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
                      field.onBlur();
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
              name="exercise.data.content"
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
              name="exercise.data.numberOfSentences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number Of Sentences</FormLabel>
                  <FormControl>
                    <NumberInput
                      {...field}
                      aria-label={field.name}
                      onChange={(value) => form.setValue(field.name, value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )}
    </>
  );
}

function WordsList({
  onChange,
  value,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
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
}
