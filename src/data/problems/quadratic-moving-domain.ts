import type { Problem } from "../../types";

export const movingDomain: Problem = {
  "id": "quadratic-moving-domain",
  "title": "定義域が動く2次関数の最小値",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "$a>0$ とする。2次関数 "
    },
    {
      "text": "$y=x^2-2x+3$",
      "fragmentId": "f1"
    },
    {
      "text": " （"
    },
    {
      "text": "$0\\le x\\le a$",
      "fragmentId": "f2"
    },
    {
      "text": "）の "
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
      "id": "f1",
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
      "patternId": "complete-square",
      "title": "平方完成して、頂点と軸を調べる",
      "detail": "$y=(x-1)^2+2$ と変形できる。頂点は $(1,\\,2)$、軸は $x=1$。式に文字がないので、グラフは動かない。"
    },
    {
      "id": "a2",
      "fragmentId": "f1",
      "patternId": "convex",
      "title": "$x^2$ の係数が正 → 下に凸",
      "detail": "下に凸なので、頂点が一番低い。"
    },
    {
      "id": "a3",
      "fragmentId": "f2",
      "patternId": "domain-moves",
      "title": "定義域に文字 → 区間の右端が $a$ で動く",
      "detail": "左端は $x=0$ のまま、右端 $x=a$ だけが動く。$a$ が小さいと頂点まで届かない。"
    },
    {
      "id": "a4",
      "fragmentId": "f3",
      "patternId": "extreme-candidates",
      "title": "最小値の候補は「頂点」か「端点」",
      "detail": "頂点が使えるかどうかを、まず確かめる。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a2",
        "a4"
      ],
      "title": "頂点が定義域に入っていれば頂点で最小。入っていなければ軸に近い端点",
      "detail": "下に凸なので、頂点が使えるなら頂点が最小。使えないなら、軸に一番近い端点が最も低い。"
    },
    {
      "id": "c2",
      "from": [
        "a3",
        "c1"
      ],
      "title": "軸 $x=1$ が区間 $0\\le x\\le a$ に入るかどうかで場合分け",
      "detail": "右端 $a$ が $1$ に届かない（$a<1$）か、届く（$a\\ge 1$）かで分ける。"
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
        "c2"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "$y=(x-1)^2+2$ と変形できる。グラフは下に凸の放物線で、軸は $x=1$、頂点は $(1,\\,2)$。",
      "fromFragments": [
        "f1"
      ],
      "fromThoughts": [
        "a1",
        "a2"
      ]
    },
    {
      "id": "s2",
      "text": "軸 $x=1$ が定義域 $0\\le x\\le a$ に含まれるかどうかで場合分けする。",
      "fromFragments": [
        "f2",
        "f3"
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
      "text": "(i) $0<a<1$ のとき　$x=a$ で最小値 $a^2-2a+3$",
      "fromFragments": [
        "f2",
        "f3"
      ],
      "fromThoughts": [
        "c2"
      ]
    },
    {
      "id": "s4",
      "text": "(ii) $a\\ge 1$ のとき　$x=1$ で最小値 $2$",
      "fromFragments": [
        "f2",
        "f3"
      ],
      "fromThoughts": [
        "c2"
      ]
    }
  ]
};
