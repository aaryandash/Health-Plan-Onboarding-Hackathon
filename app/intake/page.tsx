"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Question } from "@/components/intake/question";
import { visibleFields, visibleSections } from "@/lib/schema";
import { IntakeProvider, useIntake } from "@/lib/store";

// The intake flow, one section per screen. Upload is step 0 and always
// skippable; skipping it doesn't close the door on uploading later.

const actionClass =
  "flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius)] " +
  "bg-primary px-6 text-[1.0625rem] font-semibold text-primary-foreground " +
  "transition-colors hover:bg-[#a94d2c]";

function Counter() {
  const { questionsRemaining, progress, saveState } = useIntake();
  return (
    <div className="sticky top-0 z-20 border-b border-line bg-cream/95 px-6 py-4 backdrop-blur-sm sm:px-10">
      <div className="mx-auto flex w-full max-w-2xl items-baseline justify-between gap-4">
        <p className="text-[0.9375rem] text-muted-foreground">
          <span className="font-heading text-2xl font-bold text-navy tabular-nums">
            {questionsRemaining}
          </span>{" "}
          {questionsRemaining === 1 ? "question" : "questions"} left
        </p>
        <div className="flex items-center gap-3">
          <span
            aria-live="polite"
            className={`text-sm text-muted-foreground transition-opacity duration-300 ${
              saveState === "saved" ? "opacity-100" : "opacity-0"
            }`}
          >
            Saved
          </span>
          <div
            className="h-1.5 w-24 overflow-hidden rounded-full bg-line sm:w-32"
            role="progressbar"
            aria-valuenow={progress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress"
          >
            <div
              className="h-full rounded-full bg-navy transition-[width] duration-500"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadStep({ onNext }: { onNext: () => void }) {
  const { applyExtraction } = useIntake();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      if (!res.ok) throw new Error(String(res.status));
      const result = await res.json();
      applyExtraction(result);
      setNotice(
        result.notice ??
          "Got it — we filled in what we could find. You'll see each one marked so you can check it.",
      );
      onNext();
    } catch {
      // Extraction failing is a normal path, not an error state. The member
      // still has the manual route and loses nothing.
      setNotice(
        "We couldn't read that one. No problem — you can type the details in instead, it only takes a couple of minutes.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="enter-rise">
      <h1 className="font-heading text-[2.25rem] leading-tight font-bold text-navy">
        Do you have your insurance paperwork handy?
      </h1>
      <p className="mt-4 max-w-[62ch] leading-relaxed text-muted-foreground">
        If you upload your Summary of Benefits or a recent Explanation of
        Benefits, we&rsquo;ll read the numbers off it and fill in what we can.
        You check our work, and you&rsquo;re done much faster.
      </p>

      <label className="mt-8 block">
        <span className="sr-only">Upload a document</span>
        <input
          type="file"
          accept="application/pdf,image/*"
          disabled={busy}
          className="block w-full cursor-pointer rounded-[var(--radius)] border border-dashed border-navy/40 bg-white p-6 text-base file:mr-4 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </label>

      <div aria-live="polite">
        {busy && (
          <p className="mt-4 text-[0.9375rem] text-navy">
            Reading your document…
          </p>
        )}
        {notice && (
          <p className="mt-4 max-w-[62ch] border-l-2 border-navy pl-4 text-[0.9375rem] leading-relaxed text-ink">
            {notice}
          </p>
        )}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Don&rsquo;t have them, or can&rsquo;t find them? That&rsquo;s
          completely normal — most people can answer these from memory or off
          their insurance card.
        </p>
        <button type="button" onClick={onNext} className={`${actionClass} w-full`}>
          Skip this and type it in
        </button>
      </div>
    </div>
  );
}

function Flow() {
  const { draft, hydrated, resumed, reset } = useIntake();
  const [step, setStep] = useState(0);

  // Someone returning from the summary to fix an answer should land back in
  // the questions, not on the upload prompt they already dismissed. Step 0 is
  // still reachable with Back.
  useEffect(() => {
    if (hydrated && resumed) setStep((s) => (s === 0 ? 1 : s));
  }, [hydrated, resumed]);

  const sections = visibleSections(draft);
  const section = step > 0 ? sections[step - 1] : null;

  if (!hydrated) {
    return (
      <div className="px-6 py-16 text-muted-foreground sm:px-10">Loading…</div>
    );
  }

  const done = step > sections.length;

  return (
    <>
      {step > 0 && <Counter />}

      <main className="flex-1 px-6 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          {resumed && step === 0 && (
            <p className="mb-8 rounded-[var(--radius)] bg-white px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
              Welcome back — we kept everything you filled in last time.{" "}
              <button
                type="button"
                onClick={reset}
                className="font-medium text-navy underline underline-offset-4"
              >
                Start over
              </button>
            </p>
          )}

          {step === 0 && <UploadStep onNext={() => setStep(1)} />}

          {section && (
            <div key={section.id}>
              <h1 className="font-heading text-[2.25rem] leading-tight font-bold text-navy">
                {section.title}
              </h1>
              <p className="mt-3 max-w-[62ch] leading-relaxed text-muted-foreground">
                {section.blurb}
              </p>

              <div className="mt-4 divide-y divide-line">
                {visibleFields(section, draft).map((f) => (
                  <Question key={f.key} field={f} />
                ))}
              </div>
            </div>
          )}

          {done && (
            <div className="enter-rise">
              <h1 className="font-heading text-[2.25rem] leading-tight font-bold text-navy">
                That&rsquo;s everything.
              </h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Next up: your summary screen.
              </p>
              <Link href="/summary" className={`${actionClass} mt-8 w-full`}>
                See what we know about your plan
              </Link>
            </div>
          )}

          {step > 0 && !done && (
            <div className="mt-10 flex items-center gap-4 border-t border-line pt-8 sm:gap-6">
              <button
                type="button"
                onClick={() => {
                  setStep((s) => s - 1);
                  window.scrollTo({ top: 0 });
                }}
                className="min-h-[3.25rem] px-2 text-[0.9375rem] font-medium text-navy underline underline-offset-4"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep((s) => s + 1);
                  // Without this, tapping Next on a long section leaves you
                  // scrolled halfway down the next one.
                  window.scrollTo({ top: 0 });
                }}
                className={`${actionClass} flex-1`}
              >
                {step === sections.length ? "Finish" : "Next"}
              </button>
            </div>
          )}

          {/* No step counter here: the header already carries the question
              count and a progress bar, and a third signal saying something
              different was pure working-memory noise. */}
        </div>
      </main>
    </>
  );
}

export default function IntakePage() {
  return (
    <IntakeProvider>
      <Flow />
    </IntakeProvider>
  );
}
