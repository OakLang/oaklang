"use client";

import type { Url } from "next/dist/shared/lib/router/router";
import type { LinkProps } from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PrefetchLinkProps = LinkProps & {
  children?: ReactNode;
  prefetchOnHover?: boolean;
} & HTMLAttributes<HTMLAnchorElement>;

const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ onMouseEnter, onFocus, prefetchOnHover = true, ...props }, ref) => {
    const router = useRouter();

    const prefetch = useCallback(
      (href: Url) => {
        if (!prefetchOnHover) {
          return;
        }

        if (typeof href === "string") {
          router.prefetch(href);
        } else if (href.pathname) {
          router.prefetch(href.pathname);
        }
      },
      [prefetchOnHover, router],
    );

    return (
      <Link
        onMouseEnter={(e) => {
          onMouseEnter?.(e);
          prefetch(props.href);
        }}
        onFocus={(e) => {
          onFocus?.(e);
          prefetch(props.href);
        }}
        prefetch={false}
        ref={ref}
        {...props}
      />
    );
  },
);

PrefetchLink.displayName = "PrefetchLink";

export default PrefetchLink;
