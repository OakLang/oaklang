import type { DialogProps } from "@radix-ui/react-dialog";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCError } from "@trpc/server";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { wordColumnEnum } from "@acme/api/validators";

import type { RouterInputs } from "~/trpc/react";
import { usePracticeLanguage } from "~/providers/practice-language-provider";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";

export type ExportWordsDialogProps = Omit<DialogProps, "children"> & {
  title?: string;
  description?: string;
};

type WordColumn = keyof typeof wordColumnEnum.Values;

const columns: { id: WordColumn; title: string }[] = [
  { id: "word", title: "Word" },
  { id: "wordId", title: "Word Id" },
  { id: "createdAt", title: "Created At" },
  { id: "createdFromId", title: "Created From Id" },
  { id: "knownAt", title: "Known At" },
  { id: "knownFromId", title: "Known From Id" },
  { id: "lastSeenAt", title: "Last Seen At" },
  { id: "seenCount", title: "Seen Count" },
  { id: "lastPracticedAt", title: "Last Practiced At" },
  { id: "practiceCount", title: "Practiced Count" },
  {
    id: "seenCountSinceLastPracticed",
    title: "Seen Count Since Last Practiced",
  },
  { id: "nextPracticeAt", title: "Next Practice At" },
  { id: "hideLines", title: "Hide Lines" },
  { id: "markedUnknownCount", title: "Marked Unknown Count" },
  { id: "lastMarkedUnknownAt", title: "Last Marked Unknown At" },
  { id: "dissableHideLinesCount", title: "Dissable Hide Lines Count" },
  { id: "lastDissabledHideLinesAt", title: "Last Dissable Hide Lines At" },
];

const defaultColumns: WordColumn[] = [
  "word",
  "wordId",
  "createdAt",
  "createdFromId",
  "knownAt",
  "knownFromId",
  "lastSeenAt",
  "seenCount",
  "lastPracticedAt",
  "practiceCount",
  "seenCountSinceLastPracticed",
  "nextPracticeAt",
  "hideLines",
  "markedUnknownCount",
  "lastMarkedUnknownAt",
  "dissableHideLinesCount",
  "lastDissabledHideLinesAt",
];

const schema = z.object({
  columns: z.array(wordColumnEnum),
  applyCurrentFilters: z.boolean(),
});

export default function ExportWordsDialog({
  title = "Export Words",
  description = "Export words to a CSV file",
  ...props
}: ExportWordsDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { language } = usePracticeLanguage();
  const searchParams = useSearchParams();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      columns: defaultColumns,
      applyCurrentFilters: true,
    },
  });
  const exportUserWordsAsCSVMut = api.words.exportUserWordsAsCSV.useMutation();

  const handleExport = useCallback(
    async (data: z.infer<typeof schema>) => {
      const exportWordsToast = toast("Exporting words...", {
        dismissible: false,
      });
      try {
        setIsExporting(true);
        const filter = searchParams.get("filter") ?? undefined;
        const search = searchParams.get("search") ?? undefined;

        const csv = await exportUserWordsAsCSVMut.mutateAsync({
          columns: data.columns.length > 0 ? data.columns : defaultColumns,
          languageCode: language.code,
          filter: data.applyCurrentFilters
            ? (filter as RouterInputs["words"]["exportUserWordsAsCSV"]["filter"])
            : "all",
          search: data.applyCurrentFilters ? search : undefined,
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Oaklang Words Export - ${new Date().toISOString()}.csv`;
        a.click();
        toast("Exported successfully");
        props.onOpenChange?.(false);
      } catch (error) {
        if (error instanceof TRPCError) {
          toast(error.message);
        } else {
          toast("Failed to export words");
        }
      } finally {
        toast.dismiss(exportWordsToast);
        setIsExporting(false);
      }
    },
    [exportUserWordsAsCSVMut, language.code, props, searchParams],
  );

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleExport)}
            className="grid gap-6"
          >
            <FormField
              control={form.control}
              name="columns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Columns</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {columns.map((column) => (
                      <div key={column.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`checkbox-${column.id}`}
                          checked={field.value.includes(column.id)}
                          onCheckedChange={(value) => {
                            form.setValue(
                              field.name,
                              value
                                ? [...field.value, column.id]
                                : field.value.filter((id) => id !== column.id),
                            );
                          }}
                        />
                        <Label htmlFor={`checkbox-${column.id}`}>
                          {column.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="applyCurrentFilters"
              render={({ field: { value, ...field } }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Apply all current filters</FormLabel>
                  <FormControl>
                    <Switch
                      {...field}
                      checked={value}
                      onCheckedChange={(newValue) =>
                        form.setValue(field.name, newValue)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button disabled={isExporting}>
              {isExporting && (
                <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
              )}
              Export Words
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function useExportWordsDialog(): [
  (
    props: Omit<ExportWordsDialogProps, "open" | "onOpenChange" | "children">,
  ) => React.JSX.Element,
  boolean,
  Dispatch<SetStateAction<boolean>>,
] {
  const [open, setOpen] = useState(false);

  const Dialog = useCallback(
    (
      props: Omit<ExportWordsDialogProps, "open" | "onOpenChange" | "children">,
    ) => <ExportWordsDialog {...props} open={open} onOpenChange={setOpen} />,
    [open],
  );

  return [Dialog, open, setOpen];
}
