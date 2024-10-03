import { toast } from "sonner";

import type { InterlinearLine } from "@acme/core/validators";

import { api } from "~/trpc/react";

export const useUpdateUserSettingsMutation = () => {
  const utils = api.useUtils();

  return api.userSettings.updateUserSettings.useMutation({
    onMutate: ({ interlinearLines, ...vars }) => {
      const oldData = utils.userSettings.getUserSettings.getData();
      if (oldData) {
        utils.userSettings.getUserSettings.setData(undefined, {
          ...oldData,
          ...vars,
          interlinearLines: interlinearLines
            ? (interlinearLines as InterlinearLine[])
            : oldData.interlinearLines,
        });
      }
      return { oldData };
    },
    onError: (error, _, ctx) => {
      toast("Failed to update user settings", { description: error.message });
      if (ctx?.oldData) {
        utils.userSettings.getUserSettings.setData(undefined, ctx.oldData);
      }
    },
  });
};
