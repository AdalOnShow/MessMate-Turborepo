import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { ErrorScreen } from "./components/feedback/ErrorScreen";

export const metadata: Metadata = {
  title: "pageNotFoundMessmate",
};

export default function NotFound() {
  const t = useTranslations("misc.notFound");
  return (
    <ErrorScreen
      fullScreen
      icon={Compass}
      code="404"
      title={t("pageNotFound")}
      description={t("pageReLookingDoesn")}
      homeHref="/"
      homeLabel={t("goHome")}
    />
  );
}
