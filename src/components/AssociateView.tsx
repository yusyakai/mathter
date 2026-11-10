import { useMemo, useState } from "react";
import { allThoughts, findCombination, partnersOf } from "../thoughts";
import type { Problem } from "../types";
import { ProblemText } from "./ProblemText";
import { Rich } from "./Rich";

interface Props {
  problem: Problem;
  board: string[];
  setBoard: (next: string[]) => void;
}

export function AssociateView({ problem, board, setBoard }: Props) {
  const thoughts = useMemo(() => allThoughts(problem), [problem]);
  const [fragment, setFragment] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const candidates = problem.associations.filter((a) => a.fragmentId === fragment);
  const partners = selected ? partnersOf(problem, selected, board) : [];

  const toggleOpen = (id: string) =>
    setOpened((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const tapCard = (id: string) => {
    setMessage(null);
    if (selected === null) return setSelected(id);
    if (selected === id) return setSelected(null);
    const combo = findCombination(problem, selected, id);
    if (!combo) {
      setMessage("この2つからは、新しい考えは生まれませんでした。");
    } else if (board.includes(combo.id)) {
      setMessage("この2つをくっつけた考えは、もうボードにあります。");
    } else {
      setBoard([...board, combo.id]);
      setOpened((o) => [...o, combo.id]);
      setMessage("新しい考えが生まれました！");
    }
    setSelected(null);
  };

  /** カードを外す。それを元にして生まれた考えも一緒に外す。 */
  const remove = (id: string) => {
    const gone = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of problem.combinations) {
        if (!gone.has(c.id) && board.includes(c.id) && c.from.some((f) => gone.has(f))) {
          gone.add(c.id);
          grew = true;
        }
      }
    }
    setBoard(board.filter((x) => !gone.has(x)));
    setSelected(null);
    setMessage(null);
  };

  const total = problem.combinations.length;
  const found = problem.combinations.filter((c) => board.includes(c.id)).length;

  return (
    <main className="view">
      <section className="panel">
        <h2>問題</h2>
        <ProblemText
          problem={problem}
          active={fragment}
          onSelect={(f) => setFragment(f === fragment ? null : f)}
        />
        <p className="guide">
          {fragment
            ? "ここから何を連想しますか？ 自分で考えてから、気になるものだけ開いてください。"
            : "気になる部分をタップしてください。どこから見ても構いません。"}
        </p>

        {candidates.length > 0 && (
          <ul className="cards">
            {candidates.map((a) => {
              const onBoard = board.includes(a.id);
              return (
                <li key={a.id} className="card">
                  <div className="card-title">
                    <Rich text={a.title} />
                  </div>
                  {opened.includes(a.id) && (
                    <div className="card-detail">
                      <Rich text={a.detail} />
                    </div>
                  )}
                  <div className="card-actions">
                    <button type="button" onClick={() => toggleOpen(a.id)}>
                      {opened.includes(a.id) ? "とじる" : "くわしく"}
                    </button>
                    <button
                      type="button"
                      className="primary"
                      disabled={onBoard}
                      onClick={() => setBoard([...board, a.id])}
                    >
                      {onBoard ? "ボードにあります" : "ボードに置く"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>
          思考ボード
          <span className="count">
            くっつけて生まれた考え {found} / {total}
          </span>
        </h2>
        {board.length === 0 ? (
          <p className="guide">使えそうだと思った連想を、ここに置いていきます。</p>
        ) : (
          <p className="guide">
            {selected
              ? partners.length > 0
                ? "光っているカードとくっつけると、新しい考えが生まれます。"
                : "いまボードにあるカードの中には、くっつく相手がいません。別の連想を置いてみましょう。"
              : "カードを2枚続けてタップすると、くっつけられます。"}
          </p>
        )}
        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}
        <ul className="cards">
          {board.map((id) => {
            const t = thoughts.get(id);
            if (!t) return null;
            return (
              <li
                key={id}
                className={[
                  "card",
                  "board-card",
                  t.kind === "combination" ? "is-combination" : "",
                  selected === id ? "is-selected" : "",
                  partners.includes(id) ? "is-partner" : "",
                ].join(" ")}
              >
                <button type="button" className="card-main" onClick={() => tapCard(id)}>
                  {t.kind === "combination" && (
                    <span className="sources">
                      {t.from.map((f, i) => (
                        <span key={f}>
                          {i > 0 && " ＋ "}
                          <span className="chip">
                            <Rich text={thoughts.get(f)?.title ?? f} />
                          </span>
                        </span>
                      ))}
                      <span className="arrow">↓</span>
                    </span>
                  )}
                  <span className="card-title">
                    <Rich text={t.title} />
                  </span>
                </button>
                {opened.includes(id) && (
                  <div className="card-detail">
                    <Rich text={t.detail} />
                  </div>
                )}
                <div className="card-actions">
                  <button type="button" onClick={() => toggleOpen(id)}>
                    {opened.includes(id) ? "とじる" : "くわしく"}
                  </button>
                  <button type="button" onClick={() => remove(id)}>
                    外す
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
