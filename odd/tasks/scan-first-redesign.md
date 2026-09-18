# Scan-first redesign

## Objective

Replace the incumbent MottainAI interface with a modern, friendly, scan-first product experience built from the approved warm-paper design system while preserving all existing scanning and analysis behavior.

## Problem

The current two-panel utility layout gives capture, results, history, and recommendations similar visual weight. The primary user is the employee scanning returned trays, so camera state, capture controls, and immediate feedback need to dominate the experience.

## Why

Operators need to understand the scanner state and the result of each tray quickly, without parsing a generic dashboard. The redesign should make the workflow feel clear, trustworthy, and approachable.

## Authorized scope

- Complete frontend visual and interaction redesign.
- New layout, component composition, responsive behavior, UI states, motion, and supporting local UI components/assets.
- Preserve capture, live camera, upload, auto-detection, analysis, history, recommendation, and API behavior.
- Do not perform remote operations, push branches, create pull requests, or merge.

## Design direction

- Mode: Operate.
- Primary user: tray-scanning employee.
- Build path: code-first with iterative browser validation.
- Visual authority: approved Notion-inspired warm-paper system adapted to MottainAI, not copied as a marketing page.
- Primary sequence: capture → analyze → understand → continue scanning.
- Modernity comes from composition, feedback, typography, responsive behavior, and purposeful motion; no gradients, glassmorphism, or decorative chrome.

## Constraints

- Next.js 16.3.5, React 19.2.8, Tailwind CSS 4.
- Follow the installed Next.js documentation in `node_modules/next/dist/docs/`.
- Keep artifact copy and code in English, matching the repository.
- Preserve the untracked `.atl/` directory.
- TDD mode: off, explicitly selected by the user. No test runner is configured; use functional checks (`npm run lint`, `npm run build`) and browser verification instead.
- Receipt-driven development is disabled globally; delivery is unmanaged by RDD.

## Delivery

- Strategy: `single-pr`, explicitly selected by the user for speed.
- Forecast: approximately 700 authored changed lines across the complete redesign.
- Review budget: approximately 400 authored changed lines per slice.
- Size exception: accepted by the user; keep the complete redesign in one pull request despite the forecast.
- Chain strategy: not applicable.
- Branch point: `1c35682` (`main`).
- Feature branch: `feat/scan-first-redesign`.

## Tasks

- [x] **UI-01 — Establish product and design foundations**
  - Capture confirmed product truth in `PRODUCT.md`.
  - Record code-first workflow configuration.
  - Replace global tokens, typography, canvas, focus, motion, and reusable surface/action primitives.
  - Rebuild the page shell around a scan-first workspace.
  - Checks: `npm run lint`, `npm run build`.
  - Evidence: `npm run lint` passed; `npm run build` passed with `/` static and `/api/estimate` dynamic.
  - Commit: `b622cb0` (`feat(ui): establish scan-first design foundation`).
  - RDD: disabled/unmanaged.

- [x] **UI-02 — Rebuild the capture workspace**
  - Make live scanning the primary operational stage.
  - Redesign upload/camera mode selection, camera controls, active states, calibration feedback, success feedback, and recovery actions.
  - Preserve camera, upload, auto-detect, and analysis behavior.
  - Checks: `npm run lint`, `npm run build`, browser camera/upload state review.
  - Evidence: `npm run lint` passed; `npm run build` passed; upload/camera state markup reviewed; camera runtime remains pending physical-device verification.
  - Commit: `87b3f5a` (`feat(scanner): rebuild capture workspace`).
  - RDD: disabled/unmanaged.

- [x] **UI-03 — Rebuild results, recommendations, and scan history**
  - Create immediate scan-result feedback beside the capture workspace.
  - Move analytics, recommendation, and history into a clear secondary hierarchy.
  - Redesign empty, error, single-scan, and populated states.
  - Checks: `npm run lint`, `npm run build`, browser state review with representative data where possible.
  - Evidence: `npm run lint` passed; `npm run build` passed; empty, single, populated, and error mock states rendered; error state verified at 1440×900 in `.impeccable/review/error-desktop.png`.
  - Commit: `24a2dc1` (`feat(results): surface immediate scan feedback`).
  - RDD: disabled/unmanaged.

- [ ] **UI-04 — Responsive, accessibility, and visual finish**
  - Validate desktop and mobile layouts.
  - Verify keyboard focus, labels, contrast, reduced motion, overflow, and loading/error feedback.
  - Run the Impeccable detector once over changed UI targets.
  - Perform one batched desktop/mobile inspection, one fix batch, and at most one confirmation round.
  - Checks: `npm run lint`, `npm run build`, detector, desktop capture, mobile capture.
  - Evidence: pending.
  - Commit: pending.
  - RDD: disabled/unmanaged.

- [x] **UI-05 — Add deterministic design preview scenarios**
  - Provide development-only mock states for empty, successful, populated-history, and error views.
  - Keep preview data deterministic and prevent preview controls from rendering in production.
  - Use the mocks for browser captures without camera access or external vision-provider calls.
  - Checks: `npm run lint`, `npm run build`, preview state browser review.
  - Evidence: `npm run lint` passed; `npm run build` passed; `?preview=empty|single|many|error` renders deterministic states only in development; desktop and mobile browser captures confirmed no preview controls are visible.
  - Commit: pending final work-unit commit.
  - RDD: disabled/unmanaged.

## Acceptance criteria

- The first viewport is unmistakably a scanning workspace rather than a generic dashboard.
- Camera status and the next operator action are understandable at a glance.
- The latest scan result is visible without navigating away from the scanner.
- Recommendations and history remain available without competing with the primary workflow.
- The approved warm-paper system is consistently applied with one filled blue primary action per context, hairline cards, flat accent surfaces, and restrained motion.
- The interface works at desktop and mobile widths without clipped controls or hidden content.
- Existing capture and analysis behavior remains functional.
- Developers can inspect representative UI states locally without a camera or external API calls.
- All applicable checks and any skipped/unavailable checks are recorded honestly.

## Progress

- Feature authorized and visual direction confirmed.
- Existing UI, repository stack, Next.js guidance, RDD mode, and available checks inspected.
- UI-01 completed: product truth, code-first configuration, direction contract, design tokens, typography, page shell, and scan-first workspace grid are in place.
- UI-02 completed: capture controls and scanner states were rebuilt while preserving camera/upload behavior.
- UI-03 completed: the latest result now fills the scanner-side rail; recommendations and history sit below; analysis errors no longer create an empty grid column.
- UI-05 completed: deterministic development previews remain available by query parameter while the visible mock selector is excluded from the product UI.

## Next step

Complete UI-04 finish review and design-system documentation, then prepare the feature branch for pull-request delivery.
