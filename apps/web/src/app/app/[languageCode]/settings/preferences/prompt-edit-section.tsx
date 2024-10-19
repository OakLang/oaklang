"use client";

import { Label } from "@radix-ui/react-label";
import { RefreshCcwIcon } from "lucide-react";
import { useFormatter } from "next-intl";

import {
  AVAILABLE_PROMPT_TEMPLATE_KEYS,
  DEFAULT_GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE,
  DEFAULT_GENERATE_SENTENCES_PROMPT_TEMPLATE,
} from "@acme/core/constants";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useAppStore } from "~/providers/app-store-provider";

export default function PromptEditSection() {
  const generateSentencesPromptTemplate = useAppStore(
    (state) => state.generateSentencesPromptTemplate,
  );
  const setGenerateSentencesPromptTemplate = useAppStore(
    (state) => state.setGenerateSentencesPromptTemplate,
  );
  const generateSentenceWordsPromptTemplate = useAppStore(
    (state) => state.generateSentenceWordsPromptTemplate,
  );
  const setGenerateSentenceWordsPromptTemplate = useAppStore(
    (state) => state.setGenerateSentenceWordsPromptTemplate,
  );
  const format = useFormatter();

  return (
    <section id="interlinear-lines" className="my-8">
      <div className="mb-4">
        <h2 className="text-xl font-medium">GPT Prompt Templates</h2>
      </div>

      <div className="mb-6 grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="generateSentencesPromptTemplate">
            Generate Sentences Prompt Template
          </Label>
          <Button
            onClick={() =>
              setGenerateSentencesPromptTemplate(
                DEFAULT_GENERATE_SENTENCES_PROMPT_TEMPLATE.trim(),
              )
            }
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          id="generateSentencesPromptTemplate"
          value={generateSentencesPromptTemplate}
          onChange={(e) => {
            setGenerateSentencesPromptTemplate(e.currentTarget.value);
          }}
          className="bg-secondary/50 resize-y"
          rows={10}
        />
        <p className="text-muted-foreground text-sm">
          Available Keys{" "}
          {format.list(
            AVAILABLE_PROMPT_TEMPLATE_KEYS.map((key) => (
              <code key={key} className="font-semibold">
                {key}
              </code>
            )),
          )}
        </p>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="generateSentenceWordsPromptTemplate">
            Generate Sentence Words Prompt Template
          </Label>
          <Button
            onClick={() =>
              setGenerateSentenceWordsPromptTemplate(
                DEFAULT_GENERATE_SENTENCE_WORDS_PROMPT_TEMPLATE.trim(),
              )
            }
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          id="generateSentenceWordsPromptTemplate"
          value={generateSentenceWordsPromptTemplate}
          onChange={(e) => {
            setGenerateSentenceWordsPromptTemplate(e.currentTarget.value);
          }}
          className="bg-secondary/50 resize-y"
          rows={10}
        />
        <p className="text-muted-foreground text-sm">
          Available Keys{" "}
          {format.list(
            ["{PRACTICE_LANGUAGE}", "{NATIVE_LANGUAGE}", "{SENTENCE}"].map(
              (key) => (
                <code key={key} className="font-semibold">
                  {key}
                </code>
              ),
            ),
          )}
        </p>
      </div>
    </section>
  );
}
