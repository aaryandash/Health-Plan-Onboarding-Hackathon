import { createWriteStream } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

/** Generates demo-brief.pdf. Regenerate: npx tsx scripts/make-demo-brief.ts */

const OUT = path.resolve(process.cwd(), "demo-brief.pdf");
const NAVY = "#01447e";
const INK = "#313131";
const GREY = "#6b625c";
const W = 512;

const doc = new PDFDocument({ size: "LETTER", margin: 50 });
doc.pipe(createWriteStream(OUT));

function h(t: string) {
  doc.moveDown(0.6);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text(t, { width: W });
  doc.moveDown(0.25);
}
function b(t: string) {
  doc.fillColor(INK).font("Helvetica").fontSize(10).text(`•  ${t}`, { width: W, lineGap: 1.5 });
  doc.moveDown(0.15);
}
function qa(q: string, a: string) {
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10).text(q, { width: W });
  doc.fillColor(INK).font("Helvetica").fontSize(10).text(a, { width: W, lineGap: 1.5 });
  doc.moveDown(0.3);
}

doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(24).text("emme — demo cheat sheet");
doc.fillColor(GREY).font("Helvetica").fontSize(10).text("med-hack-template.vercel.app");

h("What we built");
b("An intake flow that collects someone's health plan details so Emme can work out what their care costs.");
b("Upload your insurance PDF and it fills the form in, or skip it and type it yourself. Both always available.");

h("What we used");
b("TypeScript — the whole thing");
b("React + Next.js — the app and the one API endpoint");
b("Tailwind CSS + shadcn/ui — styling and components");
b("Node.js — the PDF reader (built it ourselves, no library)");
b("Vercel — hosting");
b("No database. Answers save in the browser, so you can close it and come back.");

h("Demo order");
b("Landing page — show the confusing statement next to the plain-English version");
b("Start form, upload sample-eob-synthetic.pdf");
b("12 fields fill in. Question count drops 21 to 13 — pause and let them see it");
b("Scroll a section: every question says why we're asking. Tap 'I don't have this'");
b("Reload the page — everything's still there");
b("Finish, show the summary explaining their plan in plain English");
b("Tap 'Show me the raw data' for the JSON");

h("Q&A");
qa("Is it really reading the PDF?",
  "Yes. It searches the text for labels like 'Deductible' and grabs the number next to it. No AI, no API key.");
qa("Is that a real insurance document?",
  "No, we made it. Says so on the document itself. We're not using real patient data.");
qa("What about privacy / HIPAA?",
  "Nothing is stored on a server. It all stays in your browser. Real version would need proper auth and encryption.");
qa("Why doesn't it show what care will cost?",
  "We asked Emme — that's their engine's job. We collect the inputs for it.");
qa("What if the PDF doesn't work?",
  "It tells you and you type it in instead. Never a dead end.");
qa("How does it handle more insurance companies?",
  "One file lists all the questions. Add to that file and the whole app updates. No UI changes.");
qa("What's not finished?",
  "Validation is basic. The cost section is long and people would probably drop off there. We haven't tested with real users.");
qa("Who did what?",
  "Aaryan built the app and the form. Shreyas built the PDF extraction. Others on copy, research and the pitch.");

h("If it breaks");
b("Skip the upload — the manual path needs no internet");
b("Have a screen recording on the phone as backup");

doc.moveDown(0.5);
doc.fillColor(GREY).font("Helvetica-Oblique").fontSize(9)
  .text("All numbers in the demo are made up. No real patient data anywhere.", { width: W });

doc.end();
console.log(`wrote ${OUT}`);
