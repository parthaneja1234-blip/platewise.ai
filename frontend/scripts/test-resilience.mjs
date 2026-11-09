/**
 * PlateWise AI — Frontend Resilience & Empty/Partial Data Verification Test
 *
 * Verifies that:
 * 1. Safe formatters (formatINR, formatNumber, formatPercent, formatKg) accept null/undefined/NaN
 *    and return an em dash ("—") with deterministic 'en-IN' locale rendering.
 * 2. API client runtime validation (validateApiResponse) handles empty ({}) and partial data payloads
 *    without throwing uncaught exceptions, properly logging missing field warnings.
 * 3. Legacy and corrupt field schemas are gracefully normalized.
 */

import { formatINR, formatNumber, formatPercent, formatKg, EM_DASH } from "../src/lib/formatters.ts";
import {
  validateApiResponse,
  OverviewResponseSchema,
  PlanResponseSchema,
} from "../src/lib/api.ts";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

console.log("=" .repeat(65));
console.log("PlateWise AI — Frontend Resilience Test Suite");
console.log("=" .repeat(65));

// --------------------------------------------------------------------------
// 1. Safe Formatters Invariant Tests
// --------------------------------------------------------------------------
console.log("\n[1/3] Testing Safe Numerical & Currency Formatters:");

// formatINR
assert(formatINR(null) === EM_DASH, `formatINR(null) returns "${EM_DASH}"`);
assert(formatINR(undefined) === EM_DASH, `formatINR(undefined) returns "${EM_DASH}"`);
assert(formatINR(NaN) === EM_DASH, `formatINR(NaN) returns "${EM_DASH}"`);
assert(formatINR("") === EM_DASH, `formatINR("") returns "${EM_DASH}"`);
assert(formatINR(0) === "₹0", `formatINR(0) returns "₹0"`);
assert(formatINR(251280) === "₹2,51,280", `formatINR(251280) formats with en-IN lakh grouping ("₹2,51,280")`);
assert(formatINR(1250.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) === "₹1,250.50", `formatINR with decimals`);

// formatNumber
assert(formatNumber(null) === EM_DASH, `formatNumber(null) returns "${EM_DASH}"`);
assert(formatNumber(undefined) === EM_DASH, `formatNumber(undefined) returns "${EM_DASH}"`);
assert(formatNumber(NaN) === EM_DASH, `formatNumber(NaN) returns "${EM_DASH}"`);
assert(formatNumber(1234567, 0) === "12,34,567", `formatNumber(1234567) formats with en-IN grouping ("12,34,567")`);
assert(formatNumber(42.678, 1) === "42.7", `formatNumber(42.678, 1) returns "42.7"`);

// formatPercent
assert(formatPercent(null) === EM_DASH, `formatPercent(null) returns "${EM_DASH}"`);
assert(formatPercent(undefined) === EM_DASH, `formatPercent(undefined) returns "${EM_DASH}"`);
assert(formatPercent(NaN) === EM_DASH, `formatPercent(NaN) returns "${EM_DASH}"`);
assert(formatPercent(76.7, 1) === "76.7%", `formatPercent(76.7, 1) returns "76.7%"`);
assert(formatPercent(0, 0) === "0%", `formatPercent(0, 0) returns "0%"`);

// formatKg
assert(formatKg(null) === EM_DASH, `formatKg(null) returns "${EM_DASH}"`);
assert(formatKg(undefined) === EM_DASH, `formatKg(undefined) returns "${EM_DASH}"`);
assert(formatKg(NaN) === EM_DASH, `formatKg(NaN) returns "${EM_DASH}"`);
assert(formatKg(6980.5, 1) === "6,980.5 kg", `formatKg(6980.5, 1) returns "6,980.5 kg"`);

// --------------------------------------------------------------------------
// 2. Typed Runtime API Response Validation (Zod)
// --------------------------------------------------------------------------
console.log("\n[2/3] Testing Typed API Response Validation on Empty & Partial Payloads:");

// Test 2a: Empty payload {}
let warningsCaptured = [];
const originalWarn = console.warn;
console.warn = (msg) => {
  warningsCaptured.push(msg);
  originalWarn(msg);
};

