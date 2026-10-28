import { describe, expect, test } from "vitest";
import { bindChartTouch } from "./chart-touch.ts";

describe("chart touch", () => {
  test("a touch on the pie captures the pointer and cancels the gesture", () => {
    document.body.innerHTML =
      '<div data-chart-surface="pie"><button type="button" role="button">Show Household</button></div>';
    const stop = bindChartTouch(document);
    const surface = document.querySelector("[data-chart-surface='pie']");
    const slice = document.querySelector("button");

    if (surface === null || slice === null) {
      throw new Error("missing pie surface");
    }

    let captured = 0;
    surface.setPointerCapture = () => {
      captured += 1;
    };

    const down = new PointerEvent("pointerdown", {
      pointerId: 3,
      pointerType: "touch",
      bubbles: true,
      cancelable: true,
    });

    slice.dispatchEvent(down);

    expect(down.defaultPrevented).toBe(true);
    expect(captured).toBe(1);

    const move = new Event("touchmove", { bubbles: true, cancelable: true });
    slice.dispatchEvent(move);

    expect(move.defaultPrevented).toBe(true);
    stop();
  });
});