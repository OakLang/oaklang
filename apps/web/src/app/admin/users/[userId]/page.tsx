import AppBar from "../../app-bar";
import UserDetails from "./user-details";

export default async function UserPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await props.params;

  return (
    <>
      <AppBar
        breadcrumb={[{ href: "/admin/users", title: "Users" }]}
        pageTitle={userId}
      />
      <div className="mx-auto my-16 w-full max-w-screen-lg px-4">
        <UserDetails userId={userId} />
      </div>
    </>
  );
}
