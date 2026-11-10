import { useMemo, useState } from "react";
import { allThoughts } from "../thoughts";
import type { Problem } from "../types";
import { ProblemText } from "./ProblemText";
import { Rich } from "./Rich";

export function SolutionView({ problem }: { problem: Problem }) {
  const thoughts = useMemo(() => allThoughts(problem), [problem]);
  const [stepId, setStepId] = useState<string | null>(null);
  const [fragment, setFragment] = useState<string | null>(null);

  const step = problem.solution.find((s) => s.id === stepId);

  return (
    <main className="view">
      <section className="panel">
        <h2>問題</h2>
        <ProblemText
          problem={problem}
          active={fragment}
          highlighted={step?.fromFragments}
          onSelect={(f) => {
            setFragment(f === fragment ? null : f);
            setStepId(null);
          }}
        />
        <p className="guide">
          解答の行をタップすると、その行が問題文のどこから生まれたかが分かります。問題文の部分をタップすると、そこから生まれた行が分かります。
        </p>
      </section>

      <section className="panel">
        <h2>模範解答</h2>
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
                      <li key={t}>
                        <Rich text={thoughts.get(t)?.title ?? t} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
