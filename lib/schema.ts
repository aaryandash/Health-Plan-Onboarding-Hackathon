import type { IntakeDraft, IntakeKey, PlanIntake } from "./types";

/**
 * THE SINGLE SOURCE OF TRUTH.
 *
 * The form UI, tooltips, extraction target, confirmation screen, and JSON
 * export are all derived from `SECTIONS`. Add a field here and it appears
 * everywhere. Never hardcode a field name in a component.
 *
 * Copy rules (from the client brief, binding):
 *   - `why` is written to the member, not about them. One plain sentence.
 *   - Explain jargon BEFORE using it. "YTD Deductible Met" is meaningless to
 *     most people; "how much you've already paid toward your deductible" isn't.
 *   - Never imply a question is mandatory when it isn't.
 */

export type FieldType =
  | "text"
  | "email"
  | "zip"
  | "number"
  | "currency"
  | "percent"
  | "select"
  | "bool"
  | "multiselect";

export interface Field {
  key: IntakeKey;
  /** Phrased as a question to the member where natural. */
  label: string;
  type: FieldType;
  /** Why Emme needs this. Shown inline, always. Never optional. */
  why: string;
  /** Where to find it on an SBC or EOB. Shown when the member is stuck. */
  findIt?: string;
  placeholder?: string;
  options?: readonly string[];
  /**
   * Nice-to-have. Sharpens estimates but never blocks completion — the member
   * sees these behind "add this later".
   */
  deferred?: boolean;
  /** Hide unless this returns true. Fewer questions is the whole strategy. */
  showIf?: (d: IntakeDraft) => boolean;
}

export interface Section {
  id: string;
  title: string;
  /** One reassuring sentence at the top of the section. */
  blurb: string;
  fields: Field[];
  showIf?: (d: IntakeDraft) => boolean;
}

export const SCHEMA_VERSION = 1;

