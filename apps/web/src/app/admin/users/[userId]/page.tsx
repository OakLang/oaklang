import AppBar from "../../app-bar";
import UserDetails from "./user-details";

export default function UserPage({ params }: { params: { userId: string } }) {
  return (
    <>
      <AppBar backHref="/admin/users" title={`User #${params.userId}`} />
      <div className="mx-auto my-16 max-w-screen-lg px-4">
        <UserDetails userId={params.userId} />
      </div>
    </>
  );
}
