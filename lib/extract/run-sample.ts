import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractFromText, extractHeuristic } from "./heuristic";

const SAMPLE_EOB_PDF = path.resolve(process.cwd(), "data/sample-eob.pdf");

// A synthetic EOB-style text block with real cost-sharing numbers, used to
// prove the regex/proximity logic itself works. The real data/sample-eob.pdf
// (the BCBS "how to read your EOB" explainer we're required to use as the
// demo fixture) is an annotated walkthrough with no actual dollar figures in
// it, so extraction against it alone can't demonstrate correctness.
const SYNTHETIC_EOB_TEXT = `
Blue Cross Blue Shield of Michigan
Plan Name: Blue Care Network PPO Gold 2000
Individual Deductible: $2,000.00   Family Deductible: $4,000.00
Deductible Met YTD: $840.00
Out-of-Pocket Maximum: $6,000.00   OOP Met YTD: $1,150.00
Coinsurance: 20%
Primary Care Copay: $25.00   Specialist Copay: $50.00
Emergency Room Copay: $250.00   Urgent Care Copay: $75.00
Monthly Premium: $410.00
`;

async function main() {
  console.log("=== Synthetic text fixture (proves regex/parsing logic) ===");
  const synthetic = extractFromText(SYNTHETIC_EOB_TEXT);
  console.log(JSON.stringify(synthetic, null, 2));

  console.log("\n=== data/sample-eob.pdf (real demo fixture, PDF text layer) ===");
  const buffer = await readFile(SAMPLE_EOB_PDF);
  const result = await extractHeuristic(buffer);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
