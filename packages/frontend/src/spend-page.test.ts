import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  monthlyRowsFromDollars,
  parseMonthlyByBucketCsv,
  spendStub,
} from "@expendiru/domain";
import { describe, expect, test } from "vitest";
import { spendPageSize, spendPageWindow } from "./spend-page.ts";

describe("spend pages", () => {
  test("keeps a short list on one page and steps a long list by 25", () => {
    expect(spendPageSize).toBe(25);
    expect(spendPageWindow(6, 0)).toEqual({ current: 0, pages: 1, from: 0, to: 6 });
    expect(spendPageWindow(132, 0)).toEqual({ current: 0, pages: 6, from: 0, to: 25 });
    expect(spendPageWindow(132, 5)).toEqual({ current: 5, pages: 6, from: 125, to: 132 });
    expect(spendPageWindow(132, 9).current).toBe(5);
    expect(spendPageWindow(0, 0)).toEqual({ current: 0, pages: 1, from: 0, to: 0 });
  });

  test("the uploaded monthly feed matches the stub fixture", () => {
    const feed = join(process.cwd(), "../../uploads");
    const csv = readFileSync(join(feed, "monthly_by_bucket.csv"), "utf8");
    const json = JSON.parse(readFileSync(join(feed, "monthly_by_bucket.json"), "utf8"));

    const fromCsv = parseMonthlyByBucketCsv(csv);
    const fromJson = monthlyRowsFromDollars(json.months);

    expect(fromCsv.ok).toBe(true);
    expect(fromJson.ok).toBe(true);

    if (fromCsv.ok && fromJson.ok) {
      expect(fromCsv.rows).toEqual(spendStub.monthlyByBucket);
      expect(fromJson.rows).toEqual(spendStub.monthlyByBucket);
    }
  });
});