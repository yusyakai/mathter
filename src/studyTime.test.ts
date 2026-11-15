import { describe, expect, it } from "vitest";
import { addTime, dayKey, formatDuration, totalSeconds } from "./studyTime";

describe("学習時間", () => {
  it("日ごとに足し、合計できる", () => {
    let time = addTime({}, "2026-11-15", 90);
    time = addTime(time, "2026-11-15", 30);
    time = addTime(time, "2026-11-16", 600);
    expect(time).toEqual({ "2026-11-15": 120, "2026-11-16": 600 });
    expect(totalSeconds(time)).toBe(720);
  });
  it("日付は端末の時計の年月日", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("時間の書き方", () => {
    expect(formatDuration(0)).toBe("1分未満");
    expect(formatDuration(59)).toBe("1分未満");
    expect(formatDuration(12 * 60 + 40)).toBe("12分");
    expect(formatDuration(3600)).toBe("1時間");
    expect(formatDuration(3900)).toBe("1時間5分");
  });
});
