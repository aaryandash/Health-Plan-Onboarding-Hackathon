import Link from "next/link";

// Landing page. Before anyone answers 35 questions about their money and their
// health they need to know what Emme is, why their plan is confusing, and what
// they get back. The EOB fragment and its translation show that in one glance.
// Figures are synthetic.

const steps = [
  {
    n: "1",
    title: "Upload your paperwork, or don't",
    body: "Drop in your Summary of Benefits or a recent statement and we'll read the numbers off it. Haven't got them? Type what you know instead — the whole thing works either way.",
  },
  {
    n: "2",
    title: "Answer what you can",
    body: "Short groups of questions, each one explaining why we're asking. Skip anything you don't know. Nothing is required and nothing is a commitment.",
  },
  {
    n: "3",
    title: "See your plan in plain English",
    body: "We show you what you've paid, what's left, and what your plan actually covers — in words instead of insurance jargon.",
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
            Nobody should need a
            <span className="text-sky"> decoder ring </span>
            to know what a doctor&rsquo;s visit costs.
          </h1>

          <p className="mt-8 max-w-[54ch] text-xl leading-relaxed text-white/85">
            Emme reads your health plan and tells you what your care actually
            costs — before you get the bill, in language that makes sense.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/intake"
              className="flex min-h-[3.5rem] items-center justify-center rounded-[var(--radius)] bg-white px-8 text-[1.0625rem] font-semibold text-navy transition-colors hover:bg-navy-tint"
            >
              Start form
            </Link>
            <p className="text-[0.9375rem] text-white/70">
              About two minutes · nothing required
            </p>
          </div>
        </div>
      </section>

      {/* The problem, demonstrated rather than asserted */}
      <section className="px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="font-heading text-[2.25rem] leading-tight font-bold text-navy sm:text-[2.75rem]">
            Your plan is written for someone else.
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
            Not for you — for the people who process the claim. That&rsquo;s why
            reading it feels like failing a test you never studied for. Here is
            a line from a real statement, and what it actually means.
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
            What we&rsquo;ll ask you for
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
            To work out your costs we need to know how your specific plan splits
            them with you. That&rsquo;s all these questions are for.
          </p>

          <ol className="mt-12 space-y-12">
            {steps.map((step) => (
              <li key={step.n} className="flex gap-6 sm:gap-8">
                <span
                  aria-hidden
                  className="font-heading shrink-0 text-[2.5rem] leading-none font-bold text-navy-soft tabular-nums"
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
                "Emme doesn't sell insurance. We work out what the plan you already have actually costs you.",
              ],
              [
                "Skip anything you can't find.",
                "Every question can be left blank. We'll tell you what a missing answer would have sharpened, and you can come back to it.",
              ],
              [
                "Your answers save as you go.",
                "Close this halfway through and it'll all still be here. No account, no password.",
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
            className="mt-12 flex min-h-[3.5rem] w-full items-center justify-center rounded-[var(--radius)] bg-primary px-8 text-[1.0625rem] font-semibold text-primary-foreground transition-colors hover:bg-navy-deep"
          >
            Start form
          </Link>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            You can stop at any point and pick it back up later.
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
