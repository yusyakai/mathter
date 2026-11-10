import { useEffect, useState } from "react";
import { AssociateView } from "./components/AssociateView";
import { SolutionView } from "./components/SolutionView";
import { problems } from "./data/problems";

type Mode = "associate" | "solution";

function loadBoard(problemId: string): string[] {
  try {
    const raw = localStorage.getItem(`mathter:board:${problemId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function App() {
  const [problemId, setProblemId] = useState(problems[0].id);
  const [mode, setMode] = useState<Mode>("associate");
  const [board, setBoard] = useState<string[]>(() => loadBoard(problems[0].id));
  const problem = problems.find((p) => p.id === problemId)!;

  useEffect(() => {
    try {
      localStorage.setItem(`mathter:board:${problemId}`, JSON.stringify(board));
    } catch {
      // 保存できなくても学習は続けられる
    }
  }, [problemId, board]);

  const changeProblem = (id: string) => {
    setProblemId(id);
    setBoard(loadBoard(id));
    setMode("associate");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>mathter</h1>
        <select
          aria-label="問題を選ぶ"
          value={problemId}
          onChange={(e) => changeProblem(e.target.value)}
        >
          {problems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.unit}｜{p.title}
            </option>
          ))}
        </select>
      </header>

      <nav className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === "associate"}
          onClick={() => setMode("associate")}
        >
          連想する
        </button>
        <button
          role="tab"
          aria-selected={mode === "solution"}
          onClick={() => setMode("solution")}
        >
          解答との対応
        </button>
      </nav>

      {mode === "associate" ? (
        <AssociateView key={problem.id} problem={problem} board={board} setBoard={setBoard} />
      ) : (
        <SolutionView key={problem.id} problem={problem} />
      )}
    </div>
  );
}
