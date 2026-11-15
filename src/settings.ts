import { useSyncExternalStore } from "react";

export interface Settings {
  /** 文字の大きさ（1 が標準）。授業で映すときは大きくする */
  fontScale: number;
  /** カードを運んでいる間、くっつけられる相手を光らせるか */
  partnerHint: boolean;
  /** 解答ボードの並びを、模範の骨組みとくらべて確かめる機能を使うか */
  judge: boolean;
}

export const FONT_SCALES: { value: number; name: string }[] = [
  { value: 1, name: "標準" },
  { value: 1.2, name: "大きめ" },
  { value: 1.5, name: "とても大きい（授業で映すとき）" },
];

const KEY = "mathter:settings:v1";
const DEFAULTS: Settings = { fontScale: 1, partnerHint: false, judge: false };
const listeners = new Set<() => void>();
let cache: Settings | null = null;

function read(): Settings {
  if (cache) return cache;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>;
    cache = {
      fontScale: FONT_SCALES.some((f) => f.value === saved.fontScale) ? saved.fontScale! : 1,
      partnerHint: saved.partnerHint === true,
      judge: saved.judge === true,
    };
  } catch {
    cache = DEFAULTS;
  }
  return cache;
}

export function updateSettings(patch: Partial<Settings>): void {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // 保存できなくても、このページを開いている間は効く
  }
  apply();
  listeners.forEach((l) => l());
}

/** 文字の大きさをページ全体に反映する。 */
export function apply(): void {
  document.documentElement.style.fontSize = `${16 * read().fontScale}px`;
}

export function useSettings(): Settings {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, read);
}
