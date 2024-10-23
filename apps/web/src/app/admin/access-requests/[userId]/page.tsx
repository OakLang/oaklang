import AppBar from "../../app-bar";
import AccessRequestDetails from "./access-request-details";

export default async function AccessRequestReviewPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await props.params;

  return (
    <>
      <AppBar
        title={`Access Request #${userId}`}
        backHref="/admin/access-requests"
      />
      <div className="mx-auto my-16 max-w-screen-lg px-4">
        <AccessRequestDetails userId={userId} />
      </div>
    </>
  );
}
