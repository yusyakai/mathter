import { problems } from "../data/problems";
import { loadState } from "../storage";
import { checkSlot } from "../thoughts";
import type { Problem } from "../types";
import { Rich } from "./Rich";

function status(problem: Problem): string | null {
  const { board, placed } = loadState(problem);
  if (board.length === 0) return null;
  return placed.every((id, i) => checkSlot(problem, i, id) === "ok") ? "骨組み完成" : "取り組み中";
}

export function ProblemList() {
  const units = [...new Set(problems.map((p) => p.unit))];
  return (
    <main className="page">
      {units.map((unit) => (
        <section key={unit}>
          <h2 className="page-heading">{unit}</h2>
          <ul className="problem-list">
            {problems
              .filter((p) => p.unit === unit)
              .map((p) => {
                const s = status(p);
                return (
                  <li key={p.id}>
                    <a className="problem-item" href={`#/p/${p.id}`}>
                      <span className="problem-item-title">
                        {p.title}
                        {s && <span className="status">{s}</span>}
                      </span>
                      <span className="problem-item-text">
                        <Rich text={p.segments.map((x) => x.text).join("")} />
                      </span>
                    </a>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </main>
  );
}
