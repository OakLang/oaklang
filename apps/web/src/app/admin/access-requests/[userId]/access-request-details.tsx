"use client";

import { useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

import InfoTable from "~/components/InfoTable";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";

export default function AccessRequestDetails({ userId }: { userId: string }) {
  const accessRequest = api.admin.accessRequests.getAccessRequest.useQuery({
    userId,
  });

  const utils = api.useUtils();

  const reviewAccessRequestMut =
    api.admin.accessRequests.reviewAccessRequest.useMutation({
      onSuccess: (_, vars) => {
        if (vars.status === "accepted") {
          toast(`Access request accepted for user with id ${vars.userId}`);
        } else {
          toast(`Access request rejected for user with id ${vars.userId}`);
        }
        void utils.admin.accessRequests.getAccessRequest.invalidate({ userId });
        void utils.admin.accessRequests.getAccessRequests.invalidate();
      },
      onError: (error) => {
        toast(error.message);
      },
    });

  const handleAcceptRequest = useCallback(() => {
    reviewAccessRequestMut.mutate({ status: "accepted", userId });
  }, [reviewAccessRequestMut, userId]);

  const handleRejectRequest = useCallback(() => {
    reviewAccessRequestMut.mutate({ status: "rejected", userId });
  }, [reviewAccessRequestMut, userId]);

  if (accessRequest.isPending) {
    return <p>Loading...</p>;
  }

  if (accessRequest.isError) {
    return <p>{accessRequest.error.message}</p>;
  }

  return (
    <div className="space-y-16">
      <div>
        <p className="mb-4 font-semibold">Review</p>
        <InfoTable
          data={Object.entries({
            "Requested At": formatDate(accessRequest.data.createdAt),
            Status: accessRequest.data.status,
            "Reviewed By": accessRequest.data.reviewer?.name ?? "-",
            "Reviewed At": accessRequest.data.reviewedAt
              ? formatDate(accessRequest.data.reviewedAt)
              : "-",
          }).map((entry) => ({ label: entry[0], value: entry[1] }))}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {accessRequest.data.status !== "accepted" && (
            <Button
              onClick={handleAcceptRequest}
              disabled={reviewAccessRequestMut.isPending}
            >
              Accept
            </Button>
          )}
          {accessRequest.data.status !== "rejected" && (
            <Button
              variant="destructive"
              onClick={handleRejectRequest}
              disabled={reviewAccessRequestMut.isPending}
            >
              Reject
            </Button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-4 font-semibold">Questioin & Answers</p>
        <div className="grid gap-4">
          {accessRequest.data.questionsAnswers.map((qa, i) => (
            <div key={qa.id} className="space-y-1">
              <p className="font-semibold">
                {i + 1}. {qa.question}
              </p>
              <div className="space-y-2 pl-4">
                {qa.answers.map((answer) => (
                  <div key={answer.id} className="space-y-1">
                    <p className="text-muted-foreground">
                      {answer.option.option}
                    </p>
                    {answer.option.isCustomAnswer && (
                      <p className="text-muted-foreground">
                        Custom Answer: {answer.customAnswer ?? "-"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 font-semibold">User Info</p>
        <InfoTable
          data={Object.entries({
            Id: accessRequest.data.user.id,
            "Joined At": formatDate(accessRequest.data.user.createdAt),
            Name: accessRequest.data.user.name ?? "-",
            Email: accessRequest.data.user.email,
            "Email Verified": accessRequest.data.user.emailVerified
              ? formatDate(accessRequest.data.user.emailVerified)
              : "-",
            Role: accessRequest.data.user.role,
            Blocked: accessRequest.data.user.isBlocked ? "Yes" : "No",
          }).map((entry) => ({ label: entry[0], value: entry[1] }))}
        />
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/admin/users/${accessRequest.data.userId}`}>
            View User
          </Link>
        </Button>
      </div>
    </div>
  );
}
