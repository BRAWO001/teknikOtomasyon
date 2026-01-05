// src/utils/cookieHelper.js
import { serialize, parse } from "cookie";

// SUNUCU TARAFI: Cookie set et
export function setCookie(res, name, value, options = {}) {
  const defaultOptions = {
    httpOnly: false, // ⭐ JS'ten okunabilir olsun
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    // maxAge: 60 * 60 * 24 * 7, // 7 gün
    // maxAge: 60 , // 1 dakika
    maxAge: 60 * 60 * 8, // 8 saat
  };

  const cookie = serialize(name, value, {
    ...defaultOptions,
    ...options,
  });

  const existing = res.getHeader("Set-Cookie");

  if (existing) {
    if (Array.isArray(existing)) {
      res.setHeader("Set-Cookie", [...existing, cookie]);
    } else {
      res.setHeader("Set-Cookie", [existing, cookie]);
    }
  } else {
    res.setHeader("Set-Cookie", cookie);
  }
}

// SUNUCU TARAFI: Cookie oku (SSR / API Route)
export function getCookie(req, name) {
  if (!req || !req.headers) return null; // ⭐ req yoksa patlama
  const cookies = parse(req.headers.cookie || "");
  return cookies[name] || null;
}

// SUNUCU TARAFI: Cookie sil
export function deleteCookie(res, name) {
  const cookie = serialize(name, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  const existing = res.getHeader("Set-Cookie");

  if (existing) {
    if (Array.isArray(existing)) {
      res.setHeader("Set-Cookie", [...existing, cookie]);
    } else {
      res.setHeader("Set-Cookie", [existing, cookie]);
    }
  } else {
    res.setHeader("Set-Cookie", cookie);
  }
}
