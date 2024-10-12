"use client";

import { useCallback } from "react";
import Link from "next/link";
import { UserIcon } from "lucide-react";
import { toast } from "sonner";

import InfoTable from "~/components/InfoTable";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";

export default function UserDetails({ userId }: { userId: string }) {
  const userQuery = api.admin.users.getUser.useQuery({ userId });

  const utils = api.useUtils();

  const blockUser = api.admin.users.blockUser.useMutation({
    onSuccess: () => {
      void utils.admin.users.getUser.invalidate({ userId });
      void utils.admin.users.getUsers.invalidate();
      toast(`User Blocked`);
    },
    onError: (error) => toast(error.message),
  });

  const unblockUser = api.admin.users.unblockUser.useMutation({
    onSuccess: () => {
      void utils.admin.users.getUser.invalidate({ userId });
      void utils.admin.users.getUsers.invalidate();
      toast(`User Unblocked`);
    },
    onError: (error) => toast(error.message),
  });

  const handleBlockUser = useCallback(() => {
    blockUser.mutate({ userId });
  }, [blockUser, userId]);

  const handleUnlockUser = useCallback(() => {
    unblockUser.mutate({ userId });
  }, [unblockUser, userId]);

  if (userQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (userQuery.isError) {
    return <p>{userQuery.error.message}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-4 font-semibold">Image</p>
        <div>
          <Avatar className="h-24 w-24">
            <AvatarFallback>
              <UserIcon className="h-10 w-10" />
            </AvatarFallback>
            {userQuery.data.image ? (
              <AvatarImage src={userQuery.data.image} />
            ) : null}
          </Avatar>
        </div>
      </div>

      <div>
        <p className="mb-4 font-semibold">User Info</p>
        <InfoTable
          data={Object.entries({
            Id: userQuery.data.id,
            "Joined At": formatDate(userQuery.data.createdAt),
            Name: userQuery.data.name ?? "-",
            Email: userQuery.data.email,
            "Email Verified": userQuery.data.emailVerified
              ? formatDate(userQuery.data.emailVerified)
              : "-",
            Role: userQuery.data.role,
            Blocked: userQuery.data.isBlocked ? "Yes" : "No",
          }).map((entry) => ({ label: entry[0], value: entry[1] }))}
        />
      </div>

      <div>
        <p className="mb-4 font-semibold">Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`mailto:${userQuery.data.email}`}>Send Email</Link>
          </Button>
          {userQuery.data.isBlocked ? (
            <Button
              variant="outline"
              onClick={handleUnlockUser}
              disabled={blockUser.isPending}
            >
              Unblock User
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleBlockUser}
              disabled={unblockUser.isPending}
            >
              Block User
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
