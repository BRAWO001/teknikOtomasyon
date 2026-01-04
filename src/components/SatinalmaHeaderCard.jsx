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
        border: "1px solid #d1d5db",
        borderRadius: 6,
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
        backgroundColor: "#f3f4f6",
      }}
    >
      <p style={{ margin: "0 0 0.25rem 0" }}>
        <strong>Seri No:</strong> {seriNo}
      </p>
      <p style={{ margin: "0 0 0.25rem 0" }}>
        <strong>Tarih:</strong>{" "}
        {tarih ? new Date(tarih).toLocaleString("tr-TR") : "-"}
      </p>
      <p style={{ margin: "0 0 0.25rem 0" }}>
        <strong>Talep Cinsi:</strong> {talepCinsi}
      </p>
      <p style={{ margin: "0 0 0.25rem 0" }}>
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
