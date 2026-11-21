import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/** Root of every public marketing page: the dark brand theme, the public
 *  type (`.landing` in globals.css), the navbar and the footer. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="landing-dark landing min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
