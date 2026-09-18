"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Bucket } from "./types";
import {
  VOICE_LEVELS,
  VOICE_LINES,
  isVoiceLevel,
  spokenText,
  type VoiceLevel,
} from "./voiceLines";

/**
 * Plays an ElevenLabs line matching how much was left: praise for a clean
 * plate, then angrier the more food is left, with a random variant each time. Each clip is fetched once
 * and reused; if ElevenLabs is unavailable (no key, quota, offline) it falls
 * back to the browser's built-in Japanese speech so the demo never goes
 * silent.
 */
export function useMottainaiVoice() {
  const clipsRef = useRef(new Map<string, Promise<string | null>>());
  const lastVariantRef = useRef(new Map<VoiceLevel, number>());
  const currentRef = useRef<HTMLAudioElement | null>(null);

  const loadClip = useCallback((level: VoiceLevel, variant: number) => {
    const clips = clipsRef.current;
    const key = `${level}:${variant}`;
    let clip = clips.get(key);
    if (!clip) {
      clip = fetch(`/api/mottainai?level=${level}&v=${variant}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`voice ${res.status}`);
          return URL.createObjectURL(await res.blob());
        })
        .catch((err) => {
          console.warn(`ElevenLabs line ${key} unavailable`, err);
          clips.delete(key); // retry on a later scan
          return null;
        });
      clips.set(key, clip);
    }
    return clip;
  }, []);

  // Warm every line on mount, so a scan result plays instantly instead of
  // waiting on ElevenLabs.
  useEffect(() => {
    for (const level of VOICE_LEVELS) {
      VOICE_LINES[level].variants.forEach((_, v) => void loadClip(level, v));
    }
  }, [loadClip]);

  /** Random variant, avoiding an immediate repeat for the same level. */
  const pickVariant = useCallback((level: VoiceLevel) => {
    const count = VOICE_LINES[level].variants.length;
    const last = lastVariantRef.current.get(level);
    let v = Math.floor(Math.random() * count);
    if (count > 1 && v === last) v = (v + 1) % count;
    lastVariantRef.current.set(level, v);
    return v;
  }, []);

  /** Play a random line for `level`. */
  const play = useCallback(
    async (level: VoiceLevel) => {
      const variant = pickVariant(level);
      const url = await loadClip(level, variant);
      // One voice at a time — a new scan cuts off the previous line.
      currentRef.current?.pause();
      window.speechSynthesis?.cancel();
      if (url) {
        try {
          const audio = new Audio(url);
          currentRef.current = audio;
          await audio.play();
          return;
        } catch {
          // Autoplay blocked or decode error — fall through.
        }
      }
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          spokenText(VOICE_LINES[level].variants[variant]),
        );
        utterance.lang = "ja-JP";
        window.speechSynthesis.speak(utterance);
      }
    },
    [loadClip, pickVariant],
  );

  /** React to a scan: praise a clean plate, scold leftovers. */
  const say = useCallback(
    async (bucket: Bucket) => {
      if (isVoiceLevel(bucket)) await play(bucket);
    },
    [play],
  );

  return { say };
}
