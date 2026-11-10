import type { Problem } from "../../types";
import { amgmMin } from "./amgm-min";
import { quadraticMin } from "./quadratic-min";

/** アプリに内蔵する問題。追加したらここに並べる。 */
export const problems: Problem[] = [quadraticMin, amgmMin];
