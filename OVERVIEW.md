# MottainAI: Project Overview

> **Less leftovers, more good food.**
> *Mottainai* (もったいない) is the Japanese word for regret at waste.

## The problem

Restaurants throw away a lot of food that customers leave on their plates, and they pay for every gram of it. Most don't know which dishes are wasted or how much it costs them. Portion sizes stay the same because nobody measures what comes back to the kitchen.

## What MottainAI does

A camera looks down on the area where trays and plates are returned. Every time a tray is set down, MottainAI:

1. **Recognises the dish** from the restaurant's menu.
2. **Estimates how much was left**: empty, a few bites, about half, mostly left, or untouched.
3. **Explains its judgement** in plain sentences, e.g. *"About half the rice and nearly all the cabbage remain."*
4. **Tags the photo**, drawing boxes around the plate and each leftover food.
5. **Prices the waste in yen** using each dish's food cost.
6. **Recommends action**: when a dish keeps coming back half-eaten, it suggests a smaller portion and estimates the money saved each week.

Staff don't press anything. They put the tray down and the analysis happens automatically.

## How it works

```
Overhead camera ──► Browser watches for a tray that has settled (on-device, free)
                          │  only when a new tray is still
                          ▼
                    AI vision model (Claude)
                    dish · leftover level · reasoning · boxes
                          │
                          ▼
                    Menu cost lookup ──► ¥ wasted per plate
                          │
                          ▼
                    Pattern check ──► "Cut the Pork Katsu portion ~20%"
```

- **Smart triggering:** the browser compares small low-resolution video frames to notice when a tray arrives and stays still. It ignores hands and people walking past. The AI is called **once per tray**, not for every video frame.
- **Cost:** roughly **¥1–2 per tray** (about $0.01). A restaurant scanning 300 trays a day would spend around $3.
- **Camera:** any webcam works. For the best top-down view, mount an iPhone above the tray area and connect it through Continuity Camera.

## What you see in the app

| Area | Shows |
| --- | --- |
| **Live camera** | Video with a coloured status ring (waiting → tray detected → analyzing → logged) and the latest result |
| **Overview tab** | Top recommendation, running ¥ wasted, list of scans |
| **Scan log tab** | Each tray's photo with detection boxes, leftover level, confidence, reasoning, and detected leftovers |

## Built with

- **Next.js 16 / React 19 / Tailwind 4**: a single-page web app
- **Claude (Anthropic)** vision model, with Gemini available as an alternative
- **A menu CSV** holding dish names, prices and food costs

## Status

This is a **hackathon prototype.** The full loop works end to end: camera, automatic detection, AI analysis, cost, and recommendation.

Not yet built:
- **Saving data:** scans live in the browser session and are lost on refresh.
- **Real sales volumes:** weekly ¥ figures assume ~50 servings of each dish per week.
- **Multiple trays:** only one tray in view at a time.
- **Accounts:** no logins or multi-restaurant support.

## Next steps

1. Save scans to a database so trends build up over days and weeks.
2. Connect point-of-sale data to replace the 50-servings assumption with real sales volumes.
3. Detect several trays in one frame for busy return stations.
4. Add a weekly report for managers: top wasted dishes, ¥ lost, and suggested menu changes.

---

Setup and developer details are in [README.md](README.md).
