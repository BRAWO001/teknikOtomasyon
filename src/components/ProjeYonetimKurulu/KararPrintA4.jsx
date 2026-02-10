function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
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
    return safeText(iso);
  }
}

export default function KararPrintA4({ data }) {
  if (!data) return null;

  const siteBazliNo = data?.siteBazliNo ?? data?.SiteBazliNo;
  const kararNoText =
    typeof siteBazliNo === "number" && siteBazliNo > 0
      ? `#${siteBazliNo}`
      : `#${safeText(data?.id ?? data?.Id)}`;

  const tarih = data?.tarih ?? data?.Tarih;

  const oneren = Array.isArray(data?.onerenKisiler) ? data.onerenKisiler : [];

  const konu = safeText(data?.kararKonusu ?? data?.KararKonusu);
  const aciklama = safeText(data?.kararAciklamasi ?? data?.KararAciklamasi);

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

          /* Bölünme kontrolü */
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
      `}</style>

      <div className="a4 px-8 py-6">
        {/* ÜST ORTA: Belge No + Tarih */}
        <div className="tight text-center avoid-break">
          <div className="text-[12px] font-semibold text-zinc-900">
            Karar No: <span className="font-bold">{kararNoText}</span>
            
          </div>
          <div className="mt-2 h-[1px] w-full bg-zinc-200" />
        </div>

        {/* KONU */}
        <div className="mt-4 tight avoid-break">
          
          <div className="mt-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold leading-snug text-zinc-900">
            {konu}
          </div>
        </div>

        {/* AÇIKLAMA (tam metin, eksiksiz) */}
        <div className="mt-3 tight">
         
          <div className="mt-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-[11px] leading-snug text-zinc-800">
            <div className="whitespace-pre-wrap break-words">{aciklama}</div>
          </div>
        </div>

        {/* ÜYELER: Ad Soyad + Düşünce + imza hücresi */}
        <div className="mt-4 overflow-hidden rounded-md border border-zinc-200">
          

          <table className="w-full text-[10.5px]">
            <thead>
              <tr className="border-t border-zinc-200 bg-white">
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
                  const ad = safeText(o?.personel?.ad);
                  const soyad = safeText(o?.personel?.soyad);
                  

                  return (
                    <tr
                      key={o.id ?? `${o.personelId}-${dusunce}`}
                      className="border-t border-zinc-100"
                    >
                      <td className="px-3 py-2">
                        <div className="font-semibold text-zinc-900">
                          {ad} {soyad}
                        </div>
                      </td>
                      
                      <td className="px-3 py-2">
                        <div className="h-7 w-full rounded-sm border border-zinc-200 bg-white" />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-t border-zinc-100">
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-zinc-500"
                  >
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
