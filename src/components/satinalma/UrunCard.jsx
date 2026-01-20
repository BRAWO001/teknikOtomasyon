// components/satinalma/UrunCard.jsx
export default function UrunCard({ urun, formRow, onChange }) {
  const id = urun.id ?? urun.Id;

  const malzemeAdi = urun.malzemeAdi ?? urun.MalzemeAdi;
  const marka = urun.marka ?? urun.Marka ?? "-";
  const adet = urun.adet ?? urun.Adet;
  const birim = urun.birim ?? urun.Birim ?? "-";
  const kullanimAmaci = urun.kullanimAmaci ?? urun.KullanimAmaci ?? "-";
  const ornekLink = urun.ornekUrunLinki ?? urun.OrnekUrunLinki;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "0.95rem",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* Üst başlık */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.2,
              wordBreak: "break-word",
            }}
          >
            {malzemeAdi}
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
            <strong>Marka:</strong> {marka}
            <span style={{ margin: "0 8px", color: "#cbd5e1" }}>•</span>
            <strong>Adet:</strong> {adet} {birim}
          </div>
        </div>

        {/* Link */}
        <div style={{ flexShrink: 0 }}>
          {ornekLink ? (
            <a
              href={ornekLink}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0.38rem 0.7rem",
                borderRadius: 999,
                border: "1px solid #bfdbfe",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 700,
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              Örnek Link
            </a>
          ) : (
            <span
              style={{
                display: "inline-flex",
                padding: "0.38rem 0.7rem",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
                color: "#64748b",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              Link yok
            </span>
          )}
        </div>
      </div>

      {/* Kullanım amacı */}
      <div
        style={{
          marginTop: 10,
          padding: "0.65rem 0.75rem",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          backgroundColor: "#f1f5f9",
          color: "#0f172a",
          fontSize: 13,
          lineHeight: 1.45,
          wordBreak: "break-word",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 12, color: "#334155" }}>
          Kullanım Amacı
        </div>
        <div style={{ marginTop: 4 }}>{kullanimAmaci}</div>
      </div>

      {/* Form alanları */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4, color: "#334155" }}>
            Birim Fiyat
          </div>
          <input
            type="number"
            step="0.01"
            value={formRow.birimFiyat}
            onChange={(e) => onChange(id, "birimFiyat", e.target.value)}
            placeholder="0,00"
            style={{
              width: "100%",
              textAlign: "right",
              fontSize: 14,
              padding: "0.55rem 0.6rem",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              backgroundColor: "#ffffff",
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4, color: "#334155" }}>
            Para Birimi
          </div>
          <select
            value={formRow.paraBirimi}
            onChange={(e) => onChange(id, "paraBirimi", e.target.value)}
            style={{
              width: "100%",
              fontSize: 14,
              padding: "0.55rem 0.6rem",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="TRY">TRY</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4, color: "#334155" }}>
            KDV (%)
          </div>
          <input
            type="number"
            min="0"
            step="1"
            value={formRow.kdvOraniYuzde}
            onChange={(e) => onChange(id, "kdvOraniYuzde", e.target.value)}
            placeholder="20"
            style={{
              width: "100%",
              fontSize: 14,
              padding: "0.55rem 0.6rem",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              backgroundColor: "#ffffff",
            }}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4, color: "#334155" }}>
            Not
          </div>
          <input
            type="text"
            value={formRow.not}
            onChange={(e) => onChange(id, "not", e.target.value)}
            placeholder="İsteğe bağlı not"
            style={{
              width: "100%",
              fontSize: 14,
              padding: "0.55rem 0.6rem",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              backgroundColor: "#ffffff",
            }}
          />
        </div>
      </div>
    </div>
  );
}
