/**
 * The shape of everything we collect from a member.
 *
 * This is the contract between the intake form, the extraction API, and the
 * JSON export. Every key here must appear in exactly one section of
 * `lib/schema.ts` — `assertSchemaCoversIntake()` enforces that at import time.
 *
 * Numbers are numbers, not strings. The backend cost engine should never have
 * to parse "$2,500".
 */
export interface PlanIntake {
  // Identity
  firstName: string;
  email: string;
  zip: string;

  // Household
  householdSize: number;
  incomeRange: string;
  filingStatus: string;

  // Plan details
  carrier: string;
  planName: string;
  metalTier: string;
  planType: string;

  // Cost sharing — dollars, except coinsurance which is 0..1
  deductibleIndividual: number;
  deductibleFamily: number;
  deductibleMetYTD: number;
  oopMax: number;
  oopMetYTD: number;
  coinsurance: number;
  copayPrimaryCare: number;
  copaySpecialist: number;
  copayEmergency: number;
  copayUrgentCare: number;
  monthlyPremium: number;

  // HSA
  hsaEligible: boolean;
  hsaBalance: number;
  hsaContributionsYTD: number;
  hsaEmployerContribution: number;

  // Prescriptions
  takesPrescriptions: boolean;
  drugName: string;
  drugDosage: string;
  drugFrequency: string;
  drugPaymentMethod: string;
  preferredPharmacy: string;

  // Upcoming care
  plannedProcedures: string[];
  chronicConditions: string[];
  pregnancy: boolean;
  behavioralHealthNeeds: boolean;
}

export type IntakeKey = keyof PlanIntake;

/** Partial state as the member fills it in. Nothing is required until the end. */
export type IntakeDraft = Partial<PlanIntake>;

/** What `POST /api/extract` returns. Always partial — see the Core Flow Rule. */
export interface ExtractResult {
  fields: IntakeDraft;
  /** 0..1 per key. Below ~0.6 the UI should flag the value for review. */
  confidence: Partial<Record<IntakeKey, number>>;
  /**
   * Lands in the exported JSON as `meta.extractionSource`, so anyone reading
   * the payload can tell how a value was obtained.
   */
  source: "llm" | "heuristic";
  /** Human-readable note for the member when extraction went badly. */
  notice?: string;
}

/** The JSON we hand to Emme's backend. */
export interface IntakeExport {
  schemaVersion: number;
  completedAt: string;
  answers: IntakeDraft;
  meta: {
    /** Keys whose values came from an uploaded document rather than typed. */
    extractedFields: IntakeKey[];
    /** Keys the member explicitly chose to skip. */
    skippedFields: IntakeKey[];
    /** Keys never shown because a condition gated them out. */
    notApplicableFields: IntakeKey[];
    extractionSource: ExtractResult["source"] | null;
  };
}
