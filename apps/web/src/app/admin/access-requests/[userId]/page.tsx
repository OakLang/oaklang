import AppBar from "../../app-bar";
import AccessRequestDetails from "./access-request-details";

export default function AccessRequestReviewPage({
  params,
}: {
  params: { userId: string };
}) {
  return (
    <>
      <AppBar
        title={`Access Request #${params.userId}`}
        backHref="/admin/access-requests"
      />
      <div className="mx-auto my-16 max-w-screen-lg px-4">
        <AccessRequestDetails userId={params.userId} />
      </div>
    </>
  );
}
