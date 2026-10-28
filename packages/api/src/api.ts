import * as HttpApi from "effect/http-api/HttpApi";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import { GetSpend } from "./spend.ts";
import { GetSnapshot } from "./snapshot.ts";

export class Household extends HttpApiGroup.make("Household")
  .add(GetSnapshot)
  .add(GetSpend) {}

export class Api extends HttpApi.make("Api").add(Household) {}
