import type { Problem } from "../types";
import { Rich } from "./Rich";

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
}

const circled = (n: number) => (n >= 1 && n <= 20 ? String.fromCharCode(0x245f + n) : `(${n})`);

export function ProblemText({ problem, found, showOrder, active, highlighted, onSelect, onMiss }: Props) {
  return (
    <p className="problem-text" onClick={onMiss}>
      {problem.segments.map((seg, i) => {
        const id = seg.fragmentId;
        if (!id) return <Rich key={i} text={seg.text} />;
        const isFound = found.includes(id) || showOrder;
        const priority = problem.fragments.find((f) => f.id === id)?.priority;
        return (
          <button
            key={i}
            type="button"
            className={[
              "fragment",
              isFound ? "is-found" : "",
              id === active ? "is-active" : "",
              highlighted.includes(id) ? "is-highlighted" : "",
            ].join(" ")}
            aria-pressed={id === active}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(id);
            }}
          >
            {showOrder && priority !== undefined && (
              <span className="priority" aria-label={`見る順番 ${priority}`}>
                {circled(priority)}
              </span>
            )}
            <Rich text={seg.text} />
          </button>
        );
      })}
    </p>
  );
}
