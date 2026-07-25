"use client";

import { useId, useState } from "react";
import type { Field } from "@/lib/schema";
import { useIntake } from "@/lib/store";
import type { IntakeKey, PlanIntake } from "@/lib/types";

/**
 * One question. The `why` copy sits directly under the label, always visible —
 * not behind a "?" icon. On a phone there is no hover, and the brief requires
 * inline jargon-free explanation, so hiding it behind a tap would fail the
 * requirement and the member both.
 */

const inputClass =
  "w-full min-h-[3.25rem] rounded-[var(--radius)] border border-line bg-white px-4 text-base text-ink " +
  "placeholder:text-muted-foreground focus-visible:border-navy focus-visible:outline-2 " +
  "focus-visible:outline-offset-0 focus-visible:outline-navy";

// iOS renders native selects with its own chrome and ignores the border
// radius. Strip the appearance and draw our own chevron so it matches every
// other field on the page.
const selectClass =
  `${inputClass} appearance-none bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat pr-11 ` +
  `bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2024%2024%27%20stroke%3D%27%2301447e%27%20stroke-width%3D%272%27%3E%3Cpath%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20d%3D%27M6%209l6%206%206-6%27%2F%3E%3C%2Fsvg%3E")]`;

// 44px minimum tap target (DESIGN.md). Negative margin keeps the visual
// rhythm while the hit area grows.
const inlineActionClass =
  "min-h-[44px] -my-2 py-2 text-[0.9375rem] font-medium text-navy underline underline-offset-4";

function ProvenanceBadge({ kind }: { kind: "extracted" | "inferred" }) {
  const label =
    kind === "extracted" ? "from your document" : "we filled this in";
  return (
    <span className="inline-flex items-center rounded-full bg-[#fbeae2] px-2.5 py-1 text-xs font-medium text-[#8f4326]">
      {label} · edit if wrong
    </span>
  );
}

export function Question({ field }: { field: Field }) {
  const { draft, provenance, skipped, setField, skipField, unskipField } =
    useIntake();
  const id = useId();
  const [showHint, setShowHint] = useState(false);

  const value = draft[field.key];
  const prov = provenance[field.key];
  const isSkipped = skipped.has(field.key);

  function commit(next: PlanIntake[IntakeKey] | undefined) {
    setField(field.key, next as never);
  }

  return (
    <div className="enter-rise py-7">
      <label
        htmlFor={id}
        className="block text-[1.125rem] leading-snug font-medium text-ink"
      >
        {field.label}
        {field.deferred && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            optional
          </span>
        )}
      </label>

      <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
        {field.why}
      </p>

      {(prov === "extracted" || prov === "inferred") && (
        <div className="mt-3">
          <ProvenanceBadge kind={prov} />
        </div>
      )}

      <div className="mt-4">
        {field.type === "select" && (
          <select
            id={id}
            className={selectClass}
            value={(value as string) ?? ""}
            onChange={(e) => commit(e.target.value || undefined)}
          >
            <option value="">Choose one</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {field.type === "bool" && (
          <div className="flex gap-3">
            {[
              { label: "Yes", v: true },
              { label: "No", v: false },
            ].map(({ label, v }) => {
              const active = value === v;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => commit(v)}
                  aria-pressed={active}
                  className={`min-h-[3.25rem] flex-1 rounded-[var(--radius)] border text-base font-medium transition-colors ${
                    active
                      ? "border-navy bg-navy text-white"
                      : "border-line bg-white text-ink hover:border-navy"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {field.type === "multiselect" && (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const current = (value as string[] | undefined) ?? [];
              const active = current.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    commit(
                      (active
                        ? current.filter((o) => o !== opt)
                        : [...current, opt]) as never,
                    )
                  }
                  className={`min-h-[2.75rem] rounded-full border px-4 text-[0.9375rem] font-medium transition-colors ${
                    active
                      ? "border-navy bg-navy text-white"
                      : "border-line bg-white text-ink hover:border-navy"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {(field.type === "currency" || field.type === "percent") && (
          <div className="relative">
            {field.type === "currency" && (
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-base text-muted-foreground">
                $
              </span>
            )}
            <input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              step={field.type === "percent" ? 1 : 0.01}
              placeholder={field.placeholder ?? "0"}
              className={`${inputClass} ${field.type === "currency" ? "pl-8" : "pr-10"}`}
              value={
                value === undefined
                  ? ""
                  : field.type === "percent"
                    ? String(Math.round((value as number) * 100))
                    : String(value)
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return commit(undefined);
                const n = Number(raw);
                if (Number.isNaN(n)) return;
                // Coinsurance is stored 0..1 but typed as a whole percent —
                // "20" in the field means 0.2 in the export.
                commit((field.type === "percent" ? n / 100 : n) as never);
              }}
            />
            {field.type === "percent" && (
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-base text-muted-foreground">
                %
              </span>
            )}
          </div>
        )}

        {["text", "email", "zip", "number"].includes(field.type) && (
          <input
            id={id}
            type={
              field.type === "email"
                ? "email"
                : field.type === "number"
                  ? "number"
                  : "text"
            }
            inputMode={
              field.type === "zip" || field.type === "number"
                ? "numeric"
                : field.type === "email"
                  ? "email"
                  : "text"
            }
            min={field.type === "number" ? 1 : undefined}
            placeholder={field.placeholder}
            className={inputClass}
            value={(value as string | number | undefined) ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") return commit(undefined);
              commit((field.type === "number" ? Number(raw) : raw) as never);
            }}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
        {field.findIt && (
          <button
            type="button"
            onClick={() => setShowHint((s) => !s)}
            aria-expanded={showHint}
            className={inlineActionClass}
          >
            {showHint ? "Hide" : "Where do I find this?"}
          </button>
        )}

        {!isSkipped ? (
          <button
            type="button"
            onClick={() => skipField(field.key)}
            className={inlineActionClass}
          >
            I don&rsquo;t have this
          </button>
        ) : (
          <span className="flex min-h-[44px] items-center gap-1.5 text-[0.9375rem] text-muted-foreground">
            Skipped —
            <button
              type="button"
              onClick={() => unskipField(field.key)}
              className="min-h-[44px] font-medium text-navy underline underline-offset-4"
            >
              undo
            </button>
          </span>
        )}
      </div>

      {showHint && field.findIt && (
        <p className="mt-3 max-w-[62ch] border-l-2 border-navy pl-4 text-[0.9375rem] leading-relaxed text-ink">
          {field.findIt}
        </p>
      )}
    </div>
  );
}
