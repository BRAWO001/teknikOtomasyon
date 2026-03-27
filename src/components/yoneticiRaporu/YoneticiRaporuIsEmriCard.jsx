import React, { useMemo } from "react";

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
  switch (durumKod) {
    case 10:
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200";
    case 30:
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-200";
    case 50:
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/35 dark:text-violet-200";
    case 100:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200";
    case 90:
      return "bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-200";
    default:
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
  }
}

function surecDotClass(val) {
  switch ((val || "").trim()) {
    case "İncelemede":
      return "bg-amber-500";
    case "Kontrol Ediliyor":
      return "bg-sky-500";
    case "Tamamlandı":
      return "bg-emerald-500";
    default:
      return "bg-zinc-300 dark:bg-zinc-600";
  }
}

function joinPeople(list) {
  if (!Array.isArray(list) || list.length === 0) return "—";
  return list.join(" • ");
}

function tekGorunumMetni(r) {
  const kisaBaslik = String(r?.kisaBaslik || "").trim();
  const aciklama = String(r?.aciklama || "").trim();
  return kisaBaslik || aciklama || "-";
}

function SurecDot({ value }) {
  if (!value) return null;

  return (
    <span
      title={value}
      className={`inline-block h-2.5 w-2.5 rounded-full ${surecDotClass(value)}`}
    />
  );
}

function CellLink({ href, title, className = "", children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`block w-full h-full text-inherit no-underline ${className}`}
      onClick={(e) => {
        // normal sol tıkta da yeni sekme açılır, mevcut sayfa kalır
        // target="_blank" bunu zaten native olarak yapıyor
      }}
    >
      {children}
    </a>
  );
}

export default function YoneticiRaporuIsEmriCard({ data = [] }) {
  const headers = useMemo(
    () => [
      "Oluşturma",
      "Site",
      "Seri Kod",
      "Başlık",
      "Durum",
      "Personeller",
      "Toplam",
      "Depo",
      "Yeni",
      "İşveren",
    ],
    []
  );

  const getHref = (id) => `/teknik/isEmriDetay/${id}`;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1000px] w-full text-[10px]">
        <thead className="bg-zinc-50 dark:bg-zinc-900/60">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-2 py-2 text-left font-semibold whitespace-nowrap text-zinc-600 dark:text-zinc-300"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((r, i) => {
            const href = getHref(r?.id);

            return (
              <tr
                key={r?.id ?? i}
                className="border-b border-zinc-100/80 hover:bg-zinc-50/80 dark:border-zinc-800/70 dark:hover:bg-zinc-800/30"
              >
                <td className="px-2 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  <CellLink href={href}>
                    {formatDateTR(r?.olusturmaTarihi)}
                  </CellLink>
                </td>

                <td className="px-2 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  <CellLink href={href}>
                    {safeText(r?.siteAdi)}
                  </CellLink>
                </td>

                <td className="px-2 py-2 whitespace-nowrap font-semibold text-zinc-800 dark:text-zinc-100">
                  <CellLink href={href}>
                    {[safeText(r?.kod), r?.kod_2, r?.kod_3].filter(Boolean).join(" | ")}
                  </CellLink>
                </td>

                <td className="px-2 py-2 max-w-[200px] truncate text-zinc-700 dark:text-zinc-200">
                  <CellLink href={href} title={tekGorunumMetni(r)}>
                    {tekGorunumMetni(r)}
                  </CellLink>
                </td>

                <td className="px-2 py-2 whitespace-nowrap">
                  <CellLink href={href}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-[2px] rounded-full text-[10px] font-semibold ${durumChipClassByKod(
                          r?.durumKod
                        )}`}
                      >
                        {safeText(r?.durumAd)}
                      </span>

                      <div className="flex gap-1">
                        <SurecDot value={r?.projeYoneticiSurecDurumu} />
                        <SurecDot value={r?.operasyonTeknikMudurSurecDurumu} />
                        <SurecDot value={r?.operasyonGenelMudurSurecDurumu} />
                      </div>
                    </div>
                  </CellLink>
                </td>

                <td className="px-2 py-2 max-w-[140px] truncate text-zinc-700 dark:text-zinc-200">
                  <CellLink href={href} title={joinPeople(r?.personeller)}>
                    {joinPeople(r?.personeller)}
                  </CellLink>
                </td>

                <td className="px-2 py-2 whitespace-nowrap font-semibold text-zinc-800 dark:text-zinc-100">
                  <CellLink href={href}>
                    {moneyTR(r?.malzemeToplamTutar)}
                  </CellLink>
                </td>

                <td className="px-2 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  <CellLink href={href}>
                    {moneyTR(r?.depoTutar)}
                  </CellLink>
                </td>

                <td className="px-2 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  <CellLink href={href}>
                    {moneyTR(r?.yeniAlimTutar)}
                  </CellLink>
                </td>

                <td className="px-2 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                  <CellLink href={href}>
                    {moneyTR(r?.isverenTeminiTutar)}
                  </CellLink>
                </td>
              </tr>
            );
          })}

          {!data.length && (
            <tr>
              <td colSpan={headers.length} className="py-6 text-center text-zinc-500">
                Kayıt yok
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}