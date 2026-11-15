import type { Problem } from "../../types";

export const rangeMinMax: Problem = {
  "id": "quadratic-range-minmax",
  "title": "定義域のある2次関数の最大・最小",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "2次関数",
      "fragmentId": "f1"
    },
    {
      "text": " "
    },
    {
      "text": "$y=x^2-4x+1$",
      "fragmentId": "f2"
    },
    {
      "text": " （"
    },
    {
      "text": "$0\\le x\\le 3$",
      "fragmentId": "f3"
    },
    {
      "text": "）の "
    },
    {
      "text": "最大値と最小値",
      "fragmentId": "f4"
    },
    {
      "text": " を求めよ。"
    }
  ],
  "fragments": [
    {
      "id": "f4",
      "priority": 1
    },
    {
      "id": "f1",
      "priority": 2
    },
    {
      "id": "f2",
      "priority": 3
    },
    {
      "id": "f3",
      "priority": 4
    }
  ],
  "associations": [
    {
      "id": "a1",
      "fragmentId": "f1",
      "patternId": "complete-square",
      "title": "平方完成",
      "detail": "平方完成すると、頂点と軸が分かる。$y=(x-2)^2-3$ なので、頂点は $(2,\\,-3)$、軸は $x=2$。"
    },
    {
      "id": "a2",
      "fragmentId": "f2",
      "patternId": "convex",
      "title": "下に凸",
      "detail": "$x^2$ の係数が正なので、グラフは下に凸。頂点が一番低く、軸から離れるほど $y$ は大きくなる。"
    },
    {
      "id": "a3",
      "fragmentId": "f3",
      "patternId": "domain-ends",
      "title": "端点 $x=0,\\ 3$",
      "detail": "定義域に制限があるので、グラフの $0\\le x\\le 3$ の部分しか使えない。端点でも最大・最小をとることがある。"
    },
    {
      "id": "a4",
      "fragmentId": "f4",
      "patternId": "extreme-candidates",
      "title": "頂点か端点",
      "detail": "最大・最小の候補は、頂点と、定義域の両端の3つだけ。どれが一番高く、どれが一番低いかを調べる。"
    },
    {
      "id": "a5",
      "fragmentId": "f4",
      "patternId": "draw-graph",
      "title": "グラフをかく",
      "detail": "放物線と定義域を図にすると、どこが高く、どこが低いかが見える。軸からの遠さで端点の高さを比べられる。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a1",
        "a3"
      ],
      "title": "軸は定義域の中",
      "detail": "軸 $x=2$ は定義域 $0\\le x\\le 3$ の中にあるので、頂点が使える。端点は、$x=0$ が軸から $2$、$x=3$ が軸から $1$ 離れている。",
      "graph": {
        "expr": "x^2-4x+1",
        "xMin": -1,
        "xMax": 5,
        "yMin": -4,
        "yMax": 7,
        "domain": [
          "0",
          "3"
        ]
      }
    },
    {
      "id": "c2",
      "from": [
        "a2",
        "a4"
      ],
      "title": "頂点で最小",
      "detail": "下に凸なので、頂点が定義域の中にあれば、最小値は頂点でとる。最大値は端点のどちらか。"
    },
    {
      "id": "c3",
      "from": [
        "c2",
        "a5"
      ],
      "title": "最大は軸から遠い端点",
      "detail": "下に凸のグラフでは、軸から遠い点ほど高い。最小は頂点、最大は軸から遠いほうの端点 $x=0$。"
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
        "c3"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "$y=(x-2)^2-3$ と変形できる。グラフは下に凸の放物線で、軸は $x=2$、頂点は $(2,\\,-3)$。",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "a1",
        "a2"
      ]
    },
    {
      "id": "s2",
      "text": "軸 $x=2$ は定義域 $0\\le x\\le 3$ に含まれるから、$x=2$ で最小値 $-3$",
      "fromFragments": [
        "f3",
        "f4"
      ],
      "fromThoughts": [
        "a3",
        "a4",
        "c1",
        "c2"
      ]
    },
    {
      "id": "s3",
      "text": "軸から遠いほうの端点は $x=0$ であるから、$x=0$ で最大値 $1$",
      "fromFragments": [
        "f3",
        "f4"
      ],
      "fromThoughts": [
        "a5",
        "c3"
      ]
    }
  ]
};
