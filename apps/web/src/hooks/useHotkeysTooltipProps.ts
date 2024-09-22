import { useState } from "react";

import { useShowHotkeys } from "~/store/show-hotkeys-store";

export const useHotkeysTooltipProps = () => {
  const showHotkeys = useShowHotkeys((state) => state.show);
  const [open, onOpenChange] = useState(false);

  return { onOpenChange, open: open || showHotkeys };
};
