import AppBar from "../app-bar";
import AccessRequestsTable from "./access-requests-table";

export default function AccessRequestsPage() {
  return (
    <>
      <AppBar title="Access Requests" />
      <div className="mx-auto my-16 max-w-screen-xl px-4">
        <AccessRequestsTable />
      </div>
    </>
  );
}
