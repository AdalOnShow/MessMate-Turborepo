export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden bg-background">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] rounded-full bg-accent-warm/5 blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern Background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none opacity-60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Text */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Bengali Accent Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-warm/10 border border-accent-warm/20 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-ping" />
              <span className="text-xs font-semibold tracking-wider text-accent-warm font-bengali">
                মেস ম্যানেজমেন্ট এখন আরও সহজ
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-heading leading-tight sm:leading-none">
              Manage Your Mess, <br className="hidden sm:inline" />
              <span className="relative inline-block mt-2">
                The <span className="text-primary bg-clip-text">Smart</span> Way
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              Track meals, split bazaar costs, monitor member deposits & generate crystal-clear monthly reports instantly. Designed specially for students and bachelor messes in Bangladesh.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-background bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 cursor-pointer"
              >
                Start Free
              </a>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-primary border border-primary/30 hover:border-primary hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                See How It Works
              </a>
            </div>

            {/* Micro details */}
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-6 text-sm text-foreground-muted/80">
              <div className="flex items-center gap-1.5">
                <svg className="w-4.5 h-4.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                No Card Required
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4.5 h-4.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Setup in 2 mins
              </div>
            </div>
          </div>

          {/* Interactive UI Mockup */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-105 aspect-square lg:aspect-auto lg:h-112.5 rounded-2xl bg-linear-to-b from-surface-raised to-surface border border-[rgba(148,163,184,0.15)] shadow-2xl p-6 flex flex-col justify-between overflow-hidden group hover:border-primary/20 transition-all duration-300 animate-float">
              
              {/* Card decorative line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary via-accent-warm to-primary/50" />

              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-[rgba(148,163,184,0.1)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    MM
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground font-heading">Niloy&apos;s Mess</h3>
                    <p className="text-xs text-foreground-muted font-bengali">চলতি মাস: জুন ২০২৬</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-success/15 text-success">
                  Active
                </span>
              </div>

              {/* Mockup Stats */}
              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-3.5 rounded-xl bg-background/50 border border-[rgba(148,163,184,0.08)]">
                  <span className="text-xs text-foreground-muted block mb-1">Meal Rate (গড়)</span>
                  <span className="text-lg font-bold text-accent-warm">৳২৪.৫০</span>
                </div>
                <div className="p-3.5 rounded-xl bg-background/50 border border-[rgba(148,163,184,0.08)]">
                  <span className="text-xs text-foreground-muted block mb-1">Total Bazaar</span>
                  <span className="text-lg font-bold text-foreground">৳১৫,৪২০</span>
                </div>
              </div>

              {/* Mockup List */}
              <div className="space-y-3 flex-1 overflow-hidden">
                <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider block">Today&apos;s Meals</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-[rgba(148,163,184,0.08)] hover:bg-background/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/25 flex items-center justify-center text-xs font-bold text-foreground">AS</div>
                      <span className="text-sm font-medium text-foreground">Adid S.</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">2.5 Meals</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-[rgba(148,163,184,0.08)] hover:bg-background/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-accent-warm/25 flex items-center justify-center text-xs font-bold text-foreground">IM</div>
                      <span className="text-sm font-medium text-foreground">Imran H.</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">3.0 Meals</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-[rgba(148,163,184,0.08)] hover:bg-background/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-success/25 flex items-center justify-center text-xs font-bold text-foreground">FH</div>
                      <span className="text-sm font-medium text-foreground">Fahim H.</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">2.0 Meals</span>
                  </div>
                </div>
              </div>

              {/* Bottom tag */}
              <div className="mt-4 pt-3 border-t border-[rgba(148,163,184,0.08)] flex items-center justify-between text-xs text-foreground-muted">
                <span>Last entry: 10 mins ago</span>
                <span className="text-primary hover:underline cursor-pointer flex items-center gap-1 font-semibold">
                  Update Meals
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
