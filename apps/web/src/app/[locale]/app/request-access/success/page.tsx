import { revalidatePath } from "next/cache";
import { RedirectType } from "next/navigation";

import FullScreenMessage from "~/components/FullScreenMessage";
import { Button } from "~/components/ui/button";
import { redirect } from "~/i18n/routing";

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
          revalidatePath("/[locale]/app/[practiceLanguage]", "layout");
          redirect("/app", RedirectType.replace);
        }}
      >
        <Button>Dashboard</Button>
      </form>
    </FullScreenMessage>
  );
}
