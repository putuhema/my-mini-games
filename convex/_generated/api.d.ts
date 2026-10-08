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
import type * as custom from "../custom.js";
import type * as defuse from "../defuse.js";
import type * as kitchen from "../kitchen.js";
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
  custom: typeof custom;
  defuse: typeof defuse;
  kitchen: typeof kitchen;
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
