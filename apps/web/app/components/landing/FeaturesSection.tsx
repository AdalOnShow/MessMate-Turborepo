export function FeaturesSection() {
  const features = [
    {
      title: "Meal Tracking",
      description: "Track daily meals for every member. Support custom meal types like Breakfast, Lunch, Dinner, Sehri, Iftar, and guest meals.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      )
    },
    {
      title: "Expense Management",
      description: "Handle daily bazaar entries, individual/shared bills, and kitchen expenses with manager approval workflows and digital receipts.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5m-18 0A1.5 1.5 0 0 1 3.75 3h16.5a1.5 1.5 0 0 1 1.5 1.5m-18 0v14.25a1.5 1.5 0 0 0 1.5 1.5H18a1.5 1.5 0 0 0 1.5-1.5V4.5m-15 4.5h12m-12 4.5h12M10.5 18H7.5" />
        </svg>
      )
    },
    {
      title: "Deposit Tracking",
      description: "Keep a transparent ledger of deposits made by each member. Instant notifications when balances run low.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6m18 0v3M3 6v3" />
        </svg>
      )
    },
    {
      title: "Monthly Accounting",
      description: "Auto-calculate average meal rates, member-wise cost summaries, carry forwards, and balance adjustments at month-end.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
        </svg>
      )
    },
    {
      title: "Member Roles & Access",
      description: "Assign mess managers and normal members. Set dynamic permissions for recording data and viewing balances.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      )
    },
    {
      title: "Detailed Audit Logs",
      description: "Every meal entry, expense update, or payment is recorded. Complete audit trails ensure 100% mess transparency.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    }
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-primary/3 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20 space-y-4">
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-accent-warm font-bengali uppercase">
            বৈশিষ্ট্যসমূহ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
            Everything You Need to Run Your <span className="text-primary">Mess</span>
          </h2>
          <div className="h-1 w-20 bg-primary/30 mx-auto rounded-full mt-2" />
          <p className="text-base sm:text-lg text-foreground-muted font-light leading-relaxed">
            Eliminate papers and spreadsheets. MessMate is a digital assistant built specifically to manage mess calculations, approvals, and reports.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="relative p-6 sm:p-8 rounded-2xl bg-surface border border-[rgba(148,163,184,0.1)] hover:border-primary/25 hover:bg-surface-raised transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-black/25 flex flex-col group hover:-translate-y-1.5"
            >
              {/* Icon container */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 text-primary flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-foreground font-heading mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-foreground-muted leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
