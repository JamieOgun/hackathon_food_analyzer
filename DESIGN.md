---
name: MottainAI
description: A calm warm-paper tray-return instrument that turns every scan into clear waste feedback.
colors:
  paper-warm: "#f6f5f4"
  paper-deep: "#ece9e5"
  white: "#ffffff"
  ink: "#0b0b0b"
  charcoal: "#24211f"
  stone: "#706b67"
  graphite: "#5e5955"
  line: "rgb(11 11 11 / 9%)"
  action-blue: "#0075de"
  action-blue-hover: "#0068c7"
  sky-tint: "#e6f3fe"
  marigold: "#ffb110"
  coral: "#f64932"
  sky-wash: "#62aef0"
  midnight: "#02093a"
  success: "#16784a"
  success-tint: "#e7f5ed"
  danger: "#b42318"
  danger-tint: "#fff0ee"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  editorial:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "0.04em"
rounded:
  control: "8px"
  card: "12px"
  pill: "9999px"
  action: "9px"
  image: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  4xl: "36px"
components:
  capture-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "8px 16px"
  capture-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.graphite}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "8px 12px"
  mode-tab-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.action-blue}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "44px"
  status-chip-ready:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  surface-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px 24px"
  danger-notice:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  capture-dropzone:
    backgroundColor: "{colors.paper-warm}"
    textColor: "{colors.stone}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "40px 24px"
---

# Design System: MottainAI

## Overview

**Creative North Star: “The Quiet Inspection Bench”**

MottainAI is an Operate-mode instrument for the tray-return station, not a marketing dashboard. Its visual language turns a potentially hectic handoff into a calm, repeatable bench routine: warm paper under the work, white hairline surfaces for the active tools, and one unmistakable blue action when the operator needs to intervene. The implementation and the shipped desktop/mobile rasters are the source of truth; there is no approved external comp to imitate.

The system is compact and workmanlike. Inter carries the operational UI, while Source Serif 4 adds a human editorial note to the short supporting message under the headline. Tonal color fields identify ready, analyzing, success, warning, and error states without turning the station into a rainbow. Depth comes from paper-to-surface contrast and hairline borders, not floating cards or decorative chrome.

**Key Characteristics:**
- Warm-paper canvas with white, flat, hairline containers.
- Scanner-first asymmetric workspace: camera/capture occupies two-thirds on desktop; the latest result occupies the right rail.
- Cobalt is the sole filled primary action; state accents stay sparse and semantic.
- Immediate result feedback is a receipt-like rail; analysis errors remain inside that rail.
- Mobile stacks the same sequence: scanner, action/state, latest result, then patterns/history.

## Colors

The palette is a warm neutral field with a midnight reading color, cobalt action, and restrained state accents. Surface contrast is tonal and quiet; saturated colors are reserved for action, state, or data emphasis.

### Primary
- **Station Cobalt** (`#0075de`): The filled primary action and active capture emphasis.
- **Deep Cobalt** (`#0068c7`): Hover and pressed-state darkening for the primary action.

### Secondary
- **Marigold** (`#ffb110`): Waste and analyzing emphasis; use as a compact status field or data cue, not as a page-wide fill.
- **Coral** (`#f64932`): A warm supplemental accent for waste-related visual language when needed.
- **Sky Wash** (`#62aef0`): Secondary cool emphasis for data or future detection states.

### Tertiary
- **Midnight Ink** (`#02093a`): Result headings, confidence labels, and dark camera-preview surfaces.
- **Success Green** (`#16784a`): Ready/completed state text.
- **Danger Red** (`#b42318`): Recovery and error text.

### Neutral
- **Warm Paper** (`#f6f5f4`): The page canvas and quiet upload surface.
- **Deep Paper** (`#ece9e5`): Capture-mode control wells and recessed grouping surfaces.
- **Pure White** (`#ffffff`): Active cards, header, controls, and result surfaces.
- **Ink Black** (`#0b0b0b`): Primary headlines and strongest text.
- **Charcoal** (`#24211f`): Supporting dark UI text.
- **Stone** (`#706b67`): Secondary labels, metadata, and instructions.
- **Graphite** (`#5e5955`): Editorial/supporting copy.
- **Line** (`rgb(11 11 11 / 9%)`): Hairline borders and dividers.
- **Sky Tint** (`#e6f3fe`): Soft active/count badge field.
- **Success Tint** (`#e7f5ed`): Ready state background.
- **Danger Tint** (`#fff0ee`): Error notice background.

