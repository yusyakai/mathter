import katex from "katex";
import { sourcesOf, validateProblem } from "../thoughts";
import type { Association, Combination, Problem, SkeletonStep, SolutionStep } from "../types";

/** 問題文の中の着眼点の位置（文字数で数えた始まりと終わり）。 */
export interface Mark {
  id: string;
  start: number;
  end: number;
}

/**
 * 問題を作る画面で編集する形。問題文を1本の文字列で持ち、着眼点は位置で持つ。
 * marks の並び順が「見る順番」。保存するときは toProblem で Problem に直す。
 */
export interface Draft {
  id: string;
  title: string;
  unit: string;
  text: string;
  marks: Mark[];
  associations: Association[];
  combinations: Combination[];
  skeleton: SkeletonStep[];
  solution: SolutionStep[];
}

export function emptyDraft(id: string): Draft {
  return {
    id,
    title: "",
    unit: "",
    text: "",
    marks: [],
    associations: [],
    combinations: [],
    skeleton: [],
    solution: [],
  };
}

export function toProblem(d: Draft): Problem {
  const segments: Problem["segments"] = [];
  let at = 0;
  for (const m of [...d.marks].sort((a, b) => a.start - b.start)) {
    if (m.start > at) segments.push({ text: d.text.slice(at, m.start) });
    segments.push({ text: d.text.slice(m.start, m.end), fragmentId: m.id });
    at = m.end;
  }
  if (at < d.text.length) segments.push({ text: d.text.slice(at) });
  return {
    id: d.id,
    title: d.title,
    unit: d.unit,
    segments,
    fragments: d.marks.map((m, i) => ({ id: m.id, priority: i + 1 })),
    associations: d.associations,
    combinations: d.combinations,
    skeleton: d.skeleton,
    solution: d.solution,
  };
}

export function fromProblem(p: Problem): Draft {
  const positions = new Map<string, Mark>();
  let at = 0;
  for (const s of p.segments) {
    if (s.fragmentId) {
      positions.set(s.fragmentId, { id: s.fragmentId, start: at, end: at + s.text.length });
    }
    at += s.text.length;
  }
  const ordered = [...p.fragments].sort((a, b) => a.priority - b.priority).map((f) => f.id);
  const marks = [
    ...ordered.flatMap((id) => positions.get(id) ?? []),
    ...[...positions.values()].filter((m) => !ordered.includes(m.id)),
  ];
  return {
    id: p.id,
    title: p.title,
    unit: p.unit,
    text: p.segments.map((s) => s.text).join(""),
    marks,
    associations: p.associations,
    combinations: p.combinations,
    skeleton: p.skeleton,
    solution: p.solution,
  };
}

/** まだ使っていない id を作る（f1, f2, … など）。 */
export function nextId(prefix: string, existing: string[]): string {
  for (let n = 1; ; n++) {
    if (!existing.includes(`${prefix}${n}`)) return `${prefix}${n}`;
  }
}

/** `$...$` で囲まれた数式の範囲。 */
export function mathRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  let open = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "$") continue;
    if (open < 0) open = i;
    else {
      ranges.push([open, i + 1]);
      open = -1;
    }
  }
  return ranges;
}

/** 選んだ範囲を整える。前後の空白を除き、数式の途中で切れていたら数式全体に広げる。 */
export function snapSelection(
  text: string,
  start: number,
  end: number,
): { start: number; end: number } | null {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  if (start >= end) return null;
  for (const [a, b] of mathRanges(text)) {
    if (start > a && start < b) start = a;
    if (end > a && end < b) end = b;
  }
  return { start, end };
}

export function addMark(d: Draft, start: number, end: number): { draft: Draft } | { error: string } {
  const range = snapSelection(d.text, start, end);
  if (!range) return { error: "問題文の中で、着眼点にしたい部分を選んでからボタンを押してください。" };
  if (d.marks.some((m) => range.start < m.end && m.start < range.end)) {
    return { error: "すでにある着眼点と重なっています。重ならない部分を選んでください。" };
  }
  const id = nextId("f", d.marks.map((m) => m.id));
  return { draft: { ...d, marks: [...d.marks, { id, ...range }] } };
}

