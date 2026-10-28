import * as HttpApi from "effect/http-api/HttpApi";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import { GetSnapshot } from "./snapshot.ts";

export class Household extends HttpApiGroup.make("Household").add(GetSnapshot) {}

export class Api extends HttpApi.make("Api").add(Household) {}
