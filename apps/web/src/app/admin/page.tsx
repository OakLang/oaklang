import { Suspense } from "react";
import Link from "next/link";

import { count, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { accessRequests, users } from "@acme/db/schema";

import AppBar from "./app-bar";

export default async function AdminOverviewPage() {
  const totalUsers = db.select({ count: count() }).from(users);

  const newAccessRequests = db
    .select({ count: count() })
    .from(accessRequests)
    .where(eq(accessRequests.status, "pending"));

  return (
    <>
      <AppBar title="Overview" />
      <div className="container mx-auto my-16 max-w-screen-xl px-4">
        <p>
          Total Users:{" "}
          <Suspense fallback={<p>Loading...</p>}>
            <span>{(await totalUsers)[0]?.count ?? 0}</span>
          </Suspense>
        </p>
        <p>
          Pending Access Requests:{" "}
          <Suspense fallback={<p>Loading...</p>}>
            <span>{(await newAccessRequests)[0]?.count ?? 0}</span>
          </Suspense>
          <Link
            href="/admin/access-requests"
            className="ml-2 font-medium underline underline-offset-4"
          >
            Manage Access Requests
          </Link>
        </p>
      </div>
    </>
  );
}
