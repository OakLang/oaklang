import React, { useMemo } from "react";
import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function TablePagination({
  onPageIndexChange,
  pageIndex,
  totalCount,
  selectedCount,
  pageSize,
  onPageSizeChange,
  pageSizes = [10, 20, 30, 40, 50],
}: {
  totalCount: number;
  pageIndex: number;
  onPageIndexChange: (page: number) => void;
  selectedCount?: number;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizes?: number[];
}) {
  const pageCount = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [pageSize, totalCount],
  );
  const previousPage = useMemo(() => {
    if (pageIndex > 1) {
      return pageIndex - 1;
    }
    return null;
  }, [pageIndex]);
  const nextPage = useMemo(() => {
    if (pageIndex < pageCount) {
      return pageIndex + 1;
    }
    return null;
  }, [pageCount, pageIndex]);

  return (
    <div className="flex items-center pt-4">
      <p className="text-muted-foreground flex-1 text-sm">
        {selectedCount ?? 0} of {totalCount} row(s) selected.
      </p>

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="whitespace-nowrap text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
            }}
          >
            <SelectTrigger className="min-w-24">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm font-medium">
          Page {pageIndex} of {pageCount}
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageIndexChange(1)}
            disabled={previousPage == null}
          >
            <span className="sr-only">Go to first page</span>
            <ArrowLeftToLineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (previousPage !== null) {
                onPageIndexChange(previousPage);
              }
            }}
            disabled={previousPage == null}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (nextPage !== null) {
                onPageIndexChange(nextPage);
              }
            }}
            disabled={nextPage == null}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              onPageIndexChange(pageCount);
            }}
            disabled={nextPage == null}
          >
            <span className="sr-only">Go to last page</span>
            <ArrowRightToLineIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
