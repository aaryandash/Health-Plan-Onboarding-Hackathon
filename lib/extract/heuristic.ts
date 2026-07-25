import { createRequire } from "node:module";
import { PDFParse } from "pdf-parse";
import { pdfToText } from "./pdf-text";
import type { ExtractResult, IntakeDraft, IntakeKey } from "@/lib/types";

// Turbopack/webpack bundle this route, which breaks pdfjs-dist's default
// worker resolution (it looks for pdf.worker.mjs relative to the bundled
// chunk, which doesn't exist in .next output). Point it at the real file
// on disk instead — but this alone is NOT sufficient inside Next.js: Turbopack
// also bundles pdfjs-dist itself and intercepts *its* internal `import()` of
// the worker file, so this still fails at runtime with "Cannot find package
// '[project]'". The actual fix has to live in next.config.ts, outside this
// lane:
//   serverExternalPackages: ["pdf-parse", "pdfjs-dist"]
// That tells Next.js not to bundle these packages for the server, so
// pdfjs-dist's dynamic worker import resolves via plain Node instead of
// Turbopack. Until that config lands, PDF parsing will always hit the catch
// block below and fall through to manual entry — which is safe (never
// throws) but never actually extracts anything from a real request.
let workerConfigured = false;
function ensureWorkerConfigured() {
  if (workerConfigured) return;
  try {
    const require = createRequire(import.meta.url);
    const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    PDFParse.setWorker(workerPath);
  } catch {
    // If resolution fails, fall through — pdf-parse's default behavior applies.
  }
  workerConfigured = true;
}

const MONEY_RE = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\b\d{1,3}(?:,\d{3})*\.\d{2}\b/;
const PERCENT_RE = /\b\d{1,3}(?:\.\d+)?\s?%/;
const PLAN_TYPE_RE = /\b(PPO|HMO|EPO|POS|HDHP)\b/i;
const METAL_TIER_RE = /\b(Bronze|Silver|Gold|Platinum|Catastrophic)\b/i;

const KNOWN_CARRIERS = [
  "Blue Cross Blue Shield of Michigan",
  "Blue Cross Blue Shield",
  "BlueCross BlueShield",
  "Blue Cross",
  "BCBS",
  "UnitedHealthcare",
  "United Healthcare",
  "Aetna",
  "Cigna",
  "Humana",
  "Kaiser Permanente",
  "Anthem",
  "Molina Healthcare",
  "Oscar Health",
  "Centene",
];

type CurrencyKey = Extract<
  IntakeKey,
  | "deductibleIndividual"
  | "deductibleFamily"
  | "deductibleMetYTD"
  | "oopMax"
  | "oopMetYTD"
  | "copayPrimaryCare"
  | "copaySpecialist"
  | "copayEmergency"
  | "copayUrgentCare"
  | "monthlyPremium"
>;

interface FieldDef {
  key: CurrencyKey | "coinsurance";
  kind: "currency" | "percent";
  labels: RegExp[];
}

const FIELD_DEFS: FieldDef[] = [
  {
    key: "deductibleIndividual",
    kind: "currency",
    labels: [/individual\s+deductible/i, /deductible\s*\(\s*individual\s*\)/i, /single\s+deductible/i],
  },
  { key: "deductibleFamily", kind: "currency", labels: [/family\s+deductible/i] },
  {
    key: "deductibleMetYTD",
    kind: "currency",
    labels: [/deductible\s+met(?:\s+ytd)?/i, /(?:ytd|year.to.date)\s+deductible\s+met/i],
  },
  { key: "oopMax", kind: "currency", labels: [/out.of.pocket\s+max(?:imum)?/i, /\boop\s+max(?:imum)?\b/i] },
  { key: "oopMetYTD", kind: "currency", labels: [/out.of.pocket\s+met/i, /\boop\s+met\b/i] },
  {
    key: "copayPrimaryCare",
    kind: "currency",
    labels: [/primary\s+care\s+(?:physician\s+)?co-?pay/i, /\bpcp\s+co-?pay/i],
  },
  { key: "copaySpecialist", kind: "currency", labels: [/specialist\s+co-?pay/i] },
  { key: "copayEmergency", kind: "currency", labels: [/emergency\s+(?:room\s+)?co-?pay/i, /\ber\s+co-?pay\b/i] },
  { key: "copayUrgentCare", kind: "currency", labels: [/urgent\s+care\s+co-?pay/i] },
  { key: "monthlyPremium", kind: "currency", labels: [/monthly\s+premium/i] },
  { key: "coinsurance", kind: "percent", labels: [/co-?insurance/i] },
];

interface Match {
  raw: string;
  distance: number;
  direction: "forward" | "backward";
}

const WINDOW = 90;

