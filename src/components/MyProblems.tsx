import { useRef, useState } from "react";
import { buildPrompt, extractJson, fromAiDraft } from "../editor/ai";
import { emptyDraft, fromProblem, issues, toProblem } from "../editor/draft";
import {
  allPatterns,
  builtinProblems,
  countExisting,
  deleteCustom,
  deleteCustomPattern,
  importBundle,
  makeBundle,
  newCustomId,
  parseBundle,
  saveCustom,
  useCustomPatterns,
  useCustomProblems,
} from "../library";
import type { Problem } from "../types";
import { Rich } from "./Rich";
import { TextField } from "./TextField";

function download(name: string, list: Problem[]): void {
  const blob = new Blob([JSON.stringify(makeBundle(list), null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** 問題を1つ、ファイル（JSON）として保存する。使っている自作の型も一緒に入る。 */
export function downloadProblem(problem: Problem): void {
  download(problem.title.trim() || "mathter-problem", [problem]);
}

const open = (id: string) => {
  window.location.hash = `#/edit/${id}`;
};

/** 自作の問題の一覧。ここから新しく作る・直す・試す・書き出す。 */
export function MyProblems() {
  const custom = useCustomProblems();
  const customPatterns = useCustomPatterns();
  const [message, setMessage] = useState<string | null>(null);
  const [showAi, setShowAi] = useState(false);
  const file = useRef<HTMLInputElement | null>(null);

  const create = () => {
    const id = newCustomId();
    saveCustom(toProblem(emptyDraft(id)));
    open(id);
  };

  const copy = (source: Problem, title: string) => {
    const id = newCustomId();
    saveCustom({ ...source, id, title });
    open(id);
  };

  const read = async (f: File) => {
    try {
      const bundle = parseBundle(JSON.parse(await f.text()));
      if (!bundle || bundle.problems.length === 0) {
        return setMessage("このファイルは、mathter の問題ファイルではないようです。");
      }
      const same = countExisting(bundle.problems);
      const overwrite =
        same > 0 &&
        confirm(
          `ファイルの中の ${same} 問は、すでにこの端末にあります。ファイルの内容で置きかえますか？\n（キャンセルすると、別の問題として足します）`,
        );
      const n = importBundle(bundle, overwrite);
      setMessage(`${n} 問を読み込みました。`);
    } catch {
      setMessage("ファイルを読み込めませんでした。");
    }
  };

  return (
    <main className="page">
      <p className="guide">
        作った問題は、この端末の中に保存されます。ほかの端末で使うときや、保管しておくときは「書き出す」でファイルにします。
      </p>
      <div className="toolbar">
        <button type="button" className="primary" onClick={create}>
          新しい問題を作る
        </button>
        <button type="button" className="hint-button" onClick={() => setShowAi((v) => !v)}>
          AIに下書きを作らせる
        </button>
        <select
          aria-label="見本をコピーして作る"
          value=""
          onChange={(e) => {
            const source = builtinProblems.find((p) => p.id === e.target.value);
            if (source) copy(source, `${source.title}（コピー）`);
          }}
        >
          <option value="">見本をコピーして作る…</option>
          {builtinProblems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button type="button" className="hint-button" onClick={() => file.current?.click()}>
          ファイルから読み込む
        </button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void read(f);
            e.target.value = "";
          }}
        />
      </div>
      {message && (
        <p className="message" role="status">
          {message}
        </p>
      )}

      {showAi && <AiDraftPanel />}

      <h2 className="page-heading">
        自作の問題
        {custom.length > 0 && (
          <button
            type="button"
            className="hint-button"
            onClick={() => download(`mathter-問題${custom.length}問`, custom)}
          >
            すべて書き出す
          </button>
        )}
      </h2>
      {custom.length === 0 && <p className="guide">まだ問題がありません。</p>}
      <ul className="problem-list">
        {custom.map((p) => {
          const left = issues(fromProblem(p)).filter((x) => x.blocking).length;
          return (
            <li key={p.id} className="problem-item">
              <span className="problem-item-title">
                {p.title.trim() || "（タイトルなし）"}
                <span className="status">{left === 0 ? "試せます" : `作成中（あと ${left} か所）`}</span>
              </span>
              <span className="problem-item-text">{p.unit}</span>
              <span className="toolbar">
                <a className="hint-button" href={`#/edit/${p.id}`}>
                  直す
                </a>
                {left === 0 && (
                  <a className="hint-button" href={`#/p/${p.id}`}>
                    試す
                  </a>
                )}
                <button type="button" className="hint-button" onClick={() => copy(p, `${p.title}（コピー）`)}>
                  コピー
                </button>
                <button type="button" className="hint-button" onClick={() => downloadProblem(p)}>
                  書き出す
                </button>
                <button
                  type="button"
                  className="hint-button"
                  onClick={() => {
                    if (confirm(`「${p.title || "タイトルなし"}」を消します。元に戻せません。よろしいですか？`)) {
                      deleteCustom(p.id);
                    }
                  }}
                >
                  消す
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      {customPatterns.length > 0 && (
        <>
          <h2 className="page-heading">自作の型</h2>
          <ul className="cards">
            {customPatterns.map((p) => {
              const uses = custom.filter((q) => q.associations.some((a) => a.patternId === p.id));
              return (
                <li key={p.id} className="card pattern">
                  <div className="pattern-trigger">
                    {p.unit || "単元なし"}｜<Rich text={p.trigger} />
                  </div>
                  <div className="card-title">
                    → <Rich text={p.idea} />
                  </div>
                  <div className="card-actions">
                    <span className="placed-mark">使っている問題 {uses.length} 問</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            uses.length > 0
                              ? `この型を消すと、使っている ${uses.length} 問の連想は「型なし」になります。よろしいですか？`
                              : "この型を消します。よろしいですか？",
                          )
                        ) {
                          deleteCustomPattern(p.id);
                        }
                      }}
                    >
                      消す
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}

/**
 * AIに下書きを作らせる手順。アプリからAIを直接呼ばず、指示文をコピーして
 * 手元のAIチャットに貼り、返事を貼り戻してもらう（サーバーも費用もいらない）。
 */
function AiDraftPanel() {
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const patterns = allPatterns(useCustomPatterns());
  const prompt = buildPrompt(text, answer, patterns, builtinProblems[1] ?? builtinProblems[0]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
      setNote("コピーできませんでした。下の指示文を手で選んでコピーしてください。");
    }
  };

  const load = () => {
    let parsed: unknown;
    try {
      parsed = extractJson(reply);
    } catch {
      return setNote("AIの返事から下書きを読み取れませんでした。返事をすべて貼り付けたか確かめてください。");
    }
    const id = newCustomId();
    const result = fromAiDraft(parsed, id, patterns);
    if ("error" in result) return setNote(result.error);
    saveCustom(toProblem(result.draft));
    if (result.notes.length > 0) alert(`読み込みましたが、次の点は入れられませんでした。\n\n${result.notes.join("\n")}`);
    open(id);
  };

  return (
    <section className="panel ai-panel">
      <h2>AIに下書きを作らせる</h2>
      <p className="guide">
        ふだん使っているAIチャット（Claude など）に指示文を貼り、返事をここに貼り戻します。AIの下書きには誤りが入ることがあるので、読み込んだあと必ず内容を確かめてください。
      </p>
      <div className="block">
        <div className="block-title">1. 問題文を入れる</div>
        <TextField label="問題文（数式は $ で囲む）" rows={3} tools value={text} onChange={setText} />
        <TextField
          label="参考にする解答（なくてもよい）"
          rows={3}
          tools
          value={answer}
          onChange={setAnswer}
        />
      </div>
      <div className="block">
        <div className="block-title">2. 指示文をコピーして、AIチャットに貼る</div>
        <div className="toolbar">
          <button
            type="button"
            className="primary"
            disabled={text.trim() === ""}
            onClick={() => void copyPrompt()}
          >
            指示文をコピー
          </button>
          {copied && <span className="placed-mark">コピーしました。AIチャットに貼り付けてください。</span>}
        </div>
        <details>
          <summary>指示文を見る</summary>
          <textarea className="prompt-view" readOnly rows={10} value={prompt} />
        </details>
      </div>
      <div className="block">
        <div className="block-title">3. AIの返事を貼って、読み込む</div>
        <label className="field">
          <span className="field-label">AIの返事（そのまま全部）</span>
          <textarea rows={5} value={reply} onChange={(e) => setReply(e.target.value)} />
        </label>
        <button type="button" className="primary" disabled={reply.trim() === ""} onClick={load}>
          下書きとして読み込む
        </button>
      </div>
      {note && (
        <p className="message" role="status">
          {note}
        </p>
      )}
    </section>
  );
}
