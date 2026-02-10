function safeText(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s.length ? s : "";
}

function formatTRLong(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso ? String(iso) : "-";
  }
}

export default function KararPrintA4({ data }) {
  if (!data) return null;

  const siteBazliNo = data?.siteBazliNo ?? data?.SiteBazliNo;
  const kararNoText =
    typeof siteBazliNo === "number" && siteBazliNo > 0
      ? `#${siteBazliNo}`
      : `#${safeText(data?.id ?? data?.Id) || "-"}`;

  const tarih = data?.tarih ?? data?.Tarih;

  const oneren = Array.isArray(data?.onerenKisiler) ? data.onerenKisiler : [];

  const konu = safeText(data?.kararKonusu ?? data?.KararKonusu) || "-";
  const aciklamaRaw = safeText(data?.kararAciklamasi ?? data?.KararAciklamasi);

  // ✅ HTML ise direkt bas, değilse \n -> <br/>
  const aciklamaHtml = (() => {
    if (!aciklamaRaw) return "<div>-</div>";

    const looksLikeHtml =
      /<\/?[a-z][\s\S]*>/i.test(aciklamaRaw) || aciklamaRaw.includes("<br");

    if (looksLikeHtml) return aciklamaRaw;

    // plain text -> HTML
    const escaped = aciklamaRaw
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\n", "<br/>");

    return `<div>${escaped}</div>`;
  })();

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #fff !important;
          }

          .no-print {
            display: none !important;
          }

          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          table {
            page-break-inside: auto;
          }
          tr,
          td,
          th {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }

        .a4 {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          color: #111827;
        }

        .tight {
          letter-spacing: -0.01em;
        }

        /* ✅ Önizleme ile birebir görünüm için HTML içerik stili */
        .print-html {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          font-size: 12px;
          color: #111827;
        }

        .print-html b,
        .print-html strong {
          font-weight: 700;
        }

        /* HTML içindeki <div> satır satır rahat görünsün */
        .print-html div {
          margin-bottom: 6px;
        }

        /* Ortalı başlık blokları çok sıkışmasın */
        .print-html .center-block {
          text-align: center;
          font-weight: 700;
          margin-bottom: 10px;
        }
      `}</style>

      <div className="a4 px-8 py-6">
        {/* ÜST ORTA: Belge No + Tarih */}
        

        {/* AÇIKLAMA */}
        <div className="mt-3 tight">
          <div className="mt-1 rounded-md  bg-white px-4 py-3">
            <div
              className="print-html"
              dangerouslySetInnerHTML={{ __html: aciklamaHtml }}
            />
          </div>
        </div>

        {/* ÜYELER */}
        <div className="mt-4 overflow-hidden rounded-md  ">
          <table className="w-full text-[10.5px]">
            <thead>
              <tr className="border-t  bg-white">
                <th className="w-[55%] px-3 py-2 text-left font-semibold text-zinc-700">
                  Üye
                </th>
                <th className="px-3 py-2 text-left font-semibold text-zinc-700">
                  İmza
                </th>
              </tr>
            </thead>

            <tbody>
              {oneren.length ? (
                oneren.map((o) => {
                  const ad = safeText(o?.personel?.ad) || "-";
                  const soyad = safeText(o?.personel?.soyad) || "-";

                  return (
                    <tr
                      key={o.id ?? `pid-${o.personelId}`}
                      className="border-t border-zinc-100"
                    >
                      <td className="px-3 py-2">
                        <div className="font-semibold text-zinc-900">
                          {ad} {soyad}
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="h-7 w-full rounded-sm   bg-white" />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-t border-zinc-100">
                  <td colSpan={2} className="px-3 py-6 text-center text-zinc-500">
                    Üye kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 h-[1px] w-full bg-zinc-200" />
      </div>
    </>
  );
}
