import { useEffect, useState } from "react";
import { Notebook } from "./components/Notebook";
import { ProblemList } from "./components/ProblemList";
import { Workspace } from "./components/Workspace";
import { problems } from "./data/problems";
import { loadRecord, saveRecord, type LearnerRecord } from "./storage";

/** 画面の場所は URL の # 以降で表す（#/ 一覧、#/p/問題id、#/note 連想ノート）。 */
function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export function App() {
  const hash = useHash();
  const [record, setRecord] = useState<LearnerRecord>(loadRecord);
  useEffect(() => saveRecord(record), [record]);

  const collect = (patternId: string) =>
    setRecord((r) => (r.seen.includes(patternId) ? r : { ...r, seen: [...r.seen, patternId] }));
  const toggleKnown = (patternId: string) =>
    setRecord((r) => ({
      ...r,
      known: r.known.includes(patternId)
        ? r.known.filter((x) => x !== patternId)
        : [...r.known, patternId],
    }));

  const problem = hash.startsWith("#/p/")
    ? problems.find((p) => p.id === decodeURIComponent(hash.slice(4)))
    : undefined;
  const isNote = hash === "#/note";

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <a href="#/">mathter</a>
        </h1>
        <nav className="nav">
          <a href="#/" aria-current={!problem && !isNote ? "page" : undefined}>
            問題
          </a>
          <a href="#/note" aria-current={isNote ? "page" : undefined}>
            連想ノート
          </a>
        </nav>
      </header>
      {problem ? (
        <>
          <p className="crumb">
            {problem.unit}｜{problem.title}
          </p>
          <Workspace
            key={problem.id}
            problem={problem}
            known={record.known}
            onCollect={collect}
            onToggleKnown={toggleKnown}
          />
        </>
      ) : isNote ? (
        <Notebook record={record} onToggleKnown={toggleKnown} />
      ) : (
        <ProblemList />
      )}
    </div>
  );
}
