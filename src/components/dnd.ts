/** 運んでいるものの中身。落とした先で、何を置くかを決めるのに使う。 */
export type DragData =
  /** 考えのカードまるごと */
  | { kind: "card"; thoughtId: string }
  /** 問題文や説明の中のことば（どこから取り出したかも持つ） */
  | { kind: "text"; text: string; thoughtId?: string; fragmentId?: string }
  /** 解答ボードに置いてあることば */
  | { kind: "snippet"; snippetId: string };

/** 置き場所。内側にあるものほど優先する（ことば → 段 → カード → ボード全体）。 */
export type DropZone =
  | { zone: "chip"; snippetId: string }
  | { zone: "row"; index: number }
  | { zone: "card"; thoughtId: string }
  | { zone: "answer" }
  | { zone: "board" };

export const ZONE_ORDER: DropZone["zone"][] = ["chip", "row", "card", "answer", "board"];

export const isAnswerZone = (zone: DropZone | undefined): boolean =>
  zone !== undefined && (zone.zone === "answer" || zone.zone === "row" || zone.zone === "chip");
