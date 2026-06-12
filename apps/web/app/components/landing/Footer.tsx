export function Footer() {
  return (
    <footer className="bg-surface border-t border-[rgba(148,163,184,0.15)] relative pt-16 pb-8 overflow-hidden">

      {/* Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12">

          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <a href="#" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5.5 h-5.5 text-primary"
                >
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground font-heading">
                Mess<span className="text-primary">Mate</span>
              </span>
            </a>

            <p className="text-xs sm:text-sm font-semibold text-accent-warm font-bengali">
              মেস ম্যানেজমেন্ট সহজ করুন
            </p>

            <p className="text-sm text-foreground-muted max-w-sm leading-relaxed font-light">
              Simplifying meal tracking, deposit monitoring, and shared expenses for roommates and hostels in Bangladesh.
            </p>
          </div>

          {/* Product links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider font-heading">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#features" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider font-heading">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider font-heading">
              Legal & Community
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-foreground-muted hover:text-primary transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(148,163,184,0.1)] w-full my-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-foreground-muted font-light text-center sm:text-left">
            &copy; 2026 MessMate. All rights reserved. Made for messes in Bangladesh.
          </p>

          {/* Socials */}
          <div className="flex items-center gap-5">
            {/* Github */}
            <a
              href="#"
              className="text-foreground-muted hover:text-primary hover:scale-110 transition-all duration-200"
              aria-label="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
            {/* Twitter/X */}
            <a
              href="#"
              className="text-foreground-muted hover:text-primary hover:scale-110 transition-all duration-200"
              aria-label="Twitter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Facebook */}
            <a
              href="#"
              className="text-foreground-muted hover:text-primary hover:scale-110 transition-all duration-200"
              aria-label="Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