try {
  const emptyOverview = validateApiResponse({}, OverviewResponseSchema, "/v1/demo/overview");
  assert(emptyOverview !== null && typeof emptyOverview === "object", "validateApiResponse on {} does not throw and returns object");
  assert(
    warningsCaptured.some((w) => w.includes("[API Validation Warning] Missing expected field")),
    "validateApiResponse logged missing fields warning for empty payload"
  );
} catch (err) {
  assert(false, `validateApiResponse threw error on empty payload: ${err}`);
}

// Test 2b: Partial payload with missing cost_wasted_inr in top_wasted_dishes
warningsCaptured = [];
const partialOverviewPayload = {
  mess_id: "mess-boys-a",
  kpis: {
    kg_waste_prevented: 100,
    inr_saved: 4000,
    co2e_avoided_kg: 250,
    forecast_accuracy_pct: 92.0,
    guesswork_waste_pct: 25.0,
    platewise_waste_pct: 8.0,
    reduction_factor_pct: 68.0,
  },
  top_wasted_dishes: [
    {
      dish_id: "jeera-rice",
      dish_name: "Jeera Rice",
      total_waste_kg: 50.0,
      estimated_loss_inr: 2000.0,
      // name, category, guesswork_waste_kg, and cost_wasted_inr deliberately missing
    },
  ],
};

try {
  const parsed = validateApiResponse(partialOverviewPayload, OverviewResponseSchema, "/v1/demo/overview");
  assert(parsed !== null, "validateApiResponse succeeds on partial payload");
  assert(
    warningsCaptured.some((w) => w.includes("top_wasted_dishes.0.cost_wasted_inr") || w.includes("top_wasted_dishes.0.name")),
    "validateApiResponse warning explicitly identifies missing 'cost_wasted_inr' and 'name' fields"
  );

  // Normalize as done in api.ts
  const dish = parsed.top_wasted_dishes[0];
  const normalizedCost = dish.cost_wasted_inr ?? dish.estimated_loss_inr;
  const formattedCost = formatINR(normalizedCost);
  assert(formattedCost === "₹2,000", `Normalized legacy cost formatted safely as "${formattedCost}"`);
} catch (err) {
  assert(false, `validateApiResponse threw error on partial payload: ${err}`);
}

// Test 2c: Empty plan payload
warningsCaptured = [];
try {
  const emptyPlan = validateApiResponse({}, PlanResponseSchema, "/v1/demo/plan");
  assert(emptyPlan !== null, "validateApiResponse on empty plan does not throw");
  assert(
    warningsCaptured.some((w) => w.includes("[API Validation Warning] Missing expected field")),
    "validateApiResponse warned on missing plan fields"
  );
} catch (err) {
  assert(false, `validateApiResponse threw error on empty plan: ${err}`);
}

console.warn = originalWarn;

// --------------------------------------------------------------------------
// 3. Null / Undefined Rendering Safety in Components
// --------------------------------------------------------------------------
console.log("\n[3/3] Simulating Component Render Operations with Missing/Undefined Fields:");

const badDishRecord = {
  dish_id: "corrupted-dish",
  name: undefined,
  category: undefined,
  guesswork_waste_kg: undefined,
  cost_wasted_inr: undefined,
};

// Simulation of Dashboard top_wasted_dishes table cell render
try {
  const displayCost = formatINR(badDishRecord.cost_wasted_inr);
  const displayKg = formatKg(badDishRecord.guesswork_waste_kg);
  assert(displayCost === EM_DASH, `Table cell cost_wasted_inr safely renders "${EM_DASH}" instead of crashing`);
  assert(displayKg === EM_DASH, `Table cell guesswork_waste_kg safely renders "${EM_DASH}" instead of crashing`);
} catch (err) {
  assert(false, `Table cell crashed on undefined cost: ${err}`);
}

console.log("\n" + "=".repeat(65));
console.log(`RESILIENCE TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log("=".repeat(65));

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("\nAll safe formatters and API validation resilience checks passed!\n");
  process.exit(0);
}
