# MottainAI

**Less leftovers, more good food.** A camera looks down on the tray return area. When a tray is set down, MottainAI works out which dish it was and how much was left uneaten. It prices that waste in yen and recommends portion cuts for dishes that keep coming back half-eaten.

## How it works

1. **Live camera** (or photo upload): the browser compares small low-resolution frames to spot when a new tray has been set down and stays still. Only then does it send a single frame for analysis, so the cost is one AI call per tray, not one per video frame.
2. **Vision model** (Claude by default, Gemini optional): identifies the dish from the menu, picks a leftover level (empty / light / half / most / untouched), explains its reasoning, and returns boxes around the plate and each leftover food item.
3. **Menu join**: `data/menu.csv` supplies each dish's food cost, which converts the leftover level into ¥ wasted.
4. **Recommendations**: once a dish has 2+ scans averaging ≥20% left, the app suggests a portion cut and estimates the weekly ¥ wasted.

The **Scan log** tab lists every tray with its annotated image, reasoning, and detected leftovers.

## Setup

```bash
cp .env.local.example .env.local   # then add ANTHROPIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000 and choose **Live camera**. On a Mac, an iPhone mounted overhead works as a top-down camera via Continuity Camera. Pick it from the **Camera** dropdown.

| Variable | Purpose |
| --- | --- |
| `VISION_PROVIDER` | `claude` (default) or `gemini` |
| `ANTHROPIC_API_KEY` / `CLAUDE_VISION_MODEL` | Claude credentials and model (default `claude-sonnet-5`) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Gemini credentials and model |

## Key files

- `components/Capture.tsx`: upload, live camera, camera picker, auto-detect loop
- `lib/motion.ts`: the on-device check that detects when a tray has settled
- `app/api/estimate/route.ts`: vision call, menu lookup, waste cost
- `lib/vision/`: provider adapters and the shared prompt and schema
- `lib/agent.ts`: portion-cut recommendations
- `components/ScanLog.tsx`, `components/AnnotatedImage.tsx`: scan history with detection boxes

## Limitations

- Scans are kept in browser memory only and are lost on refresh.
- The weekly ¥ figure assumes 50 servings of each dish per week, because there is no order data yet.
- Auto-detect expects one tray in view at a time.
