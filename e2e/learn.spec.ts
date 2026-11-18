import { expect, test } from "@playwright/test";
import {
  board,
  boardCard,
  candidate,
  chipCounts,
  collect,
  drag,
  fragment,
  newRow,
  problemWord,
  rowEnd,
  rows,
  turnOnJudge,
} from "./helpers";

test("問題一覧から問題を開ける", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".problem-item")).toHaveCount(11);
  await page.getByText("文字を含む2次関数の最小値").click();
  await expect(page.locator(".crumb")).toContainText("文字を含む2次関数の最小値");
});

test("最初は色が付かず、タップした所だけ色が付く。見る順番はボタンで出る", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await expect(page.locator(".fragment.is-found")).toHaveCount(0);
  await problemWord(page, "における").click();
  await expect(page.locator(".message").first()).toContainText("特に連想するものはありません");
  await fragment(page, "f4").click();
  await expect(page.locator(".fragment.is-found")).toHaveCount(1);
  await expect(page.locator(".priority")).toHaveCount(0);
  await page.getByText("見る順番を表示").click();
  await expect(page.locator(".priority")).toHaveCount(4);
  await page.getByText("見る順番をかくす").click();
  await expect(page.locator(".priority")).toHaveCount(0);
  await expect(page.locator(".fragment.is-found")).toHaveCount(1);
});

test("思考ボードのカードは単語や短い文で、タップすると説明が開く", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await collect(page, "f1", "a1");
  const card = board(page).locator('[data-thought="a1"]');
  await expect(card.locator(".card-title")).toHaveText("平方完成");
  await expect(card.locator(".card-detail")).toHaveCount(0);
  await boardCard(page, "a1").click();
  await expect(card.locator(".card-detail")).toContainText("頂点");
  // 問題の下にある同じ連想は、一緒には開かない（説明が2か所に出ないように）
  await expect(candidate(page, "a1").locator(".card-detail")).toHaveCount(0);
  await boardCard(page, "a1").click();
  await expect(card.locator(".card-detail")).toHaveCount(0);
});

test("連想を集めて、くっつけられる。合わない2枚はくっつかない", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await collect(page, "f1", "a1");
  await collect(page, "f2", "a4");
  await collect(page, "f3", "a5");
  await expect(board(page).locator(".thought")).toHaveCount(3);

  await drag(page, boardCard(page, "a1"), boardCard(page, "a5"));
  await expect(board(page).locator(".message")).toContainText("生まれませんでした");
  await expect(board(page).locator(".thought")).toHaveCount(3);

  await drag(page, boardCard(page, "a1"), boardCard(page, "a4"));
  await expect(board(page).locator(".message")).toContainText("新しい考えになりました");
  await expect(board(page).locator(".thought")).toHaveCount(2);
  // 生まれた考えは開いた状態で出て、もとの考えが分かる。ばらすと元に戻る
  const born = board(page).locator('[data-thought="c1"]');
  await expect(born.locator(".sources")).toContainText("平方完成");
  await born.getByText("ばらす").click();
  await expect(board(page).locator(".thought")).toHaveCount(3);
});

