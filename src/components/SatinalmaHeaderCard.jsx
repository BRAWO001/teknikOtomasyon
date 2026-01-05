// SatinalmaHeaderCard.jsx
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
        border: "1px solid #e5e7eb",      // biraz daha ince / soft
        borderRadius: 4,                  // 6 → 4
        padding: "0.5rem 0.75rem",        // 0.75 → 0.5, 1rem → 0.75rem
        marginBottom: "0.5rem",           // 1rem → 0.5rem
        backgroundColor: "#f5f5f5",       // çok koyu değil, hafif gri
        fontSize: 12,                     // metinleri küçülttük
        lineHeight: 1.4,
      }}
    >
      <p style={{ margin: "0 0 0.15rem 0" }}>
        <strong>Seri No:</strong> {seriNo}
      </p>
      <p style={{ margin: "0 0 0.15rem 0" }}>
        <strong>Tarih:</strong>{" "}
        {tarih ? new Date(tarih).toLocaleString("tr-TR") : "-"}
      </p>
      <p style={{ margin: "0 0 0.15rem 0" }}>
        <strong>Talep Cinsi:</strong> {talepCinsi}
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
