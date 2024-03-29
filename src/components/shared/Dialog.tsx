import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'src/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip';

import type { DialogProps } from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '~/utils';

type Props = {
  className?: string;
  description?: ReactNode;
  footer?: ReactNode;
  title?: ReactNode;
  tooltip?: ReactNode;
  trigger?: ReactNode;
} & DialogProps;

export const Dialog = ({
  title,
  description,
  footer,
  children,
  onOpenChange,
  open,
  defaultOpen,
  modal,
  trigger,
  tooltip,
  className,
}: Props) => {
  return (
    <DialogRoot defaultOpen={defaultOpen} modal={modal} onOpenChange={onOpenChange} open={open}>
      {trigger ? (
        tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>{trigger}</DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        )
      ) : null}
      <DialogContent className={cn('gap-0 space-y-0 p-0', className)}>
        <DialogHeader className="p-6">
          {title ? <DialogTitle>{title}</DialogTitle> : null}
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="h-full w-full overflow-y-auto">{children}</div>
        {footer ? <DialogFooter className="p-6 pt-0">{footer}</DialogFooter> : null}
      </DialogContent>
    </DialogRoot>
  );
};
Dialog.displayName = 'Dialog';
