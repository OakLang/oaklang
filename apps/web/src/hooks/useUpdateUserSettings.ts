import { toast } from "sonner";

import { api } from "~/trpc/react";

export const useUpdateUserSettingsMutation = () => {
  const utils = api.useUtils();

  return api.userSettings.updateUserSettings.useMutation({
    onMutate: (vars) => {
      const oldData = utils.userSettings.getUserSettings.getData();
      utils.userSettings.getUserSettings.setData(undefined, (oldData) =>
        oldData
          ? {
              ...oldData,
              ...vars,
            }
          : undefined,
      );
      return { oldData };
    },
    onSuccess: (newData) => {
      utils.userSettings.getUserSettings.setData(undefined, newData);
    },
    onError: (error, _, ctx) => {
      toast("Failed to update user settings", { description: error.message });
      if (ctx?.oldData) {
        utils.userSettings.getUserSettings.setData(undefined, ctx.oldData);
      }
    },
  });
};
