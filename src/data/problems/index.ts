import type { Problem } from "../../types";
import { amgmMin } from "./amgm-min";
import { quadraticMin } from "./quadratic-min";
import { rangeMinMax } from "./quadratic-range-minmax";
import { axisMax } from "./quadratic-axis-max";
import { movingDomain } from "./quadratic-moving-domain";
import { vertexPoint } from "./quadratic-vertex-point";
import { threePoints } from "./quadratic-three-points";
import { tangent } from "./quadratic-tangent";
import { inequality } from "./quadratic-inequality";
import { alwaysPositive } from "./quadratic-always-positive";
import { wordArea } from "./quadratic-word-area";

/** アプリに内蔵する問題。追加したらここに並べる。 */
export const problems: Problem[] = [
  rangeMinMax,
  quadraticMin,
  axisMax,
  movingDomain,
  vertexPoint,
  threePoints,
  inequality,
  tangent,
  alwaysPositive,
  wordArea,
  amgmMin,
];
