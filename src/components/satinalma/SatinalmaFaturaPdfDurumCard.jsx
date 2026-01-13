// src/components/SatinalmaFaturaPdfDurumCard.jsx
import { useState } from "react";

// ✅ güvenli url mi?
function isValidHttpUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SatinalmaFaturaPdfDurumCard({
  faturaShareUrl,
  not2Raw,
}) {
  const [copiedFatura, setCopiedFatura] = useState(false);

  const not2 = (not2Raw || "").trim();
  const hasInvoicePdfUrl = isValidHttpUrl(not2);

  const copyFaturaLink = async () => {
    if (!faturaShareUrl) return;
    try {
      await navigator.clipboard.writeText(faturaShareUrl);
      setCopiedFatura(true);
      setTimeout(() => setCopiedFatura(false), 1200);
    } catch (err) {
      console.error("Fatura link kopyalama hatası:", err);
    }
  };

  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#ffffff",
        padding: "12px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>
            Fatura  Durumu
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {faturaShareUrl ? (
            <>
              <button
                type="button"
                onClick={copyFaturaLink}
                style={{
                  border: "1px solid #e5e7eb",
                  background: copiedFatura ? "#ecfdf5" : "#f8fafc",
                  color: "#111827",
                  padding: "8px 10px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                title="Fatura sayfası linkini kopyalar"
              >
                {copiedFatura ? "Kopyalandı ✅" : "Fatura Linkini Kopyala"}
              </button>

              <a
                href={faturaShareUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  border: "1px solid #bbf7d0",
                  background: "#d1fae5",
                  color: "#065f46",
                  padding: "8px 10px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 950,
                }}
                title="Fatura sayfasını yeni sekmede açar"
              >
                Fatura Sayfasını Aç →
              </a>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 800 }}>
              PublicToken yok, fatura linki üretilemedi.
            </span>
          )}
        </div>
      </div>

      {/* ✅ Not_2 PDF linki görünümü */}
      <div style={{ marginTop: 10 }}>
        {hasInvoicePdfUrl ? (
          <div
            style={{
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#065f46",
              padding: "10px 12px",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>
              ✅ Fatura PDF yüklendi
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#064e3b",
                wordBreak: "break-all",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {not2}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={not2}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  border: "1px solid #bbf7d0",
                  background: "#d1fae5",
                  color: "#065f46",
                  padding: "8px 10px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 950,
                }}
              >
                PDF Görüntüle →
              </a>

              <a
                href={not2}
                target="_blank"
                rel="noreferrer"
                download
                style={{
                  textDecoration: "none",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#111827",
                  padding: "8px 10px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                İndir
              </a>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid #fde68a",
              background: "#fffbeb",
              color: "#92400e",
              padding: "10px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            ⚠️ Henüz fatura PDF  girilmemiş. 
          </div>
        )}
      </div>
    </div>
  );
}
