import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";

import { Button } from "~/components/ui/button";
import { Link } from "~/i18n/routing";

interface Props {
  params: { locale: string };
}

const NotFoundPage = ({ params: { locale } }: Props) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("not-found");

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-muted-foreground">{t("title")}</p>
      <Button asChild className="mt-4">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
