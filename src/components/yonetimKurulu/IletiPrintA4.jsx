export default function IletiPrintA4({ data }) {
  if (!data) return null;

  return (
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 30,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            EOS MANAGEMENT
          </div>

          <div
            style={{
              fontSize: 11,
              marginTop: 5,
              color: "#555",
            }}
          >
            Yönetim Kurulu • İleti Detayı
          </div>
        </div>

        <img
          src="/eos_management_logo.png"
          alt="EOS Management"
          style={{
            width: "160px",
            height: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      <h2
        style={{
          fontSize: 18,
          margin: "0 0 16px 0",
          lineHeight: 1.4,
        }}
      >
        {data.iletiBaslik || "-"}
      </h2>

      <div
        style={{
          fontSize: 11,
          marginTop: 10,
        }}
      >
        <b>Tarih:</b>{" "}
        {data.tarihUtc
          ? new Date(data.tarihUtc).toLocaleString("tr-TR")
          : "-"}
      </div>

      <div
        style={{
          fontSize: 11,
          marginTop: 8,
        }}
      >
        <b>Site:</b> {data.site?.ad || "-"}
      </div>

      <div
        style={{
          fontSize: 11,
          marginTop: 8,
        }}
      >
        <b>İleti No:</b> #{data.siteBazliNo || data.id || "-"}
      </div>

      <hr
        style={{
          marginTop: 18,
          border: "none",
          borderTop: "1px solid #ddd",
        }}
      />

      <div
        style={{
          whiteSpace: "pre-wrap",
          marginTop: 20,
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {data.iletiAciklama || "-"}
      </div>

      <hr
        style={{
          marginTop: 25,
          border: "none",
          borderTop: "1px solid #ddd",
        }}
      />

      <h3
        style={{
          fontSize: 14,
          marginTop: 18,
          marginBottom: 12,
        }}
      >
        Yorumlar
      </h3>

      {(data.yorumlar || []).length > 0 ? (
        (data.yorumlar || []).map((y) => (
          <div
            key={y.id}
            style={{
              marginBottom: 12,
              borderBottom: "1px solid #ddd",
              paddingBottom: 10,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <b>
              {y.personel?.ad || "-"} {y.personel?.soyad || ""}
            </b>

            <div
              style={{
                marginTop: 4,
                whiteSpace: "pre-wrap",
              }}
            >
              {y.yorum || "-"}
            </div>

            {y.olusturmaTarihiUtc ? (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: "#666",
                }}
              >
                {new Date(y.olusturmaTarihiUtc).toLocaleString("tr-TR")}
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <div
          style={{
            fontSize: 11,
            color: "#555",
          }}
        >
          Henüz yorum yok.
        </div>
      )}

      <div
        style={{
          marginTop: 40,
          paddingTop: 12,
          borderTop: "1px solid #ddd",
          fontSize: 10,
          color: "#555",
        }}
      >
        SAYGILARIMIZLA, <b>EOS MANAGEMENT</b>
      </div>
    </div>
  );
}