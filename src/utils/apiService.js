// src/utils/apiService.js
import axios from "axios";
import { getCookie as getServerCookie } from "@/utils/cookieHelper";   // SSR için
import { getCookie as getClientCookie } from "@/utils/cookieService";  // client için

// 🔧 Backend base URL
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pilotapisrc.com/api";

// 🔑 Ortak token getter
function getToken(req) {
  // SSR tarafı: req varsa server cookie'sinden oku
  if (req) {
    const token = getServerCookie(req, "AuthToken_01");
    return token || null;
  }

  // Client tarafı: document.cookie üzerinden oku
  if (typeof window !== "undefined") {
    const token = getClientCookie("AuthToken_01");
    return token || null;
  }

  return null;
}

// 🔁 Ortak istek fonksiyonu
async function request(method, endpoint, { req, data } = {}) {
  const token = getToken(req);

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // URL'i düzgün birleştir (extra / kırp)
  const base = BASE_URL.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");
  const url = `${base}/${path}`;

  const res = await axios({
    method,
    url,
    headers,
    data,
  });

  return res.data;
}

// ⭐ GET -> getDataAsync
export function getDataAsync(endpoint, options = {}) {
  return request("get", endpoint, options);
}

// ⭐ POST -> postDataAsync
export function postDataAsync(endpoint, body, options = {}) {
  return request("post", endpoint, { ...options, data: body });
}

// ⭐ PUT -> putDataAsync
export function putDataAsync(endpoint, body, options = {}) {
  return request("put", endpoint, { ...options, data: body });
}

// ⭐ DELETE -> deleteDataAsync
export function deleteDataAsync(endpoint, options = {}) {
  return request("delete", endpoint, options);
}
