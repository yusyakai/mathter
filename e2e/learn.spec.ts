import { expect, test } from "@playwright/test";
import { board, boardCard, collect, drag, slot } from "./helpers";

test("問題一覧から問題を開ける", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".problem-item")).toHaveCount(11);
  await page.getByText("文字を含む2次関数の最小値").click();
  await expect(page.locator(".crumb")).toContainText("文字を含む2次関数の最小値");
});

test("最初は色が付かず、タップした所だけ色が付く。見る順番はボタンで出る", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await expect(page.locator(".fragment.is-found")).toHaveCount(0);
  await page.getByText("を求めよ").click();
  await expect(page.locator(".message").first()).toContainText("特に連想するものはありません");
  await page.locator(".fragment").nth(3).click();
  await expect(page.locator(".fragment.is-found")).toHaveCount(1);
  await expect(page.locator(".priority")).toHaveCount(0);
  await page.getByText("見る順番を表示").click();
  await expect(page.locator(".priority")).toHaveCount(4);
  await page.getByText("見る順番をかくす").click();
  await expect(page.locator(".priority")).toHaveCount(0);
  await expect(page.locator(".fragment.is-found")).toHaveCount(1);
});

test("連想を集め、くっつけ、解答ボードに並べて確かめる", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await collect(page, 3, "頂点」か「端点");
  await collect(page, 0, "平方完成");
  await collect(page, 0, "グラフ（放物線）");
  await collect(page, 1, "下に凸");
  await collect(page, 1, "文字");
  await collect(page, 2, "定義域に制限");
  await expect(board(page).locator(".card")).toHaveCount(6);

  await drag(page, boardCard(page, "平方完成"), boardCard(page, "定義域に制限"));
  await expect(board(page).locator(".message")).toContainText("生まれませんでした");
  await drag(page, boardCard(page, "平方完成"), boardCard(page, "文字"));
  await expect(board(page).locator(".message")).toContainText("新しい考えになりました");
  await drag(page, boardCard(page, "グラフ（放物線）"), boardCard(page, "定義域に制限"));
  await expect(board(page).locator(".card")).toHaveCount(4);

  // わざと違う場所に置く
  await drag(page, boardCard(page, "位置関係で場合分け"), slot(page, 0));
  await drag(page, boardCard(page, "放物線が左右に動く"), slot(page, 1));
  await drag(page, boardCard(page, "下に凸"), slot(page, 2));
  await page.getByText("配置を確かめる").click();
  await expect(page.locator(".slot-result").nth(0)).toContainText("ここではありません");
  await expect(page.locator(".slot-result").nth(2)).toContainText("くっつけてから");

  // 直す
  await drag(page, slot(page, 0).locator(".card-title"), slot(page, 1));
  await slot(page, 2).getByText("戻す").click();
  await drag(page, boardCard(page, "下に凸"), boardCard(page, "頂点」か「端点"));
  await drag(page, boardCard(page, "軸が定義域の中なら"), slot(page, 2));
  await page.getByText("配置を確かめる").click();
  await expect(page.locator(".slot.is-ok")).toHaveCount(3);
  await expect(page.getByText("骨組みができました")).toBeVisible();

  // 模範解答とつながる
  await page.getByText("模範解答を見る").click();
  await page.locator(".step").nth(1).click();
  await expect(page.locator(".fragment.is-highlighted")).toHaveCount(2);
  await expect(page.locator(".slot .card.is-highlighted")).toHaveCount(1);

  // 開き直しても残る。一覧に印が付く
  await page.reload();
  await expect(page.locator(".slot .card")).toHaveCount(3);
  await page.goto("/#/");
  await expect(page.locator(".status", { hasText: "骨組み完成" })).toHaveCount(1);
});

test("集めた型が連想ノートに貯まり、「もう分かる」を付けられる", async ({ page }) => {
  await page.goto("/#/p/quadratic-tangent");
  await collect(page, 1, "共有点がちょうど1個");
  await board(page).locator(".card").first().getByText("くわしく").click();
  await board(page).locator(".known-button").click();
  await expect(board(page).locator(".card.is-known")).toHaveCount(1);

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
      const more = page.locator(".panel").first().getByText("くわしく");
      while ((await more.count()) > 0) await more.first().click();
    }
    await page.getByText("模範解答を見る").click();
    await expect(page.locator(".katex-error")).toHaveCount(0);
  }
});

test("スマホの幅でも横にはみ出さず、長押しで運べる", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 800 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/#/p/quadratic-min");
  await page.locator(".fragment").nth(3).tap();
  const card = (await page.locator(".panel").first().locator(".card").boundingBox())!;
  const target = (await board(page).boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const touch = (type: string, x: number, y: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type: type as "touchStart",
      touchPoints: type === "touchEnd" ? [] : [{ x, y }],
    });
  await touch("touchStart", card.x + 40, card.y + 15);
  await page.waitForTimeout(300);
  for (let i = 1; i <= 10; i++) {
    await touch("touchMove", card.x + 40, card.y + 15 + ((target.y + 60 - card.y - 15) * i) / 10);
    await page.waitForTimeout(20);
  }
  await touch("touchEnd", 0, 0);
  await expect(board(page).locator(".card")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await context.close();
});
