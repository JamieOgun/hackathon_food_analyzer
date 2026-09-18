/**
 * Cheap on-device scene watching for the overhead tray camera. Frames are
 * downscaled to a tiny grayscale thumbnail and compared by mean absolute
 * difference — enough to tell "empty surface", "something moving" and "a new
 * tray has settled" apart without sending every frame to the vision model.
 */

export const THUMB_W = 64;
export const THUMB_H = 48;

/** Mean per-pixel luminance change (0-255) between consecutive samples that
 * counts as motion — hands, a tray sliding in. */
export const MOTION_THRESHOLD = 6;
/** Mean difference from a reference frame that counts as "a different scene"
 * — i.e. a tray is present vs. the empty surface, or a new tray vs. the last
 * one analyzed. */
export const SCENE_THRESHOLD = 14;
/** How long the scene must hold still before we analyze it. */
export const SETTLE_MS = 1200;
export const SAMPLE_INTERVAL_MS = 200;

export type Thumb = Float32Array;

export function grabThumb(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
): Thumb {
  ctx.drawImage(video, 0, 0, THUMB_W, THUMB_H);
  const { data } = ctx.getImageData(0, 0, THUMB_W, THUMB_H);
  const out = new Float32Array(THUMB_W * THUMB_H);
  for (let i = 0; i < out.length; i++) {
    const p = i * 4;
    out[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return out;
}

export function thumbDiff(a: Thumb, b: Thumb): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

export type WatchPhase =
  | "calibrating" // learning the empty surface
  | "empty" // matches the empty surface
  | "moving" // something is changing in view
  | "settling" // a tray is present and holding still
  | "analyzing"
  | "done"; // current tray already analyzed

export interface WatchState {
  background: Thumb | null;
  lastAnalyzed: Thumb | null;
  prev: Thumb | null;
  stillSince: number;
}

export function initialWatchState(): WatchState {
  return { background: null, lastAnalyzed: null, prev: null, stillSince: 0 };
}

/**
 * Advance the watcher by one sample. Mutates `state`; returns the phase to
 * show and whether this is the moment to analyze the current frame.
 */
export function stepWatch(
  state: WatchState,
  frame: Thumb,
  now: number,
  busy: boolean,
): { phase: WatchPhase; trigger: boolean } {
  const moving = state.prev ? thumbDiff(frame, state.prev) > MOTION_THRESHOLD : true;
  state.prev = frame;
  if (moving) state.stillSince = now;
  const settled = !moving && now - state.stillSince >= SETTLE_MS;

  if (!state.background) {
    // First steady view becomes the empty-surface reference.
    if (settled) state.background = frame;
    return { phase: "calibrating", trigger: false };
  }

  if (busy) return { phase: "analyzing", trigger: false };
  if (moving) return { phase: "moving", trigger: false };

  if (thumbDiff(frame, state.background) < SCENE_THRESHOLD) {
    // Surface is clear again — the next tray, even an identical-looking
    // dish, deserves a fresh analysis.
    state.lastAnalyzed = null;
    return { phase: "empty", trigger: false };
  }

  if (
    state.lastAnalyzed &&
    thumbDiff(frame, state.lastAnalyzed) < SCENE_THRESHOLD
  ) {
    return { phase: "done", trigger: false };
  }

  if (!settled) return { phase: "settling", trigger: false };

  state.lastAnalyzed = frame;
  return { phase: "analyzing", trigger: true };
}
