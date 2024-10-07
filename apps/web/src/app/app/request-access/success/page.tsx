import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import FullScreenMessage from "~/components/FullScreenMessage";
import { Button } from "~/components/ui/button";

export default function SuccessPage() {
  return (
    <FullScreenMessage
      title="Access Request Submitted Successfully!"
      description="Thank you! Your request has been successfully submitted. Our team is reviewing it, and we’ll get back to you shortly with further details."
    >
      <form
        // eslint-disable-next-line @typescript-eslint/require-await
        action={async () => {
          "use server";
          revalidatePath("/app/[practiceLanguage]", "layout");
          redirect("/app", RedirectType.replace);
        }}
      >
        <Button>Dashboard</Button>
      </form>
    </FullScreenMessage>
  );
}
