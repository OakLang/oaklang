import type {
  DefaultError,
  InfiniteQueryObserverLoadingErrorResult,
  InfiniteQueryObserverLoadingResult,
  InfiniteQueryObserverPendingResult,
  InfiniteQueryObserverRefetchErrorResult,
  InfiniteQueryObserverResult,
  InfiniteQueryObserverSuccessResult,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Button } from "./ui/button";

export default function RenderInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
>({
  query,
  renderError,
  renderLoading,
  children,
  renderLoadMoreButton,
}: {
  query: InfiniteQueryObserverResult<TData, TError>;
  renderLoading?: (
    query:
      | InfiniteQueryObserverLoadingResult<TData, TError>
      | InfiniteQueryObserverPendingResult<TData, TError>,
  ) => ReactNode;
  renderError?: (
    query:
      | InfiniteQueryObserverRefetchErrorResult<TData, TError>
      | InfiniteQueryObserverLoadingErrorResult<TData, TError>,
  ) => ReactNode;
  renderLoadMoreButton?: (
    query: InfiniteQueryObserverSuccessResult<TData, TError>,
  ) => ReactNode;
  children?: (
    query: InfiniteQueryObserverSuccessResult<TData, TError>,
  ) => ReactNode;
}) {
  if (query.isPending) {
    return renderLoading?.(query) ?? <p>Loading...</p>;
  }

  if (query.isError) {
    return (
      renderError?.(query) ?? (
        <p>
          {query.error instanceof Error
            ? query.error.message
            : "Something went wrong!"}
        </p>
      )
    );
  }

  return (
    <>
      {children?.(query)}
      {query.hasNextPage &&
        (renderLoadMoreButton?.(query) ?? (
          <Button
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="w-full"
            variant="outline"
          >
            Show More
          </Button>
        ))}
    </>
  );
}
