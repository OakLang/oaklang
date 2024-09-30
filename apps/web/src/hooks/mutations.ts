import { toast } from "sonner";

import { api } from "~/trpc/react";
import { usePracticeLanguageCode } from "./usePracticeLanguageCode";

export const useMarkWordKnownMutation = () => {
  const utils = api.useUtils();
  const practiceLanguageCode = usePracticeLanguageCode();

  return api.words.markWordKnown.useMutation({
    onMutate: (vars) => {
      const oldUserWord = utils.words.getUserWord.getData({
        wordId: vars.wordId,
      });

      if (oldUserWord) {
        utils.words.getUserWord.setData(
          { wordId: vars.wordId },
          { ...oldUserWord, knownAt: new Date(), knownFromId: vars.sessionId },
        );
      }

      const oldPracticeLanguage =
        utils.languages.getPracticeLanguage.getData(practiceLanguageCode);
      if (oldPracticeLanguage) {
        utils.languages.getPracticeLanguage.setData(practiceLanguageCode, {
          ...oldPracticeLanguage,
          knownWords: oldPracticeLanguage.knownWords + 1,
        });
      }

      return { oldUserWord, oldPracticeLanguage };
    },
    onSuccess: () => {
      void utils.words.invalidate();
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguageCode);
      void utils.languages.getPracticeLanguages.invalidate();
      toast("Marked word known");
    },
    onError: (error, vars, ctx) => {
      if (ctx?.oldUserWord) {
        utils.words.getUserWord.setData(
          { wordId: vars.wordId },
          ctx.oldUserWord,
        );
      }

      if (ctx?.oldPracticeLanguage) {
        utils.languages.getPracticeLanguage.setData(
          practiceLanguageCode,
          ctx.oldPracticeLanguage,
        );
      }

      toast(error.message);
    },
  });
};

export const useMarkWordUnknownMutation = () => {
  const utils = api.useUtils();
  const practiceLanguageCode = usePracticeLanguageCode();

  return api.words.markWordUnknown.useMutation({
    onMutate: (vars) => {
      const oldUserWord = utils.words.getUserWord.getData({
        wordId: vars.wordId,
      });

      if (oldUserWord) {
        utils.words.getUserWord.setData(
          { wordId: vars.wordId },
          { ...oldUserWord, knownAt: null, knownFromId: null },
        );
      }

      const oldPracticeLanguage =
        utils.languages.getPracticeLanguage.getData(practiceLanguageCode);
      if (oldPracticeLanguage) {
        utils.languages.getPracticeLanguage.setData(practiceLanguageCode, {
          ...oldPracticeLanguage,
          knownWords: oldPracticeLanguage.knownWords - 1,
        });
      }

      return { oldUserWord, oldPracticeLanguage };
    },
    onSuccess: () => {
      void utils.words.invalidate();
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguageCode);
      void utils.languages.getPracticeLanguages.invalidate();
      toast("Marked word unknown");
    },
    onError: (error, vars, ctx) => {
      if (ctx?.oldUserWord) {
        utils.words.getUserWord.setData(
          { wordId: vars.wordId },
          ctx.oldUserWord,
        );
      }

      if (ctx?.oldPracticeLanguage) {
        utils.languages.getPracticeLanguage.setData(
          practiceLanguageCode,
          ctx.oldPracticeLanguage,
        );
      }

      toast(error.message);
    },
  });
};
