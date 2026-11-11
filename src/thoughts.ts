import type { Combination, Problem, Thought } from "./types";

export function allThoughts(problem: Problem): Map<string, Thought> {
  const map = new Map<string, Thought>();
  for (const a of problem.associations) map.set(a.id, { kind: "association", ...a });
  for (const c of problem.combinations) map.set(c.id, { kind: "combination", ...c });
  return map;
}

/** 2つの考えをくっつけて生まれる組み合わせ（順不同）。なければ undefined。 */
export function findCombination(
  problem: Problem,
  x: string,
  y: string,
): Combination | undefined {
  return problem.combinations.find(
    (c) => (c.from[0] === x && c.from[1] === y) || (c.from[0] === y && c.from[1] === x),
  );
}

/**
 * ボードに見えているカード。board には置いた考えすべての id が入っていて、
 * くっつけて別の考えに代わったものは見せない。
 */
export function visibleCards(problem: Problem, board: string[]): string[] {
  const merged = new Set(
    problem.combinations.filter((c) => board.includes(c.id)).flatMap((c) => c.from),
  );
  return board.filter((id) => !merged.has(id));
}

/** id の考えを含んでいる、いま見えているカード。ボードになければ undefined。 */
export function cardContaining(
  problem: Problem,
  board: string[],
  id: string,
): string | undefined {
  if (!board.includes(id)) return undefined;
  let current = id;
  for (;;) {
    const parent = problem.combinations.find(
      (c) => board.includes(c.id) && c.from.includes(current),
    );
    if (!parent) return current;
    current = parent.id;
  }
}

/** 保存されていたボードから、知らない id や、元の考えが欠けた組み合わせを取り除く。 */
export function sanitizeBoard(problem: Problem, board: string[]): string[] {
  const known = allThoughts(problem);
  let result = [...new Set(board)].filter((id) => known.has(id));
  for (;;) {
    const next = result.filter((id) => {
      const t = known.get(id)!;
      return t.kind === "association" || t.from.every((f) => result.includes(f));
    });
    if (next.length === result.length) return result;
    result = next;
  }
}

/** 問題データの参照切れなどを検査する。問題がなければ空配列。 */
export function validateProblem(problem: Problem): string[] {
  const errors: string[] = [];
  const fragmentIds = new Set(problem.fragments.map((f) => f.id));
  const inText = problem.segments.flatMap((s) => (s.fragmentId ? [s.fragmentId] : []));
  for (const f of inText) {
    if (!fragmentIds.has(f)) errors.push(`問題文の着眼点 ${f} が fragments にない`);
  }
  for (const f of fragmentIds) {
    if (!inText.includes(f)) errors.push(`着眼点 ${f} が問題文にない`);
  }
  const priorities = problem.fragments.map((f) => f.priority).sort((a, b) => a - b);
  if (priorities.some((p, i) => p !== i + 1)) {
    errors.push("priority は 1 から順に重複なく付ける");
  }
  const thoughtIds = new Set<string>();
  for (const t of [...problem.associations, ...problem.combinations]) {
    if (thoughtIds.has(t.id)) errors.push(`id が重複: ${t.id}`);
    thoughtIds.add(t.id);
  }
  for (const f of fragmentIds) {
    const n = problem.associations.filter((a) => a.fragmentId === f).length;
    if (n < 1 || n > 3) errors.push(`着眼点 ${f} の連想は1〜3個にする（現在 ${n}）`);
  }
  for (const a of problem.associations) {
    if (!fragmentIds.has(a.fragmentId)) errors.push(`${a.id}: 着眼点 ${a.fragmentId} がない`);
  }
  const used = new Set<string>();
  for (const c of problem.combinations) {
    for (const f of c.from) {
      if (!thoughtIds.has(f) || f === c.id) errors.push(`${c.id}: 元の考え ${f} が不正`);
      if (used.has(f)) errors.push(`${f} を元にする組み合わせが2つ以上ある`);
      used.add(f);
    }
  }
  for (const s of problem.solution) {
    for (const f of s.fromFragments) {
      if (!fragmentIds.has(f)) errors.push(`${s.id}: 着眼点 ${f} がない`);
    }
    for (const t of s.fromThoughts) {
      if (!thoughtIds.has(t)) errors.push(`${s.id}: 考え ${t} がない`);
    }
  }
  const texts = [
    ...problem.segments.map((s) => s.text),
    ...problem.associations.flatMap((a) => [a.title, a.detail]),
    ...problem.combinations.flatMap((c) => [c.title, c.detail]),
    ...problem.solution.map((s) => s.text),
  ];
  for (const t of texts) {
    if ((t.match(/\$/g) ?? []).length % 2 !== 0) errors.push(`$ が閉じていない: ${t}`);
  }
  return errors;
}
