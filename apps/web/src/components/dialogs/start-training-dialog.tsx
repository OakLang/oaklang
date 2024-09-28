import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { CreateTrainingSessionInput } from "@acme/db/validators";
import { COMPLEXITY_LIST } from "@acme/core/constants";
import { createTrainingSessionInput } from "@acme/db/validators";

import { Button } from "~/components/ui/button";
import {
  Dialog,
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
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";

export default function StartTrainingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const practiceLanguage = usePracticeLanguageCode();
  const practiceLanguagesQuery = api.languages.getPracticeLanguages.useQuery();

  const form = useForm<CreateTrainingSessionInput>({
    resolver: zodResolver(createTrainingSessionInput),
    defaultValues: {
      complexity: "A1",
      languageCode: practiceLanguage,
      title: "",
    },
  });

  const router = useRouter();
  const utils = api.useUtils();

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

  useEffect(() => {
    if (practiceLanguagesQuery.isSuccess) {
      form.setValue(
        "title",
        `Learn ${practiceLanguagesQuery.data.find((lang) => lang.code === practiceLanguage)?.name}`,
      );
    }
  }, [
    form,
    practiceLanguage,
    practiceLanguagesQuery.data,
    practiceLanguagesQuery.isSuccess,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a new Training Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
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
              name="languageCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) =>
                        form.setValue(field.name, value)
                      }
                      {...field}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {practiceLanguagesQuery.data?.map((item) => (
                          <SelectItem value={item.code} key={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button disabled={startTrainingSession.isSuccess}>
                {startTrainingSession.isPending && (
                  <Loader2Icon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                )}
                Start Training
              </Button>
            </DialogFooter>
          </Form>
        </form>
      </DialogContent>
    </Dialog>
  );
}
