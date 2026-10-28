import { HouseholdSnapshot } from "@expendiru/domain";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";

export const GetSnapshot = HttpApiEndpoint.get("getSnapshot", "/snapshot", {
  success: HouseholdSnapshot,
});
