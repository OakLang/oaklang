"use client";

import { useCallback, useState } from "react";
import { UserIcon } from "lucide-react";
import { toast } from "sonner";

import type { UserRole } from "@acme/db/schema";

import InfoTable from "~/components/InfoTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";

export default function UserDetails({ userId }: { userId: string }) {
  const userQuery = api.admin.users.getUser.useQuery({ userId });
  const [userRoleChangeDialogOpen, setUserRoleChangeDialogOpen] =
    useState(false);

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
          <Dialog
            open={userRoleChangeDialogOpen}
            onOpenChange={setUserRoleChangeDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">Change Role</Button>
            </DialogTrigger>
            <DialogContent>
              <ChangeRoleDialogContent
                userId={userId}
                role={userQuery.data.role}
                onSuccess={() => {
                  setUserRoleChangeDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
          {userQuery.data.isBlocked ? (
            <Button
              variant="outline"
              onClick={handleUnlockUser}
              disabled={unblockUser.isPending}
            >
              Unblock User
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={blockUser.isPending}>
                  Block User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Block {userQuery.data.name ?? userQuery.data.email}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to block this user?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={handleBlockUser}
                      disabled={blockUser.isPending}
                    >
                      Block User
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

const ChangeRoleDialogContent = ({
  role: initRole,
  userId,
  onSuccess,
}: {
  role: UserRole;
  userId: string;
  onSuccess?: () => void;
}) => {
  const [role, setRole] = useState(initRole);
  const utils = api.useUtils();

  const changeRoleMut = api.admin.users.changeRole.useMutation({
    onSuccess: (_, vars) => {
      toast(`User role changed from ${initRole} to ${vars.role}`);
      void utils.admin.users.getUser.invalidate({ userId });
      void utils.admin.users.getUsers.invalidate();
      onSuccess?.();
    },
    onError: (error) => toast(error.message),
  });

  const handleChange = useCallback(() => {
    changeRoleMut.mutate({ role, userId });
  }, [changeRoleMut, role, userId]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change Role</DialogTitle>
      </DialogHeader>
      <div>
        <RadioGroup
          defaultValue={initRole}
          onValueChange={(value) => setRole(value as UserRole)}
        >
          {[
            { name: "Admin", value: "admin" },
            { name: "Power User", value: "power" },
            { name: "User", value: "user" },
          ].map((item) => (
            <div key={item.value} className="flex items-center space-x-2">
              <RadioGroupItem value={item.value} id={item.value} />
              <Label htmlFor={item.value}>{item.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
        </DialogClose>
        <Button
          onClick={handleChange}
          disabled={changeRoleMut.isPending || changeRoleMut.isSuccess}
        >
          Change
        </Button>
      </DialogFooter>
    </>
  );
};
