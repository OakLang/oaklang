import Link from 'next/link';
import React, { Fragment } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { cn } from '~/utils';

export default function Breadcrumbs({
  items,
}: {
  items: {
    href: string;
    label: string;
  }[];
}) {
  return (
    <ul className="flex items-center">
      {items.map((item, i) => (
        <Fragment key={item.href}>
          <li key={item.href}>
            <Link
              className={cn(
                'line-clamp-1 font-semibold leading-6',
                i === items.length - 1 ? 'text-primary' : 'text-muted-foreground hover:text-primary',
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
          {i < items.length - 1 ? <LuChevronRight className="mx-1 h-5 w-5 text-muted-foreground" /> : null}
        </Fragment>
      ))}
    </ul>
  );
}
