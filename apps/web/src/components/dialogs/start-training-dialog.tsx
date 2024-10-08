import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { api } from "~/trpc/react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

const topics: {
  name: string;
  topic: string;
}[] = [
  {
    name: "Travel and Tourism",
    topic:
      "Sentences about exploring new cities, landmarks, and travel experiences.",
  },
  {
    name: "Food and Cooking",
    topic:
      "Conversations around recipes, cooking techniques, and favorite dishes.",
  },
  {
    name: "Sports and Fitness",
    topic: "Training, sports events, workouts, and fitness goals.",
  },
  {
    name: "Technology and Gadgets",
    topic: "Tech trends, gadgets, and innovations in the tech world.",
  },
  {
    name: "Daily Life and Routines",
    topic:
      "Common daily tasks like waking up, going to work, and running errands.",
  },
  {
    name: "Entertainment and Movies",
    topic: "Discussions on favorite movies, TV shows, and entertainment news.",
  },
  {
    name: "Nature and Environment",
    topic:
      "Sentences about landscapes, animals, climate change, and sustainability.",
  },
  {
    name: "Fashion and Style",
    topic: "Conversations on fashion trends, outfits, and personal style.",
  },
  {
    name: "Music and Arts",
    topic: "Exploring musical genres, instruments, and art forms.",
  },
  {
    name: "Work and Careers",
    topic: "Topics about professions, job hunting, and office life.",
  },
  {
    name: "Hobbies and Interests",
    topic:
      "Sentences about various hobbies like reading, painting, or gardening.",
  },
  {
    name: "Social Media and Influencers",
    topic: "Conversations about online trends and content creators.",
  },
  {
    name: "Science and Space",
    topic:
      "Exploring topics related to space exploration, experiments, and discoveries.",
  },
  {
    name: "Health and Wellness",
    topic: "Sentences about diet, mental health, and exercise routines.",
  },
  {
    name: "Relationships and Family",
    topic: "Conversations on friendships, family dynamics, and relationships.",
  },
  {
    name: "Shopping and Retail",
    topic: "Buying clothes, groceries, or online shopping.",
  },
  {
    name: "Education and Learning",
    topic:
      "Sentences focused on schools, universities, and learning new skills.",
  },
  {
    name: "History and Culture",
    topic: "Sentences about historical events, cultures, and traditions.",
  },
  {
    name: "Politics and News",
    topic:
      "Discussions on current events, policies, and international relations.",
  },
  {
    name: "Fantasy and Adventure",
    topic:
      "Fun sentences involving imaginary worlds, mythical creatures, or heroic quests.",
  },
];

export default function StartTrainingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const practiceLanguage = usePracticeLanguageCode();

  const form = useForm<CreateTrainingSessionInput>({
    resolver: zodResolver(createTrainingSessionInput),
    defaultValues: {
      complexity: "A1",
      languageCode: practiceLanguage,
      title: "",
      topic: "",
    },
  });

  const router = useRouter();
  const utils = api.useUtils();
  const practiceLanguagesQuery = api.languages.getPracticeLanguages.useQuery();

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
                      {topics.map((topic) => (
                        <Button
                          variant="outline"
                          size="sm"
                          key={topic.name}
                          onClick={() => form.setValue(field.name, topic.topic)}
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
                {(startTrainingSession.isPending ||
                  startTrainingSession.isSuccess) && (
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
