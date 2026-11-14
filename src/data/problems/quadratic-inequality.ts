import type { Problem } from "../../types";

export const inequality: Problem = {
  "id": "quadratic-inequality",
  "title": "2次不等式を解く",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "2次不等式",
      "fragmentId": "f1"
    },
    {
      "text": " "
    },
    {
      "text": "$x^2-x-6$",
      "fragmentId": "f2"
    },
    {
      "text": " "
    },
    {
      "text": "$>0$",
      "fragmentId": "f3"
    },
    {
      "text": " を解け。"
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
      "patternId": "ineq-graph",
      "title": "2次不等式 → グラフと $x$ 軸の上下で読む",
      "detail": "$y=x^2-x-6$ のグラフをかき、条件に合う $x$ の範囲を読み取る。"
    },
    {
      "id": "a2",
      "fragmentId": "f2",
      "patternId": "factor-roots",
      "title": "まず $=0$ を解く → $x$ 軸との交点",
      "detail": "$x^2-x-6=(x-3)(x+2)$ なので、交点は $x=-2,\\ 3$。ここが解の範囲の境目になる。"
    },
    {
      "id": "a3",
      "fragmentId": "f2",
      "patternId": "convex",
      "title": "$x^2$ の係数が正 → 下に凸",
      "detail": "下に凸なので、2つの交点の間で $x$ 軸より下、外側で上になる。"
    },
    {
      "id": "a4",
      "fragmentId": "f3",
      "patternId": "ineq-sign",
      "title": "$>0$ → グラフが $x$ 軸より上の部分",
      "detail": "$y>0$ となる $x$ の範囲を答える。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a1",
        "a2"
      ],
      "title": "グラフは $x$ 軸と $x=-2,\\ 3$ で交わる",
      "detail": "交点が分かれば、グラフのおおよその形がかける。"
    },
    {
      "id": "c2",
      "from": [
        "a3",
        "a4"
      ],
      "title": "下に凸で $x$ 軸より上 → 2つの交点の外側",
      "detail": "下に凸の放物線が $x$ 軸より上にあるのは、左の交点より左と、右の交点より右。"
    }
  ],
  "skeleton": [
    {
      "id": "k1",
      "thoughts": [
        "c1",
        "a2"
      ]
    },
    {
      "id": "k2",
      "thoughts": [
        "c2"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "$x^2-x-6=0$ を解くと、$(x-3)(x+2)=0$ より $x=-2,\\ 3$",
      "fromFragments": [
        "f2"
      ],
      "fromThoughts": [
        "a2"
      ]
    },
    {
      "id": "s2",
      "text": "$y=x^2-x-6$ のグラフは下に凸の放物線で、$x$ 軸と $x=-2,\\ 3$ で交わる。",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "a1",
        "a3",
        "c1"
      ]
    },
    {
      "id": "s3",
      "text": "グラフが $x$ 軸より上側にある $x$ の範囲を求めて $x<-2,\\ 3<x$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a4",
        "c2"
      ]
    }
  ]
};
