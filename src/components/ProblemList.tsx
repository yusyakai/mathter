import { useState } from "react";
import {
  allPatterns,
  isCustom,
  playableProblems,
  useCustomPatterns,
  useCustomProblems,
} from "../library";
import { loadState } from "../storage";
import { dayKey, formatDuration, totalSeconds, useStudyTime } from "../studyTime";
import { checkSlot } from "../thoughts";
import type { Problem } from "../types";
import { label } from "../editor/draft";
import { Rich } from "./Rich";

type Status = "new" | "doing" | "done";

function status(problem: Problem): Status {
  const { board, placed } = loadState(problem);
  if (board.length === 0) return "new";
  return placed.every((id, i) => checkSlot(problem, i, id) === "ok") ? "done" : "doing";
}

const STATUS_NAME: Record<Status, string> = {
  new: "まだ",
  doing: "取り組み中",
  done: "骨組み完成",
};

export function ProblemList() {
  const problems = playableProblems(useCustomProblems());
  const patterns = allPatterns(useCustomPatterns());
  const [unit, setUnit] = useState("");
  const [state, setState] = useState<"" | Status>("");
  const [pattern, setPattern] = useState("");
  const [word, setWord] = useState("");
  const time = useStudyTime();
  const total = totalSeconds(time);

  const units = [...new Set(problems.map((p) => p.unit))];
  const usedPatterns = patterns.filter((x) =>
    problems.some((p) => p.associations.some((a) => a.patternId === x.id)),
  );
  const withStatus = problems.map((p) => ({ p, s: status(p) }));
  const shown = withStatus.filter(({ p, s }) => {
    if (unit && p.unit !== unit) return false;
    if (state && s !== state) return false;
    if (pattern && !p.associations.some((a) => a.patternId === pattern)) return false;
    const text = `${p.title} ${p.segments.map((x) => x.text).join("")}`;
    return word.trim() === "" || text.includes(word.trim());
  });
  const filtered = unit !== "" || state !== "" || pattern !== "" || word.trim() !== "";

  return (
    <main className="page">
      {total > 0 && (
        <p className="study-time">
          学習時間　今日 {formatDuration(time[dayKey(new Date())] ?? 0)} ／ 合計 {formatDuration(total)}
        </p>
      )}
      <div className="filters">
        <select aria-label="単元でしぼる" value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="">すべての単元</option>
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select
          aria-label="進み具合でしぼる"
          value={state}
          onChange={(e) => setState(e.target.value as "" | Status)}
        >
          <option value="">すべての進み具合</option>
          {(Object.keys(STATUS_NAME) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_NAME[s]}
            </option>
          ))}
        </select>
        <select aria-label="型でしぼる" value={pattern} onChange={(e) => setPattern(e.target.value)}>
          <option value="">すべての型</option>
          {usedPatterns.map((x) => (
            <option key={x.id} value={x.id}>
              {label(x.trigger, 14)} → {label(x.idea, 18)}
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label="ことばでさがす"
          placeholder="ことばでさがす"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
      </div>
      {filtered && (
        <p className="guide">
          {shown.length} 問が見つかりました。
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setUnit("");
              setState("");
              setPattern("");
              setWord("");
            }}
          >
            しぼりこみをやめる
          </button>
        </p>
      )}
      {units
        .filter((u) => shown.some(({ p }) => p.unit === u))
        .map((u) => (
          <section key={u}>
            <h2 className="page-heading">{u}</h2>
            <ul className="problem-list">
              {shown
                .filter(({ p }) => p.unit === u)
                .map(({ p, s }) => (
                  <li key={p.id}>
                    <a className="problem-item" href={`#/p/${p.id}`}>
                      <span className="problem-item-title">
                        {p.title}
                        <span>
                          {isCustom(p.id) && <span className="status is-custom">自作</span>}
                          {s !== "new" && <span className="status">{STATUS_NAME[s]}</span>}
                        </span>
                      </span>
                      <span className="problem-item-text">
                        <Rich text={p.segments.map((x) => x.text).join("")} />
                      </span>
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </main>
  );
}
