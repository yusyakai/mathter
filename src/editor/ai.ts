import { snapSelection, type Draft, type Mark } from "./draft";
import type { GraphSpec, Pattern, Problem } from "../types";

/**
 * AIに作らせる下書きの形。問題データそのものより単純にして、
 * 着眼点は問題文の一部分の文字列で、考えどうしは "A1" "C1" のような名前で指す。
 */
interface AiDraft {
  title: string;
  unit: string;
  text: string;
  marks: string[];
  associations: {
    key: string;
    mark: string;
    pattern: string | null;
    title: string;
    detail: string;
    graph?: GraphSpec;
  }[];
  combinations: { key: string; from: string[]; title: string; detail: string; graph?: GraphSpec }[];
  skeleton: string[][];
  solution: { text: string; marks: string[]; thoughts: string[] }[];
}

/** 内蔵の問題を、AIに見せる見本の形に直す。 */
export function toAiDraft(p: Problem): AiDraft {
  const markText = (id: string) => p.segments.find((s) => s.fragmentId === id)?.text ?? "";
  const key = new Map<string, string>();
  p.associations.forEach((a, i) => key.set(a.id, `A${i + 1}`));
  p.combinations.forEach((c, i) => key.set(c.id, `C${i + 1}`));
  const k = (id: string) => key.get(id) ?? id;
  return {
    title: p.title,
    unit: p.unit,
    text: p.segments.map((s) => s.text).join(""),
    marks: [...p.fragments].sort((a, b) => a.priority - b.priority).map((f) => markText(f.id)),
    associations: p.associations.map((a) => ({
      key: k(a.id),
      mark: markText(a.fragmentId),
      pattern: a.patternId ?? null,
      title: a.title,
      detail: a.detail,
      ...(a.graph ? { graph: a.graph } : {}),
    })),
    combinations: p.combinations.map((c) => ({
      key: k(c.id),
      from: c.from.map(k),
      title: c.title,
      detail: c.detail,
      ...(c.graph ? { graph: c.graph } : {}),
    })),
    skeleton: p.skeleton.map((s) => s.thoughts.map(k)),
    solution: p.solution.map((s) => ({
      text: s.text,
      marks: s.fromFragments.map(markText),
      thoughts: s.fromThoughts.map(k),
    })),
  };
}

