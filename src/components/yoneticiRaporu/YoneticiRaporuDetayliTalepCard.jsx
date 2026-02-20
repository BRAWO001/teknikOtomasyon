// components/yoneticiRaporu/YoneticiRaporuDetayliTalepCard.jsx
import React, { useMemo } from "react";

/* ===== helpers (senin tarzında) ===== */
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

function dosyaChip(varMi) {
  return varMi ? "Var" : "Yok";
}
function dosyaClass(varMi) {
  return varMi
    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-200"
    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
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

export default function YoneticiRaporuDetayliTalepCard({
  data = [],
  page = 1,
  pageSize = 25,
}) {
  const headers = useMemo(
    () => [
      "No",
      "Tarih",
      "Talep",
      "Site",
      "Açıklama",

      "Teknik Talep",
      "Teknik Açıklama",

      "Satın Alındı",
      "Fatura",

      "Kalem",
      "Toplam Adet",

      "Onay (Toplam)",
      "Bekleyen",
      "Onay",
      "Red",

      "Yorum",
      "Dosya",
      "Süreç",
    ],
    []
  );

  const linkBtn =
    "rounded-md border px-2 py-[2px] text-[10px] font-semibold transition";

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1400px] w-full border-collapse text-[10px]">
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
            const id = r?.satinAlmaId ?? r?.SatinAlmaId;

            // satır tık: satınalma detaya gitsin (istersen değiştir)
            const detayHref = id ? `/satinalma/teklifler/${id}` : null;

            const globalIndex = (page - 1) * pageSize + i + 1;

            const not3 = r?.not_3 ?? r?.Not_3;
            const not4 = r?.not_4 ?? r?.Not_4;
            const not5 = r?.not_5 ?? r?.Not_5;
            const not1 = r?.not_1 ?? r?.Not_1;
            const not2 = r?.not_2 ?? r?.Not_2;

            const siteAdi = r?.siteAdi ?? r?.SiteAdi;
            const talepCinsi = r?.talepCinsi ?? r?.TalepCinsi;
            const aciklama = r?.aciklama ?? r?.Aciklama;
            const tarih = r?.tarih ?? r?.Tarih;

            const kalem = r?.malzemeKalemSayisi ?? r?.MalzemeKalemSayisi ?? 0;
            const toplamAdet = r?.malzemeToplamAdet ?? r?.MalzemeToplamAdet ?? 0;

            const onayToplam = r?.onayToplam ?? r?.OnayToplam ?? 0;
            const onayBekleyen = r?.onayBekleyen ?? r?.OnayBekleyen ?? 0;
            const onayOnaylandi = r?.onayOnaylandi ?? r?.OnayOnaylandi ?? 0;
            const onayReddedildi = r?.onayReddedildi ?? r?.OnayReddedildi ?? 0;

            const yorumSayisi = r?.yorumSayisi ?? r?.YorumSayisi ?? 0;
            const dosyaVarMi = r?.dosyaVarMi ?? r?.DosyaVarMi ?? false;

            return (
              <tr
                key={id ?? i}
                onClick={() =>
                  detayHref &&
                  window.open(detayHref, "_blank", "noopener,noreferrer")
                }
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
              >
                <td className="px-2 py-[2px]">{globalIndex}</td>
                <td className="px-2 py-[2px] whitespace-nowrap">
                  {formatDateTR(tarih)}
                </td>

                <td className="px-2 py-[2px] font-semibold whitespace-nowrap">
                  TL-{safeText(id)}
                  <div className="text-[9px] text-zinc-500">
                    {safeText(talepCinsi)}
                  </div>
                </td>

                <td className="px-2 py-[2px]">{safeText(siteAdi)}</td>

                <td className="px-2 py-[2px]">
                  <div className="max-w-[360px] line-clamp-2">
                    {safeText(aciklama)}
                  </div>
                </td>

                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${teknikTalepClass(
                      not3
                    )}`}
                    title={safeText(not3)}
                  >
                    {teknikTalepChip(not3)}
                  </span>
                </td>

                <td className="px-2 py-[2px]">
                  <div className="max-w-[260px] line-clamp-2 text-[10px] text-zinc-600 dark:text-zinc-300">
                    {not4 ? safeText(not4) : "—"}
                  </div>
                </td>

                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${satinAlindiClass(
                      not1
                    )}`}
                    title={safeText(not1)}
                  >
                    {satinAlindiChip(not1)}
                  </span>
                </td>

                <td className="px-2 py-[2px]">
                  {not2 ? (
                    <a
                      href={not2}
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

                <td className="px-2 py-[2px]">{kalem}</td>
                <td className="px-2 py-[2px]">{toplamAdet}</td>

                <td className="px-2 py-[2px]">{onayToplam}</td>
                <td className="px-2 py-[2px]">{onayBekleyen}</td>
                <td className="px-2 py-[2px]">{onayOnaylandi}</td>
                <td className="px-2 py-[2px]">{onayReddedildi}</td>

                <td className="px-2 py-[2px]">{yorumSayisi}</td>

                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${dosyaClass(
                      dosyaVarMi
                    )}`}
                  >
                    {dosyaChip(dosyaVarMi)}
                  </span>
                </td>

                <td className="px-2 py-[2px]">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${surecClass(
                      not5
                    )}`}
                    title={safeText(not5)}
                  >
                    {surecChip(not5)}
                  </span>
                </td>
              </tr>
            );
          })}

          {!data.length && (
            <tr>
              <td colSpan={headers.length} className="py-6 text-center text-zinc-500">
                Kayıt bulunamadı
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
