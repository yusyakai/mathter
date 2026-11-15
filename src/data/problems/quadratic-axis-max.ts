import type { Problem } from "../../types";

export const axisMax: Problem = {
  "id": "quadratic-axis-max",
  "title": "文字を含む2次関数の最大値",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "$a$ は定数",
      "fragmentId": "f1"
    },
    {
      "text": "とする。2次関数 "
    },
    {
      "text": "$y=x^2-2ax$",
      "fragmentId": "f2"
    },
    {
      "text": " （"
    },
    {
      "text": "$0\\le x\\le 2$",
      "fragmentId": "f3"
    },
    {
      "text": "）の "
    },
    {
      "text": "最大値",
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
      "id": "f2",
      "priority": 2
    },
    {
      "id": "f1",
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
      "patternId": "param-moves",
      "title": "$a$ でグラフが動く",
      "detail": "式に文字 $a$ を含む。$a$ の値が決まっていないので、グラフは1つに決まらない。何が動くのかを調べる。"
    },
    {
      "id": "a2",
      "fragmentId": "f2",
      "patternId": "complete-square",
      "title": "平方完成",
      "detail": "平方完成すると軸が分かる。$y=(x-a)^2-a^2$ なので、軸は $x=a$。"
    },
    {
      "id": "a3",
      "fragmentId": "f2",
      "patternId": "convex",
      "title": "下に凸",
      "detail": "$x^2$ の係数が正なので、グラフは下に凸。軸から離れるほど $y$ は大きくなる。"
    },
    {
      "id": "a4",
      "fragmentId": "f3",
      "patternId": "domain-ends",
      "title": "端点 $x=0,\\ 2$",
      "detail": "定義域に制限があるので、端点が候補になる。区間の両端は $x=0$ と $x=2$。そのまん中は $x=1$。"
    },
    {
      "id": "a5",
      "fragmentId": "f4",
      "patternId": "extreme-candidates",
      "title": "頂点か端点",
      "detail": "最大値の候補は頂点か端点。頂点と両端のうち、一番高い所を探す。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a2",
        "a1"
      ],
      "title": "軸 $x=a$ が動く",
      "detail": "軸は $x=a$。$a$ が変わると放物線が左右に動き、どちらの端点が高いかが入れ替わる。",
      "graph": {
        "expr": "x^2-2ax",
        "param": {
          "name": "a",
          "min": -1,
          "max": 3,
          "value": 0.5
        },
        "xMin": -2,
        "xMax": 4,
        "yMin": -10,
        "yMax": 9,
        "domain": [
          "0",
          "2"
        ]
      }
    },
    {
      "id": "c2",
      "from": [
        "a3",
        "a5"
      ],
      "title": "軸から遠い端点",
      "detail": "下に凸では頂点が一番低いので、最大値は頂点ではとらない。軸から遠い端点ほど高いので、最大値は軸から遠いほうの端点でとる。"
    },
    {
      "id": "c3",
      "from": [
        "c2",
        "a4"
      ],
      "title": "軸と中央 $x=1$ で場合分け",
      "detail": "どちらの端点が遠いかは、軸が区間のまん中 $x=1$ の左か右かで決まる。軸がまん中より左なら右端 $x=2$ が遠く、右なら左端 $x=0$ が遠い。まん中なら同じ高さ。"
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
        "c3"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "$y=(x-a)^2-a^2$ と変形できる。グラフは下に凸の放物線で、軸は $x=a$。",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "a1",
        "a2",
        "a3",
        "c1"
      ]
    },
    {
      "id": "s2",
      "text": "最大値は軸から遠いほうの端点でとるから、定義域の中央 $x=1$ と軸の位置関係で場合分けする。",
      "fromFragments": [
        "f3",
        "f4"
      ],
      "fromThoughts": [
        "a4",
        "a5",
        "c2",
        "c3"
      ]
    },
    {
      "id": "s3",
      "text": "(i) $a<1$ のとき　$x=2$ で最大値 $4-4a$",
      "fromFragments": [
        "f3",
        "f4"
      ],
      "fromThoughts": [
        "c3"
      ]
    },
    {
      "id": "s4",
      "text": "(ii) $a=1$ のとき　$x=0,\\ 2$ で最大値 $0$",
      "fromFragments": [
        "f3",
        "f4"
      ],
      "fromThoughts": [
        "c3"
      ]
    },
    {
      "id": "s5",
      "text": "(iii) $a>1$ のとき　$x=0$ で最大値 $0$",
      "fromFragments": [
        "f3",
        "f4"
      ],
      "fromThoughts": [
        "c3"
      ]
    }
  ]
};
