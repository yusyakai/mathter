import type { Problem } from "../../types";

export const quadraticMin: Problem = {
  id: "quadratic-min",
  title: "文字を含む2次関数の最小値",
  unit: "数学Ⅰ 2次関数",
  segments: [
    { text: "2次関数", fragmentId: "f1" },
    { text: " " },
    { text: "$y=x^2-2ax+3$", fragmentId: "f2" },
    { text: " の " },
    { text: "$0\\le x\\le 2$", fragmentId: "f3" },
    { text: " における " },
    { text: "最小値", fragmentId: "f4" },
    { text: " を求めよ。" },
  ],
  associations: [
    {
      id: "a1",
      fragmentId: "f1",
      title: "平方完成して、頂点と軸を調べる",
      detail:
        "2次関数は $y=(x-p)^2+q$ の形にすると、頂点 $(p,\\,q)$ と軸 $x=p$ が読み取れる。最大・最小の問題はまずここから。",
    },
    {
      id: "a2",
      fragmentId: "f1",
      title: "グラフ（放物線）をかいて考える",
      detail:
        "式だけで考えず、放物線と定義域を図にする。最大・最小は「グラフの一番高い所・低い所」を見る問題。",
    },
    {
      id: "a3",
      fragmentId: "f2",
      title: "$x^2$ の係数が正 → 下に凸",
      detail:
        "$x^2$ の係数は $1>0$ なので、グラフは下に凸。頂点が一番低く、軸から離れるほど $y$ は大きくなる。",
    },
    {
      id: "a4",
      fragmentId: "f2",
      title: "文字 $a$ を含む → グラフの位置が $a$ で変わる",
      detail:
        "$a$ の値が決まっていないので、グラフは1つに決まらない。「$a$ によって何が動くのか」を調べる必要がある。",
    },
    {
      id: "a5",
      fragmentId: "f3",
      title: "定義域に制限 → 端点 $x=0,\\ 2$ も候補",
      detail:
        "$x$ の範囲が区切られているので、グラフの一部分しか使えない。最大・最小は頂点だけでなく、端点 $x=0$ や $x=2$ でとることがある。",
    },
    {
      id: "a6",
      fragmentId: "f4",
      title: "最小値をとるのは「頂点」か「端点」",
      detail:
        "2次関数の最小値の候補は、頂点と定義域の端点しかない。どれが一番低いかを判断すればよい。",
    },
  ],
  combinations: [
    {
      id: "c1",
      from: ["a1", "a4"],
      title: "軸は $x=a$。$a$ によって放物線が左右に動く",
      detail:
        "平方完成すると $y=(x-a)^2-a^2+3$。軸は $x=a$、頂点は $(a,\\,-a^2+3)$。$a$ が変わると軸が左右に動く。",
    },
    {
      id: "c2",
      from: ["a3", "a6"],
      title: "軸が定義域の中なら頂点、外なら軸に近い端点で最小",
      detail:
        "下に凸なので、頂点が使えるなら頂点が最小。頂点が定義域の外にあるなら、軸に近い方の端点が一番低い。",
    },
    {
      id: "c3",
      from: ["c1", "a5"],
      title: "軸 $x=a$ が区間 $0\\le x\\le 2$ の左・中・右のどこか",
      detail:
        "動く軸と、動かない定義域の位置関係を考える。軸が区間の左（$a<0$）、中（$0\\le a\\le 2$）、右（$a>2$）の3通りがある。",
    },
    {
      id: "c4",
      from: ["c2", "c3"],
      title: "方針：$a<0$，$0\\le a\\le 2$，$a>2$ で場合分けして最小値を求める",
      detail:
        "$a<0$ なら左端 $x=0$、$0\\le a\\le 2$ なら頂点 $x=a$、$a>2$ なら右端 $x=2$ で最小。それぞれ $y$ の値を計算すればよい。",
    },
  ],
  solution: [
    {
      id: "s1",
      text: "$y=(x-a)^2-a^2+3$ と変形できるから、グラフは下に凸の放物線で、軸は直線 $x=a$ である。",
      fromFragments: ["f1", "f2"],
      fromThoughts: ["a1", "a3", "c1"],
    },
    {
      id: "s2",
      text: "軸 $x=a$ と定義域 $0\\le x\\le 2$ の位置関係で場合分けする。",
      fromFragments: ["f2", "f3"],
      fromThoughts: ["a4", "a5", "c3"],
    },
    {
      id: "s3",
      text: "(i) $a<0$ のとき　$x=0$ で最小値 $3$",
      fromFragments: ["f3", "f4"],
      fromThoughts: ["c2", "c4"],
    },
    {
      id: "s4",
      text: "(ii) $0\\le a\\le 2$ のとき　$x=a$ で最小値 $-a^2+3$",
      fromFragments: ["f3", "f4"],
      fromThoughts: ["c2", "c4"],
    },
    {
      id: "s5",
      text: "(iii) $a>2$ のとき　$x=2$ で最小値 $-4a+7$",
      fromFragments: ["f3", "f4"],
      fromThoughts: ["c2", "c4"],
    },
  ],
};
