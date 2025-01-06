"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";

import RenderQueryResult from "~/components/RenderQueryResult";
import TablePagination from "~/components/TablePagination";
import { Input } from "~/components/ui/input";
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
import AppBar from "../app-bar";

export default function PageClient() {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [queryText, setQueryText] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getAIUsageListQuery = api.admin.aiUsage.getAIUsageList.useQuery({
    page: pageIndex,
    size: pageSize,
    query: queryText.trim(),
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
    <>
      <AppBar pageTitle="AI Usage" />
      <div className="mx-auto my-16 w-full max-w-screen-xl px-4">
        <div>
          <div className="mb-4 flex">
            <Input
              className="w-full max-w-md"
              placeholder="Search id, user id, user email, type, ..."
              defaultValue={queryText}
              onChange={(e) => handleSetQueryText(e.currentTarget.value)}
            />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>User Id</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>AI Model</TableHead>
                  <TableHead>Generation Type</TableHead>
                  <TableHead>Token Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <RenderQueryResult
                  query={getAIUsageListQuery}
                  renderLoading={() => (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <p>Loading...</p>
                      </TableCell>
                    </TableRow>
                  )}
                  renderError={({ error }) => (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <p>{error.message}</p>
                      </TableCell>
                    </TableRow>
                  )}
                >
                  {({ data }) => {
                    if (data.list.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <p>No result...</p>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return data.list.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            href={`/admin/ai-usage/${row.id}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {row.id}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(row.createdAt)}</TableCell>
                        <TableCell>
                          {row.userId ? (
                            <Link
                              href={`/admin/users/${row.userId}`}
                              className="underline-offset-2 hover:underline"
                            >
                              {row.userId}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{row.userEmail ?? "-"}</TableCell>
                        <TableCell>{row.type ?? "-"}</TableCell>
                        <TableCell>{row.platform ?? "-"}</TableCell>
                        <TableCell>{row.model ?? "-"}</TableCell>
                        <TableCell>{row.generationType ?? "-"}</TableCell>
                        <TableCell>
                          {row.tokenCount?.toLocaleString() ?? "-"}
                        </TableCell>
                      </TableRow>
                    ));
                  }}
                </RenderQueryResult>
              </TableBody>
            </Table>
          </div>

          {getAIUsageListQuery.isSuccess && (
            <TablePagination
              totalCount={getAIUsageListQuery.data.total}
              onPageIndexChange={setPageIndex}
              onPageSizeChange={setPageSize}
              pageIndex={pageIndex}
              pageSize={pageSize}
            />
          )}
        </div>
      </div>
    </>
  );
}
