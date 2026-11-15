import type { Locator, Page } from "@playwright/test";

/** マウスでつかんで運ぶ。dnd-kit は少し動かしてからでないと掴んだ扱いにならない。 */
export async function drag(page: Page, from: Locator, to: Locator): Promise<void> {
  await from.scrollIntoViewIfNeeded();
  const a = (await from.boundingBox())!;
  await page.mouse.move(a.x + Math.min(12, a.width / 2), a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + 20, a.y + a.height / 2 + 10, { steps: 4 });
  const b = (await to.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
  // 落としたあとの戻る動きが終わるまで待つ
  await page.waitForTimeout(400);
}

/** 思考ボード */
export const board = (page: Page) => page.locator(".board");

/** 思考ボードの上のカード（つかむ場所として題を返す）。問題データの id で指す。 */
export const boardCard = (page: Page, thoughtId: string) =>
  board(page).locator(`[data-thought="${thoughtId}"] .card-head`);

/** 問題の下に出る、連想のカード。 */
export const candidate = (page: Page, thoughtId: string) =>
  page.locator(".panel").first().locator(`[data-thought="${thoughtId}"]`);

/** 問題文の着眼点。 */
export const fragment = (page: Page, fragmentId: string) =>
  page.locator(`.problem-text [data-fragment="${fragmentId}"]`);

/** 問題文の中の、運べることば。 */
export const problemWord = (page: Page, text: string) =>
  page.locator(".problem-text .word", { hasText: text });

/** 着眼点を開き、そこからの連想を思考ボードへ運ぶ。 */
export async function collect(page: Page, fragmentId: string, thoughtId: string): Promise<void> {
  const f = fragment(page, fragmentId);
  if (!((await f.getAttribute("class")) ?? "").includes("is-active")) await f.click();
  await drag(page, candidate(page, thoughtId).locator(".card-head"), board(page).locator("h2"));
}

/** 解答ボードの段。 */
export const rows = (page: Page) => page.locator(".answer-row");

/** 段の中の、ことばのない所（ここに落とすと、その段の最後に入る）。 */
export const rowEnd = (page: Page, index: number) => rows(page).nth(index).locator(".slot-number");

/** 新しい段を作る置き場所。 */
export const newRow = (page: Page) => page.locator(".answer-new");

/** 段ごとの、ことばの数。 */
export const chipCounts = (page: Page) =>
  rows(page).evaluateAll((list) => list.map((row) => row.querySelectorAll(".snippet").length));

/** 設定で「配置を確かめる」を入れる。 */
export async function turnOnJudge(page: Page): Promise<void> {
  await page.goto("/#/settings");
  await page.getByText("「配置を確かめる」を使う").click();
}
