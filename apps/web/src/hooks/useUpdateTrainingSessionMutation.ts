import { toast } from "sonner";

import { api } from "~/trpc/react";

export const useChangeSentenceIndex = () => {
  const utils = api.useUtils();

  return api.trainingSessions.changeSentenceIndex.useMutation({
    onMutate: (vars) => {
      const oldData = utils.trainingSessions.getTrainingSession.getData({
        trainingSessionId: vars.trainingSessionId,
      });
      utils.trainingSessions.getTrainingSession.setData(
        { trainingSessionId: vars.trainingSessionId },
        (oldData) =>
          oldData
            ? {
                ...oldData,
                sentenceIndex: vars.sentenceIndex,
              }
            : undefined,
      );
      return { oldData };
    },
    onError: (error, vars, ctx) => {
      toast("Failed to update training session", {
        description: error.message,
      });
      if (ctx?.oldData) {
        utils.trainingSessions.getTrainingSession.setData(
          { trainingSessionId: vars.trainingSessionId },
          ctx.oldData,
        );
      } else {
        void utils.trainingSessions.getTrainingSession.invalidate({
          trainingSessionId: vars.trainingSessionId,
        });
      }
    },
  });
};
export const useChangeTrainingSessionView = () => {
  const utils = api.useUtils();

  return api.trainingSessions.changeView.useMutation({
    onMutate: (vars) => {
      const oldData = utils.trainingSessions.getTrainingSession.getData({
        trainingSessionId: vars.trainingSessionId,
      });
      utils.trainingSessions.getTrainingSession.setData(
        { trainingSessionId: vars.trainingSessionId },
        (oldData) =>
          oldData
            ? {
                ...oldData,
                view: vars.view,
              }
            : undefined,
      );
      return { oldData };
    },
    onError: (error, vars, ctx) => {
      toast("Failed to update training session", {
        description: error.message,
      });
      if (ctx?.oldData) {
        utils.trainingSessions.getTrainingSession.setData(
          { trainingSessionId: vars.trainingSessionId },
          ctx.oldData,
        );
      } else {
        void utils.trainingSessions.getTrainingSession.invalidate({
          trainingSessionId: vars.trainingSessionId,
        });
      }
    },
  });
};
