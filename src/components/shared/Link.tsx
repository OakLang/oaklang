'use client';
import type { MouseEventHandler, ReactNode } from 'react';

import { HiOutlineExternalLink } from 'react-icons/hi';
import NextLink from 'next/link';

/*
Custom Link component.

Variants:
 * inline - (default) blue color, underlined on hover
 * secondary - secondary gray text color, underlined on hover, darker gray text color on hover
*/

type Props = {
  children: ReactNode;
  className?: string;
  follow?: boolean;
  href: string;
  isExternal?: boolean;
  newWindow?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  rel?: string;
  showExternalIcon?: boolean;
  title?: string;
  variant?: 'inline' | 'secondary';
};

const getColor = (variant = 'inline'): string => {
  switch (variant) {
    case 'inline':
      return 'text-blue-500 no-underline hover:underline';
    case 'secondary':
      return 'hover:text-foreground hover:underline text-muted-foreground';
  }
  throw new Error(`Unknown variant: ${variant}`);
};

export default function Link({
  className,
  variant,
  children,
  href,
  isExternal,
  newWindow,
  onClick,
  follow,
  rel,
  title,
  showExternalIcon,
}: Props) {
  variant = variant ?? 'inline';
  const color = getColor(variant);
  if ((newWindow ?? showExternalIcon) && isExternal === undefined) {
    isExternal = true;
  }
  if ((newWindow ?? isExternal) && showExternalIcon === undefined) {
    showExternalIcon = true;
  }
  if (showExternalIcon && newWindow === undefined) {
    newWindow = true;
  }
  const target = newWindow ? '_blank' : undefined;
  const f = isExternal && !follow ? 'nofollow' : '';
  const _rel = isExternal ?? newWindow ? `noopener ${f}` : f;
  return (
    <NextLink className={`${color} ${className}`} href={href} onClick={onClick} rel={`${_rel} ${rel ?? ''}`} target={target} title={title}>
      {children}
      {!!(newWindow && showExternalIcon) && <HiOutlineExternalLink className="my-auto ml-0.5 inline-block text-[80%]" />}
    </NextLink>
  );
}
