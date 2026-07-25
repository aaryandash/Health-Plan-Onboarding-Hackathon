# Emme Health-Plan Onboarding

An intake flow for [Emme](https://emme.com/) — a healthtech company that tells members what their care will cost under their own plan. This app collects the inputs Emme's cost engine needs, through a flow designed to feel like a reassuring first conversation instead of a medical form.

Built in a 4-hour hackathon. **This product does not estimate or display costs** — it only collects and structures plan inputs for Emme's downstream engine.

## How it works

- **`/`** — landing page explaining Emme, the problem, and what happens next.
- **`/intake`** — the question flow. Upload an SBC/EOB (PDF or photo) to auto-fill fields, or skip straight to manual entry. Every question explains *why* Emme needs it. Progress auto-saves to `localStorage`.
- **`/summary`** — "Here's what we know about your plan," restating the member's own numbers in plain English, plus a structured JSON export for Emme's backend.

Document extraction (`POST /api/extract`) reads the uploaded PDF's text layer and regexes out cost-sharing fields (deductibles, OOP max, coinsurance, copays) with a per-field confidence score. It upgrades to an LLM-based path automatically when `ANTHROPIC_API_KEY` is set. Anything not extracted — or not uploaded at all — falls through to manual entry; that's expected behavior, not a failure state.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui. Package manager is **npm**. Deploy target is Vercel.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other commands: `npm run build`, `npm run lint`.

## Layout

- **`lib/schema.ts`** — every question, its type, and the plain-language reason we ask it. Drives the form, the summary and the export.
- **`lib/store.tsx`** — answers, autosave, and where each value came from.
- **`lib/extract/`** — PDF text extraction and field matching.
- **`lib/summarize.ts`** — turns answers into plain-English sentences about the plan.
- **`data/README.md`** — rules for synthetic-only data in this repo.

## Hard constraints

- No cost estimation — inputs only, never a price.
- No database, no auth, no server-side file writes — state lives in `localStorage`.
- Synthetic data only. No real insurance or patient details anywhere in this repo.
