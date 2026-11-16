import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { ErrorScreen } from "./components/feedback/ErrorScreen";

export const metadata: Metadata = {
  title: "Page not found — MessMate",
};

export default function NotFound() {
  return (
    <ErrorScreen
      fullScreen
      icon={Compass}
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved. Check the address, or head back home."
      homeHref="/"
      homeLabel="Go home"
    />
  );
}
