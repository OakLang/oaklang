import type {
  DefaultError,
  QueryObserverLoadingErrorResult,
  QueryObserverLoadingResult,
  QueryObserverPendingResult,
  QueryObserverRefetchErrorResult,
  QueryObserverResult,
  QueryObserverSuccessResult,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

export default function RenderQueryResult<
  TData = unknown,
  TError = DefaultError,
>({
  query,
  renderError,
  renderLoading,
  children,
}: {
  query: QueryObserverResult<TData, TError>;
  renderLoading?: (
    query:
      | QueryObserverLoadingResult<TData, TError>
      | QueryObserverPendingResult<TData, TError>,
  ) => ReactNode;
  renderError?: (
    query:
      | QueryObserverRefetchErrorResult<TData, TError>
      | QueryObserverLoadingErrorResult<TData, TError>,
  ) => ReactNode;
  children?: (query: QueryObserverSuccessResult<TData, TError>) => ReactNode;
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

  return children?.(query);
}
