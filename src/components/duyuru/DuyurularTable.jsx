




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

const DurumPill = ({ text }) => {
  const v = String(text || "").toLowerCase();

  let cls =
    "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";

  if (v.includes("aktif") || v.includes("yayın") || v.includes("yayında")) {
    cls =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200";
  } else if (v.includes("pasif") || v.includes("kapalı")) {
    cls =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/25 dark:text-red-200";
  } else if (v.includes("bekle")) {
    cls =
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/25 dark:text-amber-200";
  }

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cls}`}
    >
      {safeText(text)}
    </span>
  );
};

export default function DuyurularTable({
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
      <table className="min-w-[1100px] w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
          <tr>
            {[
              "Duyuru No",
              "Tarih",
              "Site",
              "Başlık",
              "Durum",
              "Düzenleme",
              "Dosya",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {items.map((r, i) => {
            const id = r?.id ?? r?.Id;
            const token = r?.publicToken ?? r?.PublicToken;
            const siteName = r?.site?.ad ?? r?.Site?.Ad;
            const siteIdRow = r?.siteId ?? r?.SiteId;

            const siteBazliNo = r?.siteBazliNo ?? r?.SiteBazliNo;
            const duyuruNoText =
              typeof siteBazliNo === "number" && siteBazliNo > 0
                ? `# ${siteBazliNo}`
                : `${safeText(id)}`;

            const duzenleme =
              typeof (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu) === "boolean"
                ? (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu)
                : null;

            const baslik = r?.duyuruBaslik ?? r?.DuyuruBaslik;
            const durum = r?.durum ?? r?.Durum;
            const dosyaSayisi = r?.dosyaSayisi ?? r?.DosyaSayisi ?? 0;
            const tarih = r?.tarihUtc ?? r?.TarihUtc;

            return (
              <tr
                key={id ?? i}
                onClick={() => rowOpen(token)}
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                title={token ? "Detaya git" : "Token yok"}
              >
                <td className="px-3 py-3 align-top whitespace-nowrap">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {duyuruNoText}
                  </span>
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  {formatDateTR(tarih)}
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  {siteName ?? `Site #${safeText(siteIdRow)}`}
                </td>

                <td className="px-3 py-3 align-top">
                  <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {safeText(baslik)}
                  </div>
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  <DurumPill text={durum} />
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  {duzenleme === null ? (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      -
                    </span>
                  ) : (
                    <DuzenlemePill ok={duzenleme} />
                  )}
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-900/25 dark:text-sky-200">
                    {safeText(dosyaSayisi)}
                  </span>
                </td>
              </tr>
            );
          })}

          {!loading && !items?.length && (
            <tr>
              <td
                colSpan={7}
                className="py-10 text-center text-zinc-500 dark:text-zinc-400"
              >
                Kayıt bulunamadı
              </td>
            </tr>
          )}

          {loading && (
            <tr>
              <td
                colSpan={7}
                className="py-10 text-center text-zinc-500 dark:text-zinc-400"
              >
                Yükleniyor...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}