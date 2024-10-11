"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";
import AppBar from "../../app-bar";

export default function AccessRequestReviewPage() {
  const { userId } = useParams<{ userId: string }>();
  const accessRequest = api.admin.users.getAccessRequest.useQuery({ userId });

  const utils = api.useUtils();

  const reviewAccessRequestMut =
    api.admin.users.reviewAccessRequest.useMutation({
      onSuccess: (_, vars) => {
        if (vars.status === "accepted") {
          toast(`Access request accepted for user with id ${vars.userId}`);
        } else {
          toast(`Access request rejected for user with id ${vars.userId}`);
        }
        void utils.admin.users.getAccessRequest.invalidate({ userId });
        void utils.admin.users.getAccessRequests.invalidate();
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

  return (
    <>
      <AppBar
        title={`Access Request #${userId}`}
        backHref="/admin/access-requests"
      />
      <div className="mx-auto my-16 max-w-screen-xl px-4">
        {accessRequest.isPending ? (
          <p>Loading...</p>
        ) : accessRequest.isError ? (
          <p>{accessRequest.error.message}</p>
        ) : (
          <div className="space-y-16">
            <div>
              <p className="mb-4 font-semibold">Review</p>
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-4">
                  <p>Requested At:</p>
                  <p>{formatDate(accessRequest.data.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p>Status:</p>
                  <p>{accessRequest.data.status}</p>
                </div>
                {accessRequest.data.reviewer && (
                  <div className="flex items-center gap-4">
                    <p>Reviewed By:</p>
                    <div>
                      <p>{accessRequest.data.reviewer.name}</p>
                    </div>
                  </div>
                )}
                {accessRequest.data.reviewedAt && (
                  <div className="flex items-center gap-4">
                    <p>Reviewed At:</p>
                    <p>{formatDate(accessRequest.data.reviewedAt)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
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
              <div className="grid">
                {Object.entries({
                  Id: accessRequest.data.user.id,
                  "Joined At": formatDate(accessRequest.data.user.createdAt),
                  Name: accessRequest.data.user.name,
                  Email: accessRequest.data.user.email,
                  Blocked: accessRequest.data.user.isBlocked ? "Yes" : "No",
                }).map((entry) => (
                  <div
                    key={entry[0]}
                    className="odd:bg-secondary/50 grid grid-cols-2"
                  >
                    <div className="p-2">{entry[0]}</div>
                    <div className="p-2">{entry[1]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
