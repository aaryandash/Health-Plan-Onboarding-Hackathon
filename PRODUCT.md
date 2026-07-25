# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Emme members who have just signed up and are being onboarded for the first time. They have an employer or marketplace health plan and are about to be asked for the details that make cost estimates possible.

The defining fact about this user is emotional, not demographic. From the client brief, verbatim:

> Healthcare is a subject most people approach with anxiety and learned helplessness.

They are not eager form-fillers. They may not know what a deductible is, may not know whether they have met theirs, and may not be able to find their insurance documents. Many will attempt this on a phone, possibly in a waiting room or on a couch, in a single sitting they want to be short.

## Product Purpose

Collect the precise inputs Emme's cost-calculation engine needs, through an intake experience that earns trust rather than spending it.

Success is a member who completes the flow in under three minutes on a mobile browser, understood why each question was asked, and finishes feeling that Emme now knows their plan — rather than feeling processed.

Failure, per the brief, is a flow that "feels like a standard medical form," which "kills trust before we earn it."

## Positioning

The differentiator is the front door, not the data model. The brief is explicit that the schema is the easy part and the intake experience is the hard, unsolved one.

Two mechanisms a neighboring product could not trivially copy:

1. **Dual-path intake with graceful degradation.** Document upload and manual entry are available simultaneously, not as an either/or fork. Extraction fills what it can; everything unextracted falls through to manual entry as a normal state, not an error. The member can skip documents entirely at any point.
2. **Every question earns its place.** Each field carries a plain-language justification of why Emme needs it, surfaced at the moment of asking rather than buried in a help center.

## Operating Context

- **Device:** mobile browser is the primary target. Under three minutes, start to finish.
- **Documents the member may have:** Summary of Benefits and Coverage (SBC), and their most recent Explanation of Benefits (EOB). Either may be a PDF or a photo. Many members will have neither to hand, or will not know what these documents are called.
- **Session behavior:** partial completion is expected and normal. Members abandon and resume. State must persist without an account.
- **Downstream:** collected data exports as structured JSON consumed by Emme's backend cost-calculation logic.
- **Reference material provided by the client:** UHC's EOB explainer (https://www.uhc.com/understanding-health-insurance/how-does-health-insurance-work/explanation-of-benefits) and a sample BCBS EOB statement (https://www.kentcountymi.gov/DocumentCenter/View/1459/BCBS-Understanding-Your-Explanation-of-Benefits-EOB-Statement-PDF).

## Capabilities and Constraints

**Confirmed capabilities**

- Two simultaneous intake paths: document upload with auto-population, and direct manual entry with guidance on where to find each value.
- Pre-populated values are always visible as such, and always editable by the member.
- Document upload is fully skippable.
- Automatic save of partial progress; the member can leave and resume without loss.
- A closing summary screen framed as "Here's what we know about your plan," explicitly not a generic thank-you page.
- Export of all responses as clean, structured JSON.
- Extraction from PDF and image uploads, via LLM/vision APIs or OCR libraries.

**Data collected** — eight categories, fixed by the client:

| Category | Fields |
|---|---|
| Identity | Name, Email, Zip Code |
| Household | Household Size, Income Range, Filing Status |
| Plan Details | Carrier, Plan Name, Metal Tier, Plan Type (HMO/PPO/EPO/HDHP) |
| Cost-Sharing | Deductible (Individual + Family), YTD Deductible Met, OOP Max, OOP Met YTD, Copays, Coinsurance, Monthly Premium |
| Documents | SBC Upload, Most Recent EOB Upload (optional, skippable) |
| HSA | HSA Eligible (Y/N), Current Balance, YTD Contributions, Employer Contribution |
| Prescriptions | Drug Name, Dosage, Frequency, Payment Method (Cash vs Insurance), Preferred Pharmacy |
| Upcoming Care | Planned Procedures, Chronic Conditions, Pregnancy, Behavioral Health Needs |

**Constraints**

- **No cost estimation.** This product collects inputs; it does not calculate, project, or display what care will cost. Cost math is Emme's engine, downstream of this flow. Confirmed out of scope.
- No user accounts or authentication. Persistence is client-side.
- No server-side file storage. The deployment target has an ephemeral filesystem.
- Under three minutes to complete, on a phone.

**Terminology** — member (not patient, not user), plan, carrier, deductible, coinsurance, copay, out-of-pocket maximum, SBC, EOB.

## Brand Commitments

The product presents as **Emme's** onboarding flow, under Emme's name (https://emme.com/).

Voice is set by the brief and is binding: the flow must read as "a smart, reassuring first conversation — progressive, low-friction." Plain language throughout; every piece of insurance jargon is explained before it is used. No clinical or administrative register.

No Emme brand assets, logo files, or palette have been supplied.

## Evidence on Hand

- The client brief, with verbatim problem statement, the eight-category field table, the Core Flow Rule, and seven acceptance criteria.
- A publicly available sample BCBS EOB statement, usable as an extraction fixture.
- The UHC EOB explainer as domain reference.

**Absences future work must not fabricate:** no real Emme member data, no usage or drop-off statistics, no testimonials, no pricing, no negotiated-rate data, no Emme brand assets. All demonstration data is synthetic.

## Product Principles

1. **The front door is the product.** The data model is solved; the intake experience is not. Effort belongs at the moment of asking.
2. **Every question earns its place.** A field that cannot justify itself to the member in one plain sentence should not be asked.
3. **Reduce, then ask.** Prefer extracting, inferring, or deferring a value over asking for it. The shortest honest flow wins.
4. **Never a dead end.** Missing document, unreadable upload, unknown value, abandoned session — each has a graceful path forward, framed as normal rather than as failure.
5. **The member is always in control.** Anything pre-filled is visible as pre-filled and editable. Anything optional is skippable without penalty or guilt.

## Accessibility & Inclusion

Mobile-first, one-handed use on a phone. Members span a wide range of health-insurance literacy and cannot be assumed to know standard terminology. No product-specific conformance standard has been established by the client; treat WCAG AA contrast and tap-target sizing as the working floor.
