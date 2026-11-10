---
paths:
  - "src/data/problems/**"
---

# 問題データの書き方

- 型は `src/types.ts` の `Problem`。1問1ファイルで作り、`src/data/problems/index.ts` の配列に追加する
- `segments` は問題文を前から順に分けたもの。着眼点にする部分だけ `fragmentId` を付ける
- 1つの着眼点につき連想（`associations`）は1〜3個。`title` は一言、`detail` は「なぜそう考えるか・どう使うか」
- `combinations` の `from` は2つ。連想だけでなく、別の組み合わせの id も置ける。すべての組み合わせが連想から順にたどり着けること
- `solution` の各行に、もとになった着眼点（`fromFragments`）と考え（`fromThoughts`）を必ず付ける
- 数式は `$...$` で囲む LaTeX。TypeScript の文字列なのでバックスラッシュは `\\` と書く
- 問題集の問題文をそのまま写さない（類題か自作にする）
- AIが作った問題データは、人が数学的な正しさを確認するまで完成扱いにしない
- 追加・変更後は `npm test` を実行する（参照切れ、LaTeX、到達可能性を検査する）
