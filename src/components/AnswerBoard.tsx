import { useDraggable, useDroppable } from "@dnd-kit/core";
import { checkRow, isComplete, type RowResult, type Rows, type Snippet } from "../answer";
import type { Problem } from "../types";
import type { DragData, DropZone } from "./dnd";
import { Rich } from "./Rich";

const rowMessages: Record<RowResult, string> = {
  ok: "ここで使う考えです。",
  elsewhere: "この考えを使う場所は、ここではありません。",
  "needs-merge": "ほかの考えとくっつけてから取り出すと、解答で使える考えになります。",
  unused: "この考えは、模範の骨組みには直接は使いません。",
  "no-thought": "思考ボードの考えから取り出したことばがないので、確かめられません。",
  extra: "模範の骨組みには、この段にあたるものがありません。",
};

interface Props {
  problem: Problem;
  rows: Rows;
  /** 光らせることば（模範解答の行に対応するもの） */
  highlighted: string[];
  /** 何かを運んでいる間 true。置き場所を目立たせる */
  active: boolean;
  /** 模範の骨組みとくらべる「配置を確かめる」を使うか（設定で切り替える） */
  judge: boolean;
  checked: boolean;
  onToggleChecked: () => void;
  onRemove: (snippetId: string) => void;
  onMoveRow: (index: number, by: number) => void;
}

/**
 * 解答ボード。問題文や思考ボードから運んだことばを、解答で使う順に上から並べる。
 * 段の数も、1段に置くことばの数も自由。
 */
export function AnswerBoard({
  problem,
  rows,
  highlighted,
  active,
  judge,
  checked,
  onToggleChecked,
  onRemove,
  onMoveRow,
}: Props) {
  const zone: DropZone = { zone: "answer" };
  const { setNodeRef, isOver } = useDroppable({ id: "drop:answer", data: zone });
  const showResults = judge && checked;
  const missing = problem.skeleton.length - rows.length;

  return (
    <>
      <div
        ref={setNodeRef}
        className={["answer-area", active ? "is-ready" : "", isOver ? "is-over" : ""].join(" ")}
      >
        <ol className="answer-rows">
          {rows.map((row, i) => (
            <Row
              key={i}
              index={i}
              row={row}
              count={rows.length}
              result={showResults ? checkRow(problem, i, row) : null}
              highlighted={highlighted}
              onRemove={onRemove}
              onMoveRow={onMoveRow}
            />
          ))}
        </ol>
        <p className="answer-new">
          {rows.length === 0
            ? "問題文のことばや、思考ボードのカードを、ここへ運びます。"
            : "ここに置くと新しい段に、段の上に置くとその段に入ります。"}
        </p>
      </div>
      {judge && (
        <>
          {showResults && missing > 0 && (
            <p className="message" role="status">
              模範の骨組みには、あと {missing} 段あります。
            </p>
          )}
          {showResults && isComplete(problem, rows) && (
            <p className="message" role="status">
              模範の骨組みと同じ流れになりました。この順に、ノートで解いてみましょう。
            </p>
          )}
          <button
            type="button"
            className="hint-button"
            disabled={rows.length === 0}
            onClick={onToggleChecked}
          >
            {checked ? "確かめた結果をかくす" : "配置を確かめる"}
          </button>
        </>
      )}
    </>
  );
}

interface RowProps {
  index: number;
  row: Snippet[];
  count: number;
  result: RowResult | null;
  highlighted: string[];
  onRemove: (snippetId: string) => void;
  onMoveRow: (index: number, by: number) => void;
}

function Row({ index, row, count, result, highlighted, onRemove, onMoveRow }: RowProps) {
  const zone: DropZone = { zone: "row", index };
  const { setNodeRef, isOver } = useDroppable({ id: `drop:row:${index}`, data: zone });
  return (
    <li
      ref={setNodeRef}
      data-row={index}
      className={[
        "answer-row",
        isOver ? "is-over" : "",
        result === "ok" ? "is-ok" : "",
        result && result !== "ok" ? "is-off" : "",
      ].join(" ")}
    >
      <span className="slot-number">{index + 1}</span>
      <div className="row-body">
        <div className="row-chips">
          {row.map((s) => (
            <Chip
              key={s.id}
              snippet={s}
              highlighted={highlighted.includes(s.id)}
              onRemove={() => onRemove(s.id)}
            />
          ))}
        </div>
        {result && (
          <p className="slot-result" role="status">
            {result === "ok" ? "○ " : ""}
            {rowMessages[result]}
          </p>
        )}
      </div>
      {count > 1 && (
        <span className="row-buttons">
          <button
            type="button"
            disabled={index === 0}
            aria-label={`${index + 1}段目を上へ`}
            onClick={() => onMoveRow(index, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === count - 1}
            aria-label={`${index + 1}段目を下へ`}
            onClick={() => onMoveRow(index, 1)}
          >
            ↓
          </button>
        </span>
      )}
    </li>
  );
}

/** 解答ボードに置いたことば。つかむと別の段へ移せる。ほかのことばの上に落とすと、その前に入る。 */
function Chip({
  snippet,
  highlighted,
  onRemove,
}: {
  snippet: Snippet;
  highlighted: boolean;
  onRemove: () => void;
}) {
  const data: DragData = { kind: "snippet", snippetId: snippet.id };
  const zone: DropZone = { zone: "chip", snippetId: snippet.id };
  const drag = useDraggable({
    id: `snip:${snippet.id}`,
    data,
    attributes: { role: "group", roleDescription: "運べることば" },
  });
  const drop = useDroppable({ id: `drop:chip:${snippet.id}`, data: zone });
  const isTarget = drop.isOver && drop.active?.id !== `snip:${snippet.id}`;
  return (
    <span
      ref={(node) => {
        drag.setNodeRef(node);
        drop.setNodeRef(node);
      }}
      data-snippet={snippet.id}
      className={[
        "snippet",
        drag.isDragging ? "is-dragging" : "",
        isTarget ? "is-target" : "",
        highlighted ? "is-highlighted" : "",
      ].join(" ")}
      {...drag.attributes}
      {...drag.listeners}
    >
      <span className="snippet-text">
        <Rich text={snippet.text} />
      </span>
      <button type="button" className="snippet-remove" aria-label="外す" onClick={onRemove}>
        ×
      </button>
    </span>
  );
}