test("問題文のことばや思考ボードのカードを、解答ボードへ自由に並べられる", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");

  // 問題文のことばは、着眼点を見つける前でも運べる。運んでも色は付かない
  await drag(page, problemWord(page, "最小値"), newRow(page));
  expect(await chipCounts(page)).toEqual([1]);
  await expect(rows(page).first()).toContainText("最小値");
  await expect(page.locator(".fragment.is-found")).toHaveCount(0);

  // 見つけた着眼点は、まるごと運べる。段の上に落とすと、その段に入る
  await fragment(page, "f3").click();
  await drag(page, fragment(page, "f3"), rowEnd(page, 0));
  expect(await chipCounts(page)).toEqual([2]);

  // カードを運ぶと、ことばの写しが置かれる。カードは思考ボードに残る
  await collect(page, "f1", "a1");
  await drag(page, boardCard(page, "a1"), newRow(page));
  expect(await chipCounts(page)).toEqual([2, 1]);
  await expect(rows(page).nth(1)).toContainText("平方完成");
  await expect(board(page).locator('[data-thought="a1"]')).toContainText("解答に使用");

  // カードを開くと、説明の中のことばも運べる。ことばの上に落とすと、その前に入る
  await collect(page, "f3", "a5");
  await boardCard(page, "a5").click();
  const word = board(page).locator('[data-thought="a5"] .card-text .word', { hasText: "頂点" });
  await drag(page, word, rows(page).nth(1).locator(".snippet"));
  expect(await chipCounts(page)).toEqual([2, 2]);
  await expect(rows(page).nth(1).locator(".snippet").first()).toContainText("頂点");

  // 段を上下に入れかえられる
  await page.getByLabel("2段目を上へ").click();
  await expect(rows(page).first()).toContainText("平方完成");

  // 置いたことばを、別の段や新しい段へ移せる
  await drag(page, rows(page).nth(1).locator(".snippet").first(), newRow(page));
  expect(await chipCounts(page)).toEqual([2, 1, 1]);

  // × で外せる。空になった段はなくなる
  await rows(page).nth(2).locator(".snippet-remove").click();
  expect(await chipCounts(page)).toEqual([2, 1]);

  // 正誤の判定は、設定で入れない限り出ない
  await expect(page.getByText("配置を確かめる")).toHaveCount(0);

  // 開き直しても残る。一覧では「取り組み中」になる
  await page.reload();
  expect(await chipCounts(page)).toEqual([2, 1]);
  await page.goto("/#/");
  await expect(page.locator(".status", { hasText: "取り組み中" })).toHaveCount(1);
  await expect(page.locator(".status", { hasText: "骨組み完成" })).toHaveCount(0);
});

test("まだ集めていない連想を解答ボードへ直接運ぶと、思考ボードにも集まる", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await fragment(page, "f1").click();
  await drag(page, candidate(page, "a1").locator(".card-head"), newRow(page));
  expect(await chipCounts(page)).toEqual([1]);
  await expect(board(page).locator('[data-thought="a1"]')).toHaveCount(1);
});

test("設定で入れると、並べ方を模範の骨組みとくらべて確かめられる", async ({ page }) => {
  await turnOnJudge(page);
  await page.goto("/#/p/quadratic-min");
  await collect(page, "f1", "a1");
  await collect(page, "f1", "a2");
  await collect(page, "f2", "a3");
  await collect(page, "f3", "a5");
  await collect(page, "f4", "a6");
  await drag(page, boardCard(page, "a2"), boardCard(page, "a5")); // → c3 場合分け

  // わざと違う順に置く
  await drag(page, boardCard(page, "c3"), newRow(page));
  await drag(page, boardCard(page, "a1"), newRow(page));
  await page.getByText("配置を確かめる").click();
  await expect(page.locator(".slot-result").nth(0)).toContainText("ここではありません");
  await expect(page.locator(".slot-result").nth(1)).toContainText("ここではありません");
  await expect(page.getByText("模範の骨組みには、あと 1 段あります。")).toBeVisible();

  // 並べ直す。くっつける前の考えを置くと、そのことが分かる
  await page.getByLabel("2段目を上へ").click();
  await expect(page.locator(".slot-result")).toHaveCount(0);
  await drag(page, boardCard(page, "a3"), newRow(page));
  await page.getByText("配置を確かめる").click();
  await expect(page.locator(".answer-row.is-ok")).toHaveCount(2);
  await expect(page.locator(".slot-result").nth(2)).toContainText("くっつけてから");

  // くっつけた考えを同じ段に足すと、合う
  await drag(page, boardCard(page, "a3"), boardCard(page, "a6")); // → c2
  await drag(page, boardCard(page, "c2"), rowEnd(page, 2));
  await page.getByText("配置を確かめる").click();
  await expect(page.locator(".answer-row.is-ok")).toHaveCount(3);
  await expect(page.getByText("模範の骨組みと同じ流れになりました")).toBeVisible();

  // 模範解答の行と、問題文・カード・解答ボードのことばがつながる
  await page.getByText("模範解答を見る").click();
  await page.locator(".step").nth(1).click();
  await expect(page.locator(".fragment.is-highlighted")).toHaveCount(2);
  await expect(board(page).locator(".thought.is-highlighted")).toHaveCount(1);
  await expect(page.locator(".snippet.is-highlighted")).toHaveCount(1);

  await page.goto("/#/");
  await expect(page.locator(".status", { hasText: "骨組み完成" })).toHaveCount(1);
});

