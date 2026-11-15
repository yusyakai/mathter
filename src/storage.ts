import { playableProblems } from "./library";
import { resetStudyTime, TIME_KEY } from "./studyTime";
import { sanitizeRows, type Rows } from "./answer";
import { allThoughts, sanitizeBoard } from "./thoughts";
import type { Problem } from "./types";

/** 1問ごとの学習の状態 */
export interface Saved {
  /** 思考ボードに置いた考えすべて（くっつけて代わったものも含む） */
  board: string[];
  /** 学習者が見つけた着眼点 */
  found: string[];
  /** 解答ボードに並べたことば（上から順の段） */
  rows: Rows;
}

/** 連想の型ごとの記録。問題をまたいで持つ */
export interface LearnerRecord {
  /** 思考ボードに集めたことがある型 */
  seen: string[];
  /** 学習者が「もう分かる」と印を付けた型 */
  known: string[];
}

const stateKey = (problemId: string) => `mathter:state:v4:${problemId}`;
/** 解答ボードが「決まった数の枠に、考えを1つずつ置く」形だったころの保存先 */
const oldStateKey = (problemId: string) => `mathter:state:v3:${problemId}`;
const RECORD_KEY = "mathter:record:v1";

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export function loadState(problem: Problem): Saved {
  try {
    const raw = localStorage.getItem(stateKey(problem.id));
    const old = raw ? null : localStorage.getItem(oldStateKey(problem.id));
    const saved = JSON.parse(raw ?? old ?? "{}") as Record<string, unknown>;
    const ids = problem.fragments.map((f) => f.id);
    return {
      board: sanitizeBoard(problem, strings(saved.board)),
      rows: sanitizeRows(problem, old ? rowsFromOldSlots(problem, saved.placed) : saved.rows),
      found: strings(saved.found).filter((f) => ids.includes(f)),
    };
  } catch {
    return { board: [], found: [], rows: [] };
  }
}

/** 以前の形（枠ごとに考えの id が1つ）を、いまの形（段ごとのことば）に直す。 */
function rowsFromOldSlots(problem: Problem, placed: unknown): Rows {
  const thoughts = allThoughts(problem);
  return strings(placed).flatMap((id) => {
    const t = thoughts.get(id);
    return t ? [[{ id: `old-${id}`, text: t.title, thoughtId: id }]] : [];
  });
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

/** 学習の記録（ボードの状態、型の記録、学習時間）をすべて消す。自作の問題と型は残す。 */
export function clearLearning(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("mathter:state:") || key === RECORD_KEY || key === TIME_KEY) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // 消せなくても、ほかの機能には影響しない
  }
  resetStudyTime();
}
