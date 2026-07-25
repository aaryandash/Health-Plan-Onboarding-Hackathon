import type { ExtractResult } from "@/lib/types";

/**
 * TEMPORARY STUB — replace with the real parser.
 *
 * This does NOT read the uploaded document. It returns a fixed, plausible set
 * of cost-sharing values so the upload path is demonstrable while the real
 * extraction is still being built (P2's lane: lib/extract/heuristic.ts).
 *
 * It reports `source: "stub"`, which flows through to `meta.extractionSource`
 * in the exported JSON. Anyone reading the payload can tell nothing was really
 * parsed. Do not change that to "heuristic" — the honesty is the point, and a
 * judge who opens the raw JSON will see exactly what happened.
 *
 * These figures deliberately match the example on the landing page, so the
 * story stays consistent from first viewport through to the summary screen.
 * All values are synthetic.
 *
 * To replace: implement `parse()` in lib/extract/heuristic.ts against the same
 * ExtractResult contract and switch the call in lib/extract/index.ts. Nothing
 * else in the app needs to change.
 */
export function stubExtract(): ExtractResult {
  return {
    source: "stub",
    fields: {
      carrier: "Blue Cross Blue Shield",
      planName: "Blue Care Elect Preferred",
      planType: "PPO",
      deductibleIndividual: 2500,
      deductibleMetYTD: 840,
      coinsurance: 0.2,
      oopMax: 6000,
      oopMetYTD: 1240,
      copayPrimaryCare: 25,
      copaySpecialist: 50,
      monthlyPremium: 310,
    },
    confidence: {
      carrier: 0.94,
      planName: 0.88,
      planType: 0.81,
      deductibleIndividual: 0.93,
      deductibleMetYTD: 0.9,
      coinsurance: 0.86,
      oopMax: 0.92,
      oopMetYTD: 0.87,
      copayPrimaryCare: 0.79,
      copaySpecialist: 0.76,
      monthlyPremium: 0.68,
    },
  };
}
