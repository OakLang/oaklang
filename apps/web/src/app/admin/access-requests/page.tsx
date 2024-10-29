import AppBar from "../app-bar";
import AccessRequestsTable from "./access-requests-table";

export default function AccessRequestsPage() {
  return (
    <>
      <AppBar pageTitle="Access Requests" />
      <div className="mx-auto my-16 w-full max-w-screen-xl px-4">
        <AccessRequestsTable />
      </div>
    </>
  );
}