### Named Rules
**The Warm Paper Rule.** Keep the station grounded on warm paper; white surfaces are tools laid on top of it, never glossy floating objects.

**The One Blue Action Rule.** Use Station Cobalt for the action the operator should take next. Do not compete with it using multiple filled button colors.

## Typography

**Display Font:** Inter (with ui-sans-serif, system-ui fallbacks)  
**Body Font:** Inter (with ui-sans-serif, system-ui fallbacks)  
**Editorial Font:** Source Serif 4 (with ui-serif, Georgia fallbacks)  
**Label/Mono Font:** Geist Mono is available for technical values, but the shipped surface uses Inter for labels and tabular numbers.

**Character:** Inter is direct, legible, and operational at the tray station. Source Serif 4 appears only in the short supporting statement, giving the otherwise utilitarian interface a human, food-service editorial note without weakening scanability.

### Hierarchy
- **Display** (600, `clamp(2.25rem, 4vw, 3.5rem)`, 1.02): The home promise, with tight negative tracking; wraps early on mobile.
- **Headline** (600, `1.5rem`, approximately 1.2): Scanner, result, and section headings.
- **Title** (600, `1.25rem`, 1.25): Dish and supporting card titles where a smaller anchor is needed.
- **Body** (400, `1rem`, 1.5): Instructions and explanatory copy; keep long prose comfortably short.
- **Editorial** (400, `1.125rem` to `1.25rem`, approximately 1.55): The supporting promise beneath the display headline.
- **Label** (600, `0.75rem`, 1.333, slight positive tracking, uppercase where it identifies a metric): Metadata labels such as “Recognized dish,” “Leftovers,” and “Confidence.”

### Named Rules
**The Workhorse Type Rule.** Keep operational labels in Inter; reserve Source Serif 4 for the single supporting editorial line, not controls or status copy.

**The Early-Wrap Rule.** Let the display promise wrap naturally on narrow screens rather than shrinking it into a poster-like single line.

## Layout

The page uses a centered container capped at `1440px`, with a compact `64px` sticky identity bar. Main content uses `16px` horizontal padding on narrow screens, `24px` at small widths, and `32px` on large screens; vertical sections step through roughly `24px`, `32px`, and `36px` spacing.

At the `lg` breakpoint (`1024px`), the active workspace becomes a 12-column grid with `24px` gutters: the scanner occupies columns 1–8 and the latest-result rail occupies columns 9–12. Scan patterns span all columns below the workspace. Below that breakpoint the sequence is intentionally linear: identity and promise, scanner, latest result, then recommendations/history. Preserve this order; the station workflow is the hierarchy.

The scanner stage keeps the capture mode switch, live state strip, and upload/camera work area together in one surface. Pattern analytics are secondary and separated by a hairline top rule. Query-only preview fixtures (`?preview=empty|single|many|error`) are development review tools, not a visible product navigation or user-facing mode.

## Elevation & Depth

This is a tonal, mostly flat system. Cards and controls use a white-on-warm-paper lift plus hairline borders; the content surfaces do not use shadows. The sticky header is the exception, with a barely-there shadow to separate it from scrolling content. Dashed outlines and tinted fields provide affordance and state without glossy effects.

### Shadow Vocabulary
- **Header separation** (`0 3px 9px rgb(0 0 0 / 0.03)`): The only shipped content-adjacent shadow; keeps the sticky identity bar legible while scrolling.

### Named Rules
**The Flat Surface Rule.** Do not add card shadows, gradients, glass, or decorative chrome; use tonal layering, borders, and state fields to communicate hierarchy.

## Shapes

The form language is gently rounded but disciplined: cards and image frames use `12px`, controls and notices use `8px` (the primary camera action uses `9px`), and status badges use fully rounded pills. Borders are hairline and low-contrast at rest. The upload target is a large `2px` dashed outline, while detection geometry uses thin dashed or solid overlays directly on the image. Avoid sharp marketing-page silhouettes and avoid excessive rounding that makes the station feel playful.

