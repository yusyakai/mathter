import { useDraggable } from "@dnd-kit/core";
import type { MouseEventHandler, ReactNode, TouchEventHandler } from "react";
import type { Problem } from "../types";
import type { DragData } from "./dnd";
import { Words } from "./Words";

interface Props {
  problem: Problem;
  /** 学習者が見つけた着眼点。見つけるまでは色を付けない */
  found: string[];
  /** 見る順番（丸数字）をすべての着眼点に表示するか */
  showOrder: boolean;
  /** 選択中の着眼点 */
  active: string | null;
  /** 解答の行に対応する着眼点 */
  highlighted: string[];
  onSelect: (fragmentId: string) => void;
  /** 着眼点ではない部分をタップしたとき */
  onMiss: () => void;
  /** ことばや着眼点を、解答ボードへ運べるようにするか（学習画面では true） */
  drag?: boolean;
  /** 見え方を確かめるだけの表示か（問題を作る画面）。着眼点をタップできないようにする */
  preview?: boolean;
}

const circled = (n: number) => (n >= 1 && n <= 20 ? String.fromCharCode(0x245f + n) : `(${n})`);

/**
 * 問題文。見つける前の着眼点は、ほかの部分と見分けがつかないようにする。
 * drag のとき、色の付いた着眼点はまるごと、そのほかはことば1つずつを運べる。
 */
export function ProblemText({
  problem,
  found,
  showOrder,
  active,
  highlighted,
  onSelect,
  onMiss,
  drag = false,
  preview = false,
}: Props) {
  return (
    <p className={drag ? "problem-text is-drag" : "problem-text"} onClick={preview ? undefined : onMiss}>
      {problem.segments.map((seg, i) => {
        const id = seg.fragmentId;
        const prefix = `w:problem:${i}`;
        if (!id) return <Words key={i} text={seg.text} drag={drag} idPrefix={prefix} />;
        const revealed = found.includes(id) || showOrder;
        const view = {
          id,
          revealed,
          active: id === active,
          highlighted: highlighted.includes(id),
          priority: showOrder ? problem.fragments.find((f) => f.id === id)?.priority : undefined,
          onSelect,
          preview,
        };
        const body = (
          <Words text={seg.text} drag={drag && !revealed} idPrefix={prefix} fragmentId={id} />
        );
        return drag && revealed ? (
          <DragFragment key={i} {...view} text={seg.text}>
            {body}
          </DragFragment>
        ) : (
          <FragmentView key={i} {...view}>
            {body}
          </FragmentView>
        );
      })}
    </p>
  );
}

interface ViewProps {
  id: string;
  revealed: boolean;
  active: boolean;
  highlighted: boolean;
  priority: number | undefined;
  onSelect: (fragmentId: string) => void;
  /** 見え方を確かめるだけの表示（タップできない） */
  preview: boolean;
  children: ReactNode;
  /** まるごと運べるときの、つかむための設定 */
  grab?: {
    ref: (node: HTMLElement | null) => void;
    isDragging: boolean;
    onMouseDown?: MouseEventHandler;
    onTouchStart?: TouchEventHandler;
  };
}

function FragmentView({
  id,
  revealed,
  active,
  highlighted,
  priority,
  onSelect,
  preview,
  children,
  grab,
}: ViewProps) {
  const mark = priority !== undefined && (
    <span className="priority" aria-label={`見る順番 ${priority}`}>
      {circled(priority)}
    </span>
  );
  if (preview) {
    return (
      <span data-fragment={id} className={revealed ? "fragment is-found" : "fragment"}>
        {mark}
        {children}
      </span>
    );
  }
  return (
    <span
      ref={grab?.ref}
      role="button"
      tabIndex={0}
      data-fragment={id}
      className={[
        "fragment",
        revealed ? "is-found" : "",
        active ? "is-active" : "",
        highlighted ? "is-highlighted" : "",
        grab ? "is-draggable" : "",
        grab?.isDragging ? "is-dragging" : "",
      ].join(" ")}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
      onMouseDown={grab?.onMouseDown}
      onTouchStart={grab?.onTouchStart}
    >
      {mark}
      {children}
    </span>
  );
}

/** 色の付いた（見つけた）着眼点。タップで連想を開き、つかむとまるごと運べる。 */
function DragFragment(props: ViewProps & { text: string }) {
  const data: DragData = { kind: "text", text: props.text, fragmentId: props.id };
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: `frag:${props.id}`, data });
  return (
    <FragmentView
      {...props}
      grab={{
        ref: setNodeRef,
        isDragging,
        // Enter・スペースは連想を開くのに使うので、マウスとタッチだけを運ぶ操作にする
        onMouseDown: listeners?.onMouseDown as MouseEventHandler | undefined,
        onTouchStart: listeners?.onTouchStart as TouchEventHandler | undefined,
      }}
    />
  );
}
