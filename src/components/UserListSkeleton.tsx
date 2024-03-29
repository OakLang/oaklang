import { Skeleton } from './ui/skeleton';

export default function UserListSkeleton() {
  return (
    <div>
      {new Array(10).fill(1).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div className="flex items-center gap-2 p-4" key={i}>
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
