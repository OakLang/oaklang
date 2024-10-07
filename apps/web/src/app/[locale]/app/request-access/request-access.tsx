"use client";

import { useCallback, useMemo, useState } from "react";
import { Circle } from "lucide-react";
import { toast } from "sonner";

import type {
  AccessRequestQuestion,
  AccessRequestQuestionOption,
} from "@acme/db/schema";

import FullScreenLoader from "~/components/FullScreenLoader";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Textarea } from "~/components/ui/textarea";
import { Link, useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";

type QuestionWithOptions = AccessRequestQuestion & {
  options: AccessRequestQuestionOption[];
};

interface Answer {
  options: {
    id: string;
    customAnswer?: string;
  }[];
}

export default function RequestAccess({
  questionsWithOptions,
}: {
  questionsWithOptions: QuestionWithOptions[];
}) {
  const [page, setPage] = useState(-1);
  const [agreeToPrivacyPolicy, setAgreeToPrivacyPolicy] = useState(false);
  const [agreeToTermsOfService, setAgreeToTermsOfService] = useState(false);
  const [
    understandAllSecurityConsiderations,
    setUnderstandAllSecurityConsiderations,
  ] = useState(false);
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const reqeustAccessMut = api.users.requestAccess.useMutation({
    onError: (error) => {
      toast(error.message);
    },
    onSuccess: () => {
      router.replace(`/app/request-access/success`);
    },
  });

  const handleSubmit = useCallback(() => {
    reqeustAccessMut.mutate({ answers });
  }, [answers, reqeustAccessMut]);

  if (reqeustAccessMut.isPending || reqeustAccessMut.isSuccess) {
    return <FullScreenLoader />;
  }

  if (page < 0) {
    return (
      <AgreementPage
        onContinue={() => setPage(page + 1)}
        agreeToPrivacyPolicy={agreeToPrivacyPolicy}
        agreeToTermsOfService={agreeToTermsOfService}
        understandAllSecurityConsiderations={
          understandAllSecurityConsiderations
        }
        setAgreeToPrivacyPolicy={setAgreeToPrivacyPolicy}
        setAgreeToTermsOfService={setAgreeToTermsOfService}
        setUnderstandAllSecurityConsiderations={
          setUnderstandAllSecurityConsiderations
        }
      />
    );
  }

  if (questionsWithOptions[page]) {
    const answer = answers[questionsWithOptions[page].id];
    return (
      <RenderQuestion
        questionWithOption={questionsWithOptions[page]}
        onContinue={() => {
          if (page >= questionsWithOptions.length - 1) {
            handleSubmit();
          } else {
            setPage(page + 1);
          }
        }}
        onBack={() => setPage(page - 1)}
        answer={answer}
        onAnswer={(answer) => {
          if (!questionsWithOptions[page]) {
            return;
          }
          const newAnswers = { ...answers };
          newAnswers[questionsWithOptions[page].id] = answer;
          setAnswers(newAnswers);
        }}
        isLastQuestion={page >= questionsWithOptions.length - 1}
      />
    );
  }

  return <p>Page not found!</p>;
}

function AgreementPage({
  onContinue,
  agreeToPrivacyPolicy,
  agreeToTermsOfService,
  understandAllSecurityConsiderations,
  setAgreeToPrivacyPolicy,
  setAgreeToTermsOfService,
  setUnderstandAllSecurityConsiderations,
}: {
  onContinue: () => void;
  agreeToPrivacyPolicy: boolean;
  agreeToTermsOfService: boolean;
  understandAllSecurityConsiderations: boolean;
  setAgreeToPrivacyPolicy: (value: boolean) => void;
  setAgreeToTermsOfService: (value: boolean) => void;
  setUnderstandAllSecurityConsiderations: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mx-auto grid w-full max-w-screen-sm gap-4 px-8 py-16">
        <div className="flex gap-2">
          <Checkbox
            className="my-1"
            checked={agreeToPrivacyPolicy}
            onCheckedChange={(value) => setAgreeToPrivacyPolicy(value === true)}
          />
          <p className="text-muted-foreground">
            I agree to the processing of my account and usage information as
            outlined in the{" "}
            <Link
              className="text-foreground font-medium underline underline-offset-4"
              href="/legal/privacy"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Checkbox
            className="my-1"
            checked={agreeToTermsOfService}
            onCheckedChange={(value) =>
              setAgreeToTermsOfService(value === true)
            }
          />
          <p className="text-muted-foreground">
            I agree to the{" "}
            <Link
              className="text-foreground font-medium underline underline-offset-4"
              href="/legal/terms"
            >
              Terms of Service
            </Link>{" "}
            and understand the software is in early development (pre-alpha),
            which may result in bugs or data loss.
          </p>
        </div>
        <div className="flex gap-2">
          <Checkbox
            className="my-1"
            checked={understandAllSecurityConsiderations}
            onCheckedChange={(value) =>
              setUnderstandAllSecurityConsiderations(value === true)
            }
          />
          <p className="text-muted-foreground">
            I understand that at this stage not all security considerations have
            been accounted for, and promise not to try to hack OakLang. If I
            want to do explicit security testing, I will contact you first.
          </p>
        </div>
        <div className="flex justify-end gap-4">
          <Button asChild variant="secondary">
            <Link href="/app">Cancel</Link>
          </Button>
          <Button
            onClick={onContinue}
            disabled={
              !agreeToPrivacyPolicy ||
              !agreeToTermsOfService ||
              !understandAllSecurityConsiderations
            }
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function RenderQuestion({
  questionWithOption,
  onContinue,
  onBack,
  onAnswer,
  answer,
  isLastQuestion,
}: {
  questionWithOption: QuestionWithOptions;
  onContinue: () => void;
  onBack: () => void;
  answer?: Answer;
  onAnswer: (answer: Answer) => void;
  isLastQuestion?: boolean;
}) {
  const allowedToContinue = useMemo(() => {
    if (!answer) {
      return false;
    }
    if (answer.options.length === 0) {
      return false;
    }
    const customAnswerNotFound = answer.options.find(({ id, customAnswer }) => {
      const opt = questionWithOption.options.find((option) => option.id === id);
      if (!opt) {
        return false;
      }
      return opt.isCustomAnswer && !customAnswer;
    });
    if (customAnswerNotFound) {
      return false;
    }
    return true;
  }, [answer, questionWithOption.options]);

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mx-auto grid w-full max-w-screen-sm gap-8 px-8 py-16">
        <h2 className="text-2xl font-semibold">
          {questionWithOption.question}
        </h2>
        <div className="grid gap-4">
          {questionWithOption.options.map((option) => {
            const selected =
              answer &&
              answer.options.findIndex((opt) => opt.id === option.id) !== -1;
            return (
              <div key={option.id} className="grid gap-2">
                <div className="flex items-center gap-4">
                  {questionWithOption.isMultiChoice ? (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(value) => {
                        if (value === selected) {
                          return;
                        }
                        if (value) {
                          onAnswer({
                            options: [
                              ...(answer?.options ?? []),
                              { id: option.id },
                            ],
                          });
                        } else {
                          onAnswer({
                            options: (answer?.options ?? []).filter(
                              ({ id }) => id !== option.id,
                            ),
                          });
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="relative flex h-5 w-5"
                      onClick={() => {
                        if (selected) {
                          return;
                        }
                        onAnswer({ options: [{ id: option.id }] });
                      }}
                    >
                      <Circle className="absolute h-5 w-5" />
                      {selected && (
                        <Circle className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 fill-current" />
                      )}
                    </button>
                  )}
                  <p>{option.option}</p>
                </div>
                {option.isCustomAnswer && selected && (
                  <Textarea
                    value={
                      answer.options.find((opt) => opt.id === option.id)
                        ?.customAnswer ?? ""
                    }
                    placeholder={option.customAnswerPlaceholderText ?? ""}
                    onChange={(e) => {
                      onAnswer({
                        options: answer.options.map((opt) =>
                          opt.id === option.id
                            ? { ...opt, customAnswer: e.currentTarget.value }
                            : opt,
                        ),
                      });
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-4">
          <Button onClick={onBack} variant="secondary">
            Back
          </Button>
          <Button onClick={onContinue} disabled={!allowedToContinue}>
            {isLastQuestion ? "Request Access" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
