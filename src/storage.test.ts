import { beforeEach, describe, expect, it } from "vitest";
import { problems } from "./data/problems";
import { loadState, saveState } from "./storage";

const p = problems.find((x) => x.id === "quadratic-min")!;

/** テストの中だけで使う、ブラウザの保存場所の代わり。 */
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

beforeEach(() => {
  globalThis.localStorage = fakeStorage();
});

describe("学習の状態の保存", () => {
  it("何もなければ空から始まる", () => {
    expect(loadState(p)).toEqual({ board: [], found: [], rows: [] });
  });

  it("保存したものを読み戻せる", () => {
    const saved = {
      board: ["a1", "a4", "c1"],
      found: ["f1"],
      rows: [[{ id: "n1", text: "平方完成", thoughtId: "a1" }], [{ id: "n2", text: "最小値", fragmentId: "f4" }]],
    };
    saveState(p.id, saved);
    expect(loadState(p)).toEqual(saved);
  });

  it("以前の形（枠に考えを1つずつ）で保存されたものは、段ごとのことばに直して読む", () => {
    localStorage.setItem(
      `mathter:state:v3:${p.id}`,
      JSON.stringify({ board: ["a1", "a4", "c1"], found: ["f1"], placed: ["c1", null, "zz"] }),
    );
    const state = loadState(p);
    expect(state.board).toEqual(["a1", "a4", "c1"]);
    expect(state.rows).toEqual([[{ id: "old-c1", text: p.combinations[0].title, thoughtId: "c1" }]]);
  });

  it("壊れた保存データでも、読めるものだけ読む", () => {
    localStorage.setItem(`mathter:state:v4:${p.id}`, "{こわれている");
    expect(loadState(p)).toEqual({ board: [], found: [], rows: [] });
    localStorage.setItem(
      `mathter:state:v4:${p.id}`,
      JSON.stringify({ board: ["a1", "zz"], found: ["f9"], rows: "x" }),
    );
    expect(loadState(p)).toEqual({ board: ["a1"], found: [], rows: [] });
  });
});
