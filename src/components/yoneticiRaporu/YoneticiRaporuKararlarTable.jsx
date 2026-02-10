// src/components/YoneticiRaporu/YoneticiRaporuKararlarTable.jsx
import React, { useMemo, useState } from "react";

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

/* ✅ HTML -> plain text (fallback) */
function stripHtml(html) {
  if (!html) return "";
  try {
    if (typeof window !== "undefined" && window.document) {
      const tmp = document.createElement("div");
      tmp.innerHTML = String(html);
      return (tmp.textContent || tmp.innerText || "")
        .replace(/\s+/g, " ")
        .trim();
    }
  } catch {}
  return String(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ✅ Karar HTML içinden olası <ol>/<ul>/<li> maddelerini yakala */
function extractDecisionItems(html, maxItems = 5) {
  if (!html) return [];

  const raw = String(html);

  // 1) DOM yolu (tarayıcı)
  try {
    if (typeof window !== "undefined" && window.document) {
      const tmp = document.createElement("div");
      tmp.innerHTML = raw;

      const liNodes = Array.from(tmp.querySelectorAll("li"));
      const items = liNodes
        .map((n) => (n?.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);

      if (items.length) return items.slice(0, maxItems);

      // li yoksa: satır satır dene
      const text = (tmp.textContent || tmp.innerText || "")
        .replace(/\r/g, "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      // "1) 2) 3)" gibi numbered satırları yakala
      const numbered = text
        .map((x) => x.replace(/\s+/g, " ").trim())
        .filter((x) => /^(\d+[\)\.\-:])\s+/.test(x));

      if (numbered.length) return numbered.slice(0, maxItems);

      return [];
    }
  } catch {
    // ignore
  }

  // 2) Regex fallback (SSR)
  const liMatches = raw.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
  if (liMatches.length) {
    const items = liMatches
      .map((li) => stripHtml(li))
      .map((x) => x.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    return items.slice(0, maxItems);
  }

  // numbered text fallback
  const plain = stripHtml(raw);
  const numbered = plain
    .split(/(?=\b\d+[\)\.\-:]\s)/g)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter((x) => /^(\d+[\)\.\-:])\s+/.test(x));

  return numbered.slice(0, maxItems);
}

/* ✅ Kartta aşırı uzamasın diye (tek satır özet) */
function clampText(text, max = 180) {
  const s = (text || "").trim();
  if (!s) return "-";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/* =================== */

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

export default function YoneticiRaporuKararlarTable({
  items = [],
  loading = false,
  onRowOpen,
}) {
  const rowOpen = (token) => {
    if (!token) return;
    onRowOpen?.(token);
  };

  // ✅ satır içinde "maddeler" alanını aç/kapat (opsiyonel)
  const [openRow, setOpenRow] = useState(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-[1200px] w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
          <tr>
            {[
              "Karar No",
              "Tarih",
              "Site",
              "Gündem / Maddeler",
              "Nihai Sonuç",
              "Düzenleme",
              "Öneren Kişi",
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
            const kararNoText =
              typeof siteBazliNo === "number" && siteBazliNo > 0
                ? `# ${siteBazliNo}`
                : `${safeText(id)}`;

            const duzenleme =
              typeof (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu) === "boolean"
                ? (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu)
                : null;

            const kararHtml = r?.kararAciklamasi ?? r?.KararAciklamasi;

            // ✅ özet (tek satır)
            const plainAciklama = stripHtml(kararHtml);
            const shortAciklama = clampText(plainAciklama, 180);

            // ✅ maddeler (liste)
            const maddeler = extractDecisionItems(kararHtml, 6);
            const hasMaddeler = maddeler.length > 0;

            const isExpanded = String(openRow) === String(id);

            return (
              <tr
                key={id ?? i}
                className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                title={token ? "Detaya git" : "Token yok"}
              >
                <td className="px-3 py-3 align-top text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {kararNoText}
                  </span>
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  {formatDateTR(r?.tarih ?? r?.Tarih)}
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  {siteName ?? `Site #${safeText(siteIdRow)}`}
                </td>

                {/* ✅ Konu + Maddeler */}
                <td className="px-3 py-3 align-top">
                  

                  

                  {/* ✅ maddeler görünür (satırı biraz yükseltir) */}
                  {hasMaddeler ? (
                    <div className="mt-2 max-w-[640px]">

                      {isExpanded ? (
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[11px] text-zinc-700 dark:text-zinc-200">
                          {maddeler.map((m, idx) => (
                            <li key={`${id}-m-${idx}`} className="leading-5">
                              {m}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[11px] text-zinc-700 dark:text-zinc-200">
                          {maddeler.slice(0, 2).map((m, idx) => (
                            <li key={`${id}-m-mini-${idx}`} className="leading-5">
                              {m}
                            </li>
                          ))}
                          {maddeler.length > 2 ? (
                            <li className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              + {maddeler.length - 2} madde daha…
                            </li>
                          ) : null}
                        </ol>
                      )}
                                            <div className="flex items-center gap-2">
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                          Maddeler: {maddeler.length}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRow((prev) =>
                              String(prev) === String(id) ? null : id
                            );
                          }}
                          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        >
                          {isExpanded ? "Kapat" : "Göster"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            rowOpen(token);
                          }}
                          className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          Detay
                        </button>
                      </div>

                    </div>
                  ) : null}
                </td>

                <td className="px-3 py-3 align-top whitespace-nowrap">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {safeText(r?.nihaiSonuc ?? r?.NihaiSonuc)}
                  </span>
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

      {/* ✅ Satıra tıklayınca detay açılmasın istemiyorsan:
          tr onClick yerine sadece "Detay" butonuna bağlayabilirsin.
          Şu an: Detay butonu var, ayrıca satırın üstünde hover/cursor var ama tr onClick yok.
      */}
    </div>
  );
}