/** AIチャットに貼り付ける指示文を作る。 */
export function buildPrompt(
  text: string,
  answer: string,
  patterns: Pattern[],
  example: Problem,
): string {
  const patternLines = patterns
    .map((p) => `- ${p.id}（${p.unit}）: ${p.trigger} → ${p.idea}`)
    .join("\n");
  return `あなたは高校数学の先生です。数学学習アプリ「mathter」の問題データの下書きを作ってください。

mathter は「問題文のどこに目をつけ、そこから何を連想し、連想をどう組み合わせて解答の骨組みにするか」を生徒が身に付けるアプリです。解答そのものではなく、解答に書かれない思考の過程をデータにします。

# 作るもの

次の JSON を1つだけ出力してください。説明文や前置きは書かず、JSON だけを \`\`\`json のコードブロックで出力します。

- title: 問題のタイトル（内容が分かる短い名前）
- unit: 単元（例：「数学Ⅰ 2次関数」）
- text: 問題文。数式は $ で囲んだ LaTeX で書く
- marks: 着眼点。問題文（text）の中の一部分を、そのままの文字列で書く。生徒が見るべき順に並べる。3〜5個
- associations: 着眼点から連想すること。着眼点1つにつき1〜3個
  - key: "A1" "A2" … の名前
  - mark: どの着眼点からの連想か（marks の文字列のどれか）
  - pattern: 下の「型の一覧」に合うものがあればその id、なければ null
  - title: 思考ボードのカードに出すことば。単語か短い文にする（15字くらいまで。例：「平方完成」「頂点か端点」「軸 $x=a$ が動く」）。生徒がそのまま解答の骨組みに置けることばにする
  - detail: カードを開くと出る説明。なぜそう考えるか、どう使うか。計算の手順をすべて書くのではなく、考え方を1〜2文で
- combinations: 2つの考えをくっつけると生まれる新しい考え。0〜4個
  - key: "C1" "C2" … の名前
  - from: もとになる2つの考えの key（連想でも、別の組み合わせでもよい）
  - title, detail: 連想と同じ
- 連想や組み合わせには、グラフを見せると分かりやすいときだけ graph を付けられる（なくてよい）
  - expr: y = の右側の式（例："x^2-2ax+3"。LaTeX ではなく、^ と括弧で書く）
  - xMin, xMax: 横の範囲。yMin, yMax: 縦の範囲（省ける）
  - param: 式の中の文字を生徒が動かせるようにするとき {"name": "a", "min": -1, "max": 3, "value": 1}
  - domain: 定義域を太く描くとき ["0", "2"]（数か、param の文字で書く）
- skeleton: 模範の骨組み。解答で使う考えを、使う順に上から並べる。2〜4段。各段は key の配列で、1つ目がその段で使う考え。くっつける前の考えでもよい場合だけ2つ目に書く
- solution: 模範解答。1行ずつ
  - text: 解答の文
  - marks: その行のもとになった着眼点（marks の文字列）
  - thoughts: その行のもとになった考えの key

# 守ること

- 1つの考えを from に使えるのは1回だけ（くっつけた2つは新しい考え1つに代わるため）
- skeleton の各段の1つ目の考えどうしは、一方が他方のもと（from をたどった先）になっていてはいけない
- 着眼点の文字列は、問題文の中にそのまま現れる部分にする。数式は $ から $ までをまるごと含める
- 着眼点どうしは重ならないようにする
- JSON の文字列の中では、LaTeX のバックスラッシュを2つ重ねて書く（例："$0\\\\le x\\\\le 2$"）
- 数学的に正しいこと。模範解答は最後の答えまで書く

# 型の一覧

${patternLines}

# 見本

\`\`\`json
${JSON.stringify(toAiDraft(example), null, 2)}
\`\`\`

# 今回の問題

${text.trim()}
${answer.trim() === "" ? "" : `\n# 参考にする解答\n\n${answer.trim()}\n`}`;
}

/** AIの返事から JSON の部分を取り出して読む。LaTeX のバックスラッシュが1つだけでも読めるように直す。 */
export function extractJson(reply: string): unknown {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON が見つかりません");
  const repaired = reply.slice(start, end + 1).replace(/\\(\\|[a-zA-Z]{2,}|[^])/g, (all, next: string) => {
    if (next === "\\") return all;
    if (next.length >= 2) return `\\\\${next}`;
    return '"/bfnrtu'.includes(next) ? all : `\\\\${next}`;
  });
  return JSON.parse(repaired);
}

const str = (x: unknown) => (typeof x === "string" ? x : "");
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const obj = (x: unknown): Record<string, unknown> =>
  typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {};

/** グラフの設定を読む。数でない所は捨て、式がなければグラフなしにする。 */
function readGraph(value: unknown): GraphSpec | undefined {
  const g = obj(value);
  const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
  if (str(g.expr).trim() === "") return undefined;
  const p = obj(g.param);
  const [pMin, pMax, pValue] = [n(p.min), n(p.max), n(p.value)];
  const d = arr(g.domain).map((x) => (typeof x === "number" ? String(x) : str(x)));
  return {
    expr: str(g.expr),
    xMin: n(g.xMin) ?? -5,
    xMax: n(g.xMax) ?? 5,
    ...(n(g.yMin) !== undefined && n(g.yMax) !== undefined ? { yMin: n(g.yMin), yMax: n(g.yMax) } : {}),
    ...(str(p.name) && pMin !== undefined && pMax !== undefined
      ? { param: { name: str(p.name), min: pMin, max: pMax, value: pValue ?? pMin } }
      : {}),
    ...(d.length === 2 && d.every((x) => x !== "") ? { domain: [d[0], d[1]] as [string, string] } : {}),
  };
}

