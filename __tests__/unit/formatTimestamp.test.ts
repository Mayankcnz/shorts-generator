import { describe, expect, it } from "vitest";
import { formatTimestamp } from "@/lib/formatTimestamp";

describe("formatTimestamp", () => {
  it.each([
    [0, "00:00"],
    [9.9, "00:09"],
    [65, "01:05"],
    [3599, "59:59"],
    [3600, "01:00:00"],
    [3661, "01:01:01"],
  ])("formats %s seconds as %s", (seconds, expected) => {
    expect(formatTimestamp(seconds)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid timestamp %s",
    (seconds) => {
      expect(() => formatTimestamp(seconds)).toThrow(RangeError);
    },
  );
});
