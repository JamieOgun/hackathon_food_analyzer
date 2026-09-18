import type { Bucket } from "./types";

export type VoiceLevel = Bucket;

export interface VoiceLevelConfig {
  /** Eleven v3 lines. Bracketed audio tags ([sighs], [shouts], …) are
   * performed, not spoken. One variant is picked at random per scan. */
  variants: string[];
  /** v3 stability: 0 = "Creative" (most expressive, follows audio tags
   * hardest), 0.5 = "Natural". */
  stability: number;
  speed: number;
}

/** Praise for a clean plate, then escalating from a sigh to outrage the
 * more food is left. */
export const VOICE_LINES: Record<VoiceLevel, VoiceLevelConfig> = {
  empty: {
    variants: [
      "[happily] ごちそうさま！完璧！",
      "[excited] わあ、きれいに完食！ありがとう！",
      "[laughs] ピカピカのお皿！最高だね！",
    ],
    stability: 0.5,
    speed: 1.0,
  },
  light: {
    variants: [
      "[sighs] あ、ちょっとだけ、もったいないね…",
      "[softly] あと少しだったのに…もったいない。",
      "[sighs] 惜しい！ほんのちょっと、もったいないな。",
    ],
    stability: 0.5,
    speed: 0.95,
  },
  half: {
    variants: [
      "[disappointed] もったいない！半分も残ってるよ！",
      "[sighs] えー、半分も？もったいないなぁ…",
      "[frustrated] 半分残し！？もったいない！",
    ],
    stability: 0.5,
    speed: 1.0,
  },
  most: {
    variants: [
      "[annoyed] もったいない！ほとんど残ってるじゃないか！",
      "[angry] ちょっと！ほとんど食べてないでしょ！もったいない！",
      "[frustrated] [sighs] これ、ほとんど手つかずだよ…もったいない！",
    ],
    stability: 0,
    speed: 1.05,
  },
  untouched: {
    variants: [
      "[shouts] もったいなーい！！一口も食べてないの！？",
      "[gasps] [shouts] 手つかず！？ありえない！もったいなーい！！",
      "[angry] [shouts] 全部残してる！？もったいないにも程がある！！",
    ],
    stability: 0,
    speed: 1.05,
  },
};

export const VOICE_LEVELS = Object.keys(VOICE_LINES) as VoiceLevel[];

export function isVoiceLevel(value: unknown): value is VoiceLevel {
  return typeof value === "string" && value in VOICE_LINES;
}

/** Text without audio tags, for the browser speech fallback. */
export function spokenText(line: string): string {
  return line.replace(/\[[^\]]*\]\s*/g, "");
}
