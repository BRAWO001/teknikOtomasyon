// SatinalmaMalzemeTeklifList.jsx
export default function SatinalmaMalzemeTeklifList({
  malzemeler,
  tekliflerByMalzeme,
}) {
  if (malzemeler.length === 0) {
    return (
      <div style={{ fontSize: 14 }}>
        Bu satın almada malzeme bulunmuyor.
      </div>
    );
  }

  const formatCurrency = (val) =>
    (Number(val) || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      <h2
        style={{
          marginBottom: "0.5rem",
          fontSize: 16,
          fontWeight: 600,
          color: "#000",
        }}
      >
        Malzemeler &amp; Teklif Detayları
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {malzemeler.map((m) => {
          const mid = m.id ?? m.Id;
          const malzemeAdi = m.malzemeAdi ?? m.MalzemeAdi;
          const marka = m.marka ?? m.Marka ?? "-";
          const adet = m.adet ?? m.Adet;
          const birim = m.birim ?? m.Birim ?? "-";
          const kullanimAmaci = m.kullanimAmaci ?? m.KullanimAmaci ?? "-";

          const offers = tekliflerByMalzeme[mid] || [];

          return (
            <div
              key={mid}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "0.75rem 1rem",
                backgroundColor: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  marginBottom: "0.5rem",
                  flexWrap: "wrap",
                  color: "#000",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 2,
                      color: "#111827",
                    }}
                  >
                    {malzemeAdi}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Marka: {marka}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#374151" }}>
                  <div>
                    Adet:{" "}
                    <strong>
                      {adet} {birim}
                    </strong>
                  </div>
                  <div>Kullanım Amacı: {kullanimAmaci}</div>
                </div>
              </div>

              <h3
                style={{
                  fontSize: 14,
                  margin: "0.25rem 0 0.5rem 0",
                  fontWeight: 600,
                  color: "#000",
                }}
              >
                Fiyat Teklifleri
              </h3>

              {offers.length === 0 ? (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Bu malzeme için henüz fiyat teklifi girilmemiş.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                      color: "#000",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f6" }}>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "left",
                            padding: "0.35rem",
                          }}
                        >
                          Tedarikçi
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "right",
                            padding: "0.35rem",
                          }}
                        >
                          Birim Fiyat
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "left",
                            padding: "0.35rem",
                          }}
                        >
                          Para Birimi
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "right",
                            padding: "0.35rem",
                          }}
                        >
                          Net Toplam
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "left",
                            padding: "0.35rem",
                          }}
                        >
                          KDV Oranı
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "right",
                            padding: "0.35rem",
                          }}
                        >
                          KDV Tutarı
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "right",
                            padding: "0.35rem",
                          }}
                        >
                          Toplam (KDV Dahil)
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "left",
                            padding: "0.35rem",
                          }}
                        >
                          Tarih
                        </th>
                        <th
                          style={{
                            borderBottom: "1px solid #9ca3af",
                            textAlign: "left",
                            padding: "0.35rem",
                          }}
                        >
                          Not
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((t) => {
                        const tid = t.id ?? t.Id;
                        const tedarikciAdi = t.tedarikciAdi ?? t.TedarikciAdi;
                        const birimFiyat = t.birimFiyat ?? t.BirimFiyat;
                        const paraBirimi =
                          t.paraBirimi ?? t.ParaBirimi ?? "TRY";
                        const teklifTarihi =
                          t.teklifTarihiUtc ?? t.TeklifTarihiUtc;
                        const not = t.not ?? t.Not;

                        const adetNum = Number(adet) || 0;
                        const bfNum = Number(birimFiyat) || 0;
                        const toplamTutarDto =
                          t.toplamTutar ?? t.ToplamTutar;
                        const netToplam =
                          toplamTutarDto != null
                            ? Number(toplamTutarDto)
                            : adetNum * bfNum;

                        // KDV oranı (0.20 gibi)
                        const kdvOraniRaw = t.kdvOrani ?? t.KdvOrani ?? null;
                        let kdvOrani = 0;
                        if (kdvOraniRaw != null) {
                          const num = Number(kdvOraniRaw);
                          if (!isNaN(num) && num > 0) kdvOrani = num;
                        }
                        const kdvYuzde = kdvOrani * 100;
                        const kdvTutar = netToplam * kdvOrani;
                        const toplamKdvDahil = netToplam + kdvTutar;

                        return (
                          <tr key={tid}>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                              }}
                            >
                              {tedarikciAdi}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(bfNum)}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                              }}
                            >
                              {paraBirimi}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(netToplam)}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                              }}
                            >
                              {kdvOrani > 0
                                ? `${kdvYuzde.toFixed(0)}%`
                                : "-"}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(kdvTutar)}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(toplamKdvDahil)}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                              }}
                            >
                              {teklifTarihi
                                ? new Date(teklifTarihi).toLocaleString(
                                    "tr-TR"
                                  )
                                : "-"}
                            </td>
                            <td
                              style={{
                                borderBottom: "1px solid #e5e7eb",
                                padding: "0.35rem",
                              }}
                            >
                              {not || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
