"use client";

import { useState } from "react";
import Link from "next/link";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { IntakeProvider, useIntake } from "@/lib/store";
import {
  answeredGroups,
  missingItems,
  planIdentity,
  planInsights,
} from "@/lib/summarize";

// Confirmation screen: explains the member's plan back to them in plain
// English rather than thanking them for submitting. Their own numbers only.

const actionClass =
  "flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius)] " +
  "px-6 text-[1.0625rem] font-semibold transition-colors";

function Summary() {
  const { draft, hydrated, buildExport, provenance } = useIntake();
  const [showJson, setShowJson] = useState(false);

  if (!hydrated) {
    return (
      <div className="px-6 py-16 text-muted-foreground sm:px-10">Loading…</div>
    );
  }

  const name = draft.firstName;
  const identity = planIdentity(draft);
  const insights = planInsights(draft);
  const missing = missingItems(draft);
  const groups = answeredGroups(draft);
  const payload = buildExport();
  const json = JSON.stringify(payload, null, 2);
  const extractedCount = payload.meta.extractedFields.length;

  function download() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emme-plan-intake.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const nothingYet = groups.length === 0;

  return (
    <main className="flex-1">
      <section className="bg-navy px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="mx-auto w-full max-w-2xl">
          <p className="font-heading text-2xl font-extrabold lowercase">emme</p>
          <h1 className="mt-8 text-[2.5rem] leading-[1.1] font-bold sm:text-5xl">
            {name
              ? `Here's what we know about your plan, ${name}.`
              : "Here's what we know about your plan."}
          </h1>
          {identity && (
            <p className="mt-5 text-lg text-white/85">{identity}</p>
          )}
          {extractedCount > 0 && (
            <p className="mt-3 text-[0.9375rem] text-white/70">
              {extractedCount} {extractedCount === 1 ? "answer" : "answers"} came
              straight off your document.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
        {nothingYet ? (
          <div>
            <h2 className="font-heading text-2xl font-bold text-navy">
              We don&rsquo;t have anything yet
            </h2>
            <p className="mt-3 max-w-[62ch] leading-relaxed text-muted-foreground">
              Nothing filled in yet. Even a few answers are enough to be
              useful, whenever you&rsquo;re ready.
            </p>
            <Link
              href="/intake"
              className={`${actionClass} mt-8 w-full bg-primary text-primary-foreground hover:bg-[#a94d2c]`}
            >
              Start filling it in
            </Link>
          </div>
        ) : (
          <>
            {insights.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-bold text-navy">
                  What this actually means
                </h2>
                <ul className="mt-6 space-y-5">
                  {insights.map((insight) => (
                    <li
                      key={insight.id}
                      className="border-l-2 border-navy pl-5 text-[1.0625rem] leading-relaxed text-ink"
                    >
                      {insight.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {missing.length > 0 && (
              <section className="mt-14">
                <h2 className="font-heading text-2xl font-bold text-navy">
                  Still missing
                </h2>
                <p className="mt-3 max-w-[62ch] leading-relaxed text-muted-foreground">
                  None of these are required — here&rsquo;s what each one
                  would have helped with, so you can decide if it&rsquo;s worth
                  going back for.
                </p>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {missing.map((m) => (
                    <li key={m.key} className="py-4">
                      <p className="font-medium text-ink">{m.label}</p>
                      <p className="mt-1 max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                        {m.consequence}
                      </p>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/intake"
                  className="mt-5 inline-block text-[0.9375rem] font-medium text-navy underline underline-offset-4"
                >
                  Go back and add them
                </Link>
              </section>
            )}

            <section className="mt-14">
              <h2 className="font-heading text-2xl font-bold text-navy">
                Everything you told us
              </h2>
              <p className="mt-3 max-w-[62ch] leading-relaxed text-muted-foreground">
                Anything wrong? Go back and change it. Nothing is locked in.
              </p>

              <div className="mt-6 space-y-8">
                {groups.map((group) => (
                  <div key={group.sectionId}>
                    <h3 className="font-heading text-lg font-bold text-ink">
                      {group.title}
                    </h3>
                    <dl className="mt-2 divide-y divide-line border-y border-line">
                      {group.rows.map((row) => (
                        <div
                          key={row.key}
                          className="py-3 sm:flex sm:items-baseline sm:justify-between sm:gap-6"
                        >
                          <dt className="text-[0.9375rem] leading-snug text-muted-foreground sm:max-w-[60%]">
                            {row.label}
                          </dt>
                          <dd className="mt-1 font-medium text-ink sm:mt-0 sm:shrink-0 sm:text-right">
                            {row.display}
                            {provenance[row.key] === "extracted" && (
                              <span className="ml-2 text-xs font-normal text-[#8f4326]">
                                from your document
                              </span>
                            )}
                            {provenance[row.key] === "inferred" && (
                              <span className="ml-2 text-xs font-normal text-[#8f4326]">
                                we filled this in
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>

              <Link
                href="/intake"
                className={`${actionClass} mt-8 w-full border border-navy bg-transparent text-navy hover:bg-white`}
              >
                Go back and edit
              </Link>
            </section>

            <section className="mt-14 border-t border-line pt-10">
              <h2 className="font-heading text-2xl font-bold text-navy">
                Your data, ready for Emme
              </h2>
              <p className="mt-3 max-w-[62ch] leading-relaxed text-muted-foreground">
                This is what gets passed along to work out your costs.
                It&rsquo;s your data, so take a copy.
              </p>

              <button
                type="button"
                onClick={download}
                className={`${actionClass} mt-6 w-full bg-primary text-primary-foreground hover:bg-[#a94d2c]`}
              >
                Download your data (JSON)
              </button>

              <button
                type="button"
                onClick={() => setShowJson((s) => !s)}
                className="mt-4 text-[0.9375rem] font-medium text-navy underline underline-offset-4"
              >
                {showJson ? "Hide the raw data" : "Show me the raw data"}
              </button>

              {showJson && (
                <pre className="mt-4 max-h-96 overflow-auto rounded-[var(--radius)] bg-navy p-4 text-xs leading-relaxed text-white/90">
                  {json}
                </pre>
              )}
            </section>

            <div className="mt-12">
              <MedicalDisclaimer />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function SummaryPage() {
  return (
    <IntakeProvider>
      <Summary />
    </IntakeProvider>
  );
}
