import { createWriteStream } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

/**
 * Generates the demo fixture: data/sample-eob-synthetic.pdf
 *
 * Why this exists: the BCBS file the brief links to is an *annotated
 * walkthrough* explaining how to read an EOB. It contains no real dollar
 * figures, so extraction against it yields one field and the upload demo
 * falls flat.
 *
 * This is a synthetic EOB laid out the way a real one is, with plausible
 * cost-sharing numbers, so the parser has something honest to work on. Every
 * figure is invented — the member, the plan, and the claim do not exist, and
 * the document says so on its face.
 *
 * Regenerate with: npx tsx scripts/make-sample-eob.ts
 */

const OUT = path.resolve(process.cwd(), "data/sample-eob-synthetic.pdf");

const NAVY = "#01447e";
const INK = "#313131";
const GREY = "#6b625c";

const doc = new PDFDocument({ size: "LETTER", margin: 54 });
doc.pipe(createWriteStream(OUT));

function rule(y: number) {
  doc.moveTo(54, y).lineTo(558, y).strokeColor("#d9d2cc").lineWidth(1).stroke();
}

// Header
doc.fillColor(NAVY).fontSize(20).font("Helvetica-Bold");
doc.text("Blue Cross Blue Shield of Michigan");
doc.moveDown(0.2);
doc.fillColor(GREY).fontSize(11).font("Helvetica");
doc.text("Explanation of Benefits — This is not a bill");
doc.moveDown(0.8);
rule(doc.y);
doc.moveDown(0.8);

// Member / plan block
doc.fillColor(INK).fontSize(11).font("Helvetica");
const lines: [string, string][] = [
  ["Member Name:", "Jordan A. Rivera (SAMPLE)"],
  ["Member ID:", "XJM-000-000-000"],
  ["Plan Name:", "Blue Care Elect Preferred Gold 2500"],
  ["Plan Type:", "PPO"],
  ["Statement Date:", "June 30, 2026"],
  ["Claim Number:", "0000000000"],
];
for (const [label, value] of lines) {
  doc.font("Helvetica-Bold").text(label, { continued: true });
  doc.font("Helvetica").text(`  ${value}`);
}

doc.moveDown(1);
rule(doc.y);
doc.moveDown(0.8);

// Cost sharing — the block the parser actually targets. Label/value proximity
// matters here; keep the wording close to how carriers really print it.
doc.fillColor(NAVY).fontSize(13).font("Helvetica-Bold");
doc.text("Your plan year to date");
doc.moveDown(0.6);
doc.fillColor(INK).fontSize(11);

const costs: [string, string][] = [
  ["Individual Deductible:", "$2,500.00"],
  ["Family Deductible:", "$5,000.00"],
  ["Deductible Met YTD:", "$840.00"],
  ["Out-of-Pocket Maximum:", "$6,000.00"],
  ["OOP Met YTD:", "$1,240.00"],
  ["Coinsurance:", "20%"],
  ["Primary Care Copay:", "$25.00"],
  ["Specialist Copay:", "$50.00"],
  ["Urgent Care Copay:", "$75.00"],
  ["Emergency Room Copay:", "$250.00"],
  ["Monthly Premium:", "$310.00"],
];
for (const [label, value] of costs) {
  doc.font("Helvetica-Bold").text(label, 54, doc.y, { continued: true });
  doc.font("Helvetica").text(`   ${value}`);
  doc.moveDown(0.15);
}

doc.moveDown(0.8);
rule(doc.y);
doc.moveDown(0.8);

// Claim detail, so the document reads like a real EOB rather than a form.
doc.fillColor(NAVY).fontSize(13).font("Helvetica-Bold");
doc.text("This claim");
doc.moveDown(0.6);
doc.fillColor(INK).fontSize(11).font("Helvetica");
doc.text("Provider: Riverside Primary Care Associates");
doc.text("Service Date: June 12, 2026");
doc.text("Service: Office visit, established patient");
doc.moveDown(0.4);
doc.text("Amount Billed:              $180.00");
doc.text("Plan Discount:              -$47.60");
doc.text("Amount Applied to Deductible:  $107.40");
doc.text("Plan Paid:                    $0.00");
doc.font("Helvetica-Bold").text("Patient Responsibility:     $132.40");

doc.moveDown(1.5);
rule(doc.y);
doc.moveDown(0.6);

doc.fillColor(GREY).fontSize(9).font("Helvetica");
doc.text(
  "SYNTHETIC SAMPLE DOCUMENT. Generated for a hackathon prototype. The member, plan, provider, " +
    "claim and all figures shown are invented. This is not a real Explanation of Benefits and " +
    "contains no real patient data.",
  { width: 504 },
);

doc.end();
console.log(`wrote ${OUT}`);
