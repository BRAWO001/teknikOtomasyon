import React from "react";

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

function onayDurumClass(durum) {
  const v = String(durum || "").toLowerCase();

  if (v.includes("onaylandı") || v.includes("onaylandi")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/35 dark:text-emerald-200 dark:border-emerald-900";
  }

  if (v.includes("reddedildi")) {
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/35 dark:text-rose-200 dark:border-rose-900";
  }

  if (v.includes("beklemede")) {
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/35 dark:text-amber-200 dark:border-amber-900";
  }

  return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
}

function satinAlmaDurumText(not1) {
  if (!not1) return "Durum yok";

  const v = String(not1).toLowerCase();

  if (v.includes("satın alındı")) return "Satın alındı";
  if (v.includes("satın alınmadı")) return "Satın alınmadı";

  return safeText(not1);
}

function satinAlmaDurumClass(not1) {
  if (!not1) {
    return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
  }

  const v = String(not1).toLowerCase();

  if (v.includes("satın alındı")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/35 dark:text-emerald-200 dark:border-emerald-900";
  }

  if (v.includes("satın alınmadı")) {
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/35 dark:text-rose-200 dark:border-rose-900";
  }

  return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
}

export default function SatinAlmaPersonelTalepCard({
  data = [],
  page = 1,
  pageSize = 25,
}) {
  const openNewTab = (href) => {
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Kayıt bulunamadı
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((r, i) => {
        const id = r?.satinAlmaId ?? r?.SatinAlmaId;
        const detayHref = id ? `/satinalma/teklifler/${id}` : null;
        const globalIndex = (page - 1) * pageSize + i + 1;

        const tarih = r?.tarih ?? r?.Tarih;
        const talepCinsi = r?.talepCinsi ?? r?.TalepCinsi;
        const aciklama = r?.aciklama ?? r?.Aciklama;
        const siteAdi = r?.siteAdi ?? r?.SiteAdi;

        const not1 = r?.not_1 ?? r?.Not_1;
        const dosyaVarMi = r?.dosyaVarMi ?? r?.DosyaVarMi ?? false;
        const yorumSayisi = r?.yorumSayisi ?? r?.YorumSayisi ?? 0;

        const talepEden = r?.talepEden ?? r?.TalepEden;
        const talepEdenAd =
          talepEden?.ad ||
          talepEden?.Ad ||
          talepEden?.soyad ||
          talepEden?.Soyad
            ? `${talepEden?.ad ?? talepEden?.Ad ?? ""} ${
                talepEden?.soyad ?? talepEden?.Soyad ?? ""
              }`.trim()
            : "-";

        const onaycilar = r?.onaycilar ?? r?.Onaycilar ?? [];

        return (
          <div
            key={id ?? i}
            onClick={() => openNewTab(detayHref)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                openNewTab(detayHref);
              }
            }}
            className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-900 dark:hover:bg-sky-950/20"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    #{globalIndex}
                  </span>

                  <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700 dark:bg-sky-900/35 dark:text-sky-200">
                    TL-{safeText(id)}
                  </span>

                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                    {safeText(siteAdi)}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {formatDateTR(tarih)} • {safeText(talepCinsi)}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 sm:justify-end">
                <span
                  className={`rounded-full border px-2 py-1 text-[11px] font-bold ${satinAlmaDurumClass(
                    not1
                  )}`}
                >
                  {satinAlmaDurumText(not1)}
                </span>

                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  Dosya: {dosyaVarMi ? "Var" : "Yok"}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm leading-5 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Açıklama
              </div>

              <div className="line-clamp-3">
                {safeText(aciklama)}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Talep Eden
                </div>
                <div className="mt-1 truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {safeText(talepEdenAd)}
                </div>
              </div>

              

              <div className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Yorum
                </div>
                <div className="mt-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {yorumSayisi} yorum
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                Onaycılar
              </div>

              {onaycilar?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {onaycilar.map((o, idx) => {
                    const ad =
                      typeof o === "string"
                        ? o
                        : o?.adSoyad ?? o?.AdSoyad ?? o?.ad ?? o?.Ad ?? "-";

                    const durum =
                      typeof o === "string"
                        ? ""
                        : o?.durum ?? o?.Durum ?? "Beklemede";

                    return (
                      <span
                        key={idx}
                        title={`${safeText(ad)} - ${safeText(durum)}`}
                        className={`max-w-full truncate rounded-full border px-2 py-1 text-[11px] font-semibold ${onayDurumClass(
                          durum
                        )}`}
                      >
                        {safeText(ad)} • {safeText(durum)}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-zinc-400">Onaycı bulunamadı</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}