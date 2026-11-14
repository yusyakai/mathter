/** 問題文・解答中の文字列。`$...$` で囲んだ部分は LaTeX として表示する。 */
export type RichText = string;

/** 問題文を前から順に並べた断片。fragmentId があれば「着眼点」としてタップできる。 */
export interface TextSegment {
  text: RichText;
  fragmentId?: string;
}

/** 着眼点（問題文の一部分）から連想すること。 */
export interface Association {
  id: string;
  fragmentId: string;
  /** この連想があてはまる型（`src/data/patterns.ts`）。その問題だけの連想なら省く */
  patternId?: string;
  /** カードに出す短い一言 */
  title: RichText;
  /** 思考する内容（なぜそう考えるか、どう使うか） */
  detail: RichText;
}

/**
 * 2つの考えをくっつけると生まれる新しい考え。from には連想・組み合わせどちらの id も置ける。
 * くっつけた2つは新しい考えに代わるので、1つの考えを元にできる組み合わせは1つまで。
 */
export interface Combination {
  id: string;
  from: [string, string];
  title: RichText;
  detail: RichText;
}

/** 模範解答の1行と、その行が生まれた元（問題文の着眼点と考え）。 */
export interface SolutionStep {
  id: string;
  text: RichText;
  fromFragments: string[];
  fromThoughts: string[];
}

/** 着眼点。priority は「見る順番の目安」（1 が最初）。 */
export interface Fragment {
  id: string;
  priority: number;
}

/**
 * 解答の骨組みの1段。上から順に並ぶ。thoughts は、この場所に置くと合っている考え
 * （ふつうは1つ。くっつける前の考えも認めるときは複数）。
 */
export interface SkeletonStep {
  id: string;
  thoughts: string[];
}

export interface Problem {
  id: string;
  title: string;
  unit: string;
  segments: TextSegment[];
  fragments: Fragment[];
  associations: Association[];
  combinations: Combination[];
  skeleton: SkeletonStep[];
  solution: SolutionStep[];
}

/** 思考ボードに置けるカード（連想または組み合わせ） */
export type Thought =
  | ({ kind: "association" } & Association)
  | ({ kind: "combination" } & Combination);

/** 連想の型。問題をまたいで共通の「きっかけ → 連想」。連想ノートに貯まる。 */
export interface Pattern {
  id: string;
  unit: string;
  /** 何を見たら */
  trigger: RichText;
  /** 何を連想するか */
  idea: RichText;
  detail: RichText;
}
