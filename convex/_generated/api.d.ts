/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as board from "../board.js";
import type * as bomb from "../bomb.js";
import type * as burger_customers from "../burger/customers.js";
import type * as burger_dishes from "../burger/dishes.js";
import type * as burger_ingredients from "../burger/ingredients.js";
import type * as burger_orders from "../burger/orders.js";
import type * as burger_scoring from "../burger/scoring.js";
import type * as court from "../court.js";
import type * as court_case from "../court/case.js";
import type * as court_cases_amal from "../court/cases/amal.js";
import type * as court_cases_bansos from "../court/cases/bansos.js";
import type * as court_cases_berlian from "../court/cases/berlian.js";
import type * as court_cases_ijazah from "../court/cases/ijazah.js";
import type * as court_cases_index from "../court/cases/index.js";
import type * as court_cases_lahan from "../court/cases/lahan.js";
import type * as court_cases_selingkuh from "../court/cases/selingkuh.js";
import type * as court_judge from "../court/judge.js";
import type * as court_rules from "../court/rules.js";
import type * as courtJudge from "../courtJudge.js";
import type * as creature_events from "../creature/events.js";
import type * as creature_lines from "../creature/lines.js";
import type * as creature_world from "../creature/world.js";
import type * as custom from "../custom.js";
import type * as debate from "../debate.js";
import type * as debate_rules from "../debate/rules.js";
import type * as debateJudge from "../debateJudge.js";
import type * as defuse from "../defuse.js";
import type * as glm from "../glm.js";
import type * as kitchen from "../kitchen.js";
import type * as pets from "../pets.js";
import type * as push from "../push.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as questions from "../questions.js";
import type * as rooms from "../rooms.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  board: typeof board;
  bomb: typeof bomb;
  "burger/customers": typeof burger_customers;
  "burger/dishes": typeof burger_dishes;
  "burger/ingredients": typeof burger_ingredients;
  "burger/orders": typeof burger_orders;
  "burger/scoring": typeof burger_scoring;
  court: typeof court;
  "court/case": typeof court_case;
  "court/cases/amal": typeof court_cases_amal;
  "court/cases/bansos": typeof court_cases_bansos;
  "court/cases/berlian": typeof court_cases_berlian;
  "court/cases/ijazah": typeof court_cases_ijazah;
  "court/cases/index": typeof court_cases_index;
  "court/cases/lahan": typeof court_cases_lahan;
  "court/cases/selingkuh": typeof court_cases_selingkuh;
  "court/judge": typeof court_judge;
  "court/rules": typeof court_rules;
  courtJudge: typeof courtJudge;
  "creature/events": typeof creature_events;
  "creature/lines": typeof creature_lines;
  "creature/world": typeof creature_world;
  custom: typeof custom;
  debate: typeof debate;
  "debate/rules": typeof debate_rules;
  debateJudge: typeof debateJudge;
  defuse: typeof defuse;
  glm: typeof glm;
  kitchen: typeof kitchen;
  pets: typeof pets;
  push: typeof push;
  pushSubscriptions: typeof pushSubscriptions;
  questions: typeof questions;
  rooms: typeof rooms;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
