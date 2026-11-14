import { useRef, useState } from "react";
import { emptyDraft, fromProblem, issues, toProblem } from "../editor/draft";
import {
  builtinProblems,
  deleteCustom,
  newCustomId,
  normalizeProblem,
  saveCustom,
  useCustomProblems,
} from "../library";
import type { Problem } from "../types";

/** 問題を1つ、ファイル（JSON）として保存する。 */
export function downloadProblem(problem: Problem): void {
  const blob = new Blob([JSON.stringify(problem, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${problem.title.trim() || "mathter-problem"}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const open = (id: string) => {
  window.location.hash = `#/edit/${id}`;
};

/** 自作の問題の一覧。ここから新しく作る・直す・試す・書き出す。 */
export function MyProblems() {
  const custom = useCustomProblems();
  const [message, setMessage] = useState<string | null>(null);
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
      const problem = normalizeProblem(JSON.parse(await f.text()));
      if (!problem) return setMessage("このファイルは、mathter の問題ファイルではないようです。");
      const id = newCustomId();
      saveCustom({ ...problem, id });
      setMessage(`「${problem.title || "無題"}」を読み込みました。`);
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

      <h2 className="page-heading">自作の問題</h2>
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
    </main>
  );
}
