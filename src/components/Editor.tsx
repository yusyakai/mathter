import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { patterns } from "../data/patterns";
import {
  addMark,
  editText,
  fromProblem,
  issues,
  label,
  nextId,
  removeMark,
  removeThought,
  toProblem,
  type Draft,
  type Section,
} from "../editor/draft";
import { saveCustom } from "../library";
import { sourcesOf } from "../thoughts";
import type { Problem } from "../types";
import { downloadProblem } from "./MyProblems";
import { ProblemText } from "./ProblemText";
import { Rich } from "./Rich";
import { TextField } from "./TextField";

const circled = (n: number) => (n <= 20 ? String.fromCharCode(0x245f + n) : `(${n})`);

function move<T>(list: T[], index: number, by: number): T[] {
  const to = index + by;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function Editor({ problem }: { problem: Problem }) {
  const [draft, setDraft] = useState<Draft>(() => fromProblem(problem));
  const [pickError, setPickError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const update = (fn: (d: Draft) => Draft) => setDraft(fn);
  useEffect(() => saveCustom(toProblem(draft)), [draft]);

  const built = useMemo(() => toProblem(draft), [draft]);
  const list = useMemo(() => issues(draft), [draft]);
  const blocking = list.filter((x) => x.blocking);
  const thoughts = [...draft.associations, ...draft.combinations];
  const units = [...new Set(patterns.map((p) => p.unit))];

  const markText = (id: string) => {
    const m = draft.marks.find((x) => x.id === id);
    return m ? draft.text.slice(m.start, m.end) : "";
  };

  const pick = () => {
    const el = textRef.current;
    if (!el) return;
    const result = addMark(draft, el.selectionStart, el.selectionEnd);
    if ("error" in result) return setPickError(result.error);
    setPickError(null);
    update(() => result.draft);
  };

  const notes = (section: Section) => {
    const mine = list.filter((x) => x.section === section);
    if (mine.length === 0) return null;
    return (
      <ul className="issues">
        {mine.map((x, i) => (
          <li key={i} className={x.blocking ? "" : "is-note"}>
            {x.message}
          </li>
        ))}
      </ul>
    );
  };

  /** 組み合わせ c のもとに選べる考え（自分と、自分から生まれた考えは選べない）。 */
  const sourceOptions = (comboId: string, current: string) =>
    thoughts.filter((t) => {
      if (t.id === comboId) return false;
      try {
        if (sourcesOf(built, t.id).includes(comboId)) return false;
      } catch {
        return false;
      }
      const usedElsewhere = draft.combinations.some(
        (c) => c.id !== comboId && c.from.includes(t.id),
      );
      return !usedElsewhere || t.id === current;
    });

  return (
    <main className="page editor">
      <div className="editor-bar">
        <span>
          {blocking.length === 0
            ? "この問題は試せます。"
            : `試せるようになるまで、あと ${blocking.length} か所です。`}
          <span className="saved">入力はこの端末に自動で保存されます</span>
        </span>
        <span className="editor-bar-actions">
          <a href="#/edit">一覧へ</a>
          {blocking.length === 0 ? (
            <a className="primary" href={`#/p/${draft.id}`}>
              試す
            </a>
          ) : (
            <span className="primary is-disabled">試す</span>
          )}
        </span>
      </div>

      <Step number={1} title="タイトルと単元">
        <TextField
          label="タイトル"
          value={draft.title}
          placeholder="例：文字を含む2次関数の最小値"
          onChange={(title) => update((d) => ({ ...d, title }))}
        />
        <label className="field">
          <span className="field-label">単元</span>
          <input
            type="text"
            list="units"
            value={draft.unit}
            placeholder="例：数学Ⅰ 2次関数"
            onChange={(e) => update((d) => ({ ...d, unit: e.target.value }))}
          />
          <datalist id="units">
            {units.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </label>
        {notes("basic")}
      </Step>

      <Step number={2} title="問題文と着眼点">
        <p className="guide">数式は $ で囲みます（例：$y=x^2-2ax+3$）。</p>
        <TextField
          label="問題文"
          rows={3}
          tools
          fieldRef={textRef}
          value={draft.text}
          onChange={(text) => {
            setPickError(null);
            update((d) => editText(d, text));
          }}
        />
        <p className="guide">
          着眼点にしたい部分を、上の問題文の中でドラッグして選び、ボタンを押します。数式は途中で切っても、数式全体が選ばれます。
        </p>
        <button type="button" className="hint-button" onClick={pick}>
          選んだ部分を着眼点にする
        </button>
        {pickError && (
          <p className="message" role="status">
            {pickError}
          </p>
        )}
        {draft.marks.length > 0 && (
          <>
            <div className="field-label">生徒に見える形（色と丸数字は「見る順番を表示」を押したとき）</div>
            <div className="editor-preview">
              <ProblemText
                problem={built}
                found={[]}
                showOrder
                active={null}
                highlighted={[]}
                onSelect={() => {}}
                onMiss={() => {}}
              />
            </div>
          </>
        )}
        {notes("text")}
      </Step>

      <Step number={3} title="着眼点ごとの連想">
        <p className="guide">
          上から順に「見る順番」になります。それぞれの着眼点に、連想を1〜3つ入れます。
        </p>
        {draft.marks.length === 0 && <p className="guide">まだ着眼点がありません。2 で作ってください。</p>}
        {draft.marks.map((m, i) => {
          const mine = draft.associations.filter((a) => a.fragmentId === m.id);
          return (
            <div key={m.id} className="block">
              <div className="block-head">
                <span className="block-title">
                  {circled(i + 1)} <Rich text={markText(m.id)} />
                </span>
                <RowButtons
                  onUp={i > 0 ? () => update((d) => ({ ...d, marks: move(d.marks, i, -1) })) : undefined}
                  onDown={
                    i < draft.marks.length - 1
                      ? () => update((d) => ({ ...d, marks: move(d.marks, i, 1) }))
                      : undefined
                  }
                  onDelete={() => {
                    if (mine.length === 0 || confirm("この着眼点と、その連想を消します。よろしいですか？")) {
                      update((d) => removeMark(d, m.id));
                    }
                  }}
                />
              </div>
              {mine.map((a) => {
                const set = (patch: Partial<typeof a>) =>
                  update((d) => ({
                    ...d,
                    associations: d.associations.map((x) => (x.id === a.id ? { ...x, ...patch } : x)),
                  }));
                return (
                  <div key={a.id} className="item">
                    <label className="field">
                      <span className="field-label">型（連想ノートに貯まる分類）</span>
                      <select
                        value={a.patternId ?? ""}
                        onChange={(e) => {
                          const p = patterns.find((x) => x.id === e.target.value);
                          set({
                            patternId: p?.id,
                            title: a.title.trim() === "" && p ? p.idea : a.title,
                            detail: a.detail.trim() === "" && p ? p.detail : a.detail,
                          });
                        }}
                      >
                        <option value="">型なし（この問題だけの連想）</option>
                        {units.map((u) => (
                          <optgroup key={u} label={u}>
                            {patterns
                              .filter((p) => p.unit === u)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {label(p.trigger, 16)} → {label(p.idea, 20)}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                    <TextField
                      label="連想の一言（カードに出る）"
                      value={a.title}
                      placeholder="例：平方完成して、頂点と軸を調べる"
                      onChange={(title) => set({ title })}
                    />
                    <TextField
                      label="考える内容（「くわしく」で開く）"
                      rows={2}
                      tools
                      value={a.detail}
                      placeholder="なぜそう考えるか、どう使うか"
                      onChange={(detail) => set({ detail })}
                    />
                    <RowButtons onDelete={() => update((d) => removeThought(d, a.id))} />
                  </div>
                );
              })}
              {mine.length < 3 && (
                <button
                  type="button"
                  className="add-button"
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      associations: [
                        ...d.associations,
                        {
                          id: nextId("a", d.associations.map((x) => x.id)),
                          fragmentId: m.id,
                          title: "",
                          detail: "",
                        },
                      ],
                    }))
                  }
                >
                  ＋ 連想を足す
                </button>
              )}
            </div>
          );
        })}
        {notes("marks")}
      </Step>

      <Step number={4} title="考えの組み合わせ">
        <p className="guide">
          2つの考えをくっつけると生まれる、新しい考えを作ります。なくても構いません。組み合わせから生まれた考えを、さらに別の考えとくっつけることもできます。
        </p>
        {draft.combinations.map((c) => {
          const set = (patch: Partial<typeof c>) =>
            update((d) => ({
              ...d,
              combinations: d.combinations.map((x) => (x.id === c.id ? { ...x, ...patch } : x)),
            }));
          return (
            <div key={c.id} className="block">
              <div className="pair">
                {[0, 1].map((n) => (
                  <label key={n} className="field">
                    <span className="field-label">{n === 0 ? "この考えと" : "この考えをくっつけると"}</span>
                    <select
                      value={c.from[n]}
                      onChange={(e) => {
                        const from: [string, string] = [...c.from];
                        from[n] = e.target.value;
                        set({ from });
                      }}
                    >
                      <option value="">選んでください</option>
                      {sourceOptions(c.id, c.from[n]).map((t) => (
                        <option key={t.id} value={t.id}>
                          {label(t.title, 28)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <TextField
                label="生まれる考えの一言"
                value={c.title}
                placeholder="例：軸は $x=a$。$a$ によって放物線が左右に動く"
                onChange={(title) => set({ title })}
              />
              <TextField
                label="考える内容"
                rows={2}
                tools
                value={c.detail}
                onChange={(detail) => set({ detail })}
              />
              <RowButtons onDelete={() => update((d) => removeThought(d, c.id))} />
            </div>
          );
        })}
        <button
          type="button"
          className="add-button"
          disabled={thoughts.length < 2}
          onClick={() =>
            update((d) => ({
              ...d,
              combinations: [
                ...d.combinations,
                { id: nextId("c", d.combinations.map((x) => x.id)), from: ["", ""], title: "", detail: "" },
              ],
            }))
          }
        >
          ＋ 組み合わせを足す
        </button>
        {notes("combos")}
      </Step>

      <Step number={5} title="解答の骨組み">
        <p className="guide">
          解答ボードに、上から順に置く考えを選びます。最初にすることが1段目です。くっつける前の考えを置いても合っている扱いにしたいときは、「これでもよい」に選びます。
        </p>
        {draft.skeleton.map((k, i) => {
          const setThoughts = (next: string[]) =>
            update((d) => ({
              ...d,
              skeleton: d.skeleton.map((x) => (x.id === k.id ? { ...x, thoughts: next } : x)),
            }));
          return (
            <div key={k.id} className="block">
              <div className="block-head">
                <span className="block-title">{i + 1}段目</span>
                <RowButtons
                  onUp={i > 0 ? () => update((d) => ({ ...d, skeleton: move(d.skeleton, i, -1) })) : undefined}
                  onDown={
                    i < draft.skeleton.length - 1
                      ? () => update((d) => ({ ...d, skeleton: move(d.skeleton, i, 1) }))
                      : undefined
                  }
                  onDelete={() =>
                    update((d) => ({ ...d, skeleton: d.skeleton.filter((x) => x.id !== k.id) }))
                  }
                />
              </div>
              <div className="pair">
                <label className="field">
                  <span className="field-label">ここに置く考え</span>
                  <select
                    value={k.thoughts[0] ?? ""}
                    onChange={(e) =>
                      setThoughts([e.target.value, ...k.thoughts.slice(1)].filter((x) => x !== ""))
                    }
                  >
                    <option value="">選んでください</option>
                    {thoughts.map((t) => (
                      <option key={t.id} value={t.id}>
                        {label(t.title, 28)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">これでもよい（なくてもよい）</span>
                  <select
                    value={k.thoughts[1] ?? ""}
                    disabled={k.thoughts.length === 0}
                    onChange={(e) =>
                      setThoughts([k.thoughts[0], e.target.value].filter((x) => x !== ""))
                    }
                  >
                    <option value="">なし</option>
                    {thoughts
                      .filter((t) => t.id !== k.thoughts[0])
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {label(t.title, 28)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="add-button"
          disabled={thoughts.length === 0}
          onClick={() =>
            update((d) => ({
              ...d,
              skeleton: [...d.skeleton, { id: nextId("k", d.skeleton.map((x) => x.id)), thoughts: [] }],
            }))
          }
        >
          ＋ 段を足す
        </button>
        {notes("skeleton")}
      </Step>

      <Step number={6} title="模範解答">
        <p className="guide">
          1行ずつ入れ、その行がどの着眼点・どの考えから生まれたかを選びます。生徒が行をタップしたとき、選んだものが光ります。
        </p>
        {draft.solution.map((s, i) => {
          const set = (patch: Partial<typeof s>) =>
            update((d) => ({
              ...d,
              solution: d.solution.map((x) => (x.id === s.id ? { ...x, ...patch } : x)),
            }));
          return (
            <div key={s.id} className="block">
              <div className="block-head">
                <span className="block-title">{i + 1}行目</span>
                <RowButtons
                  onUp={i > 0 ? () => update((d) => ({ ...d, solution: move(d.solution, i, -1) })) : undefined}
                  onDown={
                    i < draft.solution.length - 1
                      ? () => update((d) => ({ ...d, solution: move(d.solution, i, 1) }))
                      : undefined
                  }
                  onDelete={() =>
                    update((d) => ({ ...d, solution: d.solution.filter((x) => x.id !== s.id) }))
                  }
                />
              </div>
              <TextField label="解答の文" rows={2} tools value={s.text} onChange={(text) => set({ text })} />
              <div className="field-label">もとになった着眼点</div>
              <div className="chips">
                {draft.marks.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={s.fromFragments.includes(m.id)}
                    onClick={() => set({ fromFragments: toggle(s.fromFragments, m.id) })}
                  >
                    <Rich text={markText(m.id)} />
                  </button>
                ))}
              </div>
              <div className="field-label">もとになった考え</div>
              <div className="chips">
                {thoughts.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={s.fromThoughts.includes(t.id)}
                    onClick={() => set({ fromThoughts: toggle(s.fromThoughts, t.id) })}
                  >
                    <Rich text={t.title || "（未入力）"} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="add-button"
          onClick={() =>
            update((d) => ({
              ...d,
              solution: [
                ...d.solution,
                {
                  id: nextId("s", d.solution.map((x) => x.id)),
                  text: "",
                  fromFragments: [],
                  fromThoughts: [],
                },
              ],
            }))
          }
        >
          ＋ 行を足す
        </button>
        {notes("solution")}
      </Step>

      <Step number={7} title="確かめて試す">
        {blocking.length === 0 ? (
          <p className="guide">直すところはありません。学習画面で試せます。</p>
        ) : (
          <p className="guide">
            各欄の下に出ている赤い注意（あと {blocking.length} か所）を直すと、試せるようになります。
          </p>
        )}
        <div className="editor-bar-actions">
          {blocking.length === 0 ? (
            <a className="primary" href={`#/p/${draft.id}`}>
              この問題を試す
            </a>
          ) : (
            <span className="primary is-disabled">この問題を試す</span>
          )}
          <button type="button" className="hint-button" onClick={() => downloadProblem(built)}>
            ファイルに書き出す
          </button>
        </div>
      </Step>
    </main>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="panel step-panel">
      <h2>
        <span>
          <span className="slot-number step-number">{number}</span>
          {title}
        </span>
      </h2>
      {children}
    </section>
  );
}

function RowButtons({
  onUp,
  onDown,
  onDelete,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="row-buttons">
      {(onUp || onDown) && (
        <>
          <button type="button" disabled={!onUp} onClick={onUp} aria-label="上へ">
            ↑
          </button>
          <button type="button" disabled={!onDown} onClick={onDown} aria-label="下へ">
            ↓
          </button>
        </>
      )}
      <button type="button" onClick={onDelete}>
        消す
      </button>
    </span>
  );
}
