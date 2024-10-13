import { count, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { accessRequests, users } from "@acme/db/schema";

import InfoTable from "~/components/InfoTable";
import AppBar from "./app-bar";

export default async function AdminOverviewPage() {
  const totalUsersPromise = db
    .select({ count: count() })
    .from(users)
    .then((res) => res[0]?.count ?? 0);

  const pendingAccessRequestsPromise = db
    .select({ count: count() })
    .from(accessRequests)
    .where(eq(accessRequests.status, "pending"))
    .then((res) => res[0]?.count ?? 0);

  const totalTestersPromise = db
    .select({
      count: count(),
    })
    .from(accessRequests)
    .where(eq(accessRequests.status, "accepted"))
    .then((res) => res[0]?.count ?? 0);

  const [totalUsers, totalTesters, pendingAccessRequests] = await Promise.all([
    totalUsersPromise,
    totalTestersPromise,
    pendingAccessRequestsPromise,
  ]);

  return (
    <>
      <AppBar title="Overview" />
      <div className="container mx-auto my-16 max-w-screen-xl px-4">
        <div>
          <p className="mb-4 font-semibold">Stats</p>
          <InfoTable
            data={[
              {
                label: "Total Users",
                value: totalUsers.toLocaleString(),
              },
              {
                label: "Total Testers",
                value: totalTesters.toLocaleString(),
              },
              {
                label: "Access Requests Pending",
                value: pendingAccessRequests.toLocaleString(),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
