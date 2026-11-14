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
  checkSlot,
  findCombination,
  visibleCards,
} from "../thoughts";
import { loadState, saveState, type Saved } from "../storage";
import type { SlotResult } from "../thoughts";
import type { Problem, Thought } from "../types";
import { ProblemText } from "./ProblemText";
import { Rich } from "./Rich";

const BOARD = "board";
const SLOT = "slot:";

const slotMessages: Record<SlotResult, string> = {
  empty: "まだ空いています。",
  ok: "ここで使う考えです。",
  elsewhere: "この考えを使う場所は、ここではありません。",
  "needs-merge": "ほかの考えとくっつけてから置くと、解答で使える考えになります。",
  unused: "この考えは、解答の骨組みには直接は使いません。",
};

/** カードの上に落としたときはカードを、それ以外はボード全体を落とし先にする。 */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const card = hits.find((h) => h.id !== BOARD);
  return card ? [card] : hits;
};

interface Props {
  problem: Problem;
  /** 「もう分かる」の印が付いた型 */
  known: string[];
  /** 連想を思考ボードに集めたとき */
  onCollect: (patternId: string) => void;
  onToggleKnown: (patternId: string) => void;
}

export function Workspace({ problem, known, onCollect, onToggleKnown }: Props) {
  const thoughts = useMemo(() => allThoughts(problem), [problem]);
  const [saved, setSaved] = useState<Saved>(() => loadState(problem));
  const { board, found, placed } = saved;
  const [checked, setChecked] = useState(false);
  const [fragment, setFragment] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [stepId, setStepId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [problemMessage, setProblemMessage] = useState<string | null>(null);
  const [boardMessage, setBoardMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => saveState(problem.id, saved), [problem.id, saved]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const toggleOpen = (id: string) =>
    setOpened((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const selectFragment = (id: string) => {
    setProblemMessage(null);
    setStepId(null);
    setSaved((s) => (s.found.includes(id) ? s : { ...s, found: [...s.found, id] }));
    setFragment((f) => (f === id ? null : id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const id = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (over === null) return;
    setBoardMessage(null);
    setChecked(false);
    let nextBoard = board;
    if (!board.includes(id)) {
      nextBoard = [...board, id];
      const collected = thoughts.get(id);
      if (collected?.kind === "association" && collected.patternId) onCollect(collected.patternId);
    }
    const nextPlaced = [...placed];
    const from = placed.indexOf(id);

    if (over.startsWith(SLOT)) {
      // 解答ボードに置く。置いてあった考えは、入れ替えるか思考ボードへ戻る
      const to = Number(over.slice(SLOT.length));
      if (from >= 0) nextPlaced[from] = placed[to];
      nextPlaced[to] = id;
    } else {
      if (from >= 0) nextPlaced[from] = null;
      if (over !== BOARD && over !== id) {
        const combo = findCombination(problem, id, over);
        if (combo) {
          nextBoard = [...nextBoard, combo.id];
          setOpened((o) => [...o, combo.id]);
          setBoardMessage("2つの考えがくっついて、新しい考えになりました。");
        } else {
          setBoardMessage("この2つからは、新しい考えは生まれませんでした。");
        }
      }
    }
    setSaved((s) => ({ ...s, board: nextBoard, placed: nextPlaced }));
  };

  const unplace = (index: number) => {
    setChecked(false);
    setSaved((s) => ({ ...s, placed: s.placed.map((p, i) => (i === index ? null : p)) }));
  };

  const patternOf = (id: string) => {
    const t = thoughts.get(id);
    return t?.kind === "association" ? t.patternId : undefined;
  };
  const isKnown = (id: string) => {
    const pattern = patternOf(id);
    return pattern !== undefined && known.includes(pattern);
  };
  const toggleKnownOf = (id: string) => {
    const pattern = patternOf(id);
    return pattern ? () => onToggleKnown(pattern) : undefined;
  };

  const step = showSolution ? problem.solution.find((s) => s.id === stepId) : undefined;
  const candidates = problem.associations.filter((a) => a.fragmentId === fragment);
  const cards = visibleCards(problem, board).filter((id) => !placed.includes(id));
  const results = placed.map((id, i) => checkSlot(problem, i, id));
  const complete = results.every((r) => r === "ok");
  const stepCards = step
    ? step.fromThoughts.flatMap((t) => cardContaining(problem, board, t) ?? [])
    : [];
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
            showOrder={showOrder}
            active={fragment}
            highlighted={step?.fromFragments ?? []}
            onSelect={selectFragment}
            onMiss={() =>
              setProblemMessage("そこからは、特に連想するものはありません。ほかの部分を見てみましょう。")
            }
          />
          <p className="guide">
            {showOrder
              ? "丸数字は、見る順番の目安です。"
              : fragment
                ? "出てきた連想は、思考ボードへドラッグできます。"
                : "どこに目をつけますか？ 問題文の気になる部分をタップすると、そこからの連想が出ます。"}
          </p>
          {problemMessage && (
            <p className="message" role="status">
              {problemMessage}
            </p>
          )}
          <button
            type="button"
            className="hint-button"
            aria-pressed={showOrder}
            onClick={() => setShowOrder((v) => !v)}
          >
            {showOrder ? "見る順番をかくす" : "見る順番を表示"}
          </button>

          {candidates.length > 0 && (
            <ul className="cards">
              {candidates.map((a) => (
                <li key={a.id}>
                  <Card
                    thought={thoughts.get(a.id)!}
                    known={isKnown(a.id)}
                    onToggleKnown={toggleKnownOf(a.id)}
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
              ? board.length === 0
                ? "使えそうだと思った連想を、ここへドラッグして集めます。"
                : "カードはすべて解答ボードに置いてあります。"
              : "カードを別のカードに重ねると、くっつけられます。解答で使う考えは、解答ボードへ運びます。スマホでは長押ししてから動かします。"}
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
                    known={isKnown(id)}
                    onToggleKnown={toggleKnownOf(id)}
                    onBoard
                    highlighted={stepCards.includes(id)}
                    open={opened.includes(id)}
                    onToggle={() => toggleOpen(id)}
                    sources={
                      t.kind === "combination"
                        ? t.from.map((f) => thoughts.get(f)?.title ?? f)
                        : undefined
                    }
                    removeLabel={t.kind === "combination" ? "ばらす" : "外す"}
                    onRemove={() => {
                      setSaved((s) => ({ ...s, board: s.board.filter((x) => x !== id) }));
                      setBoardMessage(null);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </Board>

        <section className="panel" aria-labelledby="h-answer">
          <h2 id="h-answer">解答ボード</h2>
          <p className="guide">
            解答で使う考えを、使う順に上から並べて、解答の骨組みを作ります。最初にすることを1番上に置きます。
          </p>
          <ol className="slots">
            {placed.map((id, i) => {
              const t = id ? thoughts.get(id) : undefined;
              return (
                <li key={i}>
                  <Slot index={i} result={checked ? results[i] : null}>
                    {t && (
                      <Card
                        thought={t}
                        known={isKnown(t.id)}
                        onToggleKnown={toggleKnownOf(t.id)}
                        highlighted={stepCards.includes(t.id)}
                        open={opened.includes(t.id)}
                        onToggle={() => toggleOpen(t.id)}
                        removeLabel="戻す"
                        onRemove={() => unplace(i)}
                      />
                    )}
                  </Slot>
                </li>
              );
            })}
          </ol>
          {checked && complete && (
            <p className="message" role="status">
              骨組みができました。この順に、ノートで解いてみましょう。
            </p>
          )}
          <button
            type="button"
            className="hint-button"
            disabled={placed.every((p) => p === null)}
            onClick={() => setChecked((v) => !v)}
          >
            {checked ? "確かめた結果をかくす" : "配置を確かめる"}
          </button>

          <h3 className="sub-heading" id="h-solution">
            模範解答
          </h3>
          {!showSolution ? (
            <>
              <p className="guide">
                骨組みができたら、模範解答と見くらべます。解答の1行1行が、問題文のどこから、どの考えを通って生まれたかが分かります。
              </p>
              <button type="button" className="hint-button" onClick={() => setShowSolution(true)}>
                模範解答を見る
              </button>
            </>
          ) : (
            <>
              <p className="guide">
                行をタップすると、もとになった問題文の部分と、ボードの考えが光ります。
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

function Slot({
  index,
  result,
  children,
}: {
  index: number;
  result: SlotResult | null;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${SLOT}${index}` });
  return (
    <div
      ref={setNodeRef}
      className={[
        "slot",
        isOver ? "is-over" : "",
        result === "ok" ? "is-ok" : "",
        result && result !== "ok" && result !== "empty" ? "is-off" : "",
      ].join(" ")}
    >
      <span className="slot-number">{index + 1}</span>
      <div className="slot-body">
        {children || <span className="slot-empty">ここに考えを置く</span>}
        {result && (
          <p className="slot-result" role="status">
            {result === "ok" ? "○ " : ""}
            {slotMessages[result]}
          </p>
        )}
      </div>
    </div>
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
  removeLabel?: string;
  /** この連想の型に「もう分かる」の印が付いているか */
  known?: boolean;
  onToggleKnown?: () => void;
}

function Card({
  thought,
  open,
  onToggle,
  onBoard,
  placed,
  highlighted,
  sources,
  onRemove,
  removeLabel,
  known,
  onToggleKnown,
}: CardProps) {
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
        known ? "is-known" : "",
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
          {onToggleKnown && (
            <button type="button" className="known-button" aria-pressed={known} onClick={onToggleKnown}>
              {known ? "✓ もう分かる（印を外す）" : "もう分かる"}
            </button>
          )}
        </div>
      )}
      <div className="card-actions">
        {known && <span className="placed-mark">✓ 分かる</span>}
        {placed && <span className="placed-mark">ボードにあります</span>}
        <button type="button" onClick={onToggle}>
          {open ? "とじる" : "くわしく"}
        </button>
        {onRemove && (
          <button type="button" onClick={onRemove}>
            {removeLabel ?? "外す"}
          </button>
        )}
      </div>
    </div>
  );
}
