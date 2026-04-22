// components/projeGorevlileri/ProjeGorevlileriIsEmriCard.jsx
import React, { useMemo } from "react";

/* ===== helpers ===== */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
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

function moneyTR(val, currency = "TRY") {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(val));
}

function durumChipClassByKod(durumKod) {
  if (durumKod === 10)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200";
  if (durumKod === 30)
    return "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-200";
  if (durumKod === 50)
    return "bg-violet-100 text-violet-700 dark:bg-violet-900/35 dark:text-violet-200";
  if (durumKod === 100)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200";
  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
}

function joinPeople(list) {
  if (!Array.isArray(list) || list.length === 0) return "—";
  return list.join(" • ");
}

/** Süreç chip renkleri */
function surecChipClass(text) {
  const t = (text ?? "").toString().trim().toLowerCase();
  if (!t) return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200";

  if (t.includes("inceleme") || t.includes("incelemede"))
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200";

  if (t.includes("kontrol ediliyor") || t.includes("kontrol"))
    return "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-200";

  if (t.includes("görüld") || t.includes("goruld"))
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200";

  if (t.includes("incelend"))
    return "bg-violet-100 text-violet-700 dark:bg-violet-900/35 dark:text-violet-200";

  if (
    t.includes("tamamlandı") ||
    t.includes("tamam") ||
    t.includes("bitti") ||
    t.includes("kapandı") ||
    t.includes("onay")
  )
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200";

  if (t.includes("red") || t.includes("iptal"))
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200";

  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
}

function SurecCell({ value }) {
  const text = safeText(value);
  if (text === "-") return <span className="text-zinc-500">-</span>;

  return (
    <span className={`rounded-full px-2 py-[1px] font-semibold ${surecChipClass(text)}`}>
      {text}
    </span>
  );
}
/* ======================================= */

export default function ProjeGorevlileriIsEmriCard({ data = [] }) {
  const headers = useMemo(
    () => [
      "No",
      "Oluşturma",
      "SeriKod",
      "Kısa Başlık",
      "Durum",
      "Site",
      "Personeller",
      "Proje Sor. Süreç",
      "Op.Tek Süreç",
      "Op.Gen Süreç",
    ],
    []
  );

  const rowOpen = (id) => {
    if (!id) return;
    const href = `/teknik/isEmriDetay/${id}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1100px] w-full border-collapse text-[10px]">
        <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-2 py-[2px] text-left font-semibold border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((r, i) => {
            return (
              <tr
                key={r?.id ?? i}
                onClick={() => rowOpen(r?.id)}
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
              >
                <td className="px-2 py-[2px] text-zinc-600 dark:text-zinc-300">
                  {i + 1}
                </td>

                <td className="px-2 py-[2px] whitespace-nowrap">
                  {formatDateTR(r?.olusturmaTarihi)}
                </td>

                <td className="px-2 py-[2px] font-semibold whitespace-nowrap">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    ({safeText(r?.kod)})
                  </span>
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {safeText(r?.kod_2)} {r?.kod_2 ? "•" : ""} {safeText(r?.kod_3)}
                  </div>
                </td>

                {/* 🔥 BURASI DÜZELTİLDİ */}
                <td className="px-2 py-[2px] w-[220px] max-w-[220px]">
                  <div className="whitespace-normal break-words leading-tight line-clamp-2">
                    {safeText(r?.kisaBaslik)}
                  </div>
                </td>

                <td className="px-2 py-[2px] whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-[1px] font-semibold ${durumChipClassByKod(
                      r?.durumKod
                    )}`}
                  >
                    {safeText(r?.durumAd)}
                  </span>
                </td>

                <td className="px-2 py-[2px] whitespace-nowrap">
                  {safeText(r?.siteAdi)}
                </td>

                <td className="px-1 py-[2px]">
                  <div className="max-w-[160px] truncate text-zinc-700 dark:text-zinc-200">
                    {joinPeople(r?.personeller)}
                  </div>
                </td>

                <td className="px-2 py-[2px] whitespace-nowrap">
                  <SurecCell value={r?.projeYoneticiSurecDurumu} />
                </td>

                <td className="px-2 py-[2px] whitespace-nowrap">
                  <SurecCell value={r?.operasyonTeknikMudurSurecDurumu} />
                </td>

                <td className="px-2 py-[2px] whitespace-nowrap">
                  <SurecCell value={r?.operasyonGenelMudurSurecDurumu} />
                </td>
              </tr>
            );
          })}

          {!data?.length && (
            <tr>
              <td
                colSpan={headers.length}
                className="py-6 text-center text-zinc-500 dark:text-zinc-400"
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