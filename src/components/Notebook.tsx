import { useState } from "react";
import { patterns } from "../data/patterns";
import { problems } from "../data/problems";
import type { LearnerRecord } from "../storage";
import { Rich } from "./Rich";

interface Props {
  record: LearnerRecord;
  onToggleKnown: (patternId: string) => void;
}

/** 連想ノート。思考ボードに集めたことがある「連想の型」の一覧。 */
export function Notebook({ record, onToggleKnown }: Props) {
  const [opened, setOpened] = useState<string[]>([]);
  const toggle = (id: string) =>
    setOpened((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const units = [...new Set(patterns.map((p) => p.unit))];

  return (
    <main className="page">
      <p className="guide">
        問題を解くなかで思考ボードに集めた連想が、型としてここに貯まります。同じ型は、別の問題でも使えます。
      </p>
      {units.map((unit) => {
        const all = patterns.filter((p) => p.unit === unit);
        const mine = all.filter((p) => record.seen.includes(p.id));
        return (
          <section key={unit}>
            <h2 className="page-heading">
              {unit}
              <span className="count">
                集めた型 {mine.length} / {all.length}
              </span>
            </h2>
            {mine.length === 0 && <p className="guide">まだ集めた型はありません。</p>}
            <ul className="cards">
              {mine.map((p) => {
                const known = record.known.includes(p.id);
                const uses = problems.filter((q) =>
                  q.associations.some((a) => a.patternId === p.id),
                );
                return (
                  <li key={p.id} className={["card", "pattern", known ? "is-known" : ""].join(" ")}>
                    <div className="pattern-trigger">
                      <Rich text={p.trigger} />
                    </div>
                    <div className="card-title">
                      → <Rich text={p.idea} />
                    </div>
                    {opened.includes(p.id) && (
                      <div className="card-detail">
                        <Rich text={p.detail} />
                        <div className="pattern-uses">この型を使う問題</div>
                        <ul className="pattern-links">
                          {uses.map((q) => (
                            <li key={q.id}>
                              <a href={`#/p/${q.id}`}>{q.title}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="card-actions">
                      <button type="button" aria-pressed={known} onClick={() => onToggleKnown(p.id)}>
                        {known ? "✓ もう分かる" : "もう分かる"}
                      </button>
                      <button type="button" onClick={() => toggle(p.id)}>
                        {opened.includes(p.id) ? "とじる" : "くわしく"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
