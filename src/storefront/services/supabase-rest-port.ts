import type { StorefrontSupabasePort } from "../types";

type RequestFn = (path: string, options?: Record<string, unknown>) => Promise<unknown>;

export function createSupabaseRestPort(request: RequestFn): StorefrontSupabasePort {
  return {
    get<T>(path: string, options = {}) {
      return request(path, { method: "GET", ...options }) as Promise<T>;
    },
    post<T>(path: string, body: unknown, options = {}) {
      return request(path, { method: "POST", body: JSON.stringify(body), ...options }) as Promise<T>;
    },
    patch<T>(path: string, body: unknown, options = {}) {
      return request(path, { method: "PATCH", body: JSON.stringify(body), ...options }) as Promise<T>;
    },
    delete<T>(path: string, options = {}) {
      return request(path, { method: "DELETE", ...options }) as Promise<T>;
    },
  };
}
