/**
 * 文を「ことば」に区切る。問題文や説明の中のことばを、1つずつ解答ボードへ運べるようにするため。
 * 数式（`$...$`）はまるごと1つとして扱う。
 */

export interface Token {
  text: string;
  /** math: 数式まるごと / word: 運べることば / other: 空白・記号・1文字の助詞（運べない） */
  kind: "math" | "word" | "other";
}

/** 文を細かく区切る関数。ことばらしい部分かどうか（wordLike）も返す。 */
export type Segmenter = (text: string) => { text: string; wordLike: boolean }[];

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

const HAN = /[\p{Script=Han}々〆ヶ]/u;
const KATAKANA = /[\p{Script=Katakana}ー]/u;
const HIRAGANA = /[\p{Script=Hiragana}]/u;
const ALNUM = /[0-9A-Za-z０-９Ａ-Ｚａ-ｚⅠ-ⅿ]/u;
/** 漢字・カタカナ・英数字だけでできている（熟語の一部になれる） */
const COMPOUND = /^(?:[\p{Script=Han}々〆ヶ\p{Script=Katakana}ー]|[0-9A-Za-z０-９Ａ-Ｚａ-ｚⅠ-ⅿ])+$/u;
const STARTS_COMPOUND = /^(?:[\p{Script=Han}々〆ヶ\p{Script=Katakana}]|[0-9A-Za-z０-９Ａ-Ｚａ-ｚⅠ-ⅿ])/u;
const ONE_HIRAGANA = /^[\p{Script=Hiragana}]$/u;

function charClass(c: string): string {
  if (/\s/.test(c)) return "space";
  if (HAN.test(c)) return "han";
  if (KATAKANA.test(c)) return "katakana";
  if (HIRAGANA.test(c)) return "hiragana";
  if (ALNUM.test(c)) return "alnum";
  return "mark";
}

/** 文字の種類（漢字・かな・英数字）が変わる所で区切る。辞書を使えない環境のための予備。 */
export const plainSegmenter: Segmenter = (text) => {
  const result: { text: string; wordLike: boolean }[] = [];
  let kind = "";
  for (const c of text) {
    const k = charClass(c);
    const last = result[result.length - 1];
    if (last && k === kind && k !== "mark") last.text += c;
    else result.push({ text: c, wordLike: k !== "space" && k !== "mark" });
    kind = k;
  }
  return result;
};

let cached: Segmenter | undefined;

/** ブラウザが持っている日本語の辞書で区切る。なければ文字の種類で区切る。 */
function defaultSegmenter(): Segmenter {
  if (cached) return cached;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
    cached = (text) =>
      [...segmenter.segment(text)].map((s) => ({ text: s.segment, wordLike: s.isWordLike === true }));
  } else {
    cached = plainSegmenter;
  }
  return cached;
}

/**
 * 文をことばに区切る。辞書は「平方｜完成」「定義｜域」のように細かく切るので、
 * 漢字・カタカナ・英数字が続く所はつなげて、熟語を1つのことばにする。
 */
export function tokenize(text: string, segmenter: Segmenter = defaultSegmenter()): Token[] {
  const tokens: Token[] = [];
  const plain = (part: string) => {
    const merged: { text: string; wordLike: boolean }[] = [];
    for (const s of segmenter(part)) {
      const last = merged[merged.length - 1];
      if (last?.wordLike && s.wordLike && COMPOUND.test(last.text) && STARTS_COMPOUND.test(s.text)) {
        last.text += s.text;
      } else {
        merged.push({ ...s });
      }
    }
    for (const s of merged) {
      const word = s.wordLike && !ONE_HIRAGANA.test(s.text);
      const last = tokens[tokens.length - 1];
      if (!word && last?.kind === "other") last.text += s.text;
      else tokens.push({ text: s.text, kind: word ? "word" : "other" });
    }
  };
  let at = 0;
  for (const [a, b] of mathRanges(text)) {
    if (a > at) plain(text.slice(at, a));
    tokens.push({ text: text.slice(a, b), kind: "math" });
    at = b;
  }
  if (at < text.length) plain(text.slice(at));
  return tokens;
}
