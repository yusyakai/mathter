import type { Problem } from "../types";
import { Rich } from "./Rich";

interface Props {
  problem: Problem;
  /** 選択中の着眼点 */
  active?: string | null;
  /** 強調する着眼点（解答との対応表示用） */
  highlighted?: string[];
  onSelect: (fragmentId: string) => void;
}

export function ProblemText({ problem, active, highlighted = [], onSelect }: Props) {
  return (
    <p className="problem-text">
      {problem.segments.map((seg, i) =>
        seg.fragmentId ? (
          <button
            key={i}
            type="button"
            className={[
              "fragment",
              seg.fragmentId === active ? "is-active" : "",
              highlighted.includes(seg.fragmentId) ? "is-highlighted" : "",
            ].join(" ")}
            aria-pressed={seg.fragmentId === active}
            onClick={() => onSelect(seg.fragmentId!)}
          >
            <Rich text={seg.text} />
          </button>
        ) : (
          <Rich key={i} text={seg.text} />
        ),
      )}
    </p>
  );
}
