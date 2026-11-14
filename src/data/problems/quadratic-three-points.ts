import type { Problem } from "../../types";

export const threePoints: Problem = {
  "id": "quadratic-three-points",
  "title": "3点を通る2次関数を決める",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "グラフが "
    },
    {
      "text": "3点",
      "fragmentId": "f1"
    },
    {
      "text": " "
    },
    {
      "text": "$(0,\\,1)$",
      "fragmentId": "f2"
    },
    {
      "text": "，$(1,\\,0)$，$(2,\\,3)$ を "
    },
    {
      "text": "通る",
      "fragmentId": "f3"
    },
    {
      "text": " 2次関数を求めよ。"
    }
  ],
  "fragments": [
    {
      "id": "f1",
      "priority": 1
    },
    {
      "id": "f3",
      "priority": 2
    },
    {
      "id": "f2",
      "priority": 3
    }
  ],
  "associations": [
    {
      "id": "a1",
      "fragmentId": "f1",
      "patternId": "general-form",
      "title": "3点を通る → $y=ax^2+bx+c$ とおく",
      "detail": "頂点も軸も分からないので一般形でおく。文字は3つ、条件も3つ。"
    },
    {
      "id": "a2",
      "fragmentId": "f3",
      "patternId": "substitute-point",
      "title": "点を通る → 座標を代入する",
      "detail": "3点それぞれの座標を入れると、$a,\\,b,\\,c$ の式が3つできる。"
    },
    {
      "id": "a3",
      "fragmentId": "f2",
      "patternId": "y-intercept",
      "title": "$x=0$ の点 → $c$ がすぐ分かる",
      "detail": "$(0,\\,1)$ を代入すると $c=1$。先に使うと、残りは $a,\\,b$ の連立方程式になる。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a2",
        "a3"
      ],
      "title": "$c=1$ を先に決めてから、残り2点で $a,\\,b$ の連立方程式を解く",
      "detail": "3つの式を同時に解くより、すぐ決まる文字から片づけるほうが楽。"
    }
  ],
  "skeleton": [
    {
      "id": "k1",
      "thoughts": [
        "a1"
      ]
    },
    {
      "id": "k2",
      "thoughts": [
        "c1",
        "a2"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "求める2次関数を $y=ax^2+bx+c$ とおく。",
      "fromFragments": [
        "f1"
      ],
      "fromThoughts": [
        "a1"
      ]
    },
    {
      "id": "s2",
      "text": "点 $(0,\\,1)$ を通るから $c=1$",
      "fromFragments": [
        "f2",
        "f3"
      ],
      "fromThoughts": [
        "a2",
        "a3"
      ]
    },
    {
      "id": "s3",
      "text": "点 $(1,\\,0)$，$(2,\\,3)$ を通るから $a+b+1=0$，$4a+2b+1=3$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a2",
        "c1"
      ]
    },
    {
      "id": "s4",
      "text": "これを解いて $a=2$，$b=-3$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "c1"
      ]
    },
    {
      "id": "s5",
      "text": "よって $y=2x^2-3x+1$",
      "fromFragments": [
        "f1"
      ],
      "fromThoughts": [
        "a1"
      ]
    }
  ]
};
