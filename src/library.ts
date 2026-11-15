import { useSyncExternalStore } from "react";
import { patterns as builtinPatterns } from "./data/patterns";
import { problems as builtin } from "./data/problems";
import { isPlayable } from "./editor/draft";
import type { Pattern, Problem } from "./types";

const KEY = "mathter:custom:v1";
const PATTERN_KEY = "mathter:patterns:custom:v1";
const listeners = new Set<() => void>();
let cache: Problem[] | null = null;
let patternCache: Pattern[] | null = null;

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

function normalizePattern(value: unknown): Pattern | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const text = (x: unknown) => (typeof x === "string" ? x : "");
  if (text(v.id) === "") return null;
  return {
    id: text(v.id),
    unit: text(v.unit),
    trigger: text(v.trigger),
    idea: text(v.idea),
    detail: text(v.detail),
  };
}

function readPatterns(): Pattern[] {
  if (patternCache) return patternCache;
  try {
    const raw = localStorage.getItem(PATTERN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    patternCache = (Array.isArray(parsed) ? parsed : []).flatMap((x) => normalizePattern(x) ?? []);
  } catch {
    patternCache = [];
  }
  return patternCache;
}

function writePatterns(next: Pattern[]): void {
  patternCache = next;
  try {
    localStorage.setItem(PATTERN_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても、このページを開いている間は使える
  }
  listeners.forEach((l) => l());
}

/** 自作の型を保存する（同じ id があれば置きかえる）。 */
export function saveCustomPattern(pattern: Pattern): void {
  const list = readPatterns();
  writePatterns(
    list.some((p) => p.id === pattern.id)
      ? list.map((p) => (p.id === pattern.id ? pattern : p))
      : [...list, pattern],
  );
}

export function deleteCustomPattern(id: string): void {
  writePatterns(readPatterns().filter((p) => p.id !== id));
}

export function newPatternId(): string {
  return `pt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function useCustomPatterns(): Pattern[] {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, readPatterns);
}

/** 連想の型すべて（内蔵 ＋ 自作）。 */
export function allPatterns(custom: Pattern[] = readPatterns()): Pattern[] {
  return [...builtinPatterns, ...custom];
}

/** 書き出すファイルの形。問題と、その問題が使っている自作の型をまとめる。 */
export interface Bundle {
  format: "mathter";
  version: 1;
  problems: Problem[];
  patterns: Pattern[];
}

export function makeBundle(list: Problem[]): Bundle {
  const used = new Set(list.flatMap((p) => p.associations.map((a) => a.patternId)));
  return {
    format: "mathter",
    version: 1,
    problems: list,
    patterns: readPatterns().filter((p) => used.has(p.id)),
  };
}

/** 読み込んだファイルの中身を取り出す。まとめた形でも、問題1つだけの古い形でもよい。 */
export function parseBundle(value: unknown): { problems: Problem[]; patterns: Pattern[] } | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.format === "mathter" && Array.isArray(v.problems)) {
    return {
      problems: v.problems.flatMap((x) => normalizeProblem(x) ?? []),
      patterns: (Array.isArray(v.patterns) ? v.patterns : []).flatMap(
        (x) => normalizePattern(x) ?? [],
      ),
    };
  }
  const single = normalizeProblem(value);
  return single ? { problems: [single], patterns: [] } : null;
}

/** ファイルの中の問題のうち、すでに同じものが端末にある数。 */
export function countExisting(list: Problem[]): number {
  return list.filter((p) => isCustom(p.id)).length;
}

/**
 * ファイルの中身を端末に取り込む。同じ問題がすでにあるとき、overwrite なら置きかえ、
 * そうでなければ別の問題として足す。内蔵の問題と同じ id のものは、必ず別の問題として足す。
 */
export function importBundle(
  bundle: { problems: Problem[]; patterns: Pattern[] },
  overwrite: boolean,
): number {
  const known = new Set(allPatterns().map((p) => p.id));
  for (const p of bundle.patterns) {
    if (!known.has(p.id)) saveCustomPattern(p);
  }
  for (const p of bundle.problems) {
    const clash = builtin.some((b) => b.id === p.id) || p.id === "" || (isCustom(p.id) && !overwrite);
    saveCustom(clash ? { ...p, id: newCustomId() } : p);
  }
  return bundle.problems.length;
}

export { builtin as builtinProblems };
