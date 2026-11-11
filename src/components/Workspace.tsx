import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  allThoughts,
  cardContaining,
  findCombination,
  nextFragment,
  sanitizeBoard,
  visibleCards,
} from "../thoughts";
import type { Problem, Thought } from "../types";
import { ProblemText } from "./ProblemText";
import { Rich } from "./Rich";

const BOARD = "board";

interface Saved {
  board: string[];
  found: string[];
}

function load(problem: Problem): Saved {
  try {
    const raw = localStorage.getItem(`mathter:state:v2:${problem.id}`);
    const saved = raw ? (JSON.parse(raw) as Partial<Saved>) : {};
    const ids = problem.fragments.map((f) => f.id);
    return {
      board: sanitizeBoard(problem, Array.isArray(saved.board) ? saved.board : []),
      found: (Array.isArray(saved.found) ? saved.found : []).filter((f) => ids.includes(f)),
    };
  } catch {
    return { board: [], found: [] };
  }
}

/** カードの上に落としたときはカードを、それ以外はボード全体を落とし先にする。 */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const card = hits.find((h) => h.id !== BOARD);
  return card ? [card] : hits;
};

export function Workspace({ problem }: { problem: Problem }) {
  const thoughts = useMemo(() => allThoughts(problem), [problem]);
  const [saved, setSaved] = useState<Saved>(() => load(problem));
  const { board, found } = saved;
  const [fragment, setFragment] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [stepId, setStepId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [problemMessage, setProblemMessage] = useState<string | null>(null);
  const [boardMessage, setBoardMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`mathter:state:v2:${problem.id}`, JSON.stringify(saved));
    } catch {
      // 保存できなくても学習は続けられる
    }
  }, [problem.id, saved]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const setBoard = (next: string[]) => setSaved((s) => ({ ...s, board: next }));
  const toggleOpen = (id: string) =>
    setOpened((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const selectFragment = (id: string) => {
    setProblemMessage(null);
    setStepId(null);
    setSaved((s) => (s.found.includes(id) ? s : { ...s, found: [...s.found, id] }));
    setFragment((f) => (f === id ? null : id));
  };

  const showNext = () => {
    const id = nextFragment(problem, found);
    if (!id) return;
    setProblemMessage(null);
    setStepId(null);
    setSaved((s) => ({ ...s, found: [...s.found, id] }));
    setFragment(id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const id = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (over === null) return;
    setBoardMessage(null);
    let next = board.includes(id) ? board : [...board, id];
    if (over !== BOARD && over !== id) {
      const combo = findCombination(problem, id, over);
      if (combo) {
        next = [...next, combo.id];
        setOpened((o) => [...o, combo.id]);
        setBoardMessage("2つの考えがくっついて、新しい考えになりました。");
      } else {
        setBoardMessage("この2つからは、新しい考えは生まれませんでした。");
      }
    }
    setBoard(next);
  };

  const step = showSolution ? problem.solution.find((s) => s.id === stepId) : undefined;
  const candidates = problem.associations.filter((a) => a.fragmentId === fragment);
  const cards = visibleCards(problem, board);
  const stepCards = step
    ? step.fromThoughts.flatMap((t) => cardContaining(problem, board, t) ?? [])
    : [];
  const remaining = nextFragment(problem, found) !== undefined;
  const draggingThought = dragging ? thoughts.get(dragging) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={(e) => setDragging(String(e.active.id))}
      onDragCancel={() => setDragging(null)}
      onDragEnd={onDragEnd}
    >
      <main className="workspace">
        <section className="panel" aria-labelledby="h-problem">
          <h2 id="h-problem">問題</h2>
          <ProblemText
            problem={problem}
            found={found}
            active={fragment}
            highlighted={step?.fromFragments ?? []}
            onSelect={selectFragment}
            onMiss={() =>
              setProblemMessage("そこからは、特に連想するものはありません。ほかの部分を見てみましょう。")
            }
          />
          <p className="guide">
            {found.length === 0
              ? "まず、どこに目をつけますか？ 問題文の気になる部分をタップしてください。"
              : "丸数字は、見る順番の目安です。出てきた連想は、思考ボードへドラッグできます。"}
          </p>
          {problemMessage && (
            <p className="message" role="status">
              {problemMessage}
            </p>
          )}
          {remaining && (
            <button type="button" className="hint-button" onClick={showNext}>
              {found.length === 0 ? "どこから見ればいい？" : "次はどこを見ればいい？"}
            </button>
          )}

          {candidates.length > 0 && (
            <ul className="cards">
              {candidates.map((a) => (
                <li key={a.id}>
                  <Card
                    thought={thoughts.get(a.id)!}
                    placed={board.includes(a.id)}
                    open={opened.includes(a.id)}
                    onToggle={() => toggleOpen(a.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Board empty={cards.length === 0} active={dragging !== null}>
          <h2 id="h-board">思考ボード</h2>
          <p className="guide">
            {cards.length === 0
              ? "使えそうだと思った連想を、ここへドラッグして集めます。"
              : "カードを別のカードに重ねると、くっつけられます。スマホでは長押ししてから動かします。"}
          </p>
          {boardMessage && (
            <p className="message" role="status">
              {boardMessage}
            </p>
          )}
          <ul className="cards">
            {cards.map((id) => {
              const t = thoughts.get(id)!;
              return (
                <li key={id}>
                  <Card
                    thought={t}
                    onBoard
                    highlighted={stepCards.includes(id)}
                    open={opened.includes(id)}
                    onToggle={() => toggleOpen(id)}
                    sources={
                      t.kind === "combination"
                        ? t.from.map((f) => thoughts.get(f)?.title ?? f)
                        : undefined
                    }
                    onRemove={() => {
                      setBoard(board.filter((x) => x !== id));
                      setBoardMessage(null);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </Board>

        <section className="panel" aria-labelledby="h-solution">
          <h2 id="h-solution">解答</h2>
          {!showSolution ? (
            <>
              <p className="guide">
                方針が立ったら、模範解答と見くらべます。解答の1行1行が、問題文のどこから、どの考えを通って生まれたかが分かります。
              </p>
              <button type="button" className="hint-button" onClick={() => setShowSolution(true)}>
                模範解答を見る
              </button>
            </>
          ) : (
            <>
              <p className="guide">
                行をタップすると、もとになった問題文の部分と、思考ボードの考えが光ります。
              </p>
              <ol className="solution">
                {problem.solution.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={[
                        "step",
                        s.id === stepId ? "is-active" : "",
                        fragment && s.fromFragments.includes(fragment) ? "is-highlighted" : "",
                      ].join(" ")}
                      aria-pressed={s.id === stepId}
                      onClick={() => {
                        setStepId(s.id === stepId ? null : s.id);
                        setFragment(null);
                      }}
                    >
                      <Rich text={s.text} />
                    </button>
                    {s.id === stepId && (
                      <div className="step-why">
                        <div className="step-why-label">この行のもとになった考え</div>
                        <ul>
                          {s.fromThoughts.map((t) => (
                            <li key={t} className={board.includes(t) ? "is-placed" : ""}>
                              <Rich text={thoughts.get(t)?.title ?? t} />
                              {board.includes(t) && <span className="placed-mark">ボードにあり</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="hint-button"
                onClick={() => {
                  setShowSolution(false);
                  setStepId(null);
                }}
              >
                模範解答をかくす
              </button>
            </>
          )}
        </section>
      </main>

      <DragOverlay>
        {draggingThought && (
          <div
            className={[
              "card",
              "is-overlay",
              draggingThought.kind === "combination" ? "is-combination" : "",
            ].join(" ")}
          >
            <span className="card-title">
              <Rich text={draggingThought.title} />
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Board({
  empty,
  active,
  children,
}: {
  empty: boolean;
  active: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: BOARD });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby="h-board"
      className={[
        "panel",
        "board",
        empty ? "is-empty" : "",
        active ? "is-ready" : "",
        isOver ? "is-over" : "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

interface CardProps {
  thought: Thought;
  open: boolean;
  onToggle: () => void;
  /** 思考ボードの上のカードか */
  onBoard?: boolean;
  /** 問題側のカードで、すでにボードに置いてあるか */
  placed?: boolean;
  highlighted?: boolean;
  sources?: string[];
  onRemove?: () => void;
}

function Card({ thought, open, onToggle, onBoard, placed, highlighted, sources, onRemove }: CardProps) {
  const drag = useDraggable({ id: thought.id, disabled: placed });
  const drop = useDroppable({ id: thought.id, disabled: !onBoard });
  const isTarget = drop.isOver && drop.active?.id !== thought.id;

  return (
    <div
      ref={(node) => {
        drag.setNodeRef(node);
        drop.setNodeRef(node);
      }}
      className={[
        "card",
        placed ? "is-placed" : "is-draggable",
        thought.kind === "combination" ? "is-combination" : "",
        drag.isDragging ? "is-dragging" : "",
        isTarget ? "is-target" : "",
        highlighted ? "is-highlighted" : "",
      ].join(" ")}
      {...drag.attributes}
      {...drag.listeners}
    >
      {sources && (
        <span className="sources">
          {sources.map((s, i) => (
            <span key={i}>
              {i > 0 && " ＋ "}
              <span className="chip">
                <Rich text={s} />
              </span>
            </span>
          ))}
          <span className="arrow">↓</span>
        </span>
      )}
      <span className="card-title">
        <Rich text={thought.title} />
      </span>
      {open && (
        <div className="card-detail">
          <Rich text={thought.detail} />
        </div>
      )}
      <div className="card-actions">
        {placed && <span className="placed-mark">ボードにあります</span>}
        <button type="button" onClick={onToggle}>
          {open ? "とじる" : "くわしく"}
        </button>
        {onRemove && (
          <button type="button" onClick={onRemove}>
            {thought.kind === "combination" ? "ばらす" : "外す"}
          </button>
        )}
      </div>
    </div>
  );
}
