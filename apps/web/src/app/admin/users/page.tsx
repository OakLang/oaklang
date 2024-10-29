import AppBar from "../app-bar";
import UsersTable from "./users-table";

export default function UsersPage() {
  return (
    <>
      <AppBar pageTitle="Users" />
      <div className="mx-auto my-16 w-full max-w-screen-xl px-4">
        <UsersTable />
      </div>
    </>
  );
}
