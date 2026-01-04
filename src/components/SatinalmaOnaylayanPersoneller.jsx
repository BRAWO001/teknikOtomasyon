// SatinalmaOnaylayanPersoneller.jsx
export default function SatinalmaOnaylayanPersoneller({
  onaylayanPersoneller,
}) {
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
      <h2
        style={{
          margin: "0 0 0.5rem 0",
          fontSize: 16,
          fontWeight: 600,
          color: "#000",
        }}
      >
        Onaylayan / Onaylayacak Personeller
      </h2>

      {onaylayanPersoneller.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
          Bu satın alma için kayıtlı onaylayıcı personel bulunmuyor.
        </p>
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
                  Sıra
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #9ca3af",
                    textAlign: "left",
                    padding: "0.35rem",
                  }}
                >
                  Personel
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #9ca3af",
                    textAlign: "left",
                    padding: "0.35rem",
                  }}
                >
                  Durum
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
              {onaylayanPersoneller.map((o) => {
                const oid = o.id ?? o.Id;
                const sira = o.sira ?? o.Sira;
                const durumAd = o.durumAd ?? o.DurumAd ?? "";
                const durumKod = o.durumKod ?? o.DurumKod ?? null;
                const tarihUtc = o.onayTarihiUtc ?? o.OnayTarihiUtc;
                const not = o.not ?? o.Not ?? "";

                const p = o.personel ?? o.Personel ?? {};
                const adSoyad = `${p.ad ?? p.Ad ?? ""} ${
                  p.soyad ?? p.Soyad ?? ""
                }`.trim();

                let rowBg = "#ffffff";
                if (durumKod === 1) rowBg = "#ecfdf3"; // onay
                else if (durumKod === 2) rowBg = "#fef2f2"; // red

                return (
                  <tr key={oid} style={{ backgroundColor: rowBg }}>
                    <td
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "0.35rem",
                      }}
                    >
                      {sira}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "0.35rem",
                      }}
                    >
                      {adSoyad || "-"}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "0.35rem",
                      }}
                    >
                      {durumAd}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "0.35rem",
                      }}
                    >
                      {tarihUtc
                        ? new Date(tarihUtc).toLocaleString("tr-TR")
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
}
