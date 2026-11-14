import { useEffect, useState } from "react";
import { Editor } from "./components/Editor";
import { MyProblems } from "./components/MyProblems";
import { Notebook } from "./components/Notebook";
import { ProblemList } from "./components/ProblemList";
import { Workspace } from "./components/Workspace";
import { playableProblems, useCustomProblems } from "./library";
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

  const custom = useCustomProblems();
  const problem = hash.startsWith("#/p/")
    ? playableProblems(custom).find((p) => p.id === decodeURIComponent(hash.slice(4)))
    : undefined;
  const isNote = hash === "#/note";
  const isEdit = hash.startsWith("#/edit");
  const editing = hash.startsWith("#/edit/")
    ? custom.find((p) => p.id === decodeURIComponent(hash.slice(7)))
    : undefined;

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <a href="#/">mathter</a>
        </h1>
        <nav className="nav">
          <a href="#/" aria-current={!problem && !isNote && !isEdit ? "page" : undefined}>
            問題
          </a>
          <a href="#/note" aria-current={isNote ? "page" : undefined}>
            連想ノート
          </a>
          <a href="#/edit" aria-current={isEdit ? "page" : undefined}>
            問題を作る
          </a>
        </nav>
      </header>
      {problem ? (
        <>
          <p className="crumb">
            {problem.unit}｜{problem.title}
            {custom.some((p) => p.id === problem.id) && (
              <a className="crumb-link" href={`#/edit/${problem.id}`}>
                この問題を直す
              </a>
            )}
          </p>
          <Workspace
            key={problem.id}
            problem={problem}
            known={record.known}
            onCollect={collect}
            onToggleKnown={toggleKnown}
          />
        </>
      ) : editing ? (
        <Editor key={editing.id} problem={editing} />
      ) : isEdit ? (
        <MyProblems />
      ) : isNote ? (
        <Notebook record={record} onToggleKnown={toggleKnown} />
      ) : (
        <ProblemList />
      )}
    </div>
  );
}
