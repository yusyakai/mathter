import type { Locator, Page } from "@playwright/test";

/** マウスでつかんで運ぶ。dnd-kit は少し動かしてからでないと掴んだ扱いにならない。 */
export async function drag(page: Page, from: Locator, to: Locator): Promise<void> {
  await from.scrollIntoViewIfNeeded();
  const a = (await from.boundingBox())!;
  await page.mouse.move(a.x + 30, a.y + 12);
  await page.mouse.down();
  await page.mouse.move(a.x + 50, a.y + 30, { steps: 4 });
  const b = (await to.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + Math.min(b.height / 2, 30), { steps: 12 });
  await page.mouse.up();
  // 落としたあとの戻る動きが終わるまで待つ
  await page.waitForTimeout(400);
}

export const board = (page: Page) => page.locator(".board");
export const slot = (page: Page, i: number) => page.locator(".slot").nth(i);

/** 思考ボードの上の、題に text を含むカード（つかむ場所として題を返す）。 */
export const boardCard = (page: Page, text: string) =>
  board(page).locator(".card", { hasText: text }).last().locator(".card-title");

/** 問題文の n 番目の着眼点を開き、そこからの連想 title を思考ボードへ運ぶ。 */
export async function collect(page: Page, fragment: number, title: string): Promise<void> {
  const f = page.locator(".problem-text .fragment").nth(fragment);
  if (!((await f.getAttribute("class")) ?? "").includes("is-active")) await f.click();
  await drag(
    page,
    page.locator(".panel").first().locator(".card", { hasText: title }),
    board(page).locator("h2"),
  );
}
