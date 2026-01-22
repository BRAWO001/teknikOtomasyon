// SatinalmaHeaderCard.jsx
function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);

    // ✅ Türkiye UTC+3 düzeltmesi
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

export default function SatinalmaHeaderCard({
  seriNo,
  tarih,
  talepCinsi,
  talepEden,
  aciklama,
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",   // soft border
        borderRadius: 4,
        padding: "0.5rem 0.75rem",
        marginBottom: "0.5rem",
        backgroundColor: "#f5f5f5",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <p style={{ margin: "0 0 0.15rem 0" }}>
        <strong>Tarih:</strong> {formatTR(tarih)}
      </p>

      <p style={{ margin: "0 0 0.15rem 0" }}>
        <strong>Talep Cinsi:</strong> {talepCinsi || "-"}
      </p>

      <p style={{ margin: "0 0 0.15rem 0" }}>
        <strong>Talep Eden:</strong>{" "}
        {talepEden
          ? `${talepEden.ad ?? talepEden.Ad} ${
              talepEden.soyad ?? talepEden.Soyad ?? ""
            }`
          : "-"}
      </p>

      <p style={{ margin: 0 }}>
        <strong>Açıklama:</strong> {aciklama || "-"}
      </p>
    </div>
  );
}
