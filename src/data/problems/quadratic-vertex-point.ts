import type { Problem } from "../../types";

export const vertexPoint: Problem = {
  "id": "quadratic-vertex-point",
  "title": "頂点と通る点から2次関数を決める",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "グラフの "
    },
    {
      "text": "頂点が点 $(1,\\,-2)$",
      "fragmentId": "f1"
    },
    {
      "text": " で、"
    },
    {
      "text": "点 $(3,\\,6)$ を通る",
      "fragmentId": "f2"
    },
    {
      "text": " "
    },
    {
      "text": "2次関数を求めよ",
      "fragmentId": "f3"
    },
    {
      "text": "。"
    }
  ],
  "fragments": [
    {
      "id": "f1",
      "priority": 1
    },
    {
      "id": "f2",
      "priority": 2
    },
    {
      "id": "f3",
      "priority": 3
    }
  ],
  "associations": [
    {
      "id": "a1",
      "fragmentId": "f1",
      "patternId": "vertex-form",
      "title": "頂点が分かっている → $y=a(x-p)^2+q$ とおく",
      "detail": "頂点が $(1,\\,-2)$ なので $y=a(x-1)^2-2$ とおける。分からないのは $a$ だけ。"
    },
    {
      "id": "a2",
      "fragmentId": "f2",
      "patternId": "substitute-point",
      "title": "点を通る → 座標を代入する",
      "detail": "$x=3$，$y=6$ を式に入れると、$a$ の方程式ができる。"
    },
    {
      "id": "a3",
      "fragmentId": "f3",
      "patternId": "set-unknown",
      "title": "式を求める → 分からない係数を文字でおく",
      "detail": "文字が少なくなる形を選ぶ。条件の数だけ文字が決まる。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a3",
        "a1"
      ],
      "title": "$y=a(x-1)^2-2$ とおく（文字は $a$ の1つだけ）",
      "detail": "頂点の条件を使い切った形。残りの条件1つで $a$ が決まる。"
    }
  ],
  "skeleton": [
    {
      "id": "k1",
      "thoughts": [
        "c1",
        "a1"
      ]
    },
    {
      "id": "k2",
      "thoughts": [
        "a2"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "頂点が点 $(1,\\,-2)$ であるから、求める2次関数は $y=a(x-1)^2-2$ とおける。",
      "fromFragments": [
        "f1",
        "f3"
      ],
      "fromThoughts": [
        "a1",
        "a3",
        "c1"
      ]
    },
    {
      "id": "s2",
      "text": "グラフが点 $(3,\\,6)$ を通るから $6=a(3-1)^2-2$",
      "fromFragments": [
        "f2"
      ],
      "fromThoughts": [
        "a2"
      ]
    },
    {
      "id": "s3",
      "text": "これを解いて $a=2$",
      "fromFragments": [
        "f2"
      ],
      "fromThoughts": [
        "a2"
      ]
    },
    {
      "id": "s4",
      "text": "よって $y=2(x-1)^2-2$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "c1"
      ]
    }
  ]
};
