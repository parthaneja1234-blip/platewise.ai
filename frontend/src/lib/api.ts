/**
 * PlateWise AI — Single-Origin Typed API Client
 *
 * Uses relative URLs with credentials: "same-origin".
 * In development and production, browser requests go to port 3000,
 * which are proxied via Next.js rewrites to the FastAPI backend.
 */

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
    category: string;
    guesswork_waste_kg: number;
    cost_wasted_inr: number;
  }>;
  active_alerts: Array<{
    id: string;
    severity: "warning" | "info" | "critical";
    title: string;
    message: string;
    action: string;
  }>;
  data_source: string;
}

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

export const demoApi = {
  getMesses: () =>
    api.get<{ messes: Mess[]; total_messes: number; data_source: string }>("/v1/demo/messes"),

  getOverview: (messId: string = "mess-boys-a") =>
    api.get<OverviewResponse>("/v1/demo/overview", { params: { mess_id: messId } }),

  getPlan: (params?: { mess_id?: string; date?: string; meal?: string }) =>
    api.get<PlanResponse>("/v1/demo/plan", {
      params: {
        mess_id: params?.mess_id || "mess-boys-a",
        date: params?.date,
        meal: params?.meal || "Lunch",
      },
    }),

  approvePlan: (payload: { mess_id: string; date: string; meal: string }) =>
    api.post<{
      status: string;
      mess_id: string;
      date: string;
      meal: string;
      is_approved: boolean;
      message: string;
    }>("/v1/demo/plan/approve", payload),

  postForecast: (params: ForecastParams) =>
    api.post<any>("/v1/demo/forecast", params),

  postReset: () =>
    api.post<{ status: string; message: string }>("/v1/demo/reset"),

  postRsvp: (payload: {
    student_id?: string;
    mess_id: string;
    date: string;
    meal: string;
    status: "eating" | "skipping";
  }) => api.post<any>("/v1/demo/rsvp", payload),

  getFoods: () =>
    api.get<{ foods: any[]; count: number; comment: string }>("/v1/demo/foods"),

  getPopularPlates: () =>
    api.get<{ popular_plates: any[]; count: number }>("/v1/demo/plates/popular"),

  getBacktest: () =>
    api.get<any>("/v1/demo/backtest"),

  getImpact: () =>
    api.get<any>("/v1/demo/impact"),
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

export default api;

