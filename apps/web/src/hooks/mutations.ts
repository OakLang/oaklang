import { toast } from "sonner";

import { api } from "~/trpc/react";
import { usePracticeLanguageCode } from "./usePracticeLanguageCode";

export const useMarkWordKnownMutation = () => {
  const utils = api.useUtils();
  const practiceLanguageCode = usePracticeLanguageCode();

  return api.words.markWordKnown.useMutation({
    onMutate: ({ wordId, sessionId }) => {
      const oldUserWord = utils.words.getUserWord.getData({
        wordId,
      });

      if (oldUserWord) {
        utils.words.getUserWord.setData(
          { wordId },
          {
            ...oldUserWord,
            knownAt: new Date(),
            knownFromId: sessionId,
            hideLines: true,
          },
        );
      }

      return { oldUserWord };
    },
    onSuccess: () => {
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguageCode);
      void utils.languages.getPracticeLanguages.invalidate();
    },
    onError: (error, { wordId }, ctx) => {
      if (ctx?.oldUserWord) {
        utils.words.getUserWord.setData({ wordId }, ctx.oldUserWord);
      }

      toast(error.message);
    },
  });
};

export const useMarkWordUnknownMutation = () => {
  const utils = api.useUtils();
  const practiceLanguageCode = usePracticeLanguageCode();

  return api.words.markWordUnknown.useMutation({
    onMutate: ({ wordId }) => {
      const oldUserWord = utils.words.getUserWord.getData({ wordId });

      if (oldUserWord) {
        utils.words.getUserWord.setData(
          { wordId },
          {
            ...oldUserWord,
            knownAt: null,
            hideLines: false,
            knownFromId: null,
          },
        );
      }

      return { oldUserWord };
    },
    onSuccess: () => {
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguageCode);
      void utils.languages.getPracticeLanguages.invalidate();
    },
    onError: (error, { wordId }, ctx) => {
      if (ctx?.oldUserWord) {
        utils.words.getUserWord.setData({ wordId }, ctx.oldUserWord);
      }

      toast(error.message);
    },
  });
};

export const useUpdateUserWordMutation = () => {
  const utils = api.useUtils();
  return api.words.updateUserWord.useMutation({
    onMutate: ({ wordId, hideLines }) => {
      const oldWord = utils.words.getUserWord.getData({ wordId });
      if (oldWord) {
        utils.words.getUserWord.setData(
          { wordId },
          {
            ...oldWord,
            ...(typeof hideLines !== "undefined" ? { hideLines } : {}),
          },
        );
      }
      return { oldWord };
    },
    onError: (error, { wordId }, ctx) => {
      if (ctx?.oldWord) {
        utils.words.getUserWord.setData({ wordId }, ctx.oldWord);
      }
      toast(error.message);
    },
  });
};
