import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("spend fixture", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("skip link, status, touch targets, and chart keys", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("6 transactions · $227.90 out", { exact: true })).toBeVisible();

    const skip = page.locator("#skip-to-spend");
    await expect(skip).toHaveText("Skip to spending");
    await skip.focus();
    await expect(skip).toBeFocused();

    const status = page.locator("#spend-status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveAttribute("aria-atomic", "true");

    for (const selector of [
      "#spend-chart-pie",
      "#spend-chart-bar",
      "#spend-chart-line",
      "#spend-page-next",
      "#spend-person",
    ]) {
      const box = await page.locator(selector).boundingBox();

      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    const edges = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(edges.scrollWidth).toBeLessThanOrEqual(edges.clientWidth + 1);

    await page.locator("#spend-chart-line").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#spend-chart-bar")).toHaveAttribute("aria-pressed", "true");

    const results = await new AxeBuilder({ page })
      .include("#main")
      .disableRules(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
