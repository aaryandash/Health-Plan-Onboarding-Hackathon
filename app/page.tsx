import Link from "next/link";

/**
 * Welcome — the first viewport of the direction contract in DESIGN.md.
 *
 * Its whole job is to answer "why are you about to ask me all this?" before a
 * single question appears, and to make clear that nothing here is mandatory.
 * The client brief is explicit that members arrive with "anxiety and learned
 * helplessness"; this screen is where that gets defused or made worse.
 */

const reassurances = [
  {
    lead: "It takes about two minutes.",
    detail:
      "Seven short groups of questions. If you have your insurance paperwork handy, it's closer to one.",
  },
  {
    lead: "Skip anything you can't find.",
    detail:
      "Every question can be left blank. We'll tell you what a missing answer would have sharpened, and you can come back to it whenever.",
  },
  {
    lead: "Your answers save as you go.",
    detail:
      "Close this halfway through and everything will still be here. No account, no password.",
  },
  {
    lead: "We're not selling you a plan.",
    detail:
      "Emme doesn't sell insurance. We work out what your existing plan actually costs you, so nothing here is a commitment.",
  },
];

export default function WelcomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-navy px-6 pt-10 pb-14 text-white sm:px-10 sm:pt-14 sm:pb-20">
        <div className="mx-auto w-full max-w-2xl">
          <p className="font-heading text-3xl font-extrabold lowercase tracking-tight">
            emme
          </p>

          <h1 className="mt-10 max-w-[16ch] text-[2.75rem] leading-[1.05] font-bold sm:text-6xl">
            Let&rsquo;s figure out what your care actually costs.
          </h1>

          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-white/85">
            Health plans split costs with you in ways that are genuinely hard to
            read. To tell you what a visit, a prescription, or a procedure will
            cost <em className="font-medium text-white not-italic">you</em>, we
            need to know how your specific plan works.
          </p>

          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-white/85">
            That&rsquo;s all the next few questions are for. Every one of them
            comes with a plain explanation of why we&rsquo;re asking.
          </p>
        </div>
      </section>

      <section className="flex-1 px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="font-heading text-2xl font-bold text-navy">
            Before we start
          </h2>

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {reassurances.map((item) => (
              <li key={item.lead} className="py-6">
                <p className="text-lg font-medium text-ink">{item.lead}</p>
                <p className="mt-2 max-w-[62ch] leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link
              href="/intake"
              className="flex min-h-[3.25rem] w-full items-center justify-center rounded-[var(--radius)] bg-primary px-6 text-[1.0625rem] font-semibold text-primary-foreground transition-colors hover:bg-[#a94d2c]"
            >
              Get started
            </Link>

            <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
              You&rsquo;ll have the option to upload your insurance documents and
              let us fill things in — or to skip that entirely and type what you
              know.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
