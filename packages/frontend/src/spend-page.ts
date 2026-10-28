export const spendPageSize = 25;

export type SpendPageWindow = {
  readonly current: number;
  readonly pages: number;
  readonly from: number;
  readonly to: number;
};

export const spendPageWindow = (count: number, page: number): SpendPageWindow => {
  const pages = count === 0 ? 1 : Math.ceil(count / spendPageSize);
  const current = Math.min(Math.max(0, page), pages - 1);
  const from = count === 0 ? 0 : current * spendPageSize;
  const to = Math.min(count, from + spendPageSize);

  return { current, pages, from, to };
};
