import AppBar from "../../app-bar";
import AccessRequestDetails from "./access-request-details";

export default async function AccessRequestReviewPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await props.params;

  return (
    <>
      <AppBar
        breadcrumb={[
          { href: "/admin/access-requests", title: "Access Requests" },
        ]}
        pageTitle={userId}
      />
      <div className="mx-auto my-16 w-full max-w-screen-lg px-4">
        <AccessRequestDetails userId={userId} />
      </div>
    </>
  );
}
