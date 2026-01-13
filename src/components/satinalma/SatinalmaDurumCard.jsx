// src/components/SatinalmaDurumCard.jsx
function normalizeNot1(val) {
  if (val == null) return "";
  return String(val)
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

export default function SatinalmaDurumCard({
  localNot1,
  setLocalNot1,
  satinAlindiYetkiliMi,
  id,
  postDataAsync,
  fetchData,
  router,
}) {
  const not1Norm = normalizeNot1(localNot1);
  const isAlindi =
    not1Norm.includes("satın alındı") || not1Norm.includes("satin alindi");
  const isAlinmadi =
    not1Norm.includes("satın alınmadı") ||
    not1Norm.includes("satin alinmadi") ||
    not1Norm.includes("satın alinmadi");

  const satinAlimStatus = isAlindi ? "ALINDI" : isAlinmadi ? "ALINMADI" : "BOS";
  const canSetAlindi = satinAlimStatus !== "ALINDI";
  const canSetAlinmadi = satinAlimStatus !== "ALINMADI";

  // local ui state
  // (component içinde tutulur ki sayfa daha da küçülsün)
  const React = require("react");
  const { useState } = React;
  const [durumLoading, setDurumLoading] = useState(false);
  const [durumError, setDurumError] = useState(null);
  const [durumSuccess, setDurumSuccess] = useState(null);

  const handleDurumDegistir = async (targetDurum) => {
    if (!id) return;

    if (!satinAlindiYetkiliMi) {
      setDurumError("Bu işlem için yetkiniz yok. (Sadece Rol 35)");
      return;
    }

    setDurumLoading(true);
    setDurumError(null);
    setDurumSuccess(null);

    const prevNot1 = localNot1;

    try {
      if (targetDurum === "SATIN_ALINDI") {
        setLocalNot1("Satın alındı");

        const res = await postDataAsync(`satinalma/isaret/satin-alindi/${id}`, {
          not1: "Satın alındı",
        });

        setDurumSuccess(res?.Message ?? "Satın alındı olarak işaretlendi.");
      } else {
        setLocalNot1("Satın alınmadı");

        const res = await postDataAsync(
          `satinalma/isaret/satin-alinmadi/${id}`,
          { not1: "Satın alınmadı" }
        );

        setDurumSuccess(res?.Message ?? "Satın alınmadı olarak işaretlendi.");
      }

      await fetchData(id);
      await router.replace(router.asPath);
    } catch (err) {
      console.error("DURUM POST ERROR:", err);
      setLocalNot1(prevNot1);
      setDurumError("Durum güncelleme sırasında hata oluştu.");
    } finally {
      setDurumLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 12,
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#111827" }}>
            Satın Alım Durumu:
          </span>

          {satinAlimStatus === "ALINDI" ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid #86efac",
                backgroundColor: "#ecfdf5",
                color: "#065f46",
              }}
              title={localNot1}
            >
              ✅ Satın Alındı
            </span>
          ) : satinAlimStatus === "ALINMADI" ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid #fed7aa",
                backgroundColor: "#fff7ed",
                color: "#9a3412",
              }}
              title={localNot1}
            >
              🚫 Satın Alınmadı
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
                color: "#334155",
              }}
            >
              ⏳ İşaretlenmedi
            </span>
          )}
        </div>

        {satinAlindiYetkiliMi ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => handleDurumDegistir("SATIN_ALINDI")}
              disabled={durumLoading || !canSetAlindi}
              style={{
                cursor: durumLoading || !canSetAlindi ? "not-allowed" : "pointer",
                opacity: durumLoading || !canSetAlindi ? 0.6 : 1,
                border: "1px solid #16a34a",
                backgroundColor: "#16a34a",
                color: "#fff",
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Satın Alındı
            </button>

            <button
              type="button"
              onClick={() => handleDurumDegistir("SATIN_ALINMADI")}
              disabled={durumLoading || !canSetAlinmadi}
              style={{
                cursor:
                  durumLoading || !canSetAlinmadi ? "not-allowed" : "pointer",
                opacity: durumLoading || !canSetAlinmadi ? 0.6 : 1,
                border: "1px solid #334155",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Satın Alınmadı
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
            .
          </div>
        )}
      </div>

      {(durumError || durumSuccess) && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 8,
            border: durumError ? "1px solid #fecaca" : "1px solid #bbf7d0",
            backgroundColor: durumError ? "#fef2f2" : "#ecfdf5",
            color: durumError ? "#b91c1c" : "#065f46",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {durumError || durumSuccess}
        </div>
      )}
    </div>
  );
}
