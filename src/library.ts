import { useSyncExternalStore } from "react";
import { problems as builtin } from "./data/problems";
import { isPlayable } from "./editor/draft";
import type { Problem } from "./types";

const KEY = "mathter:custom:v1";
const listeners = new Set<() => void>();
let cache: Problem[] | null = null;

/** 読み込んだデータを Problem の形にそろえる。形が違いすぎれば null。 */
export function normalizeProblem(value: unknown): Problem | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const list = (x: unknown) => (Array.isArray(x) ? x : []);
  const text = (x: unknown) => (typeof x === "string" ? x : "");
  if (!Array.isArray(v.segments)) return null;
  return {
    id: text(v.id),
    title: text(v.title),
    unit: text(v.unit),
    segments: list(v.segments),
    fragments: list(v.fragments),
    associations: list(v.associations),
    combinations: list(v.combinations),
    skeleton: list(v.skeleton),
    solution: list(v.solution),
  } as Problem;
}

function read(): Problem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = (Array.isArray(parsed) ? parsed : []).flatMap((x) => normalizeProblem(x) ?? []);
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Problem[]): void {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても、このページを開いている間は使える
  }
  listeners.forEach((l) => l());
}

/** 自作の問題（この端末の中に保存）。 */
export function customProblems(): Problem[] {
  return read();
}

export function saveCustom(problem: Problem): void {
  const list = read();
  write(
    list.some((p) => p.id === problem.id)
      ? list.map((p) => (p.id === problem.id ? problem : p))
      : [problem, ...list],
  );
}

export function deleteCustom(id: string): void {
  write(read().filter((p) => p.id !== id));
}

export function newCustomId(): string {
  return `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function isCustom(id: string): boolean {
  return read().some((p) => p.id === id);
}

export function useCustomProblems(): Problem[] {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, read);
}

/** 学習画面で使える問題すべて（試せる状態の自作の問題 ＋ 内蔵の問題）。 */
export function playableProblems(custom: Problem[] = read()): Problem[] {
  return [...custom.filter(isPlayable), ...builtin];
}

export { builtin as builtinProblems };
