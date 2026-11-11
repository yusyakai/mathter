import { useState } from "react";
import { Workspace } from "./components/Workspace";
import { problems } from "./data/problems";

export function App() {
  const [problemId, setProblemId] = useState(problems[0].id);
  const problem = problems.find((p) => p.id === problemId)!;

  return (
    <div className="app">
      <header className="app-header">
        <h1>mathter</h1>
        <select
          aria-label="問題を選ぶ"
          value={problemId}
          onChange={(e) => setProblemId(e.target.value)}
        >
          {problems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.unit}｜{p.title}
            </option>
          ))}
        </select>
      </header>
      <Workspace key={problem.id} problem={problem} />
    </div>
  );
}
