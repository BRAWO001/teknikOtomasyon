// src/components/YoneticiRaporu/YoneticiRaporuKararlarTable.jsx
import React from "react";

/* ===== helpers (aynı mantık) ===== */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    // backend UTC dönüyorsa TR için +3
    d.setHours(d.getHours() + 3);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}
/* =================== */

// ✅ Düzenleme durumu pill (birebir)
const DuzenlemePill = ({ ok }) => (
  <span
    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
      ok
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200"
        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/25 dark:text-red-200"
    }`}
  >
    {ok ? "Açık" : "Kapalı"}
  </span>
);

/**
 * Props:
 * - items: karar listesi
 * - loading: boolean
 * - onRowOpen: (token) => void
 */
export default function YoneticiRaporuKararlarTable({
  items = [],
  loading = false,
  onRowOpen,
}) {
  const rowOpen = (token) => {
    if (!token) return;
    onRowOpen?.(token);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1200px] w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
          <tr>
            {[
              "Karar No",
              "Tarih",
              "Site",
              "Karar Konusu",
              "Nihai Sonuç",
              "Düzenleme",
              "Öneren Kişi",
            ].map((h) => (
              <th
                key={h}
                className="px-2 py-[4px] text-left font-semibold border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {items.map((r, i) => {
            const id = r?.id ?? r?.Id;
            const token = r?.publicToken ?? r?.PublicToken; // backend PublicToken
            const siteName = r?.site?.ad ?? r?.Site?.Ad;
            const siteIdRow = r?.siteId ?? r?.SiteId;

            // ✅ Site bazlı karar no (camelCase + PascalCase destekli)
            const siteBazliNo = r?.siteBazliNo ?? r?.SiteBazliNo;
            const kararNoText =
              typeof siteBazliNo === "number" && siteBazliNo > 0
                ? `# ${siteBazliNo}` // örn: 6-18
                : `${safeText(id)}`; // fallback: global id

            const duzenleme =
              typeof (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu) === "boolean"
                ? (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu)
                : null;

            return (
              <tr
                key={id ?? i}
                onClick={() => rowOpen(token)}
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                title={token ? "Detaya git" : "Token yok"}
              >
                {/* ✅ No */}
                <td className="px-2 py-[4px] text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {kararNoText}
                  </span>
                </td>

                <td className="px-2 py-[4px] whitespace-nowrap">
                  {formatDateTR(r?.tarih ?? r?.Tarih)}
                </td>

                <td className="px-2 py-[4px] whitespace-nowrap">
                  {siteName ?? `Site #${safeText(siteIdRow)}`}
                </td>

                <td className="px-2 py-[4px]">
                  <div className="max-w-[520px] truncate font-semibold text-zinc-800 dark:text-zinc-100">
                    {safeText(r?.kararKonusu ?? r?.KararKonusu)}
                  </div>
                  <div className="max-w-[520px] truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                    {safeText(r?.kararAciklamasi ?? r?.KararAciklamasi)}
                  </div>
                </td>

                <td className="px-2 py-[4px] whitespace-nowrap">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {safeText(r?.nihaiSonuc ?? r?.NihaiSonuc)}
                  </span>
                </td>

                {/* ✅ Düzenleme Durumu */}
                <td className="px-2 py-[4px] whitespace-nowrap">
                  {duzenleme === null ? (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      -
                    </span>
                  ) : (
                    <DuzenlemePill ok={duzenleme} />
                  )}
                </td>

                <td className="px-2 py-[4px] whitespace-nowrap">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200">
                    {safeText(r?.onerenKisiSayisi ?? r?.OnerenKisiSayisi)}
                  </span>
                </td>
              </tr>
            );
          })}

          {!loading && !items?.length && (
            <tr>
              <td
                colSpan={7}
                className="py-8 text-center text-zinc-500 dark:text-zinc-400"
              >
                Kayıt bulunamadı
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
