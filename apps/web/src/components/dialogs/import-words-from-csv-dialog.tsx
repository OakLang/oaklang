import type { DialogProps } from "@radix-ui/react-dialog";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { ArrowRightIcon, Loader2Icon, UploadIcon } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { cn } from "~/utils";
import SimpleSelect from "../simple-select";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type ImportWordsFromCsvDialogProps = DialogProps & {
  title?: string;
  description?: string;
};

const columns = [
  { id: "word", title: "Word", required: true },
  { id: "knownAt", title: "Known At", required: false },
  { id: "seenCount", title: "Seen Count", required: false },
  { id: "hideLines", title: "Hide Lines", required: false },
  { id: "practiceCount", title: "Practice Count", required: false },
] as const;

const defaultColumnMapping: Record<
  (typeof columns)[number]["id"],
  string | undefined
> = {
  hideLines: undefined,
  knownAt: undefined,
  practiceCount: undefined,
  seenCount: undefined,
  word: undefined,
};

export default function ImportWordsFromCsvDialog({
  title = "Import Words",
  description = "Import words from a CSV file",
  ...props
}: ImportWordsFromCsvDialogProps) {
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileColumns, setFileColumns] = useState<string[] | null>(null);
  const [fileData, setFileData] = useState<Record<string, string>[] | null>(
    null,
  );
  const utils = api.useUtils();
  const addUserWordsMut = api.words.addUserWords.useMutation({
    onSuccess: () => {
      void utils.words.getUserWords.invalidate({ languageCode });
      toast("Words imported successfully");
      props.onOpenChange?.(false);
    },
    onError: (error) => {
      toast("Failed to upload words", { description: error.message });
    },
  });
  const { languageCode } = useParams<{ languageCode: string }>();

  const [columnMapping, setColumnMapping] = useState(defaultColumnMapping);

  const parseCSVFile = useCallback((file: File) => {
    setIsParsingFile(true);
    Papa.parse(file, {
      complete: (result) => {
        if (result.data.length < 2) {
          toast("CSV file must have at least 2 rows");
          setFileColumns(null);
          setFileData(null);
          setColumnMapping(defaultColumnMapping);
          setIsParsingFile(false);
          return;
        }

        if (!result.meta.fields || result.meta.fields.length < 1) {
          toast("Failed to retrieve CSV column data.");
          setFileColumns(null);
          setFileData(null);
          setColumnMapping(defaultColumnMapping);
          setIsParsingFile(false);
          return;
        }

        setFileData(result.data as Record<string, string>[]);
        setFileColumns(result.meta.fields);
        setColumnMapping((columnMapping) => {
          const newMapping = { ...columnMapping };
          for (const column of columns) {
            const mapableField = result.meta.fields?.find(
              (field) => field === column.id || field === column.title,
            );
            if (mapableField) {
              newMapping[column.id] = mapableField;
            }
          }
          return newMapping;
        });
        setIsParsingFile(false);
      },
      error: (error) => {
        toast("Failed to parse CSV file.", { description: error.message });
        setIsParsingFile(false);
      },
      worker: false,
      skipEmptyLines: true,
      header: true,
    });
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      if (!file || file.type !== "text/csv") {
        toast("Please upload a CSV file.");
        return;
      }

      parseCSVFile(file);
    },
    [parseCSVFile],
  );

  const handleImportWords = useCallback(() => {
    if (!fileData || fileData.length < 1) {
      return;
    }

    for (const column of columns) {
      if (column.required && !columnMapping[column.id]) {
        toast("Please map all the required fields.");
        return;
      }
    }

    interface Value {
      word: string;
      knownAt?: Date;
      seenCount?: number;
      hideLines?: boolean;
      practiceCount?: number;
    }
    const values: Value[] = [];

    for (const data of fileData) {
      const value: Value = {
        word: "",
      };

      const word = columnMapping.word ? data[columnMapping.word] : null;
      if (!word) {
        continue;
      }
      value.word = word;

      const knownAt = columnMapping.knownAt
        ? data[columnMapping.knownAt]
        : null;
      if (knownAt) {
        const date = dayjs(knownAt);
        value.knownAt = date.isValid() ? date.toDate() : undefined;
      }

      const seenCount = columnMapping.seenCount
        ? data[columnMapping.seenCount]
        : null;
      if (seenCount) {
        const int = parseInt(seenCount);
        if (!isNaN(int)) {
          value.seenCount = int;
        }
      }

      const practiceCount = columnMapping.practiceCount
        ? data[columnMapping.practiceCount]
        : null;
      if (practiceCount) {
        const int = parseInt(practiceCount);
        if (!isNaN(int)) {
          value.practiceCount = int;
        }
      }

      const hideLines = columnMapping.hideLines
        ? data[columnMapping.hideLines]
        : null;
      if (hideLines) {
        value.hideLines =
          hideLines.toLowerCase() === "true"
            ? true
            : hideLines.toLowerCase() === "false"
              ? false
              : undefined;
      }
      values.push(value);
    }

    if (values.length > 0) {
      addUserWordsMut.mutate({ languageCode, words: values });
    } else {
      toast("No words found to import");
    }
  }, [addUserWordsMut, columnMapping, fileData, languageCode]);

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {fileColumns ? (
          <div className="grid gap-4">
            <div className="grid h-10 grid-cols-[1fr,auto,1fr] items-center gap-4 rounded-md border">
              <div className="flex-1 text-center">
                <p className="text-muted-foreground text-sm font-medium">
                  CSV Data Column
                </p>
              </div>
              <ArrowRightIcon className="text-muted-foreground h-4 w-4" />
              <div className="flex-1 text-center">
                <p className="text-muted-foreground text-sm font-medium">
                  Word Data Field
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="grid grid-cols-[1fr,auto,1fr] items-center gap-4"
                >
                  <div className="flex-1">
                    <SimpleSelect
                      options={fileColumns.map((field) => ({
                        value: field,
                        name: field,
                      }))}
                      placeholder="Select column"
                      value={columnMapping[column.id]}
                      onValueChange={(value) => {
                        setColumnMapping((mapping) => {
                          const newMapping = { ...mapping };
                          newMapping[column.id] = value;
                          return newMapping;
                        });
                      }}
                    />
                  </div>
                  <ArrowRightIcon className="text-muted-foreground h-4 w-4" />
                  <div className="bg-secondary text-muted-foreground flex h-10 flex-1 items-center rounded-md border px-3 text-sm">
                    <span>{column.title}</span>
                    {column.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleImportWords}
              disabled={addUserWordsMut.isPending}
            >
              {addUserWordsMut.isPending && (
                <Loader2Icon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
              )}
              Import Words
            </Button>
          </div>
        ) : (
          <label
            className={cn(
              "hover:bg-accent hover:text-accent-foreground text-muted-foreground flex cursor-pointer flex-col items-center justify-center rounded-lg border px-4 py-8 text-center transition-colors",
              isParsingFile ? "pointer-events-none opacity-50" : "opacity-100",
            )}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isParsingFile}
            />
            <UploadIcon className="mx-auto mb-2 h-6 w-6" />
            <p className="text-center text-sm font-medium">
              Click or drag and drop a CSV file.
            </p>
          </label>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useImportWordsFromCsvDialog(): [
  (
    props: Omit<
      ImportWordsFromCsvDialogProps,
      "children" | "open" | "onOpenchange"
    >,
  ) => JSX.Element,
  boolean,
  Dispatch<SetStateAction<boolean>>,
] {
  const [open, setOpen] = useState(false);
  const Dialog = useCallback(
    (
      props: Omit<
        ImportWordsFromCsvDialogProps,
        "children" | "open" | "onOpenchange"
      >,
    ) => (
      <ImportWordsFromCsvDialog open={open} onOpenChange={setOpen} {...props} />
    ),
    [open],
  );

  return [Dialog, open, setOpen];
}
