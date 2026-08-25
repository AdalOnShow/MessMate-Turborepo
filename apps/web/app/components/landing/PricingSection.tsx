export function PricingSection() {
  const plans = [
    {
      name: "Free",
      bengaliTag: "পারফেক্ট শুরুর জন্য",
      price: "৳0",
      period: "/ month",
      description:
        "Perfect for single bachelor flats or small student messes starting out.",
      features: [
        "1 Mess Profile",
        "Up to 10 Members",
        "Basic Meal Tracking",
        "Standard Monthly Reports",
        "Email Support",
      ],
      cta: "Get Started",
      highlight: false,
      href: "#",
    },
    {
      name: "Pro",
      bengaliTag: "সবচেয়ে জনপ্রিয়",
      price: "৳299",
      period: "/ month",
      description:
        "Ideal for growing messes and active hostels wanting full automation.",
      features: [
        "Unlimited Mess Profiles",
        "Unlimited Members",
        "Advanced Meal Configurations",
        "Detailed Bazaar Approvals",
        "Expense Splitting & Ledgers",
        "Priority 24/7 Support",
      ],
      cta: "Start Free Trial",
      highlight: true,
      href: "#",
    },
    {
      name: "Enterprise",
      bengaliTag: "বড় প্রতিষ্ঠানের জন্য",
      price: "Custom",
      period: "",
      description:
        "For student dormitories, massive hostels, or multi-branch organizations.",
      features: [
        "Everything in Pro",
        "Custom ERP Integrations",
        "Dedicated Account Manager",
        "SLA Guarantee (99.9% Uptime)",
        "Custom Payment Gateways",
      ],
      cta: "Contact Us",
      highlight: false,
      href: "#",
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24 space-y-4">
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-accent-warm font-bengali uppercase">
            মূল্য পরিকল্পনা
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
            Simple, Transparent <span className="text-primary">Pricing</span>
          </h2>
          <div className="h-1 w-20 bg-primary/30 mx-auto rounded-full mt-2" />
          <p className="text-base sm:text-lg text-foreground-muted font-light leading-relaxed">
            Choose the perfect plan for your mess. Start free, upgrade anytime.
            No hidden fees.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-8 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                plan.highlight
                  ? "bg-surface-raised border-2 border-primary"
                  : "bg-surface border border-foreground-muted/10 hover:-translate-y-1 hover:border-foreground-muted/20"
              }`}
            >
              {/* Highlight Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-warm text-background text-xs font-bold px-4 py-1.5 rounded-full font-heading uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-foreground font-heading">
                    {plan.name}
                  </h3>
                  <span className="text-xs font-bold text-accent-warm bg-accent-warm/10 px-2.5 py-1 rounded-md font-bengali">
                    {plan.bengaliTag}
                  </span>
                </div>

                <p className="text-sm text-foreground-muted mb-6 leading-relaxed font-light">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl sm:text-5xl font-black text-foreground font-heading tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-semibold text-foreground-muted ml-2">
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-foreground-muted/10 w-full mb-8" />

                {/* Feature List */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="w-4 h-4 text-primary shrink-0 mt-0.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span className="text-sm sm:text-base text-foreground/90 font-light">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA button */}
              <a
                href={plan.href}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-center active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                  plan.highlight
                    ? "bg-primary text-background hover:bg-primary-hover"
                    : "bg-surface-raised border border-primary/30 text-primary hover:bg-primary/5"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
