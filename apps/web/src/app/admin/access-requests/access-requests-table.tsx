"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { RouterInputs } from "~/trpc/react";
import RenderQueryResult from "~/components/RenderQueryResult";
import TablePagination from "~/components/TablePagination";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";

export default function AccessRequestsTable() {
  const [status, setStatus] =
    useState<
      RouterInputs["admin"]["accessRequests"]["getAccessRequests"]["status"]
    >("pending");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [queryText, setQueryText] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const accessRequestsQuery =
    api.admin.accessRequests.getAccessRequests.useQuery({
      page: pageIndex,
      size: pageSize,
      status: status,
      query: queryText,
    });

  const handleSetQueryText = useCallback((value: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setQueryText(value);
    }, 300);
  }, []);

  return (
    <div>
      <div className="mb-4 flex justify-start gap-2">
        <Input
          className="w-full max-w-md"
          placeholder="Search id, name, email, ..."
          defaultValue={queryText}
          onChange={(e) => handleSetQueryText(e.currentTarget.value)}
        />
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(
              value as RouterInputs["admin"]["accessRequests"]["getAccessRequests"]["status"],
            )
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewer Id</TableHead>
              <TableHead>Reviewed At</TableHead>
              <TableHead
                className="sticky right-0 z-10"
                style={{
                  boxShadow: "1px 0 0 hsl(var(--border)) inset",
                }}
              >
                Review
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <RenderQueryResult
              query={accessRequestsQuery}
              renderLoading={() => (
                <TableRow>
                  <TableCell colSpan={8}>
                    <p>Loading...</p>
                  </TableCell>
                </TableRow>
              )}
              renderError={({ error }) => (
                <TableRow>
                  <TableCell colSpan={8}>
                    <p>{error.message}</p>
                  </TableCell>
                </TableRow>
              )}
            >
              {({ data }) => {
                if (data.list.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <p>No result...</p>
                      </TableCell>
                    </TableRow>
                  );
                }
                return data.list.map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell>{row.userId}</TableCell>
                    <TableCell>{row.user.name ?? "-"}</TableCell>
                    <TableCell>{row.user.email}</TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell className="uppercase">{row.status}</TableCell>
                    <TableCell>{row.reviewedBy ?? "-"}</TableCell>
                    <TableCell>
                      {row.reviewedAt ? formatDate(row.reviewedAt) : "-"}
                    </TableCell>
                    <TableCell
                      className="sticky right-0 z-10 py-0"
                      style={{
                        boxShadow: "1px 0 0 hsl(var(--border)) inset",
                      }}
                    >
                      <Button variant="outline" asChild>
                        <Link href={`/admin/access-requests/${row.userId}`}>
                          Review
                          <ArrowRightIcon className="-mr-1 ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ));
              }}
            </RenderQueryResult>
          </TableBody>
        </Table>
      </div>

      {accessRequestsQuery.isSuccess && (
        <TablePagination
          totalCount={accessRequestsQuery.data.total}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          pageIndex={pageIndex}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}