test("集めた型が連想ノートに貯まり、「もう分かる」を付けられる", async ({ page }) => {
  await page.goto("/#/p/quadratic-tangent");
  await collect(page, "f2", "a1");
  await boardCard(page, "a1").click();
  await board(page).locator(".known-button").click();
  await expect(board(page).locator(".thought.is-known")).toHaveCount(1);

  await page.getByRole("link", { name: "連想ノート" }).click();
  await expect(page.locator(".page-heading").first()).toContainText("集めた型 1 /");
  await expect(page.locator(".pattern.is-known")).toHaveCount(1);
  await page.locator(".pattern").first().getByText("くわしく").click();
  await page.locator(".pattern-links a").first().click();
  await expect(page.locator(".crumb")).toContainText("接する");
});

test("すべての内蔵の問題が、数式の誤りなく開ける", async ({ page }) => {
  await page.goto("/");
  const count = await page.locator(".problem-item").count();
  for (let i = 0; i < count; i++) {
    await page.goto("/#/");
    await page.locator(".problem-item").nth(i).click();
    await page.locator(".problem-text .fragment").first().waitFor();
    const fragments = await page.locator(".problem-text .fragment").count();
    for (let j = 0; j < fragments; j++) {
      await page.locator(".problem-text .fragment").nth(j).click();
      // 連想のカードをすべて開いて、説明とグラフも出す
      const closed = page.locator('.panel >> nth=0 >> .card-head[aria-expanded="false"]');
      while ((await closed.count()) > 0) await closed.first().click();
    }
    await page.getByText("模範解答を見る").click();
    await expect(page.locator(".katex-error")).toHaveCount(0);
    await expect(page.locator(".graph-error")).toHaveCount(0);
  }
});

test("スマホでは、運んでいる間だけ画面の下に置き場所が出て、長押しで運べる", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/#/p/quadratic-min");
  const cdp = await context.newCDPSession(page);
  const touch = (type: string, x: number, y: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type: type as "touchStart",
      touchPoints: type === "touchEnd" ? [] : [{ x, y }],
    });
  const center = async (selector: string, text?: string) => {
    const box = (await page.locator(selector, text ? { hasText: text } : undefined).first().boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  /** 長押しして、画面の下に出た置き場所（label）まで指を動かして離す。 */
  const touchDragTo = async (from: { x: number; y: number }, label: string) => {
    await touch("touchStart", from.x, from.y);
    await page.waitForTimeout(300);
    await touch("touchMove", from.x, from.y + 12);
    const zone = page.locator(".quick-zone", { hasText: label });
    await expect(zone).toBeVisible();
    const to = await center(".quick-zone", label);
    for (let i = 1; i <= 10; i++) {
      await touch("touchMove", from.x + ((to.x - from.x) * i) / 10, from.y + 12 + ((to.y - from.y - 12) * i) / 10);
      await page.waitForTimeout(20);
    }
    await touch("touchEnd", 0, 0);
    await page.waitForTimeout(400);
  };

  // 運んでいないときは、置き場所は出ていない
  await expect(page.locator(".quick-drop")).toHaveCount(0);

  await fragment(page, "f4").tap();
  await touchDragTo(await center('.panel >> nth=0 >> [data-thought="a6"] .card-head'), "思考ボードへ");
  await expect(board(page).locator(".thought")).toHaveCount(1);

  await touchDragTo(await center(".problem-text .word", "における"), "解答ボードへ");
  expect(await chipCounts(page)).toEqual([1]);
  await fragment(page, "f1").tap();
  await touchDragTo(await center('.panel >> nth=0 >> [data-thought="a1"] .card-head'), "解答ボードへ");
  expect(await chipCounts(page)).toEqual([1, 1]);
  await expect(board(page).locator(".thought")).toHaveCount(2);

  await expect(page.locator(".quick-drop")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await context.close();
});
