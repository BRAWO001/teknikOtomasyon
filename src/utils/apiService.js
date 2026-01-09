




// src/utils/apiService.js
import axios from "axios";
import { getCookie as getServerCookie } from "@/utils/cookieHelper";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pilotapisrc.com/api";

function getToken(req) {
  if (req) return getServerCookie(req, "AuthToken_01") || null;

  if (typeof window !== "undefined") {
    return getClientCookie("AuthToken_01") || null;
  }
  return null;
}

async function request(method, endpoint, { req, data, headers: extraHeaders } = {}) {
  const token = getToken(req);

  const base = BASE_URL.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");
  const url = `${base}/${path}`;

  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

  // ✅ default headers (JSON) ama FormData ise Content-Type koyma (axios boundary ayarlasın)
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(extraHeaders || {}),
  };

  // Eğer FormData ve kullanıcı "multipart/form-data" set etmişse sorun yok,
  // ama çoğu zaman set etmese daha iyi (axios boundary ile setler).
  // Yine de üstte merge ettiğimiz için çalışır.

  const res = await axios({ method, url, headers, data });
  return res.data;
}

export function getDataAsync(endpoint, options = {}) {
  return request("get", endpoint, options);
}

export function postDataAsync(endpoint, body, options = {}) {
  return request("post", endpoint, { ...options, data: body, headers: options.headers });
}

export function putDataAsync(endpoint, body, options = {}) {
  return request("put", endpoint, { ...options, data: body, headers: options.headers });
}

export function deleteDataAsync(endpoint, options = {}) {
  return request("delete", endpoint, options);
}
