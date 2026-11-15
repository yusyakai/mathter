import type { Problem } from "../../types";

export const alwaysPositive: Problem = {
  "id": "quadratic-always-positive",
  "title": "すべての実数で成り立つ2次不等式",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "すべての実数 $x$ について",
      "fragmentId": "f1"
    },
    {
      "text": "、不等式 "
    },
    {
      "text": "$x^2+2kx+k+2>0$",
      "fragmentId": "f2"
    },
    {
      "text": " が成り立つような "
    },
    {
      "text": "定数 $k$ の値の範囲",
      "fragmentId": "f3"
    },
    {
      "text": " を求めよ。"
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
      "patternId": "all-x",
      "title": "グラフ全体で考える",
      "detail": "「すべての $x$ で成り立つ」とは、1つの $x$ ではなく全部の $x$ のこと。$y=x^2+2kx+k+2$ のグラフ全体が条件を満たすかを見る。"
    },
    {
      "id": "a2",
      "fragmentId": "f2",
      "patternId": "ineq-sign",
      "title": "$x$ 軸より上",
      "detail": "$>0$ は、グラフが $x$ 軸より上にあるということ。"
    },
    {
      "id": "a3",
      "fragmentId": "f2",
      "patternId": "convex",
      "title": "下に凸",
      "detail": "$x^2$ の係数が正なので、グラフは下に凸。頂点が一番低い。頂点さえ $x$ 軸より上なら、全体が上にある。"
    },
    {
      "id": "a4",
      "fragmentId": "f2",
      "patternId": "half-discriminant",
      "title": "$\\dfrac{D}{4}$ を使う",
      "detail": "$x$ の係数が $2k$（$2\\times\\square$ の形）なので、$\\dfrac{D}{4}=k^2-1\\cdot(k+2)$ で計算が楽になる。"
    },
    {
      "id": "a5",
      "fragmentId": "f3",
      "patternId": "condition-equation",
      "title": "$k$ の不等式にする",
      "detail": "求めるのは $k$ の範囲。「すべての $x$ で成り立つ」という条件を、$k$ だけの不等式に直す。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a1",
        "a2"
      ],
      "title": "$x$ 軸と共有点なし",
      "detail": "グラフ全体が $x$ 軸より上にある。どの $x$ でも $y>0$ ということは、グラフが $x$ 軸に触れもしない。",
      "graph": {
        "expr": "x^2+2kx+k+2",
        "param": {
          "name": "k",
          "min": -2,
          "max": 3,
          "value": 0.5
        },
        "xMin": -5,
        "xMax": 4,
        "yMin": -4,
        "yMax": 10
      }
    },
    {
      "id": "c2",
      "from": [
        "c1",
        "a3"
      ],
      "title": "$D<0$",
      "detail": "下に凸の放物線が $x$ 軸と共有点をもたなければ、全体が $x$ 軸より上にある。共有点なしは $D<0$。"
    },
    {
      "id": "c3",
      "from": [
        "a4",
        "a5"
      ],
      "title": "$\\dfrac{D}{4}<0$ を解く",
      "detail": "$\\dfrac{D}{4}=k^2-k-2$。$D<0$ は、$k$ の2次不等式 $k^2-k-2<0$ になる。"
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
        "c3"
      ]
    }
  ],
  "solution": [
    {
      "id": "s1",
      "text": "$y=x^2+2kx+k+2$ のグラフは下に凸の放物線である。",
      "fromFragments": [
        "f2"
      ],
      "fromThoughts": [
        "a3"
      ]
    },
    {
      "id": "s2",
      "text": "すべての実数 $x$ について $y>0$ となるのは、グラフが $x$ 軸と共有点をもたないときである。",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "a1",
        "a2",
        "c1"
      ]
    },
    {
      "id": "s3",
      "text": "2次方程式 $x^2+2kx+k+2=0$ の判別式を $D$ とすると、求める条件は $D<0$",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "c2"
      ]
    },
    {
      "id": "s4",
      "text": "$\\dfrac{D}{4}=k^2-(k+2)=k^2-k-2$ であるから $(k-2)(k+1)<0$",
      "fromFragments": [
        "f2",
        "f3"
      ],
      "fromThoughts": [
        "a4",
        "a5",
        "c3"
      ]
    },
    {
      "id": "s5",
      "text": "よって $-1<k<2$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a5"
      ]
    }
  ]
};
