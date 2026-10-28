const nextUnit = (seed: number): readonly [number, number] => {
  const mixed = Math.imul(seed, 48271) % 2147483647;
  const state = mixed <= 0 ? mixed + 2147483646 : mixed;
  return [state, (state / 2147483647) * 2 - 1];
};

const wobble = (seed: number, count: number): ReadonlyArray<number> => {
  const step = (
    remaining: number,
    state: number,
    acc: ReadonlyArray<number>,
  ): ReadonlyArray<number> => {
    if (remaining === 0) {
      return acc;
    }
    const [next, unit] = nextUnit(state);
    return step(remaining - 1, next, [...acc, unit]);
  };
  return step(count, seed, []);
};

const at = (values: ReadonlyArray<number>, index: number): number => {
  const value = values[index];
  return value === undefined ? 0 : value;
};

const round = (value: number): string => value.toFixed(1);

export const sketchRectPath = (seed: number): string => {
  const units = wobble(seed, 12);
  const jitter = 5;
  const left = 8 + at(units, 0) * jitter;
  const top = 8 + at(units, 1) * jitter;
  const right = 292 + at(units, 2) * jitter;
  const bottom = 172 + at(units, 3) * jitter;
  const midTopX = (left + right) / 2 + at(units, 4) * jitter;
  const midTopY = top + at(units, 5) * jitter;
  const midRightX = right + at(units, 6) * jitter;
  const midRightY = (top + bottom) / 2 + at(units, 7) * jitter;
  const midBottomX = (left + right) / 2 + at(units, 8) * jitter;
  const midBottomY = bottom + at(units, 9) * jitter;
  const midLeftX = left + at(units, 10) * jitter;
  const midLeftY = (top + bottom) / 2 + at(units, 11) * jitter;
  return [
    `M ${round(left)} ${round(top)}`,
    `Q ${round(midTopX)} ${round(midTopY)} ${round(right)} ${round(top)}`,
    `Q ${round(midRightX)} ${round(midRightY)} ${round(right)} ${round(bottom)}`,
    `Q ${round(midBottomX)} ${round(midBottomY)} ${round(left)} ${round(bottom)}`,
    `Q ${round(midLeftX)} ${round(midLeftY)} ${round(left)} ${round(top)}`,
    "Z",
  ].join(" ");
};
