import { toast } from "sonner";

import { api } from "~/trpc/react";

export const useUpdateTrainingSessionMutation = () => {
  const utils = api.useUtils();

  return api.trainingSessions.updateTrainingSession.useMutation({
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
                ...vars,
              }
            : undefined,
      );
      return { oldData };
    },
    onSuccess: (newData, vars) => {
      utils.trainingSessions.getTrainingSession.setData(
        { trainingSessionId: vars.trainingSessionId },
        newData,
      );
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
      }
    },
  });
};
