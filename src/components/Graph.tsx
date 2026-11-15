import { useId, useMemo, useState } from "react";
import { prepare, tickStep, yRange } from "../graph/spec";
import type { GraphSpec } from "../types";

const W = 320;
const H = 240;
const PAD = 22;

/** 考えに付けるグラフ。文字があれば、スライダーで値を動かせる。 */
export function Graph({ spec }: { spec: GraphSpec }) {
  const clip = useId();
  const ready = useMemo(() => prepare(spec), [spec]);
  const [param, setParam] = useState(spec.param?.value ?? 0);

  if ("error" in ready) return <p className="graph-error">{ready.error}</p>;
  const { fn, domain } = ready;
  const value = spec.param ? Math.min(spec.param.max, Math.max(spec.param.min, param)) : 0;
  const vars = spec.param ? { [spec.param.name]: value } : {};
  const [yMin, yMax] = yRange(spec, fn);
  const sx = (x: number) => PAD + ((x - spec.xMin) / (spec.xMax - spec.xMin)) * (W - PAD * 2);
  const sy = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin)) * (H - PAD * 2);

  const path = (from: number, to: number) => {
    const parts: string[] = [];
    let pen = false;
    for (let i = 0; i <= 160; i++) {
      const x = from + ((to - from) * i) / 160;
      const y = fn.evaluate({ x, ...vars });
      const span = yMax - yMin;
      if (!Number.isFinite(y) || y > yMax + span * 2 || y < yMin - span * 2) {
        pen = false;
        continue;
      }
      parts.push(`${pen ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
      pen = true;
    }
    return parts.join(" ");
  };

  const range = domain
    ? ([domain[0].evaluate(vars), domain[1].evaluate(vars)] as [number, number])
    : null;
  const shown =
    range && range[0] <= range[1]
      ? ([Math.max(range[0], spec.xMin), Math.min(range[1], spec.xMax)] as [number, number])
      : null;

  const ticks = (min: number, max: number) => {
    const step = tickStep(max - min);
    const list: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
      list.push(Math.round(v / step) * step);
    }
    return list;
  };
  const axisY = Math.min(H - PAD, Math.max(PAD, sy(0)));
  const axisX = Math.min(W - PAD, Math.max(PAD, sx(0)));
  const fmt = (v: number) => String(Math.round(v * 100) / 100);

  return (
    <div
      className="graph"
      // グラフの上での操作を、カードを運ぶ操作にしない
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`y = ${spec.expr} のグラフ`}>
        <defs>
          <clipPath id={clip}>
            <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} />
          </clipPath>
        </defs>
        {ticks(spec.xMin, spec.xMax).map((v) => (
          <g key={`x${v}`}>
            <line className="graph-grid" x1={sx(v)} y1={PAD} x2={sx(v)} y2={H - PAD} />
            {v !== 0 && (
              <text className="graph-label" x={sx(v)} y={axisY + 12} textAnchor="middle">
                {fmt(v)}
              </text>
            )}
          </g>
        ))}
        {ticks(yMin, yMax).map((v) => (
          <g key={`y${v}`}>
            <line className="graph-grid" x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} />
            {v !== 0 && (
              <text className="graph-label" x={axisX - 4} y={sy(v) + 3} textAnchor="end">
                {fmt(v)}
              </text>
            )}
          </g>
        ))}
        <line className="graph-axis" x1={PAD} y1={axisY} x2={W - PAD} y2={axisY} />
        <line className="graph-axis" x1={axisX} y1={PAD} x2={axisX} y2={H - PAD} />
        <text className="graph-label" x={W - PAD + 4} y={axisY + 3}>
          x
        </text>
        <text className="graph-label" x={axisX} y={PAD - 6} textAnchor="middle">
          y
        </text>
        <text className="graph-label" x={axisX - 4} y={axisY + 12} textAnchor="end">
          O
        </text>
        <g clipPath={`url(#${clip})`}>
          <path className={shown ? "graph-curve is-faint" : "graph-curve"} d={path(spec.xMin, spec.xMax)} />
          {shown && shown[0] <= shown[1] && (
            <>
              <path className="graph-curve" d={path(shown[0], shown[1])} />
              {range!.map((x, i) => {
                const y = fn.evaluate({ x, ...vars });
                return Number.isFinite(y) ? (
                  <circle key={i} className="graph-dot" cx={sx(x)} cy={sy(y)} r={3.5} />
                ) : null;
              })}
            </>
          )}
        </g>
      </svg>
      {spec.param && (
        <label className="graph-slider">
          <span>
            {spec.param.name} = {fmt(value)}
          </span>
          <input
            type="range"
            min={spec.param.min}
            max={spec.param.max}
            step={(spec.param.max - spec.param.min) / 50}
            value={value}
            onChange={(e) => setParam(Number(e.target.value))}
          />
        </label>
      )}
    </div>
  );
}
