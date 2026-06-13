export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Create Your Mess",
      description:
        "Set up your mess profile in seconds. Choose meal types (Lunch, Dinner, Sehri, etc.) and configure rules.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      ),
    },
    {
      number: "2",
      title: "Invite Members",
      description:
        "Generate a unique secure invite code. Shared-flat roommates and hostel members can join instantly.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235A8.902 8.902 0 0 1 9 18c2.28 0 4.354.856 5.93 2.263l-.004.037a8.9 8.9 0 0 1-11.926 0l-.004-.037Z"
          />
        </svg>
      ),
    },
    {
      number: "3",
      title: "Record Meals & Bazaar",
      description:
        "Log daily meal intakes and update bazaar costs. Managers can bulk-enter records to save time.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0Z"
          />
        </svg>
      ),
    },
    {
      number: "4",
      title: "Auto-Calculate Reports",
      description:
        "View real-time meal rates, total deposits, and month-end net balances. Clear receipts for everyone.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 18.375v-5.25ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-9.75ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 lg:py-28 bg-surface border-y border-foreground-muted/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20 space-y-4">
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-accent-warm font-bengali uppercase">
            কিভাবে কাজ করে
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
            How <span className="text-primary">MessMate</span> Works
          </h2>
          <div className="h-1 w-20 bg-primary/30 mx-auto rounded-full mt-2" />
          <p className="text-base sm:text-lg text-foreground-muted font-light leading-relaxed">
            Get started in minutes. Our smooth dashboard and structured process
            make mess accounting clear for students.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-foreground-muted/10 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Step Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-background text-xs font-bold flex items-center justify-center border-2 border-surface">
                  {step.number}
                </div>
              </div>

              {/* Step Content */}
              <h3 className="text-lg sm:text-xl font-bold text-foreground font-heading mb-3">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base text-foreground-muted font-light leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
