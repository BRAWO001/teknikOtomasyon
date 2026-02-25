// src/utils/roleGuard.js
import { getCookie } from "@/utils/cookieHelper";

/**
 * Sayfaya rol bazlı giriş kontrolü (SSR)
 * Kullanım:
 *   export const getServerSideProps = (ctx) =>
 *     roleGuard(ctx, { allow: [70, 80], redirectTo: "/" });
 */
export function roleGuard(ctx, opts = {}) {
  const {
    allow = [], // izinli rol listesi (örn [70, 80])
    cookieName = "PersonelUserInfo",
    redirectTo = "/", // yetkisizse nereye
  } = opts;

  // Güvenli default: allow boşsa kimseyi sokma
  if (!Array.isArray(allow) || allow.length === 0) {
    return { redirect: { destination: redirectTo, permanent: false } };
  }

  const raw = getCookie(ctx.req, cookieName);
  if (!raw) {
    return { redirect: { destination: redirectTo, permanent: false } };
  }

  let personel = null;
  try {
    personel = JSON.parse(raw);
  } catch {
    return { redirect: { destination: redirectTo, permanent: false } };
  }

  const rol = Number(personel?.rol ?? personel?.Rol);
  if (!Number.isFinite(rol)) {
    return { redirect: { destination: redirectTo, permanent: false } };
  }

  if (!allow.includes(rol)) {
    return { redirect: { destination: redirectTo, permanent: false } };
  }

  return { props: {} };
}

/**
 * İstersen "minimum rol" / "rol aralığı" gibi kontrol:
 *   roleGuardRange(ctx, { min: 70, max: 90 })
 */
export function roleGuardRange(ctx, opts = {}) {
  const { min = null, max = null, cookieName = "PersonelUserInfo", redirectTo = "/" } = opts;

  const raw = getCookie(ctx.req, cookieName);
  if (!raw) return { redirect: { destination: redirectTo, permanent: false } };

  let personel = null;
  try { personel = JSON.parse(raw); } catch { return { redirect: { destination: redirectTo, permanent: false } }; }

  const rol = Number(personel?.rol ?? personel?.Rol);
  if (!Number.isFinite(rol)) return { redirect: { destination: redirectTo, permanent: false } };

  if (min != null && rol < min) return { redirect: { destination: redirectTo, permanent: false } };
  if (max != null && rol > max) return { redirect: { destination: redirectTo, permanent: false } };

  return { props: {} };
}