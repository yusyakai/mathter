import type { Problem } from "../../types";

export const tangent: Problem = {
  "id": "quadratic-tangent",
  "title": "グラフがx軸と接する条件",
  "unit": "数学Ⅰ 2次関数",
  "segments": [
    {
      "text": "2次関数 "
    },
    {
      "text": "$y=x^2-2kx+k+2$",
      "fragmentId": "f1"
    },
    {
      "text": " のグラフが "
    },
    {
      "text": "$x$ 軸と接する",
      "fragmentId": "f2"
    },
    {
      "text": " とき、"
    },
    {
      "text": "定数 $k$ の値",
      "fragmentId": "f3"
    },
    {
      "text": " を求めよ。"
    }
  ],
  "fragments": [
    {
      "id": "f2",
      "priority": 1
    },
    {
      "id": "f3",
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
      "fragmentId": "f2",
      "patternId": "tangent",
      "title": "共有点が1個",
      "detail": "$x$ 軸と接する ＝ 共有点がちょうど1個。$y=0$ となる $x$ がちょうど1つ（重解）。"
    },
    {
      "id": "a2",
      "fragmentId": "f2",
      "patternId": "discriminant",
      "title": "判別式 $D$",
      "detail": "$x$ 軸との共有点の個数は、$x^2-2kx+k+2=0$ の実数解の個数と同じ。判別式 $D$ の符号で分かる。"
    },
    {
      "id": "a3",
      "fragmentId": "f1",
      "patternId": "half-discriminant",
      "title": "$\\dfrac{D}{4}$ を使う",
      "detail": "$x$ の係数が $-2k=2\\times(-k)$ の形なので、$\\dfrac{D}{4}=(-k)^2-1\\cdot(k+2)$ で計算が楽になる。"
    },
    {
      "id": "a4",
      "fragmentId": "f3",
      "patternId": "condition-equation",
      "title": "$k$ の方程式にする",
      "detail": "求めるのは $k$。「接する」という条件を、$k$ だけの式に直せば解ける。"
    }
  ],
  "combinations": [
    {
      "id": "c1",
      "from": [
        "a1",
        "a2"
      ],
      "title": "$D=0$",
      "detail": "接する ⇔ 共有点が1個 ⇔ 実数解が1個（重解） ⇔ 判別式が $0$。",
      "graph": {
        "expr": "x^2-2kx+k+2",
        "param": {
          "name": "k",
          "min": -2,
          "max": 3,
          "value": 0.5
        },
        "xMin": -4,
        "xMax": 6,
        "yMin": -4,
        "yMax": 10
      }
    },
    {
      "id": "c2",
      "from": [
        "a3",
        "a4"
      ],
      "title": "$\\dfrac{D}{4}$ を $k$ で表す",
      "detail": "$\\dfrac{D}{4}=k^2-k-2$。$\\dfrac{D}{4}=0$ は $k$ の2次方程式になる。"
    }
  ],
  "skeleton": [
    {
      "id": "k1",
      "thoughts": [
        "c1"
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
      "text": "2次方程式 $x^2-2kx+k+2=0$ の判別式を $D$ とする。",
      "fromFragments": [
        "f1",
        "f2"
      ],
      "fromThoughts": [
        "a2"
      ]
    },
    {
      "id": "s2",
      "text": "グラフが $x$ 軸と接するのは $D=0$ のときである。",
      "fromFragments": [
        "f2"
      ],
      "fromThoughts": [
        "a1",
        "c1"
      ]
    },
    {
      "id": "s3",
      "text": "$\\dfrac{D}{4}=(-k)^2-(k+2)=k^2-k-2$",
      "fromFragments": [
        "f1"
      ],
      "fromThoughts": [
        "a3",
        "c2"
      ]
    },
    {
      "id": "s4",
      "text": "$k^2-k-2=0$ より $(k-2)(k+1)=0$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a4",
        "c2"
      ]
    },
    {
      "id": "s5",
      "text": "よって $k=-1,\\ 2$",
      "fromFragments": [
        "f3"
      ],
      "fromThoughts": [
        "a4"
      ]
    }
  ]
};
