import { HouseholdSnapshot } from "@expendiru/domain";
import { Schema } from "effect";
import { defineMessageUnion } from "foldkit/message";

export const Message = defineMessageUnion({
  LoadedSnapshot: { snapshot: HouseholdSnapshot },
  FailedLoadSnapshot: { error: Schema.String },
  ClickedReplay: {},
  ClickedRetry: {},
});

export type Message = typeof Message.Type;
