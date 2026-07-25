<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Med Hackathon — Team Context

## What we are building

<!-- FILL IN AT T+0. One sentence on the product. Then the judging criteria we are optimizing for. -->

## Stack — do not change without telling the team

- Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui
- Package manager: **npm**. Not pnpm, not yarn.
- Deploy: Vercel

## Commands

- dev: `npm run dev`
- build: `npm run build`
- lint: `npm run lint`

## Hard rules

- **Synthetic patient data only.** Never paste real PHI into a prompt, a file, or the repo. See `data/README.md`.
- Any diagnostic, triage, or risk output renders `<MedicalDisclaimer />` from `components/medical-disclaimer.tsx`. Not optional, not "add it later".
- No mock or placeholder data on the demo path. If it is in the demo, it is real code.
- Errors surface in the UI. Never swallow into `console.log`.
- Small commits, every ~20 minutes. Cheap rollback beats 3am debugging.

## File ownership — stay in your lane, this is how we avoid merge hell

| Person | Owns |
|--------|------|
| Aaryan | `app/api/**`, `lib/**` |
| TBD 2  | `app/(ui)/**`, `components/**` (not `components/ui/**`) |
| TBD 3  | `lib/model/**`, `scripts/**` |
| TBD 4  | `data/**`, deploy config, demo script |

If you need a file outside your lane, ask in chat first. Do not silently edit it.

`components/ui/**` is generated shadcn code — nobody hand-edits it. Re-run `npx shadcn@latest add <name>` instead.

## Conventions

- Types live in the file that owns them, not a global `types.ts`.
- Server-side secrets in `.env.local` only. Never `NEXT_PUBLIC_` a key.
- Branch naming: `yourname/feature`. Never commit to `main` directly.
