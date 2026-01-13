






// components/YoneticiRaporuSatinAlmaCard.jsx
import React, { useMemo } from "react";

/* ===== helpers (AYNEN KORUNDU) ===== */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
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

function moneyTR(val, currency = "TRY") {
  if (val === null || val === undefined || Number.isNaN(Number(val)))
    return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(val));
}

function calcKdv(net, gross) {
  const n = Number(net);
  const g = Number(gross);
  if (Number.isNaN(n) || Number.isNaN(g)) return null;
  return g - n;
}

function buildDurum(r) {
  const list = r?.onaylayanPersoneller || [];
  if (!list.length) return "Onaycı Yok";
  if (list.some((x) => x?.durumKod === 2)) return "Reddedildi";
  if (list.some((x) => x?.durumKod === 0)) return "Beklemede";
  return "Onaylandı";
}

function durumChipClass(durum) {
  if (durum === "Onaylandı")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200";
  if (durum === "Beklemede")
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200";
  if (durum === "Reddedildi")
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200";
  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
}

function satinAlindiChip(not1) {
  if (!not1) return "—";
  const v = String(not1).toLowerCase();
  if (v.includes("satın alındı")) return "Satın alındı";
  if (v.includes("satın alınmadı")) return "Satın alınmadı";
  return safeText(not1);
}

function satinAlindiClass(not1) {
  if (!not1)
    return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
  const v = String(not1).toLowerCase();
  if (v.includes("satın alındı"))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200";
  if (v.includes("satın alınmadı"))
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200";
  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
}

/* ✅ EK: Not_3/4/5 yardımcıları (yapıyı bozmaz) */
function teknikTalepChip(not3) {
  if (!not3) return "—";
  const v = String(not3).toLowerCase();
  if (v.includes("evet")) return "Evet";
  if (v.includes("hayır") || v.includes("hayir")) return "Hayır";
  return safeText(not3);
}

function teknikTalepClass(not3) {
  if (!not3)
    return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
  const v = String(not3).toLowerCase();
  if (v.includes("evet"))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200";
  if (v.includes("hayır") || v.includes("hayir"))
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200";
  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
}

function teknikAciklamaChip(not4) {
  if (!not4) return "Yok";
  return "Var";
}

function teknikAciklamaClass(not4) {
  if (!not4)
    return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
  return "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-200";
}

function surecChip(not5) {
  if (!not5) return "—";
  const v = String(not5).toLowerCase();
  if (v.includes("süreç tamamlandı") || v.includes("surec tamamlandi"))
    return "Tamamlandı";
  return safeText(not5);
}

function surecClass(not5) {
  if (!not5)
    return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
  const v = String(not5).toLowerCase();
  if (v.includes("süreç tamamlandı") || v.includes("surec tamamlandi"))
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200";
  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
}

/* ================================================= */

export default function YoneticiRaporuSatinAlmaCard({ data = [] }) {
  const headers = useMemo(
    () => [
      "No",
      "Tarih",
      "Satın Alma",
      "Site",

      "Durum",
      "Satın Alındı",
      "Fatura",

      // ✅ EK
      "Teknik Talep",
      "Proje Yöneticisi Süreci",

      "Kalem",
      "Ara Toplam",
      "KDV",
      "Genel Toplam",
    ],
    []
  );

  const linkBtn =
    "rounded-md border px-2 py-[2px] text-[10px] font-semibold transition";

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1200px] w-full border-collapse text-[10px]">
        <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-2 py-[3px] text-left font-semibold border-b"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((r, i) => {
            const detayHref = `/satinalma/teklifler/${r?.satinAlmaId}`;
            const durum = buildDurum(r);
            const para = r?.paraBirimi || "TRY";
            const net = r?.enIyiTeklifKdvHaric;
            const gross = r?.enIyiTeklifKdvDahil;
            const kdv = calcKdv(net, gross);

            return (
              <tr
                key={r?.satinAlmaId ?? i}
                onClick={() =>
                  r?.satinAlmaId &&
                  window.open(detayHref, "_blank", "noopener,noreferrer")
                }
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
              >
                <td className="px-2 py-[2px]">{i + 1}</td>
                <td className="px-2 py-[2px] whitespace-nowrap">
                  {formatDateTR(r?.tarih)}
                </td>

                <td className="px-2 py-[2px] font-semibold whitespace-nowrap">
                  SA-{safeText(r?.satinAlmaId)}
                  <div className="text-[9px] text-zinc-500">
                    {safeText(r?.talepCinsi)}
                  </div>
                </td>

                <td className="px-2 py-[2px]">{safeText(r?.siteAdi)}</td>

                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${durumChipClass(
                      durum
                    )}`}
                  >
                    {durum}
                  </span>
                </td>

                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${satinAlindiClass(
                      r?.not_1
                    )}`}
                  >
                    {satinAlindiChip(r?.not_1)}
                  </span>
                </td>

                <td className="px-2 py-[2px]">
                  {r?.not_2 ? (
                    <a
                      href={r.not_2}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`${linkBtn} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
                    >
                      Fatura
                    </a>
                  ) : (
                    "—"
                  )}
                </td>

                {/* ✅ EK: Not_3 / Not_4 / Not_5 */}
                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${teknikTalepClass(
                      r?.not_3
                    )}`}
                    title={safeText(r?.not_3)}
                  >
                    {teknikTalepChip(r?.not_3)}
                  </span>
                </td>

                

                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${surecClass(
                      r?.not_5
                    )}`}
                    title={safeText(r?.not_5)}
                  >
                    {surecChip(r?.not_5)}
                  </span>
                </td>

                <td className="px-1 py-[2px]">{r?.malzemeKalemSayisi ?? 0}</td>

                <td className="px-2 py-[2px]">{moneyTR(net, para)}</td>
                <td className="px-2 py-[2px]">
                  {kdv == null ? "-" : moneyTR(kdv, para)}
                </td>
                <td className="px-2 py-[2px] font-semibold">
                  {moneyTR(gross, para)}
                </td>
              </tr>
            );
          })}

          {!data.length && (
            <tr>
              <td
                colSpan={headers.length}
                className="py-6 text-center text-zinc-500"
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