/** 考え（連想・組み合わせ）を消し、それを参照している所からも外す。 */
export function removeThought(d: Draft, id: string): Draft {
  return {
    ...d,
    associations: d.associations.filter((a) => a.id !== id),
    combinations: d.combinations
      .filter((c) => c.id !== id)
      .map((c) => ({ ...c, from: c.from.map((f) => (f === id ? "" : f)) as [string, string] })),
    skeleton: d.skeleton.map((k) => ({ ...k, thoughts: k.thoughts.filter((t) => t !== id) })),
    solution: d.solution.map((s) => ({
      ...s,
      fromThoughts: s.fromThoughts.filter((t) => t !== id),
    })),
  };
}

/** 着眼点を消す。その着眼点の連想も一緒に消す。 */
export function removeMark(d: Draft, id: string): Draft {
  let next: Draft = {
    ...d,
    marks: d.marks.filter((m) => m.id !== id),
    solution: d.solution.map((s) => ({
      ...s,
      fromFragments: s.fromFragments.filter((f) => f !== id),
    })),
  };
  for (const a of d.associations.filter((x) => x.fragmentId === id)) {
    next = removeThought(next, a.id);
  }
  return next;
}

/**
 * 問題文を書きかえたときに、着眼点の位置を合わせ直す。
 * 着眼点の中を直したときは伸び縮みし、着眼点をまるごと消したときだけ着眼点も消える。
 */
