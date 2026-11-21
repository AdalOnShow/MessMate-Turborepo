import { getTranslations } from "next-intl/server";
import { Container, SectionHeading } from "./ui";

const RATE = 68.5;

/** Meals × rate = meal cost; deposits − meal cost = balance. Kept to whole
 *  taka so the table reads like a settled month. */
const MEMBERS = [
  { name: "Adal", meals: 42, paid: 4127 },
  { name: "Fahad", meals: 38, paid: 2923 },
  { name: "Rahim", meals: 40, paid: 2260 },
  { name: "Karim", meals: 36, paid: 3076 },
];

const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;
const signed = (n: number) => `${n < 0 ? "−" : "+"}${taka(Math.abs(n))}`;

export async function AccountingSection() {
  const t = await getTranslations("landing.accounting");

  return (
    <section
      id="accounting"
      className="scroll-mt-20 border-t border-border py-20 lg:py-28"
    >
      <Container>
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-sm font-semibold text-foreground-muted">
              {t("rateLabel")}
            </p>
            <p className="mt-1 font-heading text-[clamp(3.5rem,8vw,5.5rem)] font-extrabold leading-none tracking-[-0.04em] text-primary">
              ৳68.50
            </p>
            <p className="mt-3 text-[15px] text-foreground-body">
              {t("rateWorking")}
            </p>

            <ul className="mt-8 space-y-3 border-t border-border pt-6">
              {(["rate", "cost", "balance"] as const).map((key) => (
                <li
                  key={key}
                  className="text-[15px] leading-relaxed text-foreground-muted"
                >
                  {t(`lines.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="w-full min-w-[340px] whitespace-nowrap text-left text-sm">
                <caption className="border-b border-border px-4 sm:px-5 py-4 text-left font-heading text-base font-semibold text-foreground">
                  {t("table.caption")}
                </caption>
                <thead>
                  <tr className="text-xs text-foreground-muted">
                    <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                      {t("table.member")}
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-right font-medium sm:px-3"
                    >
                      {t("table.meals")}
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-right font-medium sm:px-3"
                    >
                      {t("table.cost")}
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-right font-medium sm:px-3"
                    >
                      {t("table.paid")}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium sm:px-5"
                    >
                      {t("table.balance")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border border-t border-border">
                  {MEMBERS.map((m) => {
                    const cost = Math.round(m.meals * RATE);
                    const balance = m.paid - cost;
                    return (
                      <tr key={m.name}>
                        <th
                          scope="row"
                          className="px-4 py-3.5 font-semibold sm:px-5 text-foreground"
                        >
                          {m.name}
                        </th>
                        <td className="px-2 py-3.5 text-right sm:px-3 text-foreground-body">
                          {m.meals}
                        </td>
                        <td className="px-2 py-3.5 text-right sm:px-3 text-foreground-body">
                          {taka(cost)}
                        </td>
                        <td className="px-2 py-3.5 text-right sm:px-3 text-foreground-body">
                          {taka(m.paid)}
                        </td>
                        <td
                          className={`px-4 py-3.5 text-right font-bold sm:px-5 ${
                            balance < 0 ? "text-destructive" : "text-success"
                          }`}
                        >
                          {signed(balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-foreground-muted">
              {t("rollNote")}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
