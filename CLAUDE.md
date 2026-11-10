# mathter

中学生〜高校生向けの数学学習アプリ。「問題文内の語句や数式から何を連想するか」に特化し、解答に書かれない思考の過程を見えるようにする。要件の全体は `docs/design-sheet.md`（検討シート）にある。

## 現在の段階

検討シート10章の「段階1：試作」。内蔵した問題で中心となる体験を確かめるための画面試作であり、サーバー・ログイン・AI機能・VRはまだない。

## 技術

- Vite + React + TypeScript（ウェブアプリ。スマホ・PC共通。将来のVRは別の仕組みで作る方針）
- 数式は KaTeX。文字列中の `$...$` を数式として表示する
- テストは Vitest
- 思考ボードの状態は端末内（localStorage）にのみ保存する

## コマンド

- `npm run dev` 開発サーバー
- `npm test` テスト（問題データの検査を含む）
- `npm run typecheck` 型検査
- `npm run build` 型検査＋ビルド（`dist/`）

## 公開

GitHub Pages（`https://yusyakai.github.io/mathter/`）。`.github/workflows/deploy.yml` が push のたびにテスト・ビルドして `dist/` を配信する。

## 構成

- `src/types.ts` 問題データの型
- `src/data/problems/` 内蔵する問題（1問1ファイル、`index.ts` に登録）
- `src/thoughts.ts` 考えの組み合わせと問題データ検査のロジック
- `src/components/AssociateView.tsx` 「連想する」画面（着眼点 → 連想 → 思考ボードでくっつける）
- `src/components/SolutionView.tsx` 「解答との対応」画面（解答の行 ⇔ 問題文の部分）

## 設計方針

- 正誤判定はしない。答えを教えるのではなく、着眼点と連想を見せる
- ヒントを決まった順に出さない。どこを見るか、どれを開くかは学習者が選ぶ
- 画面の文言は日本語。中高生が読める言葉で書く
