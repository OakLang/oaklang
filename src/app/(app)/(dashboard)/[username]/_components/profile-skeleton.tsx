import React from 'react';
import { Skeleton } from '~/components/ui/skeleton';

export default function ProfileSkeleton() {
  return (
    <div>
      <div className="flex gap-x-8 gap-y-4 p-4 max-sm:flex-col">
        <div className="relative h-fit w-fit flex-shrink-0">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="sm:flex-1">
          <div className="flex gap-4">
            <div className="flex-1 overflow-hidden">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="mt-2 h-5 w-20" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <Skeleton className="h-5 w-[80%]" />
        <Skeleton className="mt-1 h-5 w-[60%]" />
      </div>
      <div className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-56" />
        </div>
      </div>
    </div>
  );
}
