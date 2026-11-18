import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  findSnippet,
  moveRow,
  newSnippetId,
  placeSnippet,
  removeSnippet,
  type Snippet,
  type Target,
} from "../answer";
import { useSettings } from "../settings";
import { loadState, saveState, type Saved } from "../storage";
import { useStudyTimer } from "../studyTime";
import { allThoughts, cardContaining, findCombination, sourcesOf, visibleCards } from "../thoughts";
import type { Problem } from "../types";
import { AnswerBoard } from "./AnswerBoard";
import { Card } from "./Card";
import { isAnswerZone, ZONE_ORDER, type DragData, type DropZone } from "./dnd";
import { ProblemText } from "./ProblemText";
import { Rich } from "./Rich";

/** 画面がせまいときに、運んでいる間だけ画面の下に出す置き場所の id の先頭 */
const QUICK = "drop:quick:";

/**
 * 重なっている置き場所のうち、いちばん内側のものを選ぶ
 * （解答ボードのことば → 段 → 思考ボードのカード → ボード全体）。
 * 画面の下に出す置き場所は、ほかのものの上に重なっているので最優先にする。
 */
const collision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  // キーボードで運ぶときは指す位置がないので、重なりで決める
  const hits = pointer.length > 0 ? pointer : rectIntersection(args);
  const rank = (hit: (typeof hits)[number]) => {
    if (String(hit.id).startsWith(QUICK)) return -1;
    const zone = hit.data?.droppableContainer?.data?.current as DropZone | undefined;
    return zone ? ZONE_ORDER.indexOf(zone.zone) : ZONE_ORDER.length;
  };
  return [...hits].sort((a, b) => rank(a) - rank(b)).slice(0, 1);
};

interface Props {
  problem: Problem;
  /** 「もう分かる」の印が付いた型 */
  known: string[];
  /** 連想を思考ボードに集めたとき */
  onCollect: (patternId: string) => void;
  onToggleKnown: (patternId: string) => void;
}

/**
 * 学習画面。「問題 → 思考ボード → 解答ボード」を並べる。
 * 問題文から拾った連想を思考ボードに集めて組み合わせ、
 * 問題文や思考ボードのことばを解答ボードへ運んで、解答の骨組みを作る。
 */
