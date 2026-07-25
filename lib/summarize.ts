import { FIELD_BY_KEY, SECTIONS, visibleFields, visibleSections } from "./schema";
import type { IntakeDraft, IntakeKey } from "./types";

/**
 * Turns a member's answers into plain-English sentences about their own plan.
 *
 * IMPORTANT — this never estimates the cost of care. Cost calculation is
 * Emme's engine, downstream of this flow, and is explicitly out of scope
 * (see PRODUCT.md). Everything here restates numbers the member already gave
 * us, in language they can actually read. "You've met $840 of your $2,500
 * deductible" is their own data explained back. "This MRI will cost you $312"
 * would be a projection, and is not ours to make.
 *
 * Most members have never had their plan explained to them in these terms.
 * That is the point of the screen.
 */

export function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export interface PlanInsight {
  id: string;
  /** The sentence itself, already plain-language. */
  text: string;
  /** Emphasised fragments, rendered in navy semibold. */
  emphasis?: string[];
}

export function planIdentity(d: IntakeDraft): string | null {
  const bits = [d.carrier, d.planName].filter(Boolean);
  if (bits.length === 0) return null;
  const type = d.planType && d.planType !== "I'm not sure" ? ` (${d.planType})` : "";
  return `${bits.join(" · ")}${type}`;
}

export function planInsights(d: IntakeDraft): PlanInsight[] {
  const out: PlanInsight[] = [];
  const ded = d.deductibleIndividual;
  const met = d.deductibleMetYTD;
  const coins = d.coinsurance;
  const planPays = coins !== undefined ? Math.round((1 - coins) * 100) : null;

  // Where they stand on the deductible — the single most useful thing to know.
  if (ded !== undefined && met !== undefined) {
    const left = Math.max(0, ded - met);
    if (left === 0) {
      out.push({
        id: "deductible",
        text: `You've already met your ${money(ded)} deductible for the year.${
          planPays !== null
            ? ` That means your plan is covering ${planPays}% of your costs right now.`
            : ""
        }`,
        emphasis: ["met your"],
      });
    } else {
      out.push({
        id: "deductible",
        text: `You've paid ${money(met)} of your ${money(ded)} deductible so far. After another ${money(
          left,
        )}, your plan starts sharing costs with you${
          planPays !== null ? ` — covering ${planPays}% from that point on` : ""
        }.`,
      });
    }
  } else if (ded !== undefined) {
    out.push({
      id: "deductible",
      text: `Your deductible is ${money(ded)} — that's what you pay yourself before your plan starts chipping in.`,
    });
  }

  // The ceiling. For most people this is the number that actually matters.
  if (d.oopMax !== undefined) {
    const oopLeft =
      d.oopMetYTD !== undefined ? Math.max(0, d.oopMax - d.oopMetYTD) : null;
    out.push({
      id: "oop",
      text:
        oopLeft !== null
          ? `Your out-of-pocket maximum is ${money(d.oopMax)}, and you've paid ${money(
              d.oopMetYTD!,
            )} toward it. Once you reach it, your plan covers everything for the rest of the year.`
          : `Your out-of-pocket maximum is ${money(d.oopMax)} — the most you'd pay in a year, no matter what happens.`,
    });
  }

  // Copays are the number people meet most often in real life.
  if (d.copayPrimaryCare !== undefined || d.copaySpecialist !== undefined) {
    const parts: string[] = [];
    if (d.copayPrimaryCare !== undefined)
      parts.push(`${money(d.copayPrimaryCare)} to see your regular doctor`);
    if (d.copaySpecialist !== undefined)
      parts.push(`${money(d.copaySpecialist)} for a specialist`);
    out.push({
      id: "copays",
      text: `You pay ${parts.join(" and ")}. Copays are flat fees — they don't change based on what the visit actually costs.`,
    });
  }

  if (d.monthlyPremium !== undefined) {
    out.push({
      id: "premium",
      text: `You pay ${money(
        d.monthlyPremium,
      )} a month just to have this plan. That's separate — it doesn't count toward your deductible or your out-of-pocket maximum.`,
    });
  }

  if (d.hsaEligible === true && d.hsaBalance !== undefined) {
    out.push({
      id: "hsa",
      text: `You have ${money(
        d.hsaBalance,
      )} in your HSA, which you can put toward any of the above — tax-free.`,
    });
  }

  if (d.planType === "HMO") {
    out.push({
      id: "network",
      text: "On an HMO, you'll generally need a referral from your regular doctor before seeing a specialist, and out-of-network care usually isn't covered.",
    });
  } else if (d.planType === "PPO") {
    out.push({
      id: "network",
      text: "On a PPO, you can see specialists without a referral, and out-of-network care is usually covered at a lower rate.",
    });
  }

  return out;
}

export interface MissingItem {
  key: IntakeKey;
  label: string;
  /** What this answer would have sharpened. Never scolding. */
  consequence: string;
}

/** Ranked by how much each gap actually costs us in accuracy. */
const CONSEQUENCE: Partial<Record<IntakeKey, string>> = {
  deductibleIndividual:
    "Without it we can't tell how much you pay before your plan starts helping.",
  deductibleMetYTD:
    "Without it we'd assume you've paid nothing yet, and quote you higher than reality.",
  coinsurance: "Without it we can't tell how you and your plan split costs.",
  oopMax: "Without it we can't tell you where your spending stops for the year.",
  oopMetYTD: "Without it we can't tell how close you are to that ceiling.",
  carrier: "Different insurers negotiate different prices for the same care.",
  planName: "Two plans from one insurer can cover completely different things.",
  zip: "Prices for identical care vary a lot between ZIP codes.",
  copayPrimaryCare: "This is the cost you'd run into most often.",
  monthlyPremium: "Useful for showing your full yearly picture.",
};

export function missingItems(d: IntakeDraft, limit = 5): MissingItem[] {
  const out: MissingItem[] = [];
  for (const section of visibleSections(d)) {
    for (const field of visibleFields(section, d)) {
      if (field.deferred) continue;
      const v = d[field.key];
      const empty =
        v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (!empty) continue;
      const consequence = CONSEQUENCE[field.key];
      if (!consequence) continue;
      out.push({ key: field.key, label: field.label, consequence });
    }
  }
  return out.slice(0, limit);
}

export interface AnsweredGroup {
  sectionId: string;
  title: string;
  rows: { key: IntakeKey; label: string; display: string }[];
}

function displayValue(key: IntakeKey, v: unknown): string {
  const field = FIELD_BY_KEY.get(key);
  if (v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    if (field?.type === "currency") return money(v);
    if (field?.type === "percent") return `${Math.round(v * 100)}%`;
    return String(v);
  }
  return String(v);
}

/** Everything the member gave us, grouped for review. */
export function answeredGroups(d: IntakeDraft): AnsweredGroup[] {
  return SECTIONS.map((section) => ({
    sectionId: section.id,
    title: section.title,
    rows: visibleFields(section, d)
      .filter((f) => {
        const v = d[f.key];
        return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
      })
      .map((f) => ({
        key: f.key,
        label: f.label,
        display: displayValue(f.key, d[f.key]),
      })),
  })).filter((g) => g.rows.length > 0);
}
