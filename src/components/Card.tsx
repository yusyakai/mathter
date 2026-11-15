import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { SyntheticEvent } from "react";
import type { Thought } from "../types";
import type { DragData, DropZone } from "./dnd";
import { Graph } from "./Graph";
import { Rich } from "./Rich";
import { Words } from "./Words";

interface Props {
  thought: Thought;
  /** cand: 問題の下に出る連想 / board: 思考ボードの上のカード */
  where: "cand" | "board";
  open: boolean;
  onToggle: () => void;
  /** cand で、すでに思考ボードにある（カードごとは運べない） */
  placed?: boolean;
  /** board で、解答ボードにことばを置いてある */
  used?: boolean;
  /** 模範解答の行に対応している */
  highlighted?: boolean;
  /** 運んでいるカードとくっつけられる相手（設定で光らせるとき） */
  partner?: boolean;
  /** この連想の型に「もう分かる」の印が付いている */
  known?: boolean;
  onToggleKnown?: () => void;
  /** 組み合わせのとき、もとになった考えの題 */
  sources?: string[];
  onRemove?: () => void;
  removeLabel?: string;
}

const stop = (e: SyntheticEvent) => e.stopPropagation();

/**
 * 考えのカード。ふだんは単語や短い文（題）だけを出し、タップすると説明が開く。
 * 題の所をつかむとカードごと運べる。開いた説明の中は、ことば1つずつを運べる。
 */
export function Card({
  thought,
  where,
  open,
  onToggle,
  placed,
  used,
  highlighted,
  partner,
  known,
  onToggleKnown,
  sources,
  onRemove,
  removeLabel,
}: Props) {
  const data: DragData = { kind: "card", thoughtId: thought.id };
  const zone: DropZone = { zone: "card", thoughtId: thought.id };
  const drag = useDraggable({
    id: `card:${where}:${thought.id}`,
    data,
    disabled: placed,
    attributes: { role: "group", roleDescription: "運べるカード" },
  });
  const drop = useDroppable({ id: `drop:card:${thought.id}`, data: zone, disabled: where !== "board" });
  const carried = drop.active?.data.current as DragData | undefined;
  const isTarget = drop.isOver && carried?.kind === "card" && carried.thoughtId !== thought.id;

  return (
    <div
      ref={(node) => {
        drag.setNodeRef(node);
        drop.setNodeRef(node);
      }}
      data-thought={thought.id}
      className={[
        "card",
        "thought",
        placed ? "is-placed" : "is-draggable",
        thought.kind === "combination" ? "is-combination" : "",
        known ? "is-known" : "",
        partner ? "is-partner" : "",
        drag.isDragging ? "is-dragging" : "",
        isTarget ? "is-target" : "",
        highlighted ? "is-highlighted" : "",
      ].join(" ")}
      {...(placed ? {} : drag.attributes)}
      {...drag.listeners}
    >
      <button type="button" className="card-head" aria-expanded={open} onClick={onToggle}>
        <span className="card-title">
          <Rich text={thought.title} />
        </span>
        {known && <span className="card-mark">✓ 分かる</span>}
        {used && <span className="card-mark">解答に使用</span>}
        {placed && <span className="card-mark">ボードにあります</span>}
        <span className="card-chevron" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        // 説明の中での操作を、カードを運ぶ操作にしない
        <div className="card-detail" onMouseDown={stop} onTouchStart={stop} onKeyDown={stop}>
          {sources && (
            <p className="sources">
              {sources.map((s, i) => (
                <span key={i}>
                  {i > 0 && " ＋ "}
                  <span className="chip">
                    <Rich text={s} />
                  </span>
                </span>
              ))}{" "}
              をくっつけた考え
            </p>
          )}
          {thought.detail.trim() !== "" && (
            <p className="card-text">
              <Words
                text={thought.detail}
                drag
                idPrefix={`w:${where}:${thought.id}`}
                thoughtId={thought.id}
              />
            </p>
          )}
          {thought.graph && <Graph spec={thought.graph} />}
          <div className="card-actions">
            {onToggleKnown && (
              <button type="button" className="known-button" aria-pressed={known} onClick={onToggleKnown}>
                {known ? "✓ もう分かる" : "もう分かる"}
              </button>
            )}
            {onRemove && (
              <button type="button" onClick={onRemove}>
                {removeLabel ?? "外す"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
