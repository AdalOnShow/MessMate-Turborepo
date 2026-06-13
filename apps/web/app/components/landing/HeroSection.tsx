export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center pt-24 bg-background relative overflow-hidden">
      {/* Soft ambient blur behind mockup */}
      <div className="absolute top-1/3 right-0 w-150 h-150 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Text */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-warm/10 border border-accent-warm/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-warm" />
              <span className="text-xs font-semibold tracking-wider text-accent-warm font-bengali">
                মেস ম্যানেজমেন্ট এখন আরও সহজ
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-heading leading-tight sm:leading-none">
              Manage Your Mess, <br className="hidden sm:inline" />
              <span className="relative inline-block mt-2">
                The <span className="text-primary">Smart</span> Way
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              Track meals, split bazaar costs, monitor member deposits &
              generate crystal-clear monthly reports instantly. Designed for
              students and bachelor messes in Bangladesh.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-background bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 cursor-pointer"
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
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-6 text-sm text-foreground-muted">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4.5 h-4.5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                No Card Required
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4.5 h-4.5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Setup in 2 mins
              </div>
            </div>
          </div>

          {/* UI Mockup Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-scale-in">
            <div className="relative w-full max-w-105 aspect-square lg:aspect-auto lg:h-112.5 rounded-2xl bg-surface-raised border border-foreground-muted/10 p-6 flex flex-col justify-between overflow-hidden">
              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-foreground-muted/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    MM
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground font-heading">
                      Niloy&apos;s Mess
                    </h3>
                    <p className="text-xs text-foreground-muted font-bengali">
                      চলতি মাস: জুন ২০২৬
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-success/15 text-success">
                  Active
                </span>
              </div>

              {/* Mockup Stats */}
              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-3.5 rounded-xl bg-background/50 border border-foreground-muted/10">
                  <span className="text-xs text-foreground-muted block mb-1">
                    Meal Rate (গড়)
                  </span>
                  <span className="text-lg font-bold text-accent-warm">
                    ৳২৪.৫০
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-background/50 border border-foreground-muted/10">
                  <span className="text-xs text-foreground-muted block mb-1">
                    Total Bazaar
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    ৳১৫,৪২০
                  </span>
                </div>
              </div>

              {/* Mockup List */}
              <div className="space-y-3 flex-1 overflow-hidden">
                <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider block">
                  Today&apos;s Meals
                </span>
                <div className="space-y-2">
                  {[
                    {
                      initials: "AS",
                      name: "Adid S.",
                      meals: "2.5 Meals",
                      color: "bg-primary/25",
                    },
                    {
                      initials: "IM",
                      name: "Imran H.",
                      meals: "3.0 Meals",
                      color: "bg-accent-warm/25",
                    },
                    {
                      initials: "FH",
                      name: "Fahim H.",
                      meals: "2.0 Meals",
                      color: "bg-success/25",
                    },
                  ].map((member) => (
                    <div
                      key={member.initials}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-foreground-muted/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-foreground`}
                        >
                          {member.initials}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {member.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {member.meals}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom tag */}
              <div className="mt-4 pt-3 border-t border-foreground-muted/10 flex items-center justify-between text-xs text-foreground-muted">
                <span>Last entry: 10 mins ago</span>
                <span className="text-primary hover:underline cursor-pointer flex items-center gap-1 font-semibold">
                  Update Meals
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
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
