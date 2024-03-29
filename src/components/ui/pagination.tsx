'use client';

import * as React from 'react';

import { LuChevronLeft, LuChevronRight, LuMoreHorizontal } from 'react-icons/lu';

import type { ButtonProps } from '~/components/ui/button';
import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/utils';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav aria-label="pagination" className={cn('mx-auto flex w-full justify-center', className)} role="navigation" {...props} />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(({ className, ...props }, ref) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} ref={ref} {...props} />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(({ className, ...props }, ref) => (
  <li className={cn('', className)} ref={ref} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;

const PaginationLink = ({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        size,
        variant: isActive ? 'outline' : 'ghost',
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = 'PaginationLink';

type PaginationButtonProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'button'>;

const PaginationButton = ({ className, isActive, size = 'icon', ...props }: PaginationButtonProps) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        size,
        variant: isActive ? 'outline' : 'ghost',
      }),
      'text-foreground',
      className,
    )}
    type="button"
    {...props}
  />
);
PaginationButton.displayName = 'PaginationButton';

const PaginationPreviousLink = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" className={cn('gap-1 pl-2.5', className)} size="default" {...props}>
    <LuChevronLeft size={20} />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPreviousLink.displayName = 'PaginationPreviousLink';

const PaginationPreviousButton = ({ className, ...props }: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton aria-label="Go to previous page" className={cn('gap-1 pl-2.5', className)} size="default" {...props}>
    <LuChevronLeft size={20} />
    <span>Previous</span>
  </PaginationButton>
);
PaginationPreviousButton.displayName = 'PaginationPreviousButton';

const PaginationNextLink = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" className={cn('gap-1 pr-2.5', className)} size="default" {...props}>
    <span>Next</span>
    <LuChevronRight size={20} />
  </PaginationLink>
);
PaginationNextLink.displayName = 'PaginationNextLink';

const PaginationNextButton = ({ className, ...props }: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton aria-label="Go to next page" className={cn('gap-1 pr-2.5', className)} size="default" {...props}>
    <span>Next</span>
    <LuChevronRight size={20} />
  </PaginationButton>
);
PaginationNextButton.displayName = 'PaginationNextButton';

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span aria-hidden className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
    <LuMoreHorizontal size={20} />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNextLink,
  PaginationPreviousLink,
  PaginationButton,
  PaginationPreviousButton,
  PaginationNextButton,
};
