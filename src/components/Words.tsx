import { useDraggable } from "@dnd-kit/core";
import { memo, useMemo, type ReactNode } from "react";
import { tokenize } from "../words";
import type { DragData } from "./dnd";
import { Rich } from "./Rich";

interface Props {
  text: string;
  /** ことばを1つずつ運べるようにするか。false なら、ただ表示する */
  drag: boolean;
  /** 運べることばに付ける id の先頭（画面の中で重ならないようにする） */
  idPrefix: string;
  /** 考えの説明の中のことばなら、その考え */
  thoughtId?: string;
  /** 問題文の着眼点の中のことばなら、その着眼点 */
  fragmentId?: string;
}

/** 文を表示する。drag のときは、ことば（と数式）を1つずつ解答ボードへ運べる。 */
export const Words = memo(function Words({ text, drag, idPrefix, thoughtId, fragmentId }: Props) {
  const tokens = useMemo(() => (drag ? tokenize(text) : []), [text, drag]);
  if (!drag) return <Rich text={text} />;
  return (
    <>
      {tokens.map((t, i) =>
        t.kind === "other" ? (
          <span key={i}>{t.text}</span>
        ) : (
          <Word
            key={i}
            id={`${idPrefix}:${i}`}
            data={{
              kind: "text",
              text: t.text,
              ...(thoughtId ? { thoughtId } : {}),
              ...(fragmentId ? { fragmentId } : {}),
            }}
          >
            <Rich text={t.text} />
          </Word>
        ),
      )}
    </>
  );
});

function Word({ id, data, children }: { id: string; data: DragData; children: ReactNode }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, data });
  return (
    <span ref={setNodeRef} className={isDragging ? "word is-dragging" : "word"} {...listeners}>
      {children}
    </span>
  );
}
