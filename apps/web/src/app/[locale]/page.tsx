import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { auth } from "@acme/auth";

import { Button } from "~/components/ui/button";
import { Link } from "~/i18n/routing";

export default async function HomePage() {
  const session = await auth();
  const t = useTranslations("HomePage");

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-center text-3xl font-medium">{t("title")}</h1>
        {session ? (
          <Button asChild>
            <Link href="/app">
              {t("dashboard")}
              <ArrowRight className="-mr-1 ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/login">
              {t("sign-in")}
              <ArrowRight className="-mr-1 ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