export function Workspace({ problem, known, onCollect, onToggleKnown }: Props) {
  const thoughts = useMemo(() => allThoughts(problem), [problem]);
  const [saved, setSaved] = useState<Saved>(() => loadState(problem));
  const { board, found, rows } = saved;
  const [checked, setChecked] = useState(false);
  const [fragment, setFragment] = useState<string | null>(null);
  /** 説明を開いているカード。問題の下の連想と思考ボードのカードは、別々に開け閉めする */
  const [opened, setOpened] = useState<string[]>([]);
  const [stepId, setStepId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [problemMessage, setProblemMessage] = useState<string | null>(null);
  const [boardMessage, setBoardMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragData | null>(null);
  const [overAnswer, setOverAnswer] = useState(false);
  /** 画面の下の置き場所の上にいる間は、画面を自動で送らない（落としにくくなるため） */
  const overQuick = useRef(false);
  const settings = useSettings();
  useStudyTimer();

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

  /** まだ思考ボードにない連想なら、集める（型も「集めた」と記録する）。 */
  const withCollected = (current: string[], id: string): string[] => {
    const t = thoughts.get(id);
    if (!t || t.kind !== "association" || current.includes(id)) return current;
    if (t.patternId) onCollect(t.patternId);
    return [...current, id];
  };

  const endDrag = () => {
    setDragging(null);
    setOverAnswer(false);
    overQuick.current = false;
  };

  const onDragEnd = (e: DragEndEvent) => {
    endDrag();
    const data = e.active.data.current as DragData | undefined;
    const zone = e.over?.data.current as DropZone | undefined;
    if (!data || !zone) return;
    const toAnswer = isAnswerZone(zone);
    const target: Target =
      zone.zone === "row" ? { row: zone.index } : zone.zone === "chip" ? { before: zone.snippetId } : "new";

    if (data.kind === "snippet") {
      // 解答ボードの中で、ことばを移す
      const snippet = findSnippet(rows, data.snippetId);
      if (!toAnswer || !snippet) return;
      setChecked(false);
      setSaved((s) => ({ ...s, rows: placeSnippet(s.rows, snippet, target) }));
      return;
    }

    if (data.kind === "text") {
      // 問題文や説明の中のことば。解答ボードにだけ置ける
      if (!toAnswer) return;
      const snippet: Snippet = {
        id: newSnippetId(),
        text: data.text,
        ...(data.thoughtId ? { thoughtId: data.thoughtId } : {}),
        ...(data.fragmentId ? { fragmentId: data.fragmentId } : {}),
      };
      const nextBoard = data.thoughtId ? withCollected(board, data.thoughtId) : board;
      setChecked(false);
      setSaved((s) => ({ ...s, board: nextBoard, rows: placeSnippet(s.rows, snippet, target) }));
      return;
    }

    // 考えのカード
    const id = data.thoughtId;
    const thought = thoughts.get(id);
    if (!thought) return;
    let nextBoard = withCollected(board, id);
    setBoardMessage(null);
    if (toAnswer) {
      // 解答ボードには、カードのことば（題）の写しを置く。カードは思考ボードに残る
      const snippet: Snippet = { id: newSnippetId(), text: thought.title, thoughtId: id };
      setChecked(false);
      setSaved((s) => ({ ...s, board: nextBoard, rows: placeSnippet(s.rows, snippet, target) }));
      return;
    }
    if (zone.zone === "card" && zone.thoughtId !== id) {
      const combo = findCombination(problem, id, zone.thoughtId);
      if (combo && !nextBoard.includes(combo.id)) {
        nextBoard = [...nextBoard, combo.id];
        setOpened((o) => [...o, `board:${combo.id}`]);
        setBoardMessage("2つの考えがくっついて、新しい考えになりました。");
      } else {
        setBoardMessage("この2つからは、新しい考えは生まれませんでした。");
      }
    }
    setSaved((s) => ({ ...s, board: nextBoard }));
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
  const cards = visibleCards(problem, board);
  const used = new Set(rows.flat().flatMap((s) => s.thoughtId ?? []));
  const judge = settings.judge && problem.skeleton.length > 0;

  // 模範解答の行を選んだとき、その行のもとになったカードと、解答ボードのことばを光らせる
  const stepCards = step
    ? step.fromThoughts.flatMap((t) => cardContaining(problem, board, t) ?? [])
    : [];
  const stepSnippets = step
    ? rows
        .flat()
        .filter(
          (s) =>
            (s.fragmentId !== undefined && step.fromFragments.includes(s.fragmentId)) ||
            (s.thoughtId !== undefined &&
              [s.thoughtId, ...sourcesOf(problem, s.thoughtId)].some((t) =>
                step.fromThoughts.includes(t),
              )),
        )
        .map((s) => s.id)
    : [];

  // 設定で選んだときだけ、運んでいるカードとくっつけられる相手を光らせる
  const carried = dragging?.kind === "card" ? dragging.thoughtId : null;
  const partners =
    settings.partnerHint && carried
      ? cards.filter((id) => {
          const combo = id !== carried ? findCombination(problem, carried, id) : undefined;
          return combo !== undefined && !board.includes(combo.id);
        })
      : [];

  const overlay = () => {
    if (!dragging) return null;
    if (dragging.kind === "card") {
      const t = thoughts.get(dragging.thoughtId);
      if (!t) return null;
      // 解答ボードの上では、置かれる形（ことば）で見せる
      if (overAnswer) return <Chip text={t.title} />;
      return (
        <div
          className={["card", "thought", "is-overlay", t.kind === "combination" ? "is-combination" : ""].join(
            " ",
          )}
        >
          <span className="card-head">
            <span className="card-title">
              <Rich text={t.title} />
            </span>
          </span>
        </div>
      );
    }
    const text = dragging.kind === "text" ? dragging.text : findSnippet(rows, dragging.snippetId)?.text;
    return text ? <Chip text={text} /> : null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={(e) => setDragging((e.active.data.current as DragData | undefined) ?? null)}
      autoScroll={{ canScroll: () => !overQuick.current }}
      onDragOver={(e) => {
        setOverAnswer(isAnswerZone(e.over?.data.current as DropZone | undefined));
        overQuick.current = String(e.over?.id ?? "").startsWith(QUICK);
      }}
      onDragCancel={endDrag}
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
            drag
          />
          <p className="guide">
            {showOrder
              ? "丸数字は、見る順番の目安です。"
              : fragment
                ? "出てきた連想は、思考ボードへ運べます。"
                : "どこに目をつけますか？ 気になる部分をタップすると、そこからの連想が出ます。問題文のことばは、解答ボードへ運べます。"}
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
            <ul className="thoughts">
              {candidates.map((a) => (
                <li key={a.id} className={opened.includes(`cand:${a.id}`) ? "is-open" : ""}>
                  <Card
                    thought={thoughts.get(a.id)!}
                    where="cand"
                    known={isKnown(a.id)}
                    onToggleKnown={toggleKnownOf(a.id)}
                    placed={board.includes(a.id)}
                    open={opened.includes(`cand:${a.id}`)}
                    onToggle={() => toggleOpen(`cand:${a.id}`)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Board empty={cards.length === 0} active={dragging?.kind === "card"}>
          <h2 id="h-board">思考ボード</h2>
          <p className="guide">
            {cards.length === 0
              ? "使えそうだと思った連想を、ここへ運んで集めます。"
              : "カードをタップすると、説明が開きます。別のカードに重ねると、くっつけられます。スマホでは長押ししてから動かします。"}
          </p>
          {boardMessage && (
            <p className="message" role="status">
              {boardMessage}
            </p>
          )}
          <ul className="thoughts">
            {cards.map((id) => {
              const t = thoughts.get(id)!;
              return (
                <li key={id} className={opened.includes(`board:${id}`) ? "is-open" : ""}>
                  <Card
                    thought={t}
                    where="board"
                    known={isKnown(id)}
                    onToggleKnown={toggleKnownOf(id)}
                    partner={partners.includes(id)}
                    used={used.has(id)}
                    highlighted={stepCards.includes(id)}
                    open={opened.includes(`board:${id}`)}
                    onToggle={() => toggleOpen(`board:${id}`)}
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
            問題文のことばや、思考ボードのカードを運んで、解答で使う順に上から並べます。
          </p>
          <AnswerBoard
            problem={problem}
            rows={rows}
            highlighted={stepSnippets}
            active={dragging !== null}
            judge={judge}
            checked={checked}
            onToggleChecked={() => setChecked((v) => !v)}
            onRemove={(id) => {
              setChecked(false);
              setSaved((s) => ({ ...s, rows: removeSnippet(s.rows, id) }));
            }}
            onMoveRow={(index, by) => {
              setChecked(false);
              setSaved((s) => ({ ...s, rows: moveRow(s.rows, index, by) }));
            }}
          />

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
                行をタップすると、もとになった問題文の部分と、ボードの考えやことばが光ります。
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

      {dragging && dragging.kind !== "snippet" && (
        <div className="quick-drop">
          {dragging.kind === "card" && !board.includes(dragging.thoughtId) && (
            <QuickZone id={`${QUICK}board`} zone={{ zone: "board" }} label="思考ボードへ" />
          )}
          <QuickZone id={`${QUICK}answer`} zone={{ zone: "answer" }} label="解答ボードへ" />
        </div>
      )}

      <DragOverlay>{overlay()}</DragOverlay>
    </DndContext>
  );
}

/**
 * 画面がせまくて3つが縦に並ぶとき、運んでいる間だけ画面の下に出す置き場所。
 * 下のほうにあるボードまで引っぱらなくても置ける（広い画面では出さない）。
 */
function QuickZone({ id, zone, label }: { id: string; zone: DropZone; label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: zone });
  return (
    <div ref={setNodeRef} className={isOver ? "quick-zone is-over" : "quick-zone"}>
      {label}
    </div>
  );
}

/** 運んでいる間に見せる、ことばの形。 */
function Chip({ text }: { text: string }) {
  return (
    <span className="snippet is-overlay">
      <span className="snippet-text">
        <Rich text={text} />
      </span>
    </span>
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
  const zone: DropZone = { zone: "board" };
  const { setNodeRef, isOver } = useDroppable({ id: "drop:board", data: zone });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby="h-board"
      className={[
        "panel",
        "board",
        empty ? "is-empty" : "",
        active ? "is-ready" : "",
        isOver && active ? "is-over" : "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}
