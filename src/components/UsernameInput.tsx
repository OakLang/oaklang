import { LuCheck, LuCornerDownLeft } from 'react-icons/lu';
import React, { forwardRef, useEffect, useRef } from 'react';

import { Input } from './ui/input';
import { cn } from '~/utils';

export type UsernameInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  addErrorPlaceholder?: boolean;
  containerClassname?: string;
  errorMessage?: string | null;
  hideEnterArrow?: boolean;
  resetWasSaved?(): void;
  wasSaved?: boolean;
};

const UsernameInput = forwardRef<HTMLInputElement, UsernameInputProps>(
  ({ errorMessage, className, containerClassname, hideEnterArrow, wasSaved, resetWasSaved, addErrorPlaceholder, ...props }, ref) => {
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
      if (wasSaved && resetWasSaved) {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => resetWasSaved(), 3000);
      }
    }, [wasSaved, resetWasSaved]);

    return (
      <fieldset>
        <div className={cn('relative w-full', containerClassname)}>
          <Input
            autoCapitalize="off"
            autoCorrect="off"
            className={cn('peer h-11 w-full rounded-lg pl-[130px] text-base sm:pr-14', className)}
            placeholder="your name"
            {...props}
            ref={ref}
          />
          <p className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground">wonderful.dev/</p>
          {resetWasSaved ? (
            <div
              className={cn('absolute right-2 top-1/2 -translate-y-1/2 text-primary opacity-0 transition-opacity', {
                'opacity-100': wasSaved,
              })}
            >
              <LuCheck size={20} />
            </div>
          ) : (
            !hideEnterArrow && (
              <div className="pointer-events-none absolute right-1.5 top-1/2 flex h-8 -translate-y-1/2 items-center justify-center rounded-sm border bg-card px-2 text-muted-foreground peer-focus:text-foreground max-sm:hidden">
                <LuCornerDownLeft size={20} />
              </div>
            )
          )}
        </div>
        {errorMessage ? (
          <p className="mt-2 h-5 text-sm font-medium text-destructive">{errorMessage}</p>
        ) : addErrorPlaceholder ? (
          <div className="mt-2 h-5" />
        ) : null}
      </fieldset>
    );
  },
);

UsernameInput.displayName = 'UsernameInput';

export default UsernameInput;
