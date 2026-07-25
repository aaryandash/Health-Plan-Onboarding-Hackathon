<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Emme Health-Plan Onboarding — read this first

**You are helping a 4-person team win a 4-hour hackathon. Build time ends at 3:00 PM EDT sharp.**

If your human says "start working," find their lane in **Your Lane** below and begin immediately. Don't re-plan the project. Don't ask what to build. The decisions are already made and recorded here.

## What we're building

An intake flow for **Emme** (https://emme.com/) — a healthtech company that tells members what their care will cost under their specific plan. Every calculation needs precise inputs, and Emme has no clean way to collect them.

The client's own framing, which is the entire design constraint:

> The core challenge isn't the data model; it's the front door. Healthcare is a subject most people approach with anxiety and learned helplessness. A form that feels like a standard medical form kills trust before we earn it. We need an intake experience that feels like a smart, reassuring first conversation — progressive, low-friction, with every question earning its place.

Full product record: **`PRODUCT.md`**. Read it before writing UI or copy.

## Non-negotiables

These are graded. Judges will check each one.

1. **Under 3 minutes** to complete, on a mobile browser
2. **Plain language + tooltips** — every question explains *why* Emme needs it, in jargon-free language, inline
3. **Auto-save** — partial progress persists, member can leave and resume
4. **Confirmation screen** framed "Here's what we know about your plan" — explicitly NOT a generic thank-you
5. **Structured JSON export** — clean, ready for a backend cost engine
6. **Document extraction** — SBC/EOB uploads (PDF or image) parse and auto-fill
7. **Skippable upload** — members can bypass documents entirely

**Core Flow Rule (verbatim from the client):** Both paths must be available simultaneously. Start with upload, fall back gracefully to manual entry for any unextracted fields, and allow members to edit/correct pre-populated data. Members must also be able to skip document upload entirely.

## Hard constraints — do not violate

- **NO cost estimation.** We collect inputs. We do not calculate, project, or display what care will cost. Confirmed out of scope with the client. Restating a member's own plan terms back to them ("you've met $840 of your $2,500 deductible") is fine and encouraged — projecting the price of a future service is not.
- **No database, no auth, no server-side file writes.** State lives in `localStorage`. The deploy target has an ephemeral filesystem — an API route writing JSON to disk will work locally and silently fail in production.
- **Synthetic data only.** Never enter real insurance details anywhere. See `data/README.md`.
- **No Claude attribution** in commits or PRs. Already configured.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, **npm** (not pnpm, not yarn). Deploy: Vercel.

- dev: `npm run dev` · build: `npm run build` · lint: `npm run lint`
- `components/ui/**` is generated shadcn. Never hand-edit. Re-run `npx shadcn@latest add <name>`.

## Architecture — one idea carries the build

**`lib/schema.ts` drives everything.** Every field is defined once, with its label, type, plain-language `why`, and where to find it on an SBC/EOB. The form UI, tooltips, extraction target, confirmation screen, and JSON export are all derived from it.

Add a field there and it appears everywhere. **Never hardcode a field name in a component.** If you're tempted to, you're working around the architecture.

## Your Lane

Four people, four lanes. **Only edit files in your lane.** This is how we avoid spending an hour on merge conflicts.

### P1 — the app (Aaryan)
**Owns:** `lib/schema.ts`, `lib/types.ts`, `lib/store.tsx`, `lib/export.ts`, `app/page.tsx`, `components/intake/**`, `components/confirmation.tsx`
Works directly on `main`.
Order: schema → store + autosave → form UI → confirmation screen.

### P2 — extraction
**Owns:** `app/api/extract/route.ts`, `lib/extract/**`, `data/*.pdf`
Works on branch `extract`, opens **one** PR at 1:30. Touch nothing outside these paths.

Build `POST /api/extract`: accepts a file, returns

```ts
{ fields: Partial<PlanIntake>, confidence: Record<string, number>, source: "llm" | "heuristic" }
```

Ship the no-key path first: `npm i pdf-parse`, read the text layer, regex for `/deductible/i`, `/out-of-pocket\s+max/i`, `/coinsurance/i`, `/copay/i` and nearby currency patterns. Download the sample BCBS EOB into `data/` as a fixture so the demo never depends on venue Wi-Fi:
https://www.kentcountymi.gov/DocumentCenter/View/1459/BCBS-Understanding-Your-Explanation-of-Benefits-EOB-Statement-PDF

Add an LLM path behind the same interface only if an `ANTHROPIC_API_KEY` appears. **Always return partial results** — unextracted fields falling through to manual entry is the Core Flow Rule working correctly, not a failure.

### P3 — copy and the client conversation
**Owns:** all member-facing words. Writes in a shared doc; P1 pastes into `lib/schema.ts`.

Every field needs a `why` — one plain sentence, warm, no jargon, explaining what Emme does with it. The client's own example: explain what "YTD Deductible Met" means *before* asking for it. Also owns section blurbs, dead-end copy ("no documents? that's completely fine — here's what to do"), and the confirmation screen wording.

Also owns the Emme rep on site. Ask:
1. **Of these 30 fields, which are load-bearing for your cost engine and which are nice-to-have?** (highest-value question — their answer tells us what to defer)
2. Where do real members drop off today?
3. **Do you have an existing JSON schema for this payload?** (if yes, we match it exactly)
4. What terminology do your members actually use?

### P4 — pitch and demo
**Owns:** the deck, demo script, demo data, phone testing, submission.
Start the deck at 12:00, not 2:30. Presentation is 25% of the score.
3-minute pitch + 2-minute Q&A. Rehearse twice with a timer, on the actual phone you'll present with. Film a backup demo video by 2:30 in case live fails.
Submit at https://red.ht/toa-healthhack

## Differentiation — why we beat 15 identical wizards

Everyone will ship a wizard with a progress bar and an upload box. Criteria compliance is table stakes. Our edge:

1. **Shortest honest flow.** Shrinking question counter ("14 questions left" → upload → "4 questions left"). Infer what we can (metal tier from carrier + plan name; family deductible ≈ 2× individual). Defer nice-to-haves behind "add this later, it sharpens your estimates."
2. **The confirmation screen teaches members their own plan.** Most people have never had their plan explained back to them. No cost projection needed — just their own numbers in plain English.
3. **Dead ends are designed, not patched.** No document, unreadable upload, "I don't know" — each gets a warm specific path. Other teams will ship an error toast.

## Working rules

- Commit every ~20 min. Conventional prefixes (`feat:`, `fix:`, `chore:`).
- P1 on `main`. Everyone else on `yourname/feature`, PR in.
- **2:15 PM = feature freeze.** No new functionality after that. Ignore this and you'll be debugging at 2:55.
- Test on a real phone, not the desktop responsive simulator.
- Render `<MedicalDisclaimer />` (in `components/`) on the confirmation screen.

## Cut list when behind, in order

1. HSA section → single "Do you have an HSA?" toggle
2. Prescriptions → one drug, not a repeatable list
3. LLM extraction → heuristic only
4. Upcoming Care → checkboxes only, drop free text

**Never cut:** upload path, manual fallback, tooltips, autosave, confirmation screen, JSON export. Those are the seven graded criteria.
