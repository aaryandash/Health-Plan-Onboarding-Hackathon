# Data — SYNTHETIC ONLY

No real patient data enters this repo, ever. Not in files, not in prompts, not in screenshots, not in demo videos.

This is a disqualification risk and a legal risk, not a style preference.

## Sources we use

- **Synthea** (MITRE) — synthetic patients with realistic FHIR R4 bundles, the default choice.
  - Pre-generated sample downloads: https://synthea.mitre.org/downloads
  - Generate your own (needs Java): https://github.com/synthetichealth/synthea
- **HAPI FHIR public test server** — free FHIR R4 endpoint, no auth, no signup.
  - Base: `https://hapi.fhir.org/baseR4`
  - Example: `https://hapi.fhir.org/baseR4/Patient?_count=10`
- **MIMIC-IV Clinical Database Demo** — 100 de-identified ICU patients, open access, no credentialing.
  - https://physionet.org/content/mimic-iv-demo/

## Terminologies

ICD-10-CM, SNOMED CT, RxNorm, LOINC. Download offline copies if we need them — public terminology APIs go down under hackathon load, local files do not.

## Rule

If you cannot point at the synthetic source for a data file, it does not go in the repo.
