---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/Capture.tsx","components/ResultsPanel.tsx","components/ScanLog.tsx"]
---

# Home scanning workspace

- Scope: `/` scanning workspace; mode: Operate.
- Audience/job: tray-return employee scanning one tray at a time with minimal interruption.
- Task: see station readiness, capture or auto-detect a tray, understand the result, clear the surface, continue.
- Proof: camera state, annotated result, dish, leftover level, confidence, known waste cost, and session history.
- Constraints: preserve current capture behavior; mobile and desktop; English UI; no persistence claims.

## Direction contract

**THESIS:** A calm tray-return instrument that makes one scan cycle obvious; it refuses the equal-column analytics dashboard.

**OWN-WORLD:** Warm paper canvas, white hairline surfaces, cobalt as the sole filled action, flat marigold/coral/sky/midnight state fields, workhorse sans typography, 12px cards, no content shadows.

**STORY:** The operator sees readiness, presents a tray, watches analysis resolve, reads one immediate result, clears the surface, and continues; patterns remain below.

**FIRST VIEWPORT:** Compact identity bar above an asymmetric workspace: a two-thirds camera stage on the left, latest-result receipt on the right, scanner state attached to the stage, primary action directly beneath it. Mobile stacks stage, action, result.

**FORM:** Quality-control inspection bench, fifth in the grounded list; seed `47afe5b6`. Signature interaction: the result receipt settles into place while the scanner visibly rearms for the next tray.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
