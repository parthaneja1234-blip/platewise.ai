/**
 * PlateWise AI — Single-Origin Typed API Client
 *
 * Uses relative URLs with credentials: "same-origin".
 * In development and production, browser requests go to port 3000,
 * which are proxied via Next.js rewrites to the FastAPI backend.
 */

import { z } from "zod";

/**
 * Validates an API response payload against a typed Zod schema.
 * Logs a clear console warning naming any missing or invalid fields,
 * without crashing or throwing so application runtime remains resilient.
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodType<any>,
  endpoint: string
): T {
  const isNil = data === null || data === undefined;
  if (isNil) {
    console.warn(`[API Validation Warning] Empty or null response received from ${endpoint}`);
  }

  const payload: any = isNil ? {} : typeof data === "object" ? { ...(data as any) } : {};
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  // Check expected keys from schema shape if available
  const shape = (schema as any).shape;
  if (shape && typeof shape === "object") {
    for (const key of Object.keys(shape)) {
      if (isNil || payload[key] === undefined) {
        missingFields.push(key);
      }
    }
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      const isMissing =
        (issue.code === "invalid_type" &&
          ((issue as any).received === "undefined" || issue.message.includes("received undefined"))) ||
        (issue.code === "custom" && issue.message.toLowerCase().includes("missing")) ||
        issue.message.toLowerCase().includes("missing");

      if (isMissing) {
        if (!missingFields.includes(fieldPath)) {
          missingFields.push(fieldPath);
        }
      } else {
        invalidFields.push(`${fieldPath}: ${issue.message}`);
      }
    }
  }

  if (missingFields.length > 0) {
    console.warn(
      `[API Validation Warning] Missing expected field(s) in response from ${endpoint}: ${missingFields.join(", ")}`
    );
  }
  if (invalidFields.length > 0) {
    console.warn(
      `[API Validation Warning] Schema discrepancy in response from ${endpoint}: ${invalidFields.join("; ")}`
    );
  }

  if (result.success) {
    return result.data as T;
  }

  return payload as T;
}

export interface ApiErrorResponse {
  status?: string;
  detail?: string | Record<string, unknown> | Array<{ msg: string; loc: string[] }>;
  message?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  data?: ApiErrorResponse;

  constructor(status: number, message: string, data?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

/**
 * Normalizes endpoint paths to ensure they start with /api
 */
