// src/components/SatinalmaSurecDurumCard.jsx
function normalizeNot5(val) {
  if (val == null) return "";
  return String(val)
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

export default function SatinalmaSurecDurumCard({
  id,
  localNot5,
  setLocalNot5,
  surecIsaretYetkiliMi,
  postDataAsync,
  fetchData,
  router,
}) {
  const React = require("react");
  const { useState } = React;

  const [surecLoading, setSurecLoading] = useState(false);
  const [surecError, setSurecError] = useState(null);
  const [surecSuccess, setSurecSuccess] = useState(null);

  const not5Norm = normalizeNot5(localNot5);
  const isSurecTamamlandi =
    not5Norm.includes("süreç tamamlandı") || not5Norm.includes("surec tamamlandi");

  const surecStatus = isSurecTamamlandi ? "TAMAMLANDI" : "BOS";

  const canSetSurecTamamlandi = surecStatus !== "TAMAMLANDI";
  const canKaldirSurec = surecStatus === "TAMAMLANDI";

  const handleSurecDegistir = async (target) => {
    if (!id) return;

    if (!surecIsaretYetkiliMi) {
      setSurecError("Bu işlem için yetkiniz yok. (Sadece talep açan kişi)");
      return;
    }

    setSurecLoading(true);
    setSurecError(null);
    setSurecSuccess(null);

    const prevNot5 = localNot5;

    try {
      if (target === "SUREC_TAMAMLANDI") {
        setLocalNot5("Süreç tamamlandı");

        const res = await postDataAsync(
          `satinalma/isaret/surec-tamamlandi/${id}`,
          { not5: "Süreç tamamlandı" }
        );

        setSurecSuccess(res?.Message ?? "Süreç tamamlandı olarak işaretlendi.");
      } else {
        // ✅ kaldır (Not_5 null)
        setLocalNot5("");

        const res = await postDataAsync(
          `satinalma/isaret/surec-tamamlandi-kaldir/${id}`,
          {}
        );

        setSurecSuccess(res?.Message ?? "Süreç tamamlandı kaldırıldı.");
      }

      await fetchData(id);
      await router.replace(router.asPath);
    } catch (err) {
      console.error("SUREC POST ERROR:", err);
      setLocalNot5(prevNot5);
      setSurecError("Süreç güncelleme sırasında hata oluştu.");
    } finally {
      setSurecLoading(false);
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
           Proje yönetici onayı :
          </span>

          {surecStatus === "TAMAMLANDI" ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid #60a5fa",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
              }}
              title={localNot5}
            >
              ✅ Süreç Tamamlandı
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
              title={localNot5}
            >
              ⏳ Tamamlanmadı
            </span>
          )}
        </div>

        {surecIsaretYetkiliMi ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => handleSurecDegistir("SUREC_TAMAMLANDI")}
              disabled={surecLoading || !canSetSurecTamamlandi}
              style={{
                cursor:
                  surecLoading || !canSetSurecTamamlandi ? "not-allowed" : "pointer",
                opacity: surecLoading || !canSetSurecTamamlandi ? 0.6 : 1,
                border: "1px solid #2563eb",
                backgroundColor: "#2563eb",
                color: "#fff",
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Süreç Tamamlandı 
            </button>

            <button
              type="button"
              onClick={() => handleSurecDegistir("SUREC_KALDIR")}
              disabled={surecLoading || !canKaldirSurec}
              style={{
                cursor: surecLoading || !canKaldirSurec ? "not-allowed" : "pointer",
                opacity: surecLoading || !canKaldirSurec ? 0.6 : 1,
                border: "1px solid #334155",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Kaldır
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
            .
          </div>
        )}
      </div>

      {(surecError || surecSuccess) && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 8,
            border: surecError ? "1px solid #fecaca" : "1px solid #bbf7d0",
            backgroundColor: surecError ? "#fef2f2" : "#ecfdf5",
            color: surecError ? "#b91c1c" : "#065f46",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {surecError || surecSuccess}
        </div>
      )}
    </div>
  );
}
