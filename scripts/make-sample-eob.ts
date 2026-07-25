import { writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Generates the demo fixture: data/sample-eob-synthetic.pdf
 *
 * Why this exists: the BCBS file the brief links to is an annotated
 * "how to read your EOB" walkthrough. It contains no dollar figures, so
 * extraction against it yields one field and the upload demo falls flat.
 *
 * This writes a minimal, uncompressed, single-page PDF by hand. pdfkit was
 * tried first and buries its text in a stream our reader can't reach; a
 * hand-emitted file keeps the text layer plainly readable, which is the whole
 * point of a parser fixture.
 *
 * Every figure is invented. The member, plan, provider and claim do not exist,
 * and the document says so on its face.
 *
 * Regenerate with: npx tsx scripts/make-sample-eob.ts
 */

const OUT = path.resolve(process.cwd(), "data/sample-eob-synthetic.pdf");

type Line = { text: string; size?: number; gap?: number };

const LINES: Line[] = [
  { text: "Blue Cross Blue Shield of Michigan", size: 18, gap: 22 },
  { text: "Explanation of Benefits - This is not a bill", size: 11, gap: 26 },

  { text: "Member Name: Jordan A. Rivera (SAMPLE)", size: 11, gap: 16 },
  { text: "Member ID: XJM-000-000-000", size: 11, gap: 16 },
  { text: "Plan Name: Blue Care Elect Preferred Gold 2500", size: 11, gap: 16 },
  { text: "Plan Type: PPO", size: 11, gap: 16 },
  { text: "Statement Date: June 30, 2026", size: 11, gap: 26 },

  { text: "Your plan year to date", size: 13, gap: 22 },
  { text: "Individual Deductible: $2,500.00", size: 11, gap: 16 },
  { text: "Family Deductible: $5,000.00", size: 11, gap: 16 },
  { text: "Deductible Met YTD: $840.00", size: 11, gap: 16 },
  { text: "Out-of-Pocket Maximum: $6,000.00", size: 11, gap: 16 },
  { text: "OOP Met YTD: $1,240.00", size: 11, gap: 16 },
  { text: "Coinsurance: 20%", size: 11, gap: 16 },
  { text: "Primary Care Copay: $25.00", size: 11, gap: 16 },
  { text: "Specialist Copay: $50.00", size: 11, gap: 16 },
  { text: "Urgent Care Copay: $75.00", size: 11, gap: 16 },
  { text: "Emergency Room Copay: $250.00", size: 11, gap: 16 },
  { text: "Monthly Premium: $310.00", size: 11, gap: 26 },

  { text: "This claim", size: 13, gap: 22 },
  { text: "Provider: Riverside Primary Care Associates", size: 11, gap: 16 },
  { text: "Service Date: June 12, 2026", size: 11, gap: 16 },
  { text: "Service: Office visit, established patient", size: 11, gap: 16 },
  { text: "Amount Billed: $180.00", size: 11, gap: 16 },
  { text: "Plan Discount: -$47.60", size: 11, gap: 16 },
  { text: "Amount Applied to Deductible: $107.40", size: 11, gap: 16 },
  { text: "Patient Responsibility: $132.40", size: 11, gap: 30 },

  { text: "SYNTHETIC SAMPLE DOCUMENT - generated for a hackathon prototype.", size: 8, gap: 12 },
  { text: "The member, plan, provider, claim and all figures shown are invented.", size: 8, gap: 12 },
  { text: "This is not a real Explanation of Benefits and contains no real patient data.", size: 8, gap: 12 },
];

/** Escape the characters that are structural inside a PDF string literal. */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

let y = 740;
const ops: string[] = ["BT", "/F1 11 Tf", `1 0 0 1 54 ${y} Tm`];
for (const line of LINES) {
  ops.push(`/F1 ${line.size ?? 11} Tf`);
  ops.push(`1 0 0 1 54 ${y} Tm`);
  ops.push(`(${esc(line.text)}) Tj`);
  y -= line.gap ?? 16;
}
ops.push("ET");
const content = ops.join("\n");

// Assemble the file, tracking byte offsets for the xref table.
const objects: string[] = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
  `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
];

let pdf = "%PDF-1.4\n";
const offsets: number[] = [];
objects.forEach((body, idx) => {
  offsets.push(Buffer.byteLength(pdf, "latin1"));
  pdf += `${idx + 1} 0 obj\n${body}\nendobj\n`;
});

const xrefOffset = Buffer.byteLength(pdf, "latin1");
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const off of offsets) {
  pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

writeFileSync(OUT, Buffer.from(pdf, "latin1"));
console.log(`wrote ${OUT} (${Buffer.byteLength(pdf, "latin1")} bytes)`);