/**
 * AIの下書きを、問題を作る画面の下書きに直す。
 * 読み取れなかった所は notes に残し、作る人が画面で直せるようにする。
 */
export function fromAiDraft(
  value: unknown,
  id: string,
  patterns: Pattern[],
): { draft: Draft; notes: string[] } | { error: string } {
  const v = obj(value);
  const text = str(v.text);
  if (text.trim() === "") return { error: "問題文（text）が入っていません。" };
  const notes: string[] = [];

  const marks: Mark[] = [];
  const markId = new Map<string, string>();
  for (const raw of arr(v.marks)) {
    const piece = str(raw).trim();
    if (piece === "" || markId.has(piece)) continue;
    let found: { start: number; end: number } | null = null;
    for (let at = text.indexOf(piece); at >= 0; at = text.indexOf(piece, at + 1)) {
      const range = snapSelection(text, at, at + piece.length);
      if (range && !marks.some((m) => range.start < m.end && m.start < range.end)) {
        found = range;
        break;
      }
    }
    if (!found) {
      notes.push(`着眼点「${piece}」が問題文の中に見つからなかったので、入れていません。`);
      continue;
    }
    const mid = `f${marks.length + 1}`;
    marks.push({ id: mid, ...found });
    markId.set(piece, mid);
  }

  const keyId = new Map<string, string>();
  const patternIds = new Set(patterns.map((p) => p.id));
  const associations: Draft["associations"] = [];
  for (const raw of arr(v.associations)) {
    const a = obj(raw);
    const fragmentId = markId.get(str(a.mark).trim());
    if (!fragmentId) {
      notes.push(`連想「${str(a.title)}」は、着眼点が見つからなかったので入れていません。`);
      continue;
    }
    const aid = `a${associations.length + 1}`;
    if (str(a.key)) keyId.set(str(a.key), aid);
    const patternId = patternIds.has(str(a.pattern)) ? str(a.pattern) : undefined;
    const graph = readGraph(a.graph);
    associations.push({
      id: aid,
      fragmentId,
      ...(patternId ? { patternId } : {}),
      title: str(a.title),
      detail: str(a.detail),
      ...(graph ? { graph } : {}),
    });
  }

  const rawCombos = arr(v.combinations).map(obj);
  rawCombos.forEach((c, i) => {
    if (str(c.key)) keyId.set(str(c.key), `c${i + 1}`);
  });
  const ref = (x: unknown) => keyId.get(str(x)) ?? "";
  const combinations: Draft["combinations"] = rawCombos.map((c, i) => {
    const from = arr(c.from);
    const graph = readGraph(c.graph);
    return {
      id: `c${i + 1}`,
      from: [ref(from[0]), ref(from[1])],
      title: str(c.title),
      detail: str(c.detail),
      ...(graph ? { graph } : {}),
    };
  });

  const refs = (x: unknown) => [...new Set(arr(x).map(ref).filter((r) => r !== ""))];
  return {
    notes,
    draft: {
      id,
      title: str(v.title),
      unit: str(v.unit),
      text,
      marks,
      associations,
      combinations,
      skeleton: arr(v.skeleton).map((k, i) => ({ id: `k${i + 1}`, thoughts: refs(k) })),
      solution: arr(v.solution).map((raw, i) => {
        const s = obj(raw);
        return {
          id: `s${i + 1}`,
          text: str(s.text),
          fromFragments: [
            ...new Set(arr(s.marks).flatMap((m) => markId.get(str(m).trim()) ?? [])),
          ],
          fromThoughts: refs(s.thoughts),
        };
      }),
    },
  };
}
