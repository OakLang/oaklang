import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { showHotkeysAtom } from '~/store/show-tooltips';

export const useHotkeysTooltipProps = () => {
  const showHotkeys = useAtomValue(showHotkeysAtom);
  const [open, onOpenChange] = useState(false);
  return { onOpenChange, open: open || showHotkeys };
};
