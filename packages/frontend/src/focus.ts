import type { ChartMode } from "@expendiru/domain";

export const MAIN_ID = "main";

export const SPEND_ID = "spend";

export const SKIP_LINK_ID = "skip-to-spend";

export const SPEND_STATUS_ID = "spend-status";

export const CHART_MODE_ID = "spend-chart-mode";

export const CLEAR_SELECTION_ID = "spend-clear";

export const PAGE_PREVIOUS_ID = "spend-page-previous";

export const PAGE_NEXT_ID = "spend-page-next";

export const PAGE_STATUS_ID = "spend-page-status";

export const TRANSACTIONS_ID = "spend-transactions";

export const SNAPSHOT_RETRY_ID = "snapshot-retry";

export const SPEND_RETRY_ID = "spend-retry";

export const PERSON_ID = "spend-person";

export const chartModeButtonId = (mode: ChartMode): string => `spend-chart-${mode}`;
