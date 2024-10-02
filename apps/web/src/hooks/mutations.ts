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
          {
            ...oldUserWord,
            knownAt: new Date(),
            knownFromId: vars.sessionId,
            hideLines: true,
          },
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
    onSuccess: (_, vars) => {
      void utils.words.getUserWord.invalidate({ wordId: vars.wordId });
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
          {
            ...oldUserWord,
            knownAt: null,
            hideLines: false,
            knownFromId: null,
          },
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
    onSuccess: (_, vars) => {
      void utils.words.getUserWord.invalidate({ wordId: vars.wordId });
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

export const useUpdateUserWordMutation = () => {
  const utils = api.useUtils();
  return api.words.updateUserWord.useMutation({
    onMutate: (vars) => {
      const oldWord = utils.words.getUserWord.getData();
      if (oldWord) {
        utils.words.getUserWord.setData(
          { wordId: vars.wordId },
          {
            ...oldWord,
            ...(typeof vars.hideLines !== "undefined"
              ? { hideLines: vars.hideLines }
              : {}),
          },
        );
      }
      return { oldWord };
    },
    onSuccess: (data, vars) => {
      void utils.words.getUserWord.invalidate({ wordId: vars.wordId });
    },
    onError: (error, vars, ctx) => {
      toast(error.message);
      if (ctx?.oldWord) {
        utils.words.getUserWord.setData({ wordId: vars.wordId }, ctx.oldWord);
      }
    },
  });
};
