import type { Problem } from "../../types";

export const amgmMin: Problem = {
  id: "amgm-min",
  title: "和の最小値（相加平均・相乗平均）",
  unit: "数学Ⅱ 式と証明",
  segments: [
    { text: "$x>0$", fragmentId: "f1" },
    { text: " のとき、" },
    { text: "$x+\\dfrac{4}{x}$", fragmentId: "f2" },
    { text: " の " },
    { text: "最小値", fragmentId: "f3" },
    { text: " を求めよ。" },
  ],
  associations: [
    {
      id: "b1",
      fragmentId: "f1",
      title: "「正の数」という条件 → 相加平均・相乗平均が使える",
      detail:
        "わざわざ $x>0$ と書いてあるのには理由がある。正の数どうしなら $p+q\\ge 2\\sqrt{pq}$ が使える。",
    },
    {
      id: "b2",
      fragmentId: "f2",
      title: "$x$ と $\\dfrac{4}{x}$ は、掛けると $x$ が消える",
      detail:
        "$x\\cdot\\dfrac{4}{x}=4$ で定数になる。「和の形で、積が定数」は相加平均・相乗平均の合図。",
    },
    {
      id: "b3",
      fragmentId: "f3",
      title: "「〜以上」だけでは最小値と言えない",
      detail:
        "$\\ge 4$ が示せても、実際に $4$ になる $x$ がなければ最小値ではない。等号が成り立つ $x$ があるかを確認する。",
    },
  ],
  combinations: [
    {
      id: "d1",
      from: ["b1", "b2"],
      title: "相加平均・相乗平均：$x+\\dfrac{4}{x}\\ge 2\\sqrt{x\\cdot\\dfrac{4}{x}}=4$",
      detail:
        "$x>0$，$\\dfrac{4}{x}>0$ で、積が定数 $4$ になるので、和は $4$ 以上と分かる。",
    },
    {
      id: "d2",
      from: ["d1", "b3"],
      title: "等号成立 $x=\\dfrac{4}{x}$ を確認 → $x=2$ で最小値 $4$",
      detail:
        "等号は2つの数が等しいとき。$x=\\dfrac{4}{x}$ から $x^2=4$、$x>0$ より $x=2$。実際に $4$ になるので最小値は $4$。",
    },
  ],
  solution: [
    {
      id: "t1",
      text: "$x>0$ より $\\dfrac{4}{x}>0$ であるから、相加平均と相乗平均の関係により $x+\\dfrac{4}{x}\\ge 2\\sqrt{x\\cdot\\dfrac{4}{x}}=4$",
      fromFragments: ["f1", "f2"],
      fromThoughts: ["b1", "b2", "d1"],
    },
    {
      id: "t2",
      text: "等号が成り立つのは $x=\\dfrac{4}{x}$ すなわち $x^2=4$ のときで、$x>0$ より $x=2$",
      fromFragments: ["f1", "f3"],
      fromThoughts: ["b3", "d2"],
    },
    {
      id: "t3",
      text: "よって、$x=2$ のとき最小値 $4$",
      fromFragments: ["f3"],
      fromThoughts: ["d2"],
    },
  ],
};
