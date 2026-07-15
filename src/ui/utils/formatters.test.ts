import { notificationsFix } from "../__fixtures__/notificationsFix";
import {
  ellipsisText,
  formatCurrencyUSD,
  formatShortTime,
  timeDifference,
} from "./formatters";

describe("Utils", () => {
  test("formatCurrencyUSD", () => {
    const balance = 1012.0;
    expect(formatCurrencyUSD(balance)).toBe("$1,012.00");
  });

  test("formatShortTime", () => {
    expect(formatShortTime("2024-07-16T03:32:59.312000+00:00")).toBe(
      new Date("2024-07-16T03:32:59.312000+00:00").toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  });

  test("ellipsisText", () => {
    expect(ellipsisText("text text text", 3)).toBe("tex...");
  });

  test("Renders Notifications in Notifications Tab", () => {
    expect(timeDifference(notificationsFix[0].createdAt)).toStrictEqual([
      10,
      "m",
    ]);
    expect(timeDifference(notificationsFix[1].createdAt)).toStrictEqual([
      2,
      "h",
    ]);
    expect(timeDifference(notificationsFix[2].createdAt)).toStrictEqual([
      2,
      "d",
    ]);
    expect(timeDifference(notificationsFix[3].createdAt)).toStrictEqual([
      2,
      "w",
    ]);
    expect(timeDifference(notificationsFix[4].createdAt)).toStrictEqual([
      2,
      "y",
    ]);
  });
});
