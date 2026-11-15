import { prepare } from "../graph/spec";
import type { GraphSpec } from "../types";
import { Graph } from "./Graph";

const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v));

interface Props {
  value: GraphSpec | undefined;
  onChange: (value: GraphSpec | undefined) => void;
}

/** 考えにグラフを付ける入力欄。すぐ下に、生徒に見える形を出す。 */
export function GraphEditor({ value, onChange }: Props) {
  if (!value) {
    return (
      <button
        type="button"
        className="add-button"
        onClick={() => onChange({ expr: "x^2", xMin: -4, xMax: 4 })}
      >
        ＋ グラフを付ける
      </button>
    );
  }
  const set = (patch: Partial<GraphSpec>) => onChange({ ...value, ...patch });
  const ready = prepare(value);
  const field = (label: string, v: number | undefined, apply: (n: number | undefined) => void) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <input type="number" step="any" value={v ?? ""} onChange={(e) => apply(num(e.target.value))} />
    </label>
  );

  return (
    <div className="graph-editor">
      <div className="block-head">
        <span className="block-title">グラフ</span>
        <span className="row-buttons">
          <button type="button" onClick={() => onChange(undefined)}>
            グラフを外す
          </button>
        </span>
      </div>
      <label className="field">
        <span className="field-label">式（y = の右側。例：x^2-2ax+3、x(10-x)）</span>
        <input type="text" value={value.expr} onChange={(e) => set({ expr: e.target.value })} />
      </label>
      <div className="quad">
        {field("x の範囲（左）", value.xMin, (n) => set({ xMin: n ?? 0 }))}
        {field("x の範囲（右）", value.xMax, (n) => set({ xMax: n ?? 0 }))}
        {field("y の範囲（下）※空なら自動", value.yMin, (n) => set({ yMin: n }))}
        {field("y の範囲（上）※空なら自動", value.yMax, (n) => set({ yMax: n }))}
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={value.param !== undefined}
          onChange={(e) =>
            set({ param: e.target.checked ? { name: "a", min: -2, max: 2, value: 1 } : undefined })
          }
        />
        式の中の文字を、生徒がスライダーで動かせるようにする
      </label>
      {value.param && (
        <div className="quad">
          <label className="field">
            <span className="field-label">動かす文字</span>
            <input
              type="text"
              maxLength={1}
              value={value.param.name}
              onChange={(e) => set({ param: { ...value.param!, name: e.target.value } })}
            />
          </label>
          {field("最小", value.param.min, (n) => set({ param: { ...value.param!, min: n ?? 0 } }))}
          {field("最大", value.param.max, (n) => set({ param: { ...value.param!, max: n ?? 0 } }))}
          {field("最初の値", value.param.value, (n) => set({ param: { ...value.param!, value: n ?? 0 } }))}
        </div>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={value.domain !== undefined}
          onChange={(e) => set({ domain: e.target.checked ? ["0", "2"] : undefined })}
        />
        定義域を太く描く
      </label>
      {value.domain && (
        <div className="pair">
          <label className="field">
            <span className="field-label">定義域の左端（数、または動かす文字）</span>
            <input
              type="text"
              value={value.domain[0]}
              onChange={(e) => set({ domain: [e.target.value, value.domain![1]] })}
            />
          </label>
          <label className="field">
            <span className="field-label">定義域の右端</span>
            <input
              type="text"
              value={value.domain[1]}
              onChange={(e) => set({ domain: [value.domain![0], e.target.value] })}
            />
          </label>
        </div>
      )}
      {"error" in ready ? (
        <p className="graph-error">{ready.error}</p>
      ) : (
        <Graph key={JSON.stringify(value)} spec={value} />
      )}
    </div>
  );
}
