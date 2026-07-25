import Link from "next/link";

// Landing page. Before anyone answers 35 questions about their money and their
// health they need to know what Emme is, why their plan is confusing, and what
// they get back. The EOB fragment and its translation show that in one glance.
// Figures are synthetic.

const steps = [
  {
    n: "1",
    title: "Upload your paperwork, or don't",
    body: "Upload your Summary of Benefits or a recent statement and we'll pull the numbers off it. Don't have them? Just type what you know. Either way works.",
  },
  {
    n: "2",
    title: "Answer what you can",
    body: "A few short questions, and we tell you why we're asking each one. Skip anything you don't know — none of it is required.",
  },
  {
    n: "3",
    title: "See your plan in plain English",
    body: "What you've paid, what's left, and what your plan covers — in normal words.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-3xl px-6 pt-10 pb-16 sm:px-10 sm:pt-14 sm:pb-24">
          <p className="font-heading text-3xl font-extrabold lowercase tracking-tight">
            emme
          </p>

          <h1 className="mt-12 text-[2.5rem] leading-[1.03] font-bold tracking-tight sm:mt-14 sm:text-[4.5rem] sm:leading-[0.98]">
            How much is this
            <br className="hidden sm:block" /> going to cost me?
          </h1>

          <p className="mt-8 max-w-[54ch] text-xl leading-relaxed text-white/85">
            It&rsquo;s the first thing you want to know, and the hardest thing to
            find out. Emme reads your health plan and tells you — before the bill
            shows up.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/intake"
              className="flex min-h-[3.5rem] items-center justify-center rounded-[var(--radius)] bg-primary px-8 text-[1.0625rem] font-semibold text-primary-foreground transition-colors hover:bg-[#a94d2c]"
            >
              Start form
            </Link>
            <p className="text-[0.9375rem] text-white/70">
              Takes about two minutes
            </p>
          </div>
        </div>
      </section>

      {/* The problem, demonstrated rather than asserted */}
      <section className="px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="font-heading text-[2.25rem] leading-tight font-bold text-navy sm:text-[2.75rem]">
            Insurance paperwork isn&rsquo;t written for you.
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
            It&rsquo;s written for the people processing the claim, which is why
            it&rsquo;s so hard to read. Here&rsquo;s a line from a statement, and
            what it&rsquo;s actually saying.
          </p>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line sm:grid-cols-2">
            <div className="bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                What your statement says
              </p>
              <pre className="mt-5 overflow-x-auto font-mono text-[0.8125rem] leading-loose whitespace-pre text-ink sm:text-[0.9375rem]">
                {`AMT APPLIED TO DED   840.00
COINS                   20%
OOP ACCUM YTD      1,240.00
PT RESP              172.40`}
              </pre>
              <p className="mt-5 text-xs text-muted-foreground">
                Synthetic example
              </p>
            </div>

            <div className="bg-navy p-6 text-white sm:p-8">
              <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
                What it means
              </p>
              <p className="mt-5 text-[1.0625rem] leading-relaxed">
                You&rsquo;ve paid <strong className="font-semibold">$840</strong>{" "}
                toward your deductible. Once you hit it, your plan picks up{" "}
                <strong className="font-semibold">80%</strong> of what comes
                next. You&rsquo;re{" "}
                <strong className="font-semibold">$1,240</strong> into the{" "}
                <em className="not-italic">most</em> you&rsquo;ll pay this year.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section className="border-y border-line bg-white px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="font-heading text-[2.25rem] leading-tight font-bold text-navy sm:text-[2.75rem]">
            How it works
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
            Every plan splits costs differently, so we need to know how yours
            works. That&rsquo;s all the questions are for.
          </p>

          <ol className="mt-12 space-y-12">
            {steps.map((step) => (
              <li key={step.n} className="flex gap-6 sm:gap-8">
                <span
                  aria-hidden
                  className="font-heading shrink-0 text-[2.5rem] leading-none font-bold text-[#e37753] tabular-nums"
                >
                  {step.n}
                </span>
                <div>
                  <h3 className="font-heading text-xl font-bold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[58ch] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Reassurance + close */}
      <section className="px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="font-heading text-[2.25rem] leading-tight font-bold text-navy sm:text-[2.75rem]">
            Before you start
          </h2>

          <dl className="mt-10 divide-y divide-line border-y border-line">
            {[
              [
                "We're not selling you anything.",
                "Emme doesn't sell insurance. We just help you understand the plan you already have.",
              ],
              [
                "Skip anything you can't find.",
                "Leave any question blank. We'll tell you what it would have helped with, and you can come back to it later.",
              ],
              [
                "Your answers save as you go.",
                "Close it halfway through and everything will still be here. No account, no password.",
              ],
            ].map(([term, detail]) => (
              <div key={term} className="py-6">
                <dt className="text-lg font-medium text-ink">{term}</dt>
                <dd className="mt-2 max-w-[62ch] leading-relaxed text-muted-foreground">
                  {detail}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href="/intake"
            className="mt-12 flex min-h-[3.5rem] w-full items-center justify-center rounded-[var(--radius)] bg-primary px-8 text-[1.0625rem] font-semibold text-primary-foreground transition-colors hover:bg-[#a94d2c]"
          >
            Start form
          </Link>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Stop whenever you like and pick it up later.
          </p>
        </div>
      </section>

      <footer className="bg-navy px-6 py-10 text-white/70 sm:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <p className="font-heading text-2xl font-extrabold lowercase text-white">
            emme
          </p>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed">
            Built for the TOA Health Hack. All figures shown are synthetic — no
            real member data appears anywhere in this prototype.
          </p>
        </div>
      </footer>
    </main>
  );
}
