import AppBar from "../../app-bar";
import UserDetails from "./user-details";

export default async function UserPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await props.params;

  return (
    <>
      <AppBar backHref="/admin/users" title={`User #${userId}`} />
      <div className="mx-auto my-16 max-w-screen-lg px-4">
        <UserDetails userId={userId} />
      </div>
    </>
  );
}