function normalizeUrl(endpoint: string, params?: RequestOptions["params"]): string {
  let cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (!cleanPath.startsWith("/api")) {
    cleanPath = `/api${cleanPath}`;
  }

  if (!params) return cleanPath;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${cleanPath}?${queryString}` : cleanPath;
}

/**
 * Retrieves the CSRF token from document.cookie if present
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Core fetch wrapper enforcing single-origin relative URLs & same-origin credentials
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, headers = {}, ...customConfig } = options;

  const url = normalizeUrl(endpoint, params);

  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  // Add CSRF token for mutating requests if available
  const csrf = getCsrfToken();
  if (csrf && ["POST", "PUT", "PATCH", "DELETE"].includes(customConfig.method || "GET")) {
    reqHeaders["X-CSRF-Token"] = csrf;
  }

  let reqBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      reqBody = body;
    } else {
      reqHeaders["Content-Type"] = "application/json";
      reqBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    credentials: "same-origin", // strictly same-origin session/cookies
    ...customConfig,
    headers: reqHeaders,
    body: reqBody,
  });

  // Handle no-content responses
  if (response.status === 204) {
    return {} as T;
  }

  let data: unknown;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorData = (typeof data === "object" && data !== null ? data : { detail: data }) as ApiErrorResponse;
    const detailMsg =
      typeof errorData.detail === "string"
        ? errorData.detail
        : Array.isArray(errorData.detail)
        ? errorData.detail.map((e) => e.msg).join(", ")
        : errorData.message || response.statusText || "Request failed";

    throw new ApiError(response.status, detailMsg, errorData);
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};

// --------------------------------------------------------------------------
// Demo API TypeScript Definitions & Helpers
// --------------------------------------------------------------------------

export interface Mess {
  id: string;
  name: string;
  capacity: number;
  type: string;
  current_turnout_pct: number;
  location?: string;
  campus_location?: string;
  breakfast_time?: string;
  lunch_time?: string;
  dinner_time?: string;
  meal_times?: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  has_imported_logs?: boolean;
  data_source?: string;
  data_label?: string;
}


export interface OverviewResponse {
  mess_id: string;
  kpis: {
    kg_waste_prevented: number;
    inr_saved: number;
    co2e_avoided_kg: number;
    forecast_accuracy_pct: number;
    guesswork_waste_pct: number;
    platewise_waste_pct: number;
    reduction_factor_pct: number;
    sparklines?: {
      kg_saved: number[];
      inr_saved: number[];
      co2e_avoided: number[];
      accuracy: number[];
    };
  };
  totals: {
    total_prepared_guesswork_kg: number;
    total_prepared_platewise_kg: number;
    total_eaten_kg: number;
    total_waste_guesswork_kg: number;
    total_waste_platewise_kg: number;
  };
  trends_30d: Array<{
    date: string;
    guesswork_waste_kg: number;
    platewise_waste_kg: number;
    waste_prevented_kg: number;
    actual_turnout: number;
    is_exam: boolean;
    is_holiday: boolean;
    is_rainy: boolean;
  }>;
  top_wasted_dishes: Array<{
    dish_id: string;
    name: string;
    dish_name?: string;
    category: string;
    guesswork_waste_kg: number;
    total_waste_kg?: number;
    cost_wasted_inr: number;
    estimated_loss_inr?: number;
    co2e_factor?: number;
  }>;
  active_alerts: Array<{
    id: string;
    severity: "warning" | "info" | "critical" | string;
    title: string;
    message: string;
    action?: string;
    metric_delta?: string;
  }>;
  data_source: string;
  data_label?: string;
  has_imported_logs?: boolean;
  unverified_items_count?: number;
}

export const OverviewTopWastedDishSchema = z.object({
  dish_id: z.string().default(""),
  name: z.string({ message: "Missing required 'name' field" }),
  category: z.string({ message: "Missing required 'category' field" }),
  guesswork_waste_kg: z.number({ message: "Missing required 'guesswork_waste_kg' field" }),
  cost_wasted_inr: z.number({ message: "Missing required 'cost_wasted_inr' field" }),
  dish_name: z.string().optional(),
  total_waste_kg: z.number().optional(),
  estimated_loss_inr: z.number().optional(),
  co2e_factor: z.number().optional(),
}).passthrough();

export const OverviewActiveAlertSchema = z.object({
  id: z.string().default("alert-0"),
  severity: z.string().default("info"),
  title: z.string().default("Alert"),
  message: z.string().default(""),
  action: z.string().optional(),
  metric_delta: z.string().optional(),
}).passthrough();

export const OverviewResponseSchema = z.object({
  mess_id: z.string().default("mess-boys-a"),
  kpis: z.object({
    kg_waste_prevented: z.number().default(0),
    inr_saved: z.number().default(0),
    co2e_avoided_kg: z.number().default(0),
    forecast_accuracy_pct: z.number().default(0),
    guesswork_waste_pct: z.number().default(0),
    platewise_waste_pct: z.number().default(0),
    reduction_factor_pct: z.number().default(0),
    sparklines: z.record(z.string(), z.array(z.number())).optional(),
  }).passthrough().default({
    kg_waste_prevented: 0,
    inr_saved: 0,
    co2e_avoided_kg: 0,
    forecast_accuracy_pct: 0,
    guesswork_waste_pct: 0,
    platewise_waste_pct: 0,
    reduction_factor_pct: 0,
  }),
  totals: z.record(z.string(), z.any()).default({}),
  trends_30d: z.array(z.record(z.string(), z.any())).default([]),
  top_wasted_dishes: z.array(OverviewTopWastedDishSchema).default([]),
  active_alerts: z.array(OverviewActiveAlertSchema).default([]),
  data_source: z.string().default("synthetic_demo"),
  data_label: z.string().default("Demo data (synthetic)"),
  has_imported_logs: z.boolean().default(false),
  unverified_items_count: z.number().default(0),
}).passthrough();

export const PlanResponseSchema = z.object({
  mess_id: z.string().default("mess-boys-a"),
  mess_name: z.string().default("Boys Hostel Mess A"),
  date: z.string().default("2026-11-02"),
  meal: z.string().default("Lunch"),
  expected_turnout_range: z.object({
    p10: z.number().default(0),
    p50: z.number().default(0),
    p90: z.number().default(0),
  }).default({ p10: 0, p50: 0, p90: 0 }),
  total_recommended_kg: z.number().default(0),
  total_recommended_servings: z.number().default(0),
  turnout_drivers: z.array(z.any()).default([]),
  drivers: z.array(z.any()).default([]),
  dishes: z.array(z.any()).default([]),
  live_student_rsvp_count: z.number().default(0),
  is_approved: z.boolean().default(false),
  kitchen_readiness_pct: z.number().default(94),
  surplus_risk: z.object({
    level: z.string().default("Low"),
    risk_score: z.number().default(18),
    shelf_life_hours: z.number().default(3.5),
    hot_holding_temp_c: z.number().default(68),
    redistribution_partners: z.array(z.any()).default([]),
    safety_note: z.string().default("Keep hot holding above 65°C. Safe redistribution window closes 15:30."),
  }).passthrough().default({
    level: "Low",
    risk_score: 18,
    shelf_life_hours: 3.5,
    hot_holding_temp_c: 68,
    redistribution_partners: [],
    safety_note: "Keep hot holding above 65°C. Safe redistribution window closes 15:30.",
  }),
  data_source: z.string().default("synthetic_demo"),
  data_label: z.string().default("Demo data (synthetic)"),
  unverified_items_count: z.number().default(0),
}).passthrough();

export const ForecastResultSchema = z.object({
  mess_id: z.string().default("mess-boys-a"),
  predicted_turnout: z.number().default(0),
  turnout_range: z.object({
    p10: z.number().default(0),
    p50: z.number().default(0),
    p90: z.number().default(0),
  }).default({ p10: 0, p50: 0, p90: 0 }),
  nominal_base_turnout: z.number().default(0),
  drivers: z.array(z.any()).default([]),
  dish_recommendations: z.array(z.any()).default([]),
  total_recommended_kg: z.number().default(0),
  total_recommended_servings: z.number().default(0),
  guesswork_comparison: z.object({
    guesswork_prep_kg: z.number().default(0),
    platewise_prep_kg: z.number().default(0),
    prevented_prep_kg: z.number().default(0),
  }).default({ guesswork_prep_kg: 0, platewise_prep_kg: 0, prevented_prep_kg: 0 }),
  data_source: z.string().default("synthetic_demo"),
}).passthrough();

export const SimulateDayResponseSchema = z.object({
  service_name: z.string().default("Lunch Service Rush Simulation"),
  service_window: z.string().default("12:00 - 14:00"),
  total_diners: z.number().default(0),
  guesswork_prepared_kg: z.number().default(0),
  platewise_prepared_kg: z.number().default(0),
  actual_consumed_kg: z.number().default(0),
  guesswork_leftover_kg: z.number().default(0),
  platewise_leftover_kg: z.number().default(0),
  timeline: z.array(z.any()).default([]),
  data_source: z.string().default("synthetic_demo"),
}).passthrough();

export const ImpactResponseSchema = z.object({
  kg_food_saved: z.number().default(0),
  inr_saved: z.number().default(0),
  co2e_avoided_kg: z.number().default(0),
  co2e_avoided_tonnes: z.number().default(0),
  equivalents: z.record(z.string(), z.any()).default({}),
  assumptions: z.record(z.string(), z.any()).default({}),
  data_source: z.string().default("synthetic_demo"),
}).passthrough();

export const FoodsResponseSchema = z.object({
  foods: z.array(z.any()).default([]),
  count: z.number().default(0),
  comment: z.string().default(""),
}).passthrough();

export const MenusResponseSchema = z.object({
  mess_id: z.string().default("mess-boys-a"),
  menus: z.array(z.any()).default([]),
  count: z.number().default(0),
  data_source: z.string().default("synthetic_demo"),
}).passthrough();

export const LogsResponseSchema = z.object({
  logs: z.array(z.any()).default([]),
  total_active_logs: z.number().default(0),
  data_source: z.string().default("synthetic_demo"),
}).passthrough();

export const PopularPlatesResponseSchema = z.object({
  popular_plates: z.array(z.any()).default([]),
  plates: z.array(z.any()).default([]),
  count: z.number().default(0),
  data_source: z.string().default("synthetic_demo"),
}).passthrough();

export interface DishRecommendation {
  dish_id: string;
  name: string;
  category: string;
  portion_kg: number;
  cost_per_kg_inr: number;
  popularity: number;
  recommended_servings: number;
  recommended_kg: number;
  confidence_pct: number;
  vs_last_week_servings?: number;
  vs_last_week_pct?: number;
  driver_chips?: string[];
}

export interface TurnoutDriver {
  category: string;
  name: string;
  impact_pct: number;
  direction: "positive" | "negative";
  description: string;
}

export interface PlanResponse {
  mess_id: string;
  mess_name: string;
  date: string;
  meal: "Breakfast" | "Lunch" | "Dinner";
  expected_turnout_range: {
    p10: number;
    p50: number;
    p90: number;
  };
  turnout_drivers: TurnoutDriver[];
  dishes: DishRecommendation[];
  total_recommended_kg: number;
  total_recommended_servings: number;
  surplus_risk: {
    level: "Low" | "Moderate" | "High";
    risk_score: number;
    shelf_life_hours: number;
    hot_holding_temp_c: number;
    redistribution_partners: Array<{
      name: string;
      contact: string;
      eta_minutes: number;
    }>;
  };
  live_student_rsvp_count: number;
  is_approved: boolean;
  kitchen_readiness_pct: number;
  data_source: string;
  data_label?: string;
  unverified_items_count?: number;
}

export interface ForecastParams {
  mess_id?: string;
  day_of_week?: number;
  meal?: "Breakfast" | "Lunch" | "Dinner";
  expected_turnout?: number | null;
  is_exam?: boolean;
  is_holiday?: boolean;
  has_event?: boolean;
  rain_mm?: number;
  temperature_c?: number;
  menu?: string[];
}

export interface ForecastResult {
  mess_id: string;
  parameters: ForecastParams;
  predicted_turnout: number;
  turnout_range: {
    p10: number;
    p50: number;
    p90: number;
  };
  nominal_base_turnout: number;
  drivers: TurnoutDriver[];
  dish_recommendations: DishRecommendation[];
  total_recommended_kg: number;
  total_recommended_servings: number;
  guesswork_comparison: {
    guesswork_prep_kg: number;
    platewise_prep_kg: number;
    prevented_prep_kg: number;
  };
  data_source: string;
}

export interface BacktestBaseline {
  name: string;
  mape: number;
  rmse: number;
}

export interface BacktestResponse {
  training_days: number;
  test_days: number;
  test_samples: number;
  baselines: {
    platewise: BacktestBaseline;
    cook_for_capacity: BacktestBaseline;
    same_weekday_last_week: BacktestBaseline;
  };
  error_reduction_vs_capacity_pct: number;
  error_reduction_vs_last_week_pct: number;
  sample_predictions: Array<{
    date: string;
    meal: string;
    actual_turnout: number;
    pred_platewise: number;
    pred_capacity: number;
    pred_last_week: number;
    error_platewise_pct: number;
  }>;
  data_source: string;
}

export interface SimulateDayTick {
  time: string;
  arrivals: number;
  cumulative_eaten_kg: number;
  guesswork_remaining_kg: number;
  platewise_remaining_kg: number;
}

export interface SimulateDayResponse {
  service_name: string;
  service_window: string;
  total_diners: number;
  guesswork_prepared_kg: number;
  platewise_prepared_kg: number;
  actual_consumed_kg: number;
  guesswork_leftover_kg: number;
  platewise_leftover_kg: number;
  timeline: SimulateDayTick[];
  data_source: string;
}

export interface MealLog {
  id?: string;
  mess_id: string;
  date: string;
  meal: "Breakfast" | "Lunch" | "Dinner";
  dish_id: string;
  prepared_kg: number;
  consumed_kg: number;
  leftover_kg: number;
  turnout: number;
  created_at?: string;
  is_synthetic_seed?: boolean;
}

export const demoApi = {
  getMesses: () =>
    api.get<{ messes: Mess[]; total_messes: number; data_source: string }>("/v1/demo/messes"),

  createMess: (payload: {
    name: string;
    capacity: number;
    type?: string;
    location?: string;
    breakfast_time?: string;
    lunch_time?: string;
    dinner_time?: string;
  }) => api.post<{ status: string; mess: Mess; message: string }>("/v1/demo/messes", payload),

  updateMess: (id: string, payload: Partial<Mess>) =>
    api.put<{ status: string; mess: Mess }>(`/v1/demo/messes/${id}`, payload),

  deleteMess: (id: string) =>
    api.delete<{ status: string; message: string }>(`/v1/demo/messes/${id}`),

  getOverview: async (messId: string = "mess-boys-a"): Promise<OverviewResponse> => {
    const raw = await api.get<any>("/v1/demo/overview", { params: { mess_id: messId } });
    const validated = validateApiResponse<OverviewResponse>(raw, OverviewResponseSchema, "/v1/demo/overview");
    if (validated && Array.isArray(validated.top_wasted_dishes)) {
      validated.top_wasted_dishes = validated.top_wasted_dishes.map((dish: any) => ({
        ...dish,
        name: dish.name ?? dish.dish_name ?? dish.dish_id,
        category: dish.category ?? "curry",
        guesswork_waste_kg: dish.guesswork_waste_kg ?? dish.total_waste_kg ?? 0,
        cost_wasted_inr: dish.cost_wasted_inr ?? dish.estimated_loss_inr ?? 0,
      }));
    }
    if (validated && Array.isArray(validated.active_alerts)) {
      validated.active_alerts = validated.active_alerts.map((alert: any) => ({
        ...alert,
        action: alert.action ?? alert.metric_delta ?? "",
      }));
    }
    return validated;
  },

  getPlan: async (params?: { mess_id?: string; date?: string; meal?: string }): Promise<PlanResponse> => {
    const raw = await api.get<any>("/v1/demo/plan", {
      params: {
        mess_id: params?.mess_id || "mess-boys-a",
        date: params?.date,
        meal: params?.meal || "Lunch",
      },
    });
    const normalized = {
      ...(raw || {}),
      turnout_drivers: raw?.turnout_drivers || raw?.drivers || [],
      drivers: raw?.drivers || raw?.turnout_drivers || [],
      dishes: Array.isArray(raw?.dishes) ? raw.dishes : [],
      expected_turnout_range: {
        p10: 0,
        p50: 0,
        p90: 0,
        ...(raw?.expected_turnout_range || {}),
      },
      surplus_risk: {
        level: "Low",
        risk_score: 18,
        shelf_life_hours: 3.5,
        hot_holding_temp_c: 68,
        safety_note: "Keep hot holding above 65°C. Safe redistribution window closes 15:30.",
        ...(raw?.surplus_risk || {}),
        redistribution_partners: Array.isArray(raw?.surplus_risk?.redistribution_partners)
          ? raw.surplus_risk.redistribution_partners.map((p: any) =>
              typeof p === "string" ? { name: p, contact: "—", eta_minutes: 30 } : p
            )
          : [],
      },
    };
    return validateApiResponse<PlanResponse>(normalized, PlanResponseSchema, "/v1/demo/plan");
  },

  approvePlan: (payload: { mess_id: string; date: string; meal: string }) =>
    api.post<{
      status: string;
      mess_id: string;
      date: string;
      meal: string;
      is_approved: boolean;
      message: string;
    }>("/v1/demo/plan/approve", payload),

  postForecast: async (params: ForecastParams): Promise<ForecastResult> => {
    const raw = await api.post<any>("/v1/demo/forecast", params);
    const normalized = {
      ...(raw || {}),
      drivers: Array.isArray(raw?.drivers) ? raw.drivers : [],
      dish_recommendations: Array.isArray(raw?.dish_recommendations) ? raw.dish_recommendations : [],
      turnout_range: {
        p10: 0,
        p50: 0,
        p90: 0,
        ...(raw?.turnout_range || {}),
      },
      guesswork_comparison: {
        guesswork_prep_kg: 0,
        platewise_prep_kg: 0,
        prevented_prep_kg: 0,
        ...(raw?.guesswork_comparison || {}),
      },
    };
    return validateApiResponse<ForecastResult>(normalized, ForecastResultSchema, "/v1/demo/forecast");
  },

  postReset: () =>
    api.post<{ status: string; message: string }>("/v1/demo/reset"),

  postRsvp: (payload: {
    student_id?: string;
    mess_id: string;
    date: string;
    meal: string;
    status: "eating" | "skipping";
  }) => api.post<any>("/v1/demo/rsvp", payload),

  getFoods: async () => {
    const raw = await api.get<any>("/v1/demo/foods");
    const normalized = {
      foods: Array.isArray(raw?.foods) ? raw.foods : [],
      count: typeof raw?.count === "number" ? raw.count : 0,
      comment: raw?.comment || "",
      ...(raw || {}),
    };
    return validateApiResponse<{ foods: any[]; count: number; comment: string }>(
      normalized,
      FoodsResponseSchema,
      "/v1/demo/foods"
    );
  },

  createFood: (payload: any) =>
    api.post<{ status: string; food: any; message: string }>("/v1/demo/foods", payload),

  updateFood: (id: string, payload: any) =>
    api.put<{ status: string; food: any; message: string }>(`/v1/demo/foods/${id}`, payload),

  deleteFood: (id: string) =>
    api.delete<{ status: string; message: string }>(`/v1/demo/foods/${id}`),

  getWeeklyMenus: async (messId: string = "mess-boys-a") => {
    const raw = await api.get<any>("/v1/demo/menus", {
      params: { mess_id: messId },
    });
    const normalized = {
      mess_id: messId,
      menus: Array.isArray(raw?.menus) ? raw.menus : [],
      count: typeof raw?.count === "number" ? raw.count : 0,
      data_source: raw?.data_source || "synthetic_demo",
      ...(raw || {}),
    };
    return validateApiResponse<{ mess_id: string; menus: any[]; count: number; data_source: string }>(
      normalized,
      MenusResponseSchema,
      "/v1/demo/menus"
    );
  },

  setMenuCell: (payload: {
    mess_id: string;
    day_of_week: number;
    meal: string;
    dish_ids: string[];
  }) =>
    api.post<{ status: string; menu: any; message: string }>("/v1/demo/menus/cell", payload),

  optimizeMenu: (messId: string = "mess-boys-a") =>
    api.post<{
      status: string;
      mess_id: string;
      suggestions: any[];
      suggestions_applied: number;
      total_projected_waste_cut_kg: number;
      total_projected_inr_saved: number;
    }>("/v1/demo/menus/optimize", undefined, { params: { mess_id: messId } }),

  evaluatePlate: (items: Array<{ food_id: string; count: number }>) =>
    api.post<any>("/v1/demo/plates/evaluate", { items }),

  savePlate: (payload: {
    name: string;
    items: Array<{ food_id: string; count: number }>;
    mess_id: string;
    meal: string;
  }) => api.post<{ status: string; plate: any }>("/v1/demo/plates", payload),

  getPopularPlates: async (messId?: string) => {
    const raw = await api.get<any>("/v1/demo/plates/popular", {
      params: messId ? { mess_id: messId } : undefined,
    });
    const plates = Array.isArray(raw?.popular_plates)
      ? raw.popular_plates
      : Array.isArray(raw?.plates)
      ? raw.plates
      : [];
    const normalized = {
      popular_plates: plates,
      plates: plates,
      count: typeof raw?.count === "number" ? raw.count : plates.length,
      data_source: raw?.data_source || "synthetic_demo",
      ...(raw || {}),
    };
    return validateApiResponse<{ popular_plates: any[]; plates?: any[]; count: number }>(
      normalized,
      PopularPlatesResponseSchema,
      "/v1/demo/plates/popular"
    );
  },

  deletePlate: (id: string) =>
    api.delete<{ status: string; message: string }>(`/v1/demo/plates/${id}`),

  getBacktest: () =>
    api.get<BacktestResponse>("/v1/demo/backtest"),

  getSimulateDay: async (): Promise<SimulateDayResponse> => {
    const raw = await api.get<any>("/v1/demo/simulate-day");
    const normalized = {
      ...(raw || {}),
      timeline: Array.isArray(raw?.timeline) ? raw.timeline : [],
    };
    return validateApiResponse<SimulateDayResponse>(
      normalized,
      SimulateDayResponseSchema,
      "/v1/demo/simulate-day"
    );
  },

  postLog: (payload: MealLog) =>
    api.post<{
      status: string;
      logged_record: MealLog;
      log: MealLog;
      total_active_logs: number;
      data_source: string;
    }>("/v1/demo/log", payload),

  updateMealLog: (id: string, payload: Partial<MealLog>) =>
    api.put<{ status: string; log: MealLog }>(`/v1/demo/logs/${id}`, payload),

  deleteMealLog: (id: string) =>
    api.delete<{ status: string; message: string }>(`/v1/demo/logs/${id}`),

  getLogs: async (limit: number = 50, messId?: string) => {
    const raw = await api.get<any>("/v1/demo/logs", { params: { limit, mess_id: messId } });
    const normalized = {
      logs: Array.isArray(raw?.logs) ? raw.logs : [],
      total_active_logs: typeof raw?.total_active_logs === "number" ? raw.total_active_logs : 0,
      data_source: raw?.data_source || "synthetic_demo",
      ...(raw || {}),
    };
    return validateApiResponse<{
      logs: MealLog[];
      total_active_logs: number;
      data_source: string;
    }>(normalized, LogsResponseSchema, "/v1/demo/logs");
  },

  getImpact: async () => {
    const raw = await api.get<any>("/v1/demo/impact");
    const normalized = {
      kg_food_saved: 8400.0,
      inr_saved: 1420000,
      co2e_avoided_kg: 21000.0,
      co2e_avoided_tonnes: 21.0,
      equivalents: {
        trees_planted_equivalent: 1050,
        car_km_avoided: 109375,
        household_days_powered: 5000,
        meals_redistributed_potential: 24000,
        ...(raw?.equivalents || {}),
      },
      assumptions: {
        default_cost_per_kg_inr: 45.0,
        default_emission_factor_co2e: 2.5,
        source: "IPCC Climate Change & Land Special Report; FAO Food Wastage Footprint v2",
        ...(raw?.assumptions || {}),
      },
      data_source: "synthetic_demo",
      ...(raw || {}),
    };
    return validateApiResponse<any>(normalized, ImpactResponseSchema, "/v1/demo/impact");
  },

  // Real Data System Endpoints
  importFoods: (rows: any[], dryRun: boolean = false) =>
    api.post<{
      status: string;
      total_rows: number;
      valid_rows: number;
      created_count: number;
      updated_count: number;
      errors: Array<{ row_index: number; id?: string; name?: string; error: string }>;
      warnings_count: number;
      dry_run: boolean;
      items: Array<{
        row_index: number;
        id: string;
        name: string;
        action: "create" | "update";
        category: string;
        veg: boolean;
        serving_weight_g: number;
        kcal_per_serving: number;
        source_type: string;
        verified: boolean;
        warnings: string[];
      }>;
    }>("/v1/demo/foods/import", { rows, dry_run: dryRun }),

  getIngredients: () =>
    api.get<{
      ingredients: Array<{
        id: string;
        name: string;
        kcal_per_100g: number;
        protein: number;
        carbs: number;
        fat: number;
        source_note?: string;
      }>;
      count: number;
      note: string;
    }>("/v1/demo/ingredients"),

  createIngredient: (payload: {
    name: string;
    kcal_per_100g: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    source_note?: string;
  }) =>
    api.post<{
      status: string;
      ingredient: {
        id: string;
        name: string;
        kcal_per_100g: number;
        protein: number;
        carbs: number;
        fat: number;
        source_note?: string;
      };
      message: string;
    }>("/v1/demo/ingredients", payload),

  updateIngredient: (
    id: string,
    payload: {
      name?: string;
      kcal_per_100g?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      source_note?: string;
    }
  ) =>
    api.put<{
      status: string;
      ingredient: {
        id: string;
        name: string;
        kcal_per_100g: number;
        protein: number;
        carbs: number;
        fat: number;
        source_note?: string;
      };
      message: string;
    }>(`/v1/demo/ingredients/${id}`, payload),

  deleteIngredient: (id: string) =>
    api.delete<{ status: string; message: string }>(`/v1/demo/ingredients/${id}`),

  importMealLogs: (messId: string, rows: any[]) =>
    api.post<{
      status: string;
      mess_id: string;
      imported_count: number;
      has_imported_logs: boolean;
      data_source: string;
      data_label: string;
      message: string;
    }>("/v1/demo/logs/import", { mess_id: messId, rows }),
};


// Convenience endpoint helper functions
export async function getHealthStatus(): Promise<{
  status: string;
  backend?: string;
  database?: string;
  latency_ms?: number;
  environment?: string;
  version?: string;
}> {
  return api.get("/health");
}

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    api.post<{ message: string; csrf_token: string }>("/v1/auth/login", payload),

  registerStudent: (payload: {
    email: string;
    full_name: string;
    password: string;
    join_code: string;
  }) =>
    api.post<{ message: string; csrf_token: string }>("/v1/auth/register-student", payload),

  logout: () => api.post<{ message: string }>("/v1/auth/logout"),

  me: () =>
    api.get<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      cafeteria_ids: string[];
    }>("/v1/auth/me"),
};

export const appApi = {
  student: {
    getToday: () =>
      api.get<{
        mess_id: string;
        mess_name: string;
        date: string;
        day_name: string;
        current_meal: string;
        cutoff_time: string;
        is_cutoff_passed: boolean;
        menu_items: any[];
        my_rsvp: "eating" | "skipping" | null;
      }>("/v1/app/student/today"),

    submitRsvp: (payload: { date: string; meal: string; status: "eating" | "skipping" }) =>
      api.post<{ message: string; status: string }>("/v1/app/student/rsvp", payload),

    getPlates: () =>
      api.get<{
        my_plates: any[];
        community_plates: any[];
      }>("/v1/app/student/plates"),

    savePlate: (payload: any) =>
      api.post<{ message: string; plate_id: string; name: string }>("/v1/app/student/plates", payload),

    rateMeal: (payload: { date: string; meal: string; rating: number; feedback?: string }) =>
      api.post<{ message: string; rating: number }>("/v1/app/student/rate", payload),

    getProfile: () =>
      api.get<{
        id: string;
        email: string;
        full_name: string;
        role: string;
        mess_id: string;
        mess_name: string;
        campus_location: string;
        streak_days: number;
        saved_plates_count: number;
        ratings_submitted: number;
      }>("/v1/app/student/me"),
  },

  owner: {
    getMesses: () =>
      api.get<Array<{
        id: string;
        name: string;
        campus_location: string;
        is_demo: boolean;
        cost_per_kg_inr: number;
        co2e_factor_kg_per_kg: number;
      }>>("/v1/app/owner/messes"),

    getEngagement: (messId?: string) =>
      api.get<{
        mess_id: string;
        date: string;
        rsvps: { eating: number; skipping: number; total: number };
        rating_summary: { average: number; total_reviews: number };
        feedback_stream: Array<{
          id: string;
          date: string;
          meal: string;
          rating: number;
          feedback: string;
          created_at: string;
        }>;
        popular_plates: any[];
      }>("/v1/app/owner/engagement", { params: messId ? { mess_id: messId } : undefined }),

    createJoinCode: (payload: { mess_id?: string; max_uses?: number; valid_days?: number }) =>
      api.post<{
        code: string;
        id: string;
        mess_id: string;
        max_uses: number;
        expires_at: string;
        instructions: string;
      }>("/v1/app/owner/join-codes", payload),

    listJoinCodes: (messId?: string) =>
      api.get<Array<{
        id: string;
        mess_id: string;
        max_uses: number;
        used_count: number;
        remaining_uses: number;
        expires_at: string;
        is_active: boolean;
        created_at: string;
      }>>("/v1/app/owner/join-codes", { params: messId ? { mess_id: messId } : undefined }),

    deactivateJoinCode: (codeId: string) =>
      api.delete<{ message: string }>(`/v1/app/owner/join-codes/${codeId}`),
  },

  admin: {
    getMesses: () =>
      api.get<Array<{
        id: string;
        name: string;
        campus_location: string;
        is_demo: boolean;
        cost_per_kg_inr: number;
        co2e_factor_kg_per_kg: number;
        manager_count: number;
        student_count: number;
        created_at: string;
      }>>("/v1/app/admin/messes"),

    createMess: (payload: {
      name: string;
      campus_location: string;
      cost_per_kg_inr?: number;
      co2e_factor_kg_per_kg?: number;
    }) =>
      api.post<{ message: string; id: string; name: string }>("/v1/app/admin/messes", payload),

    getUsers: (role?: string) =>
      api.get<Array<{
        id: string;
        email: string;
        full_name: string;
        role: string;
        is_active: boolean;
        assigned_messes: Array<{ id: string; name: string }>;
        created_at: string;
      }>>("/v1/app/admin/users", { params: role ? { role } : undefined }),

    createOwner: (payload: {
      email: string;
      full_name: string;
      password: string;
      mess_ids: string[];
    }) =>
      api.post<{ message: string; id: string; email: string; assigned_messes: string[] }>(
        "/v1/app/admin/users/owner",
        payload
      ),

    deactivateUser: (userId: string) =>
      api.patch<{ message: string; is_active: boolean }>(`/v1/app/admin/users/${userId}/deactivate`),

    resetPassword: (userId: string, newPassword: string) =>
      api.post<{ message: string }>(`/v1/app/admin/users/${userId}/reset-password`, {
        new_password: newPassword,
      }),

    getAuditLogs: (limit: number = 50, action?: string) =>
      api.get<Array<{
        id: string;
        action: string;
        user_id?: string;
        ip_address?: string;
        user_agent?: string;
        details?: any;
        created_at: string;
      }>>("/v1/app/admin/audit-logs", { params: { limit, ...(action ? { action } : {}) } }),

    getHealth: () =>
      api.get<{
        status: string;
        environment: string;
        database: string;
        total_users: number;
        total_messes: number;
        total_audit_events: number;
        active_join_codes: number;
        timestamp: string;
      }>("/v1/app/admin/health"),

    getAssumptions: () =>
      api.get<{
        default_cost_per_kg_inr: number;
        default_emission_factor_co2e: number;
        account_lockout_attempts: number;
        account_lockout_minutes: number;
        password_min_length: number;
      }>("/v1/app/admin/assumptions"),
  },
};

export default api;


