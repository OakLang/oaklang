import type { SortingState } from "@tanstack/react-table";

import type { SortParams } from "~/components/DataTable";

export const stateToSortBy = (sorting: SortingState | undefined) => {
  const sort = sorting?.[0];
  if (!sort) {
    return undefined;
  }

  return `${sort.id}.${sort.desc ? "desc" : "asc"}` as const;
};

export const sortByToState = (sortBy: SortParams["sortBy"] | undefined) => {
  if (!sortBy) return [];

  const [id, desc] = sortBy.split(".");
  return [{ id, desc: desc === "desc" }];
};
