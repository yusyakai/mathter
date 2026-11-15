/**
 * 「x^2-2ax+3」のような式を読み取って、値を計算できる形にする。
 * 掛け算の記号は省ける（2x、ax、x(10-x)）。文字は1文字ずつ別の文字として扱う。
 */

type Node =
  | { kind: "num"; value: number }
  | { kind: "var"; name: string }
  | { kind: "neg"; arg: Node }
  | { kind: "bin"; op: "+" | "-" | "*" | "/" | "^"; left: Node; right: Node }
  | { kind: "call"; name: string; arg: Node };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  log: Math.log,
};

type Token = { type: "num"; value: number } | { type: "id"; name: string } | { type: "op"; op: string };

function tokenize(source: string): Token[] {
  const text = source
    .replace(/\$/g, "")
    .replace(/^\s*y\s*=/, "")
    .replace(/[−ー－]/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/（/g, "(")
    .replace(/）/g, ")");
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < text.length && /[0-9.]/.test(text[j])) j++;
      const value = Number(text.slice(i, j));
      if (Number.isNaN(value)) throw new Error(`数「${text.slice(i, j)}」が読み取れません`);
      tokens.push({ type: "num", value });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      const name = Object.keys(FUNCTIONS).find((f) => text.startsWith(f, i));
      if (name) {
        tokens.push({ type: "id", name });
        i += name.length;
      } else {
        tokens.push({ type: "id", name: c });
        i++;
      }
    } else if ("+-*/^()".includes(c)) {
      tokens.push({ type: "op", op: c });
      i++;
    } else {
      throw new Error(`「${c}」は式に使えません`);
    }
  }
  return tokens;
}

function parse(source: string): Node {
  const tokens = tokenize(source);
  let at = 0;
  const peek = () => tokens[at];
  const isOp = (op: string) => {
    const t = peek();
    return t?.type === "op" && t.op === op;
  };

  const expression = (): Node => {
    let left = term();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[at++] as { op: "+" | "-" }).op;
      left = { kind: "bin", op, left, right: term() };
    }
    return left;
  };

  const term = (): Node => {
    let left = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = (tokens[at++] as { op: "*" | "/" }).op;
        left = { kind: "bin", op, left, right: unary() };
      } else if (peek() && (peek().type !== "op" || isOp("("))) {
        // 記号を省いた掛け算
        left = { kind: "bin", op: "*", left, right: power() };
      } else {
        return left;
      }
    }
  };

  const unary = (): Node => {
    if (isOp("-")) {
      at++;
      return { kind: "neg", arg: unary() };
    }
    if (isOp("+")) at++;
    return power();
  };

  const power = (): Node => {
    const base = atom();
    if (isOp("^")) {
      at++;
      return { kind: "bin", op: "^", left: base, right: unary() };
    }
    return base;
  };

  const atom = (): Node => {
    const t = tokens[at++];
    if (!t) throw new Error("式が途中で終わっています");
    if (t.type === "num") return { kind: "num", value: t.value };
    if (t.type === "id") {
      if (t.name in FUNCTIONS) {
        if (!isOp("(")) throw new Error(`${t.name} のあとに ( が必要です`);
        at++;
        const arg = expression();
        if (!isOp(")")) throw new Error(") が足りません");
        at++;
        return { kind: "call", name: t.name, arg };
      }
      return { kind: "var", name: t.name };
    }
    if (t.op === "(") {
      const inner = expression();
      if (!isOp(")")) throw new Error(") が足りません");
      at++;
      return inner;
    }
    throw new Error(`「${t.op}」の位置が正しくありません`);
  };

  if (tokens.length === 0) throw new Error("式が入っていません");
  const result = expression();
  if (at < tokens.length) throw new Error("式の終わりに読み取れない部分があります");
  return result;
}

function evaluate(node: Node, vars: Record<string, number>): number {
  switch (node.kind) {
    case "num":
      return node.value;
    case "var":
      return vars[node.name] ?? NaN;
    case "neg":
      return -evaluate(node.arg, vars);
    case "call":
      return FUNCTIONS[node.name](evaluate(node.arg, vars));
    case "bin": {
      const a = evaluate(node.left, vars);
      const b = evaluate(node.right, vars);
      if (node.op === "+") return a + b;
      if (node.op === "-") return a - b;
      if (node.op === "*") return a * b;
      if (node.op === "/") return a / b;
      return a ** b;
    }
  }
}

function collect(node: Node, into: Set<string>): void {
  if (node.kind === "var") into.add(node.name);
  else if (node.kind === "neg" || node.kind === "call") collect(node.arg, into);
  else if (node.kind === "bin") {
    collect(node.left, into);
    collect(node.right, into);
  }
}

export interface Compiled {
  /** 式に出てくる文字 */
  variables: string[];
  evaluate: (vars: Record<string, number>) => number;
}

/** 式を読み取る。読み取れないときは、理由を日本語で書いた Error を投げる。 */
export function compile(source: string): Compiled {
  const node = parse(source);
  const names = new Set<string>();
  collect(node, names);
  return { variables: [...names], evaluate: (vars) => evaluate(node, vars) };
}