function findLabeledValue(text: string, labelRegexes: RegExp[], valueRegex: RegExp): Match | null {
  let best: Match | null = null;

  for (const labelRe of labelRegexes) {
    const flags = labelRe.flags.includes("g") ? labelRe.flags : labelRe.flags + "g";
    const re = new RegExp(labelRe.source, flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const labelEnd = m.index + m[0].length;

      const forwardSlice = text.slice(labelEnd, labelEnd + WINDOW);
      const forwardMatch = forwardSlice.match(valueRegex);
      if (forwardMatch && forwardMatch.index !== undefined) {
        const distance = forwardMatch.index;
        if (!best || (best.direction === "forward" && distance < best.distance) || best.direction === "backward") {
          best = { raw: forwardMatch[0], distance, direction: "forward" };
        }
        continue;
      }

      const backwardStart = Math.max(0, m.index - WINDOW);
      const backwardSlice = text.slice(backwardStart, m.index);
      const backwardMatches = [...backwardSlice.matchAll(new RegExp(valueRegex.source, valueRegex.flags.includes("g") ? valueRegex.flags : valueRegex.flags + "g"))];
      if (backwardMatches.length > 0) {
        const lastMatch = backwardMatches[backwardMatches.length - 1];
        const matchEnd = (lastMatch.index ?? 0) + lastMatch[0].length;
        const distance = backwardSlice.length - matchEnd;
        if (!best) {
          best = { raw: lastMatch[0], distance, direction: "backward" };
        }
      }

      if (re.lastIndex === m.index) re.lastIndex++;
    }
  }

  return best;
}

function confidenceForMatch(match: Match): number {
  const base = match.direction === "forward" ? 0.9 : 0.5;
  if (match.distance <= 10) return base;
  if (match.distance <= 30) return base - 0.15;
  if (match.distance <= 60) return base - 0.3;
  return base - 0.4;
}

function parseMoney(raw: string): number {
  return Number(raw.replace(/[^0-9.]/g, ""));
}

function parsePercent(raw: string): number {
  return Number(raw.replace(/[^0-9.]/g, "")) / 100;
}

function findCarrier(text: string): string | null {
  for (const carrier of KNOWN_CARRIERS) {
    const re = new RegExp(carrier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (re.test(text)) return carrier;
  }
  return null;
}

function findFirst(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[0] : null;
}

/**
 * Pure text -> fields logic, split out from PDF I/O so it can be tested
 * against synthetic strings without a real PDF fixture.
 */
export function extractFromText(text: string): { fields: IntakeDraft; confidence: Partial<Record<IntakeKey, number>> } {
  const fields: IntakeDraft = {};
  const confidence: Partial<Record<IntakeKey, number>> = {};

  for (const def of FIELD_DEFS) {
    const match = findLabeledValue(text, def.labels, def.kind === "percent" ? PERCENT_RE : MONEY_RE);
    if (!match) continue;
    const value = def.kind === "percent" ? parsePercent(match.raw) : parseMoney(match.raw);
    if (Number.isNaN(value)) continue;
    (fields as Record<string, number>)[def.key] = value;
    confidence[def.key as IntakeKey] = Number(confidenceForMatch(match).toFixed(2));
  }

  // Fallback: a bare "deductible" mention (not "deductible met") if we didn't
  // already find an individual deductible via a more specific label.
  if (fields.deductibleIndividual === undefined) {
    const fallback = findLabeledValue(text, [/\bdeductible\b(?!\s+met)/i], MONEY_RE);
    if (fallback) {
      const value = parseMoney(fallback.raw);
      if (!Number.isNaN(value)) {
        fields.deductibleIndividual = value;
        confidence.deductibleIndividual = Math.min(0.4, confidenceForMatch(fallback));
      }
    }
  }

  const carrier = findCarrier(text);
  if (carrier) {
    fields.carrier = carrier;
    confidence.carrier = 0.85;
  }

  const planType = findFirst(text, PLAN_TYPE_RE);
  if (planType) {
    fields.planType = planType.toUpperCase();
    confidence.planType = 0.7;
  }

  const metalTier = findFirst(text, METAL_TIER_RE);
  if (metalTier) {
    fields.metalTier = metalTier[0].toUpperCase() + metalTier.slice(1).toLowerCase();
    confidence.metalTier = 0.7;
  }

  return { fields, confidence };
}

async function pdfTextFromBuffer(buffer: Buffer): Promise<string> {
  // Our own reader first. pdf-parse works locally but not in the deployed
  // function: pdfjs-dist touches DOM globals at module evaluation and resolves
  // its worker by dynamic import, so uploads 500'd in production and then
  // extracted nothing once shimmed. pdfToText needs only node:zlib.
  const direct = pdfToText(buffer);
  if (direct.length > 0) return direct;

  // Fall back to pdf-parse for shapes our reader can't open. If that fails too
  // the caller falls through to manual entry, which is designed behaviour.
  ensureWorkerConfigured();
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function extractHeuristic(buffer: Buffer): Promise<ExtractResult> {
  let text: string;
  try {
    text = await pdfTextFromBuffer(buffer);
  } catch (err) {
    console.error("[extractHeuristic] pdf parse failed:", err);
    return {
      fields: {},
      confidence: {},
      source: "heuristic",
      notice: "We couldn't read that PDF. You can still enter your plan details manually below.",
    };
  }

  const { fields, confidence } = extractFromText(text);
  const fieldCount = Object.keys(fields).length;

  const result: ExtractResult = { fields, confidence, source: "heuristic" };

  if (fieldCount === 0) {
    result.notice =
      "We couldn't confidently pull any plan details from this document. No worries — fill them in below and we'll use what you enter.";
  } else if (fieldCount < 4) {
    result.notice = "We found a few details in this document. Please check them and fill in the rest.";
  }

  return result;
}
