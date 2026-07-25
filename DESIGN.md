# Design

<!-- impeccable:design-schema 1 -->

## Direction contract

**THESIS.** An intake flow that reads as one continuous conversation, not a form. It refuses the category default — a card-grid wizard with a step counter and a dense field stack — in favour of a single question-group per screen on a warm ground, where the reason for each question sits next to the question itself rather than behind a "?" icon.

**OWN-WORLD.** Emme's own identity, pinned by the client. Cream ground `#fff8f4`, deep navy `#01447e` carrying whole regions, terracotta `#e37753` reserved exclusively for the member's next action. Zain for display, Poppins for everything else. Generous vertical rhythm, large soft-cornered inputs, no cards inside cards.

**STORY.** A member who just joined Emme understands what's about to be asked and why, sees that nothing is mandatory, gives what they have, and finishes seeing their own plan explained back to them in plain English.

**FIRST VIEWPORT.** Navy welcome panel, Zain headline set large, three plain-language reassurances stacked beneath, one terracotta primary action, one quiet secondary. No progress bar until the flow actually starts.

**FORM.** Pinned by the client brief ("match the emme website"), so no concept roll was run. Mode: Operate.

## Platform

web · mobile-first

## Palette

Extracted from emme.com's live CSS custom properties. These are the client's real tokens, not an interpretation.

| Token | Value | Role |
|---|---|---|
| `--emme-navy` | `#01447e` | Structural. Welcome panel, section headers, footer, filled surfaces. Carries real area, not accents. |
| `--emme-terracotta` | `#e37753` | **Action only.** Primary buttons, active states, the extracted-value badge. Never decorative. |
| `--emme-cream` | `#fff8f4` | Page ground. The default surface for everything. |
| `--emme-white` | `#ffffff` | Raised surfaces — input fields, answered-question rows. |
| `--emme-ink` | `#313131` | Body text. |
| `--emme-grey` | `#b2b2be` | Placeholders, disabled, hint text on cream. |

**Strategy:** three named roles. Navy and cream own regions; terracotta owns action and nothing else. Any terracotta the member cannot press is a bug.

**Light, not dark.** The use scene is a person on a phone in daylight — a couch, a waiting room — who is mildly anxious about money and health. A dark UI reads clinical and expensive here. Cream reads like paper mail from someone who is on your side.

**Contrast rules.** Navy on cream and ink on cream both clear 4.5:1. Terracotta `#e37753` on cream is **~2.7:1 and must never carry body text** — it is a fill with white text on it, or a border, or a large-text-only colour. White on terracotta clears large-text 3:1; use ≥18px semibold on terracotta fills. Secondary text on navy is tinted from navy, never grey.

## Type

- **Display — Zain** (Google Fonts, weights 200/300/400/700/800). Headlines, section titles, the number in the question counter. High x-height, slightly condensed, warm without being cute. Tracking floor `-0.02em` at display sizes.
- **Body — Poppins** (300/400/500/600/700). All questions, helper copy, labels, buttons.
- Body measure caps at 65ch. Display caps at 3.5rem on mobile.
- Question labels are Poppins 500 at 1.125rem. The `why` copy sits directly beneath at 0.9375rem in ink at 80% — never in grey, never behind an icon.

## Components

- **Inputs:** white fill on cream, 1px `#e8ddd6` border, 14px radius, `min-height: 3.25rem`, `font-size: 1rem` minimum (prevents iOS zoom-on-focus). Focus: 2px navy ring, no glow.
- **Primary action:** terracotta fill, white text, full-width on mobile, 3.25rem tall.
- **Secondary action:** navy text on transparent, underlined. Skip and "I don't have this" always look pressable, never like a lesser choice — Product Principle 5.
- **Extracted badge:** small terracotta-tinted pill reading "from your document", attached to the field, with the value still fully editable.
- **No cards as page structure.** Sections are separated by space and a navy rule, not by nested boxes.

## Motion

One authored moment: question groups enter with a 12px rise and fade, exponential ease-out, 240ms, from an already-visible default. The shrinking question counter animates its number change. Nothing else moves. Respect `prefers-reduced-motion`.

## Accessibility floor

WCAG AA contrast, 44px minimum tap targets, visible keyboard focus on every control, inputs at 16px+, every field label bound to its control. Members span a wide range of health-insurance literacy — jargon is explained before it is used, everywhere, with no exceptions.
