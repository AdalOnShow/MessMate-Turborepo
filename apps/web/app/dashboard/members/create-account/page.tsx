import { Suspense } from "react";
import CreateAccountForm from "./CreateAccountForm";

export default function CreateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background pb-20 lg:ml-72 lg:pb-8">
          <main className="px-4 py-8 lg:px-8">
            <div className="mx-auto max-w-lg space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-foreground-muted/20" />
              <div className="h-64 w-full animate-pulse rounded bg-foreground-muted/20" />
            </div>
          </main>
        </div>
      }
    >
      <CreateAccountForm />
    </Suspense>
  );
}
