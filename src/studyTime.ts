import { useEffect, useSyncExternalStore } from "react";

/** 日付（YYYY-MM-DD）ごとの学習時間（秒）。この端末の中だけに持つ。 */
export type StudyTime = Record<string, number>;

export const TIME_KEY = "mathter:time:v1";
/** 操作がこの時間なければ、席を離れたとみなして数えない（ノートで解いている時間は数えたいので長め）。 */
const IDLE_LIMIT_MS = 30 * 60 * 1000;
const TICK_MS = 15 * 1000;

const listeners = new Set<() => void>();
let cache: StudyTime | null = null;

export function dayKey(date: Date): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

export function addTime(time: StudyTime, day: string, seconds: number): StudyTime {
  return { ...time, [day]: (time[day] ?? 0) + seconds };
}

export function totalSeconds(time: StudyTime): number {
  return Object.values(time).reduce((a, b) => a + b, 0);
}

/** 「1時間5分」「12分」「1分未満」のように書く。 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "1分未満";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}分` : m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

function read(): StudyTime {
  if (cache) return cache;
  cache = {};
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(TIME_KEY) ?? "{}");
    if (typeof saved === "object" && saved !== null) {
      for (const [day, value] of Object.entries(saved)) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) cache[day] = value;
      }
    }
  } catch {
    // 読めなければ 0 から数える
  }
  return cache;
}

function record(seconds: number): void {
  cache = addTime(read(), dayKey(new Date()), seconds);
  try {
    localStorage.setItem(TIME_KEY, JSON.stringify(cache));
  } catch {
    // 保存できなくても学習は続けられる
  }
  listeners.forEach((l) => l());
}

export function resetStudyTime(): void {
  cache = {};
  listeners.forEach((l) => l());
}

export function useStudyTime(): StudyTime {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, read);
}

/** 問題を開いている間の時間を数える。画面が隠れている間と、長く操作がない間は数えない。 */
export function useStudyTimer(): void {
  useEffect(() => {
    let last = Date.now();
    let lastActivity = Date.now();
    const flush = () => {
      const now = Date.now();
      const visible = document.visibilityState === "visible";
      if (visible && now - lastActivity < IDLE_LIMIT_MS) {
        const seconds = Math.round((now - last) / 1000);
        if (seconds > 0 && seconds <= (TICK_MS / 1000) * 4) record(seconds);
      }
      last = now;
    };
    const active = () => {
      lastActivity = Date.now();
    };
    const visibility = () => {
      if (document.visibilityState === "visible") last = Date.now();
      else flush();
    };
    const timer = window.setInterval(flush, TICK_MS);
    window.addEventListener("pointerdown", active);
    window.addEventListener("keydown", active);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      flush();
      window.clearInterval(timer);
      window.removeEventListener("pointerdown", active);
      window.removeEventListener("keydown", active);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
}