## Components

### Buttons
- **Character:** Tactile, compact, and obvious about the next operator action.
- **Primary:** Station Cobalt fill, white label, `9px` radius, minimum `44px` height, and `8px 16px` internal padding. Use for “Analyze now” and equivalent next actions.
- **Hover / Focus:** Darken to Deep Cobalt on hover. Keep the global `3px` cobalt-tinted focus outline with `3px` offset; respect reduced motion.
- **Secondary / Tertiary:** White or paper-backed controls with graphite text and hairline border; use for “Re-learn empty surface” and recovery paths, never to compete with the primary action.

### Chips
- **Style:** Ready uses Success Tint with Success Green text, pill radius, and compact `6px 12px` padding. The scan-count badge uses Sky Tint with Station Cobalt text.
- **State:** Analyzing uses Marigold with Ink Black text. Keep chips short, sentence case, and status-oriented; do not use them as decorative tags.

### Cards / Containers
- **Corner Style:** `12px` radius for scanner, result rail, and history items.
- **Background:** Pure White over Warm Paper; Deep Paper groups capture tabs.
- **Shadow Strategy:** Flat at rest; depth comes from the line token and tonal contrast, with only the sticky header shadow.
- **Border:** Low-contrast hairline `Line` border; dashed borders signal empty/upload affordances.
- **Internal Padding:** `16px` on compact content, `24px` on the desktop scanner shell, with `20px` gaps between result groups.

### Inputs / Fields
- **Style:** Native select controls are white, `8px` rounded, hairline bordered, and at least `44px` high. File input is visually represented by the large dashed dropzone.
- **Focus:** Global visible focus ring uses a cobalt-tinted `3px` outline with `3px` offset.
- **Error / Disabled:** Disabled primary actions become muted slate; camera failure is shown as a Danger Tint notice with recovery copy rather than a dead control.

### Navigation
- **Style:** The sticky top bar is an identity/status strip, not a multi-destination marketing nav. It pairs the MottainAI wordmark with the “Tray return station” context and a compact scan-count badge.
- **Typography / states:** Inter at small body sizes; the count badge is the only filled element. On mobile the context label disappears while the wordmark and count remain.

### Signature: Capture Workspace
The signature component is a single scanner surface: mode tabs, live readiness strip, upload dropzone or camera preview, and recovery controls. Camera auto-detection communicates phases through a colored ring and compact dark status overlay. The operator can always switch to upload, manually analyze, or re-learn the empty surface.

### Signature: Latest-Result Rail
The result rail behaves like a settled receipt: dish, leftovers, estimated yen, confidence, reasoning, and visible leftovers arrive together. If analysis fails, the error heading, alert, and no-result recovery state stay inside this same rail; never push the analysis error into the lower patterns row.

### Signature: Detection Image
AnnotatedImage keeps the source image visible and adds thin plate/leftover boxes with small labeled chips. Plate uses dashed green; leftover uses a marigold field. The overlay is explanatory evidence, not decoration.

## Do's and Don'ts

### Do:
- **Do** make the scanner and its next action unmistakably primary in every responsive layout.
- **Do** use Warm Paper, Pure White, hairlines, and flat tonal fields before reaching for decoration.
- **Do** keep cobalt reserved for primary action and active capture emphasis; use semantic accents for status and waste data.
- **Do** preserve the mobile order of scanner, result rail, then patterns/history.
- **Do** keep analysis errors in the latest-result rail, where the operator is already looking for feedback.
- **Do** use the development-only query previews for visual review without adding a visible mock-state selector to the product UI.
- **Do** support reduced motion; receipt-settle is a restrained `320ms` settle, not a persistent animation.

### Don't:
- **Don't** turn the page into an equal-column analytics dashboard or let patterns outrank the current scan.
- **Don't** add gradients, glassmorphism, decorative chrome, or content shadows.
- **Don't** use multiple competing filled action colors.
- **Don't** expose query-only preview fixtures as a production control or imply that scan results persist beyond the browser tab.
- **Don't** move capture errors into a separate lower row; the result rail owns analysis feedback.
- **Don't** fabricate a canonical approved comp: the shipped code and finish-review rasters are the visual authority until a new direction is explicitly chosen.
