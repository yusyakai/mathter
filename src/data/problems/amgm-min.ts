import type { Problem } from "../../types";

export const amgmMin: Problem = {
  "id": "amgm-min",
  "title": "和の最小値（相加平均・相乗平均）",
  "unit": "数学Ⅱ 式と証明",
  "segments": [
    {
      "text": "$x>0$",
      "fragmentId": "f1"
    },
    {
      "text": " のとき、"
    },
    {
      "text": "$x+\\dfrac{4}{x}$",
      "fragmentId": "f2"
    },
    {
      "text": " の "
    },
    {
      "text": "最小値",
      "fragmentId": "f3"
    },
    {
      "text": " を求めよ。"
    }
  ],
  "fragments": [
    {
      "id": "f3",
      "priority": 1
    },
    {
      "id": "f2",
      "priority": 2
    },
    {
      "id": "f1",
      "priority": 3
    }
  ],
  "associations": [
    {
      "id": "b1",
      "patternId": "amgm-positive",
      "fragmentId": "f1",
      "title": "相加平均・相乗平均",
      "detail": "「正の数」という条件があると、相加平均・相乗平均の関係 $p+q\\ge 2\\sqrt{pq}$ が使える。わざわざ $x>0$ と書いてあるのには理由がある。"
    },
    {
      "id": "b2",
      "patternId": "amgm-product",
      "fragmentId": "f2",
      "title": "積が定数",
      "detail": "$x$ と $\\dfrac{4}{x}$ は、掛けると $x$ が消えて $4$ になる。「和の形で、積が定数」は相加平均・相乗平均の合図。"
    },
    {
      "id": "b3",
      "patternId": "equality-check",
      "fragmentId": "f3",
      "title": "等号成立を確かめる",
      "detail": "$\\ge 4$ が示せても、実際に $4$ になる $x$ がなければ最小値とは言えない。等号が成り立つ $x$ があるかを確かめる。"
    }
  ],
  "combinations": [
    {
      "id": "d1",
      "from": [
        "b1",
        "b2"
      ],
      "title": "$x+\\dfrac{4}{x}\\ge 4$",
      "detail": "$x>0$，$\\dfrac{4}{x}>0$ で、積が定数 $4$ になるので、相加平均・相乗平均の関係から $x+\\dfrac{4}{x}\\ge 2\\sqrt{x\\cdot\\dfrac{4}{x}}=4$。"
    }
  ],
  "skeleton": [
    {
      "id": "k1",
      "thoughts": [
        "d1"
      ]
    },
    {
      "id": "k2",
      "thoughts": [
        "b3"
      ]
    }
  ],
  "solution": [
    {
      "id": "t1",
      "text": "$x>0$ より $\\dfrac{4}{x}>0$ であるから、相加平均と相乗平均の関係により $x+\\dfrac{4}{x}\\ge 2\\sqrt{x\\cdot\\dfrac{4}{x}}=4$",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "b1",
        "b2",
        "d1"
      ]
    },
    {
      "id": "t2",
      "text": "等号が成り立つのは $x=\\dfrac{4}{x}$ すなわち $x^2=4$ のときで、$x>0$ より $x=2$",
      "fromFragments": [
        "f1",
        "f3"
      ],
      "fromThoughts": [
        "b3"
      ]
    },
    {
      "id": "t3",
      "text": "よって、$x=2$ のとき最小値 $4$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "b3"
      ]
    }
  ]
};
