import type { Problem } from "../../types";

export const wordArea: Problem = {
  "id": "quadratic-word-area",
  "title": "文章題：長方形の面積の最大値",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "長さ $20\\,\\text{cm}$ の針金",
      "fragmentId": "f1"
    },
    {
      "text": "を折り曲げて "
    },
    {
      "text": "長方形",
      "fragmentId": "f2"
    },
    {
      "text": " を作る。この長方形の "
    },
    {
      "text": "面積の最大値",
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
      "id": "a1",
      "fragmentId": "f3",
      "patternId": "set-variable",
      "title": "最大値を求めたい量を、$x$ の式で表す",
      "detail": "面積が何で決まるかを考える。1つの文字 $x$ の式にできれば、関数の最大値の問題になる。"
    },
    {
      "id": "a2",
      "fragmentId": "f3",
      "patternId": "complete-square",
      "title": "2次式になれば、平方完成で最大値が分かる",
      "detail": "$x^2$ の係数が負（上に凸）なら、頂点で最大になる。"
    },
    {
      "id": "a3",
      "fragmentId": "f2",
      "patternId": "figure-quantities",
      "title": "長方形 → 縦と横で決まる。面積は 縦×横",
      "detail": "縦と横の長さが分かれば、面積が式で書ける。"
    },
    {
      "id": "a4",
      "fragmentId": "f1",
      "patternId": "constraint-relation",
      "title": "針金の長さが一定 → 縦＋横＝$10$",
      "detail": "周の長さが $20$ なので、縦と横の和は $10$。一方が決まれば、もう一方も決まる。"
    },
    {
      "id": "a5",
      "fragmentId": "f1",
      "patternId": "variable-range",
      "title": "長さは正 → $x$ のとりうる範囲が決まる",
      "detail": "縦も横も正の数でなければならない。最大値はその範囲の中で考える。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a3",
        "a4"
      ],
      "title": "縦を $x$ とすると、横は $10-x$",
      "detail": "文字を1つに減らせた。"
    },
    {
      "id": "c2",
      "from": [
        "c1",
        "a1"
      ],
      "title": "面積は $S=x(10-x)$",
      "detail": "面積が $x$ の2次式で表せた。"
    }
  ],
  "skeleton": [
    {
      "id": "k1",
      "thoughts": [
        "c2",
        "c1"
      ]
    },
    {
      "id": "k2",
      "thoughts": [
        "a5"
      ]
    },
    {
      "id": "k3",
      "thoughts": [
        "a2"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "長方形の縦の長さを $x\\,\\text{cm}$ とすると、横の長さは $(10-x)\\,\\text{cm}$ である。",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "a3",
        "a4",
        "c1"
      ]
    },
    {
      "id": "s2",
      "text": "$x>0$ かつ $10-x>0$ であるから $0<x<10$",
      "fromFragments": [
        "f1"
      ],
      "fromThoughts": [
        "a5"
      ]
    },
    {
      "id": "s3",
      "text": "面積を $S\\,\\text{cm}^2$ とすると $S=x(10-x)=-(x-5)^2+25$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a1",
        "a2",
        "c2"
      ]
    },
    {
      "id": "s4",
      "text": "$0<x<10$ の範囲で、$S$ は $x=5$ で最大値 $25$ をとる。",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a2",
        "a5"
      ]
    },
    {
      "id": "s5",
      "text": "よって、面積の最大値は $25\\,\\text{cm}^2$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a1"
      ]
    }
  ]
};
