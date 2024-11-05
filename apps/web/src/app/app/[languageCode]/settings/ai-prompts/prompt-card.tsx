"use client";

import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCcw } from "lucide-react";
import { useForm } from "react-hook-form";

import type { Prompt, Prompts } from "@acme/core/validators";
import { prompt } from "@acme/core/validators";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useUserSettings } from "~/providers/user-settings-provider";

export default function PromptCard({
  id,
  title,
  description,
  defaultPrompt,
  keys,
}: {
  id: keyof Prompts;
  title: string;
  description?: string;
  defaultPrompt: string;
  keys?: string[];
}) {
  const { userSettings } = useUserSettings();

  return (
    <Card className="my-16">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <PromptForm
        id={id}
        value={userSettings.prompts[id]}
        defaultPrompt={defaultPrompt}
        keys={keys}
        prompts={userSettings.prompts}
      />
    </Card>
  );
}

const PromptForm = ({
  id,
  value,
  defaultPrompt,
  keys,
  prompts,
}: {
  id: keyof Prompts;
  value?: Prompt | null;
  onChange?: (value: Prompt | null) => void;
  defaultPrompt: string;
  keys?: string[];
  prompts: Prompts;
}) => {
  const form = useForm<Prompt>({
    resolver: zodResolver(prompt),
    defaultValues: value ?? {
      override: false,
      prompt: defaultPrompt,
    },
  });
  const { updateUserSettings } = useUserSettings();

  const handleSubmit = useCallback(
    (data: Prompt) => {
      const newPrompts: Prompts = { ...prompts };
      newPrompts[id] = data;
      updateUserSettings.mutate({ prompts: newPrompts });
      form.reset(data);
    },
    [form, id, prompts, updateUserSettings],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="override"
            render={({ field: { value, ...field } }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Override</FormLabel>
                <FormControl>
                  <Switch
                    {...field}
                    checked={value}
                    onCheckedChange={(newValue) =>
                      form.setValue(field.name, newValue, { shouldDirty: true })
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Prompt</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          form.setValue(field.name, defaultPrompt, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset to Default Prompt</TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <Textarea {...field} rows={16} />
                </FormControl>
                {keys && (
                  <FormDescription>
                    Available Keys: {keys.map((key) => `{${key}}`).join(", ")}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter className="space-x-2">
          <Button
            disabled={!form.formState.isDirty || updateUserSettings.isPending}
          >
            {updateUserSettings.isPending && (
              <Loader2 className="-ml-1 mr-2 animate-spin" />
            )}
            Save
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
};
