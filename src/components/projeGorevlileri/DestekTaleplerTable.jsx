// src/components/projeGorevlileri/DestekTaleplerTable.jsx
import React, { useMemo } from "react";
import { useRouter } from "next/router";

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatTR(isoOrDate) {
  if (!isoOrDate) return "-";
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return safeText(isoOrDate);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return safeText(isoOrDate);
  }
}

function pick(item, ...keys) {
  for (const k of keys) {
    const v = item?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
}

function badgeClassFromDurum(durumRaw) {
  const d = String(durumRaw || "").toLowerCase();
  if (d.includes("kapalı") || d.includes("kapali"))
    return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";
  if (d.includes("bekle"))
    return "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
  return "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
}

export default function DestekTaleplerTable({
  items = [],
  loading = false,
  onOpenToken,
}) {
  const router = useRouter();
  const rows = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const goDetay = (token) => {
    if (!token) return;

    if (typeof onOpenToken === "function") {
      onOpenToken(token);
      return;
    }

    router.push({
      pathname: "/Destek/TalepDetay/[token]",
      query: { token: String(token) },
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-auto">
        <table className="min-w-[950px] w-full text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-3 py-2 font-semibold">TicketNo</th>
              <th className="px-3 py-2 font-semibold">Site</th>
              <th className="px-3 py-2 font-semibold">Ad Soyad</th>
              <th className="px-3 py-2 font-semibold">Konu</th>
              <th className="px-3 py-2 font-semibold">Departman</th>
              <th className="px-3 py-2 font-semibold">Durum</th>
              <th className="px-3 py-2 font-semibold">Tarih</th>
              <th className="px-3 py-2 font-semibold text-right">İşlem</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-3 text-zinc-500 dark:text-zinc-400">
                  Yükleniyor…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-3 text-zinc-500 dark:text-zinc-400">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              rows.map((it, idx) => {
                // ✅ SADECE TicketNo (Id fallback yok!)
                const ticketNo = pick(it, "TicketNo", "ticketNo");
                const siteAdi = pick(it, "SiteAdi", "siteAdi", "SiteAd", "siteAd");
                const adSoyad = pick(it, "AdSoyad", "adSoyad");
                const konu = pick(it, "Konu", "konu");
                const departman = pick(it, "Departman", "departman");
                const durum = pick(it, "Durum", "durum", "Not_1", "not_1");
                const tarih = pick(it, "TarihUtc", "tarihUtc", "Tarih", "tarih");
                const token = pick(it, "Token", "token");

                return (
                  <tr
                    key={String(token || ticketNo || idx)}
                    className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/40"
                    onDoubleClick={() => token && goDetay(token)}
                    title={
                      token
                        ? "Detay için çift tıkla"
                        : "Token yok (liste response token göndermeli)"
                    }
                  >
                    <td className="px-2 py-2">
                      {ticketNo === null || ticketNo === undefined ? (
                        <span className="text-zinc-400">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (token) goDetay(token);
                          }}
                          className="
        inline-flex items-center
        rounded-md
        bg-blue-50
        px-3 py-1
        text-[12px] font-semibold
        text-blue-700 cursor-pointer
        transition
        hover:bg-blue-100
        hover:text-blue-900
        dark:bg-blue-900/30
        dark:text-blue-200
        dark:hover:bg-blue-900/50
      "
                        >
                          {String(ticketNo)}
                        </button>
                      )}
                    </td>

                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">
                      {safeText(siteAdi)}
                    </td>

                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">
                      {safeText(adSoyad)}
                    </td>

                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">
                      <span className="block max-w-[320px] truncate">
                        {safeText(konu)}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">
                      {safeText(departman)}
                    </td>

                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClassFromDurum(
                          durum,
                        )}`}
                      >
                        {safeText(durum)}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {formatTR(tarih)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (token) goDetay(token);
                        }}
                        disabled={!token}
                          className="
        inline-flex items-center
        rounded-md
        bg-blue-50
        px-3 py-1
        text-[12px] font-semibold
        text-blue-700 cursor-pointer
        transition
        hover:bg-blue-100
        hover:text-blue-900
        dark:bg-blue-900/30
        dark:text-blue-200
        dark:hover:bg-blue-900/50
      "
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      
    </div>
  );
}