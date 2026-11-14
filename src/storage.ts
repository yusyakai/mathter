import { playableProblems } from "./library";
import { sanitizeBoard, sanitizePlaced } from "./thoughts";
import type { Problem } from "./types";

/** 1問ごとの学習の状態 */
export interface Saved {
  /** 思考ボードに置いた考えすべて（くっつけて代わったものも含む） */
  board: string[];
  /** 学習者が見つけた着眼点 */
  found: string[];
  /** 解答ボードの各段に置いた考え */
  placed: (string | null)[];
}

/** 連想の型ごとの記録。問題をまたいで持つ */
export interface LearnerRecord {
  /** 思考ボードに集めたことがある型 */
  seen: string[];
  /** 学習者が「もう分かる」と印を付けた型 */
  known: string[];
}

const stateKey = (problemId: string) => `mathter:state:v3:${problemId}`;
const RECORD_KEY = "mathter:record:v1";

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export function loadState(problem: Problem): Saved {
  try {
    const raw = localStorage.getItem(stateKey(problem.id));
    const saved = raw ? (JSON.parse(raw) as Partial<Saved>) : {};
    const ids = problem.fragments.map((f) => f.id);
    const board = sanitizeBoard(problem, strings(saved.board));
    return {
      board,
      placed: sanitizePlaced(problem, board, Array.isArray(saved.placed) ? saved.placed : []),
      found: strings(saved.found).filter((f) => ids.includes(f)),
    };
  } catch {
    return { board: [], found: [], placed: problem.skeleton.map(() => null) };
  }
}

export function saveState(problemId: string, saved: Saved): void {
  try {
    localStorage.setItem(stateKey(problemId), JSON.stringify(saved));
  } catch {
    // 保存できなくても学習は続けられる
  }
}

/** 型の記録を読む。以前の版でボードに置いた連想の型も「集めた」に含める。 */
export function loadRecord(): LearnerRecord {
  let seen: string[] = [];
  let known: string[] = [];
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<LearnerRecord>) : {};
    seen = strings(saved.seen);
    known = strings(saved.known);
  } catch {
    // 読めなければ空から始める
  }
  for (const problem of playableProblems()) {
    const { board } = loadState(problem);
    for (const a of problem.associations) {
      if (a.patternId && board.includes(a.id) && !seen.includes(a.patternId)) {
        seen.push(a.patternId);
      }
    }
  }
  return { seen, known };
}

export function saveRecord(record: LearnerRecord): void {
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  } catch {
    // 保存できなくても学習は続けられる
  }
}
