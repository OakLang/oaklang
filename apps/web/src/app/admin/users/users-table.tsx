"use client";

import { useState } from "react";
import { CheckIcon, MoreHorizontalIcon, UserIcon, XIcon } from "lucide-react";

import TablePagination from "~/components/TablePagination";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
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
import { unimplementedToast } from "~/utils/helpers";

export default function UsersTable() {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const usersQuery = api.admin.users.getUsers.useQuery({
    size: pageSize,
    page: pageIndex,
  });

  return (
    <div>
      <div className="mb-4 flex">
        <Input className="w-full max-w-md" placeholder="Search" />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>
                <Checkbox />
              </TableHead> */}
              <TableHead>Avatar</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined At</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead
                className="sticky right-0 z-10"
                style={{
                  boxShadow: "1px 0 0 hsl(var(--border)) inset",
                }}
              ></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isPending ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <p>Loading...</p>
                </TableCell>
              </TableRow>
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <p>{usersQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : usersQuery.data.list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <p>No result...</p>
                </TableCell>
              </TableRow>
            ) : (
              usersQuery.data.list.map((user) => (
                <TableRow key={user.id}>
                  {/* <TableCell>
                    <Checkbox />
                  </TableCell> */}
                  <TableCell>
                    <Avatar>
                      <AvatarFallback>
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                      {user.image ? <AvatarImage src={user.image} /> : null}
                    </Avatar>
                  </TableCell>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <XIcon className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell
                    className="sticky right-0 z-10 w-12 py-0"
                    style={{
                      boxShadow: "1px 0 0 hsl(var(--border)) inset",
                    }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={unimplementedToast}
                    >
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {usersQuery.isSuccess && (
        <TablePagination
          totalCount={usersQuery.data.total}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          pageIndex={pageIndex}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}
