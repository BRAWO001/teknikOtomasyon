// SatinalmaTedarikciOzet.jsx
export default function SatinalmaTedarikciOzet({ tedarikciOzetList }) {
  // ⭐ Küçükten büyüğe sırala (GENEL TOPLAM / KDV DAHİL)
  const sorted = [...tedarikciOzetList].sort(
    (a, b) => (a.totalBrut ?? a.totalNet ?? a.total) - (b.totalBrut ?? b.totalNet ?? b.total)
  );

  const formatCurrency = (val) =>
    (Number(val) || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 6,
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.4rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: "#000",
          }}
        >
          Tedarikçi Bazlı Özet
        </h2>
        {sorted.length > 0 && (
          <span
            style={{
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            Toplam {sorted.length} tedarikçi teklifi
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
          Henüz herhangi bir tedarikçi teklif girmemiş.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {sorted.map((t, index) => {
            const isBest = index === 0; // ⭐ En düşük KDV DAHİL toplam = en iyi teklif

            const cardStyle = isBest
              ? {
                  border: "1px solid #22c55e",
                  backgroundColor: "#ecfdf5",
                }
              : {
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                };

            const totalNet = t.totalNet ?? t.total ?? 0;
            const totalKdv = t.totalKdv ?? 0;
            const totalBrut = t.totalBrut ?? totalNet + totalKdv;
            const paraBirimiText = t.paraBirimiText || "TRY";

            return (
              <div
                key={t.name}
                style={{
                  ...cardStyle,
                  borderRadius: 6,
                  padding: "0.6rem 0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Sol taraf - isim + kapsam */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                        color: "#111827",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 7px",
                          borderRadius: 999,
                          backgroundColor: "#e5e7eb",
                          color: "#374151",
                          fontWeight: 600,
                        }}
                      >
                        #{index + 1}
                      </span>

                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 220,
                        }}
                      >
                        {t.name}
                      </span>

                      {isBest && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          En iyi teklif
                        </span>
                      )}
                    </div>

                    {t.kapsamaText && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#4b5563",
                          marginTop: 2,
                        }}
                      >
                        {t.kapsamaText}
                      </div>
                    )}
                  </div>

                  {/* Sağ taraf - Net, KDV ve KDV dahil toplam */}
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 13,
                      minWidth: 210,
                    }}
                  >
                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {formatCurrency(totalBrut)}{" "}
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: 12,
                          color: "#4b5563",
                        }}
                      >
                        {paraBirimiText}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 2,
                      }}
                    >
                      <span>Net: {formatCurrency(totalNet)}</span>
                      {" • "}
                      <span>KDV: {formatCurrency(totalKdv)}</span>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 2,
                      }}
                    >
                      Genel Toplam (KDV Dahil)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