export function editText(d: Draft, text: string): Draft {
  const old = d.text;
  let prefix = 0;
  while (prefix < old.length && prefix < text.length && old[prefix] === text[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < old.length - prefix &&
    suffix < text.length - prefix &&
    old[old.length - 1 - suffix] === text[text.length - 1 - suffix]
  ) {
    suffix++;
  }
  const a = prefix;
  const b = old.length - suffix;
  const inserted = text.length - suffix - prefix;
  const delta = text.length - old.length;

  let next: Draft = { ...d, text };
  const removed: string[] = [];
  const marks: Mark[] = [];
  for (const m of d.marks) {
    let { start, end } = m;
    if (end <= a) {
      // 変更より前。そのまま
    } else if (start >= b) {
      start += delta;
      end += delta;
    } else if (a >= start && b <= end) {
      end += delta;
    } else if (a <= start && b >= end) {
      start = end = 0;
    } else if (a < start) {
      start = a + inserted;
      end += delta;
    } else {
      end = a;
    }
    if (end > start) marks.push({ id: m.id, start, end });
    else removed.push(m.id);
  }
  next.marks = marks;
  for (const id of removed) next = removeMark(next, id);
  return next;
}

/** 一覧や注意書きに出す短い名前（数式の記号は外す）。 */
export function label(text: string, max = 18): string {
  const plain = text.replace(/\$/g, "").trim();
  if (plain === "") return "（未入力）";
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export type Section = "basic" | "text" | "marks" | "combos" | "skeleton" | "solution";

export interface Issue {
  section: Section;
  message: string;
  /** true なら、直すまで試せない */
  blocking: boolean;
}

function mathProblem(text: string): string | null {
  if ((text.match(/\$/g) ?? []).length % 2 !== 0) return "$ が閉じていません";
  const parts = text.split("$");
  for (let i = 1; i < parts.length; i += 2) {
    try {
      katex.renderToString(parts[i], { throwOnError: true });
    } catch {
      return `数式「${parts[i]}」が正しく書けていません`;
    }
  }
  return null;
}

/** いまの下書きで直す必要があること。空なら、そのまま試せる。 */
export function issues(d: Draft): Issue[] {
  const list: Issue[] = [];
  const add = (section: Section, message: string, blocking = true) =>
    list.push({ section, message, blocking });
  const checkMath = (section: Section, where: string, text: string) => {
    const problem = mathProblem(text);
    if (problem) add(section, `${where}：${problem}`);
  };
  const markText = (id: string) => label(d.text.slice(...range(d, id)));

  if (d.title.trim() === "") add("basic", "タイトルを入れてください。");
  if (d.unit.trim() === "") add("basic", "単元を入れてください。");

  if (d.text.trim() === "") add("text", "問題文を入れてください。");
  checkMath("text", "問題文", d.text);
  if (d.text.trim() !== "" && d.marks.length === 0) {
    add("text", "着眼点を1つ以上作ってください。");
  }

  for (const m of d.marks) {
    const mine = d.associations.filter((a) => a.fragmentId === m.id);
    if (mine.length === 0) add("marks", `着眼点「${markText(m.id)}」に、連想を1つ以上入れてください。`);
    if (mine.length > 3) add("marks", `着眼点「${markText(m.id)}」の連想は3つまでです。`);
    for (const a of mine) {
      if (a.title.trim() === "") add("marks", `着眼点「${markText(m.id)}」に、一言が空の連想があります。`);
      checkMath("marks", `連想「${label(a.title)}」`, `${a.title} ${a.detail}`);
    }
  }

  const thoughtIds = new Set([...d.associations, ...d.combinations].map((t) => t.id));
  const title = (id: string) =>
    label([...d.associations, ...d.combinations].find((t) => t.id === id)?.title ?? "");
  const used = new Map<string, number>();
  for (const c of d.combinations) {
    const name = `組み合わせ「${label(c.title)}」`;
    if (c.from.some((f) => !thoughtIds.has(f))) add("combos", `${name}：もとになる考えを2つ選んでください。`);
    else if (c.from[0] === c.from[1]) add("combos", `${name}：もとになる考えは、別々の2つを選んでください。`);
    if (c.title.trim() === "") add("combos", "生まれる考えの一言が空の組み合わせがあります。");
    checkMath("combos", name, `${c.title} ${c.detail}`);
    for (const f of new Set(c.from)) if (f) used.set(f, (used.get(f) ?? 0) + 1);
  }
  for (const [id, n] of used) {
    if (n > 1) {
      add("combos", `「${title(id)}」が2つ以上の組み合わせで使われています。くっつけた考えは新しい考えに代わるので、使えるのは1回だけです。`);
    }
  }
  const problem = toProblem(d);
  const looped = d.combinations.some((c) => {
    try {
      return sourcesOf(problem, c.id).includes(c.id);
    } catch {
      return true;
    }
  });
  if (looped) add("combos", "組み合わせが輪になっています（自分から生まれた考えを、自分のもとにしています）。");

  if (d.skeleton.length === 0) add("skeleton", "解答の骨組みを1段以上作ってください。");
  const placed = new Map<string, number>();
  d.skeleton.forEach((k, i) => {
    if (k.thoughts.length === 0) add("skeleton", `${i + 1}段目に置く考えを選んでください。`);
    for (const t of k.thoughts) placed.set(t, (placed.get(t) ?? 0) + 1);
  });
  for (const [id, n] of placed) {
    if (n > 1) add("skeleton", `「${title(id)}」が骨組みの2か所に入っています。`);
  }
  if (!looped) {
    const main = d.skeleton.flatMap((k) => k.thoughts.slice(0, 1));
    for (const t of main) {
      for (const u of main) {
        if (t !== u && sourcesOf(problem, t).includes(u)) {
          add("skeleton", `「${title(u)}」は「${title(t)}」のもとになっているので、両方を骨組みに置けません。どちらか一方にしてください。`);
        }
      }
    }
  }

  if (d.solution.length === 0) add("solution", "模範解答を1行以上入れてください。");
  d.solution.forEach((s, i) => {
    if (s.text.trim() === "") add("solution", `模範解答の${i + 1}行目が空です。`);
    checkMath("solution", `模範解答の${i + 1}行目`, s.text);
    if (s.fromFragments.length === 0 && s.fromThoughts.length === 0) {
      add("solution", `模範解答の${i + 1}行目に、もとになった着眼点や考えが付いていません（付けなくても試せます）。`, false);
    }
  });

  if (!list.some((x) => x.blocking) && !looped) {
    for (const message of validateProblem(problem)) add("solution", message);
  }
  return list;
}

function range(d: Draft, markId: string): [number, number] {
  const m = d.marks.find((x) => x.id === markId);
  return m ? [m.start, m.end] : [0, 0];
}

/** 学習画面で試せる状態か。 */
export function isPlayable(p: Problem): boolean {
  return !issues(fromProblem(p)).some((x) => x.blocking);
}
