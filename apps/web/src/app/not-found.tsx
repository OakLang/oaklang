import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui/button";

export default function NotFound() {
  const t = useTranslations("NotFoundPage");

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-muted-foreground">{t("title")}</p>
      <Button asChild className="mt-4">
        <Link href="/home">{t("home")}</Link>
      </Button>
    </div>
  );
}