export const SECTIONS: readonly Section[] = [
  {
    id: "identity",
    title: "About you",
    blurb: "Three quick things, then we'll get into your plan.",
    fields: [
      {
        key: "firstName",
        label: "What should we call you?",
        type: "text",
        placeholder: "First name",
        why: "So we can talk to you like a person instead of an account number.",
      },
      {
        key: "email",
        label: "Your email",
        type: "email",
        placeholder: "you@example.com",
        why: "This is where your cost estimates go. We don't sell it and we don't send marketing.",
      },
      {
        key: "zip",
        label: "ZIP code",
        type: "zip",
        placeholder: "02210",
        why: "The exact same procedure can cost very different amounts in different ZIP codes, so this changes your estimate a lot.",
      },
    ],
  },

  {
    id: "plan",
    title: "Your plan",
    blurb: "If you uploaded a document, we've filled in what we could find. Change anything that looks wrong.",
    fields: [
      {
        key: "carrier",
        label: "Who's your insurance company?",
        type: "text",
        placeholder: "Blue Cross Blue Shield, Aetna, UnitedHealthcare…",
        why: "Different insurers negotiate different prices for the same care.",
        findIt: "The logo at the top of your insurance card or any statement they've sent you.",
      },
      {
        key: "planName",
        label: "What's your plan called?",
        type: "text",
        placeholder: "e.g. Blue Care Elect Preferred",
        why: "Two plans from the same insurer can cover completely different things, so the specific name matters.",
        findIt: "Printed on your insurance card, usually under the insurer's name.",
      },
      {
        key: "planType",
        label: "What type of plan is it?",
        type: "select",
        options: ["HMO", "PPO", "EPO", "HDHP", "I'm not sure"],
        why: "This tells us whether you need referrals and whether out-of-network care is covered at all.",
        findIt: "Usually printed right on your insurance card, next to the plan name.",
      },
      {
        key: "metalTier",
        label: "Metal tier",
        type: "select",
        options: ["Bronze", "Silver", "Gold", "Platinum", "Catastrophic", "Not sure / doesn't apply"],
        why: "A shorthand for how costs split between you and your insurer. Skip it if you've never heard of it — we can often work it out from your other answers.",
        deferred: true,
      },
      {
        key: "monthlyPremium",
        label: "What do you pay per month for this plan?",
        type: "currency",
        why: "Your premium is what you pay just to have insurance, whether or not you use it. It doesn't count toward your deductible.",
        findIt: "Your pay stub if you get insurance through work, or your monthly bill from the insurer.",
      },
    ],
  },

  {
    id: "costSharing",
    title: "What you pay",
    blurb: "This is the part that makes estimates accurate. Every one of these is on a recent statement — and you can skip any you can't find.",
    fields: [
      {
        key: "deductibleIndividual",
        label: "Your deductible",
        type: "currency",
        why: "Your deductible is the amount you pay yourself before your insurance starts chipping in. It's the single biggest factor in what care costs you.",
        findIt: 'Near the top of your Summary of Benefits, labeled "Deductible" or "Annual deductible".',
      },
      {
        key: "deductibleMetYTD",
        label: "How much of it have you already paid this year?",
        type: "currency",
        why: "Once you've met your deductible, everything gets cheaper for the rest of the year. If you've already paid a chunk of it, your estimates should reflect that — otherwise we'd quote you too high.",
        findIt: 'Any recent Explanation of Benefits, labeled "Applied to deductible" or "Deductible met to date".',
      },
      {
        key: "deductibleFamily",
        label: "Family deductible",
        type: "currency",
        why: "If anyone else is on your plan, there's usually a separate family total. Leave it blank if it's just you.",
        deferred: true,
        showIf: (d) => (d.householdSize ?? 1) > 1,
      },
      {
        key: "coinsurance",
        label: "After your deductible, what share do you pay?",
        type: "percent",
        placeholder: "20",
        why: "Once your deductible is met, you and your insurer split costs — often 20% you, 80% them. This is your share.",
        findIt: 'Your Summary of Benefits, written as "Coinsurance" or as a pair like "20% / 80%".',
      },
      {
        key: "oopMax",
        label: "Out-of-pocket maximum",
        type: "currency",
        why: "This is the most you'd ever pay in a year. After you hit it, your insurer covers everything. It's the number that matters most if something serious happens.",
        findIt: 'Summary of Benefits, labeled "Out-of-pocket maximum" or "Out-of-pocket limit".',
      },
      {
        key: "oopMetYTD",
        label: "How much have you paid toward it so far?",
        type: "currency",
        why: "Same idea as the deductible — knowing where you already stand keeps our estimates honest.",
        findIt: 'Your most recent Explanation of Benefits, near the deductible totals.',
      },
      {
        key: "copayPrimaryCare",
        label: "Copay for a regular doctor visit",
        type: "currency",
        why: "A copay is a flat fee you pay at the visit, instead of a percentage. Many plans charge one for routine appointments.",
        findIt: "Often printed directly on your insurance card.",
      },
      {
        key: "copaySpecialist",
        label: "Copay for a specialist",
        type: "currency",
        why: "Specialists usually cost more than your regular doctor, so we track them separately.",
        findIt: "Also usually on your insurance card, next to the primary care copay.",
      },
      {
        key: "copayUrgentCare",
        label: "Copay for urgent care",
        type: "currency",
        why: "Useful for estimating the cost of something unplanned but not an emergency.",
        deferred: true,
      },
      {
        key: "copayEmergency",
        label: "Copay for the emergency room",
        type: "currency",
        why: "ER visits are usually the most expensive copay on a plan, and worth knowing before you need it.",
        deferred: true,
      },
    ],
  },

  {
    id: "household",
    title: "Your household",
    blurb: "This helps with subsidies and family cost limits.",
    fields: [
      {
        key: "householdSize",
        label: "How many people are on your plan, including you?",
        type: "number",
        why: "Family plans have different cost limits than individual ones, and household size affects what help you might qualify for.",
      },
      {
        key: "filingStatus",
        label: "How do you file taxes?",
        type: "select",
        options: ["Single", "Married filing jointly", "Married filing separately", "Head of household", "Prefer not to say"],
        why: "Some cost assistance is tied to how you file. Skip it if you'd rather not share.",
        deferred: true,
      },
      {
        key: "incomeRange",
        label: "Roughly what's your household income?",
        type: "select",
        options: [
          "Under $30,000",
          "$30,000 – $60,000",
          "$60,000 – $100,000",
          "$100,000 – $150,000",
          "Over $150,000",
          "Prefer not to say",
        ],
        why: "Only used to check whether you qualify for cost assistance you might not know about. A range is enough — we never need an exact figure.",
        deferred: true,
      },
    ],
  },

  {
    id: "hsa",
    title: "Health savings account",
    blurb: "Only relevant if you have one — one question tells us.",
    fields: [
      {
        key: "hsaEligible",
        label: "Do you have an HSA?",
        type: "bool",
        why: "An HSA is a tax-free account for medical costs. If you have one, we count it toward what you can cover comfortably.",
      },
      {
        key: "hsaBalance",
        label: "Current balance",
        type: "currency",
        why: "Tells us how much of an upcoming cost you could cover without touching your regular money.",
        showIf: (d) => d.hsaEligible === true,
      },
      {
        key: "hsaContributionsYTD",
        label: "Contributed so far this year",
        type: "currency",
        why: "There's an annual limit on HSA contributions, so this tells us how much room you have left.",
        deferred: true,
        showIf: (d) => d.hsaEligible === true,
      },
      {
        key: "hsaEmployerContribution",
        label: "What your employer puts in",
        type: "currency",
        why: "Employer contributions count toward the same annual limit as yours.",
        deferred: true,
        showIf: (d) => d.hsaEligible === true,
      },
    ],
  },

  {
    id: "prescriptions",
    title: "Prescriptions",
    blurb: "Medications are often the biggest recurring cost we can help with.",
    fields: [
      {
        key: "takesPrescriptions",
        label: "Do you take any regular prescriptions?",
        type: "bool",
        why: "Drug coverage works differently from the rest of your plan, so we only ask if it applies to you.",
      },
      {
        key: "drugName",
        label: "Which medication?",
        type: "text",
        placeholder: "Start with the one you take most often",
        why: "Prices vary enormously between drugs, and there's often a cheaper equivalent your plan covers better.",
        showIf: (d) => d.takesPrescriptions === true,
      },
      {
        key: "drugDosage",
        label: "Dosage",
        type: "text",
        placeholder: "e.g. 20mg",
        why: "Different dosages are often priced differently, even for the same medication.",
        showIf: (d) => d.takesPrescriptions === true,
      },
      {
        key: "drugFrequency",
        label: "How often do you take it?",
        type: "select",
        options: ["Once daily", "Twice daily", "Weekly", "Monthly", "As needed"],
        why: "Tells us how much you go through, and therefore what it costs you over a year.",
        showIf: (d) => d.takesPrescriptions === true,
      },
      {
        key: "drugPaymentMethod",
        label: "How do you pay for it now?",
        type: "select",
        options: ["Through my insurance", "Cash / discount card", "Both, depending on the drug"],
        why: "Paying cash is sometimes cheaper than using insurance. If that's your situation, we want to catch it.",
        showIf: (d) => d.takesPrescriptions === true,
      },
      {
        key: "preferredPharmacy",
        label: "Where do you usually fill it?",
        type: "text",
        placeholder: "CVS, Walgreens, mail order…",
        why: "The same prescription can cost different amounts at different pharmacies on the same plan.",
        deferred: true,
        showIf: (d) => d.takesPrescriptions === true,
      },
    ],
  },

  {
    id: "upcomingCare",
    title: "What's coming up",
    blurb: "Anything you already know about helps us get ahead of the cost. Skip whatever doesn't apply.",
    fields: [
      {
        key: "plannedProcedures",
        label: "Anything planned in the next year?",
        type: "multiselect",
        options: [
          "Surgery",
          "Imaging (MRI, CT, X-ray)",
          "Physical therapy",
          "Dental work",
          "Vision / eye care",
          "Nothing planned",
        ],
        why: "Planned care is the easiest kind to budget for, and often the kind where shopping around saves the most.",
      },
      {
        key: "chronicConditions",
        label: "Any ongoing conditions you manage?",
        type: "multiselect",
        options: [
          "Diabetes",
          "Heart condition",
          "Asthma or COPD",
          "Autoimmune condition",
          "Cancer",
          "Other",
          "None",
        ],
        why: "Ongoing conditions mean predictable recurring costs — which means we can plan for them instead of surprising you.",
      },
      {
        key: "pregnancy",
        label: "Are you or your partner expecting?",
        type: "bool",
        why: "Maternity care is covered under its own set of rules, and the costs are worth knowing about early.",
      },
      {
        key: "behavioralHealthNeeds",
        label: "Do you use mental health or substance-use care?",
        type: "bool",
        why: "Coverage for this is legally required to match medical coverage, but plans often make it hard to find. We'll surface what you're entitled to.",
      },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Derived helpers. Use these instead of walking SECTIONS by hand.
// ---------------------------------------------------------------------------

export const ALL_FIELDS: readonly Field[] = SECTIONS.flatMap((s) => s.fields);

export const FIELD_BY_KEY: ReadonlyMap<IntakeKey, Field> = new Map(
  ALL_FIELDS.map((f) => [f.key, f]),
);

/** Sections whose gate currently passes. */
export function visibleSections(draft: IntakeDraft): Section[] {
  return SECTIONS.filter((s) => !s.showIf || s.showIf(draft));
}

/** Fields in a section whose gate currently passes. */
export function visibleFields(section: Section, draft: IntakeDraft): Field[] {
  return section.fields.filter((f) => !f.showIf || f.showIf(draft));
}

function isAnswered(draft: IntakeDraft, key: IntakeKey): boolean {
  const v = draft[key];
  if (v === undefined || v === null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * Powers the shrinking question counter — our headline differentiator.
 * Deferred fields don't count: they never block completion.
 */
export function questionsRemaining(draft: IntakeDraft): number {
  return visibleSections(draft)
    .flatMap((s) => visibleFields(s, draft))
    .filter((f) => !f.deferred && !isAnswered(draft, f.key)).length;
}

export function progress(draft: IntakeDraft): { answered: number; total: number; pct: number } {
  const fields = visibleSections(draft)
    .flatMap((s) => visibleFields(s, draft))
    .filter((f) => !f.deferred);
  const answered = fields.filter((f) => isAnswered(draft, f.key)).length;
  const total = fields.length;
  return { answered, total, pct: total === 0 ? 0 : Math.round((answered / total) * 100) };
}

/** Keys gated out by a condition — recorded in the export as not-applicable. */
export function notApplicableKeys(draft: IntakeDraft): IntakeKey[] {
  const visible = new Set(
    visibleSections(draft).flatMap((s) => visibleFields(s, draft)).map((f) => f.key),
  );
  return ALL_FIELDS.map((f) => f.key).filter((k) => !visible.has(k));
}

/**
 * Fill in what we can work out, so we don't ask for it.
 * Returns only newly inferred values — never overwrites something the member
 * typed or a document supplied. Callers must badge these as inferred and keep
 * them editable.
 */
export function inferFields(draft: IntakeDraft): IntakeDraft {
  const out: IntakeDraft = {};

  // Family deductible is conventionally 2x the individual on most plans.
  if (
    draft.deductibleIndividual !== undefined &&
    draft.deductibleFamily === undefined &&
    (draft.householdSize ?? 1) > 1
  ) {
    out.deductibleFamily = draft.deductibleIndividual * 2;
  }

  // An HDHP is by definition HSA-eligible.
  if (draft.planType === "HDHP" && draft.hsaEligible === undefined) {
    out.hsaEligible = true;
  }

  // Plan names usually carry their own tier.
  if (draft.planName && draft.metalTier === undefined) {
    const tier = ["Bronze", "Silver", "Gold", "Platinum"].find((t) =>
      draft.planName!.toLowerCase().includes(t.toLowerCase()),
    );
    if (tier) out.metalTier = tier;
  }

  // Living alone means the household total is the individual one.
  if (draft.householdSize === 1 && draft.filingStatus === undefined) {
    out.filingStatus = "Single";
  }

  return out;
}

/**
 * Fails loudly at import time if `PlanIntake` and `SECTIONS` drift apart —
 * a field in the type with no question, or a duplicate key across sections.
 */
function assertSchemaCoversIntake(): void {
  const seen = new Set<string>();
  for (const f of ALL_FIELDS) {
    if (seen.has(f.key)) throw new Error(`schema: duplicate field key "${f.key}"`);
    seen.add(f.key);
  }
  const required: Record<keyof PlanIntake, true> = {
    firstName: true, email: true, zip: true,
    householdSize: true, incomeRange: true, filingStatus: true,
    carrier: true, planName: true, metalTier: true, planType: true,
    deductibleIndividual: true, deductibleFamily: true, deductibleMetYTD: true,
    oopMax: true, oopMetYTD: true, coinsurance: true,
    copayPrimaryCare: true, copaySpecialist: true, copayEmergency: true,
    copayUrgentCare: true, monthlyPremium: true,
    hsaEligible: true, hsaBalance: true, hsaContributionsYTD: true, hsaEmployerContribution: true,
    takesPrescriptions: true, drugName: true, drugDosage: true, drugFrequency: true,
    drugPaymentMethod: true, preferredPharmacy: true,
    plannedProcedures: true, chronicConditions: true, pregnancy: true, behavioralHealthNeeds: true,
  };
  const missing = Object.keys(required).filter((k) => !seen.has(k));
  if (missing.length) throw new Error(`schema: no question for ${missing.join(", ")}`);
}

assertSchemaCoversIntake();
