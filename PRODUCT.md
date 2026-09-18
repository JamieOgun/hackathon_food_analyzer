# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the employee operating the tray-return scanner. Their job is to move each returned tray through a fast, repeatable sequence: present or capture the tray, understand the analysis, clear the station, and continue scanning.

## Product Purpose

MottainAI identifies the dish on a returned tray, estimates how much food remains, converts that waste into a yen amount using the restaurant menu, and surfaces portion-reduction recommendations when repeated scans reveal a pattern. Success means an operator can scan trays with minimal interruption while the restaurant receives understandable, menu-level waste evidence.

## Positioning

MottainAI combines settled-tray detection, menu-aware vision analysis, food-cost lookup, and portion recommendations in one operational workflow. The browser watches low-resolution frames locally and sends one image for analysis only after a new tray settles, rather than treating the camera feed as continuous model input.

## Operating Context

- The product runs in a browser at a restaurant tray-return station.
- An overhead camera is the primary capture method; a photo upload is the fallback and alternate input.
- A mounted iPhone can act as the overhead camera through Continuity Camera on macOS.
- The intended sequence is capture, analyze, understand the immediate result, clear the station, and continue scanning.
- Auto-detection expects one tray in view at a time and uses the cleared surface as its reference state.

## Capabilities and Constraints

- Supports live camera capture, manual frame analysis, photo upload, camera selection, recalibration, and optional automatic tray detection.
- Auto-detection compares small grayscale frames on-device, waits for a new scene to settle, and avoids repeated analysis of the same tray.
- Uses Claude as the default vision provider, with Gemini as an optional provider configured through environment variables.
- Vision analysis returns the recognized dish, one of five leftover levels, confidence, reasoning, visible leftover items, and detection boxes for the plate and food.
- Joins recognized dishes to `data/menu.csv` to calculate estimated food cost wasted in yen.
- Builds a portion recommendation after at least two scans of the same recognized dish average at least 20% remaining.
- The weekly waste estimate assumes 50 servings per dish because the product has no order-volume integration.
- Scan results and image object URLs live only in browser memory and are lost on refresh.
- A dish that does not match the menu has no dish ID or cost basis, so its yen waste cannot be calculated or used for a recommendation.
- Camera access depends on browser device permissions; an unavailable or denied camera falls back to photo upload.
- There is no configured automated test runner. Current functional checks are lint, production build, and browser verification.
- Product and interface artifacts are currently written in English.

## Brand Commitments

- Product name: MottainAI.
- Product line: “Less leftovers, more good food.”
- Existing logo asset: `public/mottainai.png`.
- The approved redesign must feel modern, friendly, and scan-first.
- The binding visual reference is a Notion-inspired warm-paper system adapted to MottainAI rather than copied as a marketing page. It uses a warm paper canvas, flat hairline surfaces, a single blue primary-action color, sparse accent color, and restrained motion; it excludes gradients, glassmorphism, and decorative chrome.

## Evidence on Hand

- `data/menu.csv` contains the current menu names, prices, food costs, and dayparts used by analysis.
- `public/mottainai.png` contains the current product wordmark.
- The working product demonstrates camera and upload capture, automatic settled-tray detection, AI analysis, menu-based yen calculations, recommendations, annotated images, and a scan log.
- The repository contains no confirmed customer testimonials, case studies, measured savings, order-volume data, or persistence layer. Future product work must not fabricate them.

## Product Principles

1. Keep the scanner and its next action unmistakably primary for the operator.
2. Return immediate, legible feedback without forcing the operator to leave the capture workflow.
3. Automate routine tray detection while preserving manual capture and upload recovery paths.
4. Keep waste estimates explainable through recognized dishes, leftover levels, confidence, reasoning, and visible detections.
5. State estimation limits honestly, especially transient storage and assumed weekly serving volume.
