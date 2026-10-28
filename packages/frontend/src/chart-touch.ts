const pieSurface = "[data-chart-surface='pie']";

const surfaceFrom = (target: EventTarget | null): Element | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest(pieSurface);
};

export const bindChartTouch = (root: Document = document): (() => void) => {
  let blockTrustedClick = false;

  const selectSlice = (event: PointerEvent): void => {
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const control = hit instanceof Element ? hit.closest(`${pieSurface} [role='button']`) : null;

    if (!(control instanceof Element)) {
      return;
    }

    blockTrustedClick = true;
    control.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.setTimeout(() => {
      blockTrustedClick = false;
    }, 400);
  };

  const onPointerDown = (event: PointerEvent) => {
    const surface = surfaceFrom(event.target);

    if (surface === null) {
      return;
    }

    try {
      surface.setPointerCapture(event.pointerId);
    } catch {
      // Capture is optional when the node is not connected.
    }

    if (
      event.cancelable &&
      (event.pointerType === "touch" || event.pointerType === "pen")
    ) {
      event.preventDefault();
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }

    if (surfaceFrom(event.target) === null) {
      return;
    }

    selectSlice(event);
  };

  const onClick = (event: MouseEvent) => {
    if (!blockTrustedClick || !event.isTrusted) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!event.cancelable || surfaceFrom(event.target) === null) {
      return;
    }

    event.preventDefault();
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("click", onClick, true);
  root.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointerup", onPointerUp);
    root.removeEventListener("click", onClick, true);
    root.removeEventListener("touchmove", onTouchMove);
  };
};
