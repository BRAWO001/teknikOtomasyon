// src/utils/cookieService.js

// CLIENT TARAFI: document.cookie üzerinden cookie oku
export function getCookie(name) {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)")
  );

  return match ? decodeURIComponent(match[2]) : null;
}
