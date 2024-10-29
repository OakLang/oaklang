import { count, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { accessRequestsTable, usersTable } from "@acme/db/schema";

import InfoTable from "~/components/InfoTable";
import AppBar from "./app-bar";

export default async function AdminOverviewPage() {
  const totalUsersPromise = db
    .select({ count: count() })
    .from(usersTable)
    .then((res) => res[0]?.count ?? 0);

  const pendingAccessRequestsPromise = db
    .select({ count: count() })
    .from(accessRequestsTable)
    .where(eq(accessRequestsTable.status, "pending"))
    .then((res) => res[0]?.count ?? 0);

  const totalTestersPromise = db
    .select({
      count: count(),
    })
    .from(accessRequestsTable)
    .where(eq(accessRequestsTable.status, "accepted"))
    .then((res) => res[0]?.count ?? 0);

  const [totalUsers, totalTesters, pendingAccessRequests] = await Promise.all([
    totalUsersPromise,
    totalTestersPromise,
    pendingAccessRequestsPromise,
  ]);

  return (
    <>
      <AppBar pageTitle="Overview" />
      <div className="mx-auto my-16 w-full max-w-screen-xl px-4">
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
