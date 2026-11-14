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
      "title": "文字 $a$ を含む → グラフの位置が $a$ で変わる",
      "detail": "$a$ の値が決まっていないので、グラフは1つに決まらない。何が動くのかを調べる。"
    },
    {
      "id": "a2",
      "fragmentId": "f2",
      "patternId": "complete-square",
      "title": "平方完成して、軸を調べる",
      "detail": "$y=(x-a)^2-a^2$ と変形できる。軸は $x=a$。"
    },
    {
      "id": "a3",
      "fragmentId": "f2",
      "patternId": "convex",
      "title": "$x^2$ の係数が正 → 下に凸",
      "detail": "下に凸なので、軸から離れるほど $y$ は大きくなる。"
    },
    {
      "id": "a4",
      "fragmentId": "f3",
      "patternId": "domain-ends",
      "title": "定義域に制限 → 端点 $x=0,\\ 2$ が候補",
      "detail": "区間の両端は $x=0$ と $x=2$。そのまん中は $x=1$。"
    },
    {
      "id": "a5",
      "fragmentId": "f4",
      "patternId": "extreme-candidates",
      "title": "最大値の候補は「頂点」か「端点」",
      "detail": "頂点と両端のうち、一番高い所を探す。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a2",
        "a1"
      ],
      "title": "軸は $x=a$。$a$ によって放物線が左右に動く",
      "detail": "$a$ が変わると軸が左右に動き、どちらの端点が高いかが入れ替わる。"
    },
    {
      "id": "c2",
      "from": [
        "a3",
        "a5"
      ],
      "title": "下に凸なので、最大値は軸から遠いほうの端点",
      "detail": "下に凸では頂点が一番低いので、最大値は頂点ではとらない。軸から遠い端点ほど高い。"
    },
    {
      "id": "c3",
      "from": [
        "c2",
        "a4"
      ],
      "title": "どちらの端点が遠いかは、軸が区間のまん中 $x=1$ の左か右かで決まる",
      "detail": "軸がまん中より左なら右端 $x=2$ が遠く、右なら左端 $x=0$ が遠い。まん中なら同じ高さ。"
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
