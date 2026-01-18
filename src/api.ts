import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

const TOKEN_KEY = "kantor_token_v3";

// ===== TOKEN STORAGE =====
export async function setToken(token: string) {
  console.log("[TOKEN] setToken:", token ? token.slice(0, 20) + "..." : token);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  const t = await SecureStore.getItemAsync(TOKEN_KEY);
  console.log("[TOKEN] getToken:", t ? t.slice(0, 20) + "..." : t);
  return t;
}

export async function clearToken() {
  console.log("[TOKEN] clearToken");
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ===== REQUEST CORE =====
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  console.log("[REQ]", path, "hasToken?", !!token);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  console.log("[RES STATUS]", path, res.status);

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.log("[RES ERROR BODY]", data);
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  console.log("[RES OK BODY]", path, data);
  return data as T;
}

// ===== AUTH =====
export async function apiLogin(email: string, password: string) {
  console.log("[LOGIN] start", email);

  const res: any = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  console.log("[LOGIN] raw response:", res);

  const token =
    res?.access_token ??
    res?.token ??
    res?.accessToken ??
    res?.jwt ??
    res?.data?.access_token ??
    res?.data?.token;

  console.log("[LOGIN] parsed token:", token ? token.slice(0, 20) + "..." : token);

  if (!token) {
    throw new Error("Brak tokena w odpowiedzi z /auth/login");
  }

  await setToken(token);
  return res;
}

export function apiRegister(email: string, password: string) {
  console.log("[REGISTER]", email);
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ===== DATA =====
export function apiRatesLatest() {
  return request("/rates/latest");
}

export function apiWalletMe() {
  return request("/wallet/me");
}

export function apiRatesByDate(date: string) {
  // zakładam format YYYY-MM-DD
  return request(`/rates/history?date=${encodeURIComponent(date)}`);
}

export function apiWalletDeposit(amountPLN: number) {
  return request("/wallet/deposit", {
    method: "POST",
    body: JSON.stringify({ amountPLN }),
  });
}

