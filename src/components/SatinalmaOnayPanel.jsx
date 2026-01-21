// ✅ SatinalmaOnayPanel.jsx
export default function SatinalmaOnayPanel({
  currentPersonelId,
  benimOnayKaydim,
  benimBeklemedeMi,
  benimDurumAd,
  onayNot,
  setOnayNot,
  onayError,
  onaySuccess,
  onayLoading,
  handleOnayIslem, // true=Onay, false=Red, null=Yorum
}) {
  if (!currentPersonelId) return null;

  const durumMetni = (() => {
    if (!benimOnayKaydim) {
      return "Bu talep için sizin adınıza tanımlı bir onay kaydı bulunmuyor.";
    }

    if (benimBeklemedeMi) {
      return (
        <>
          Bu talep için sizin onayınız bekleniyor. Aşağıdan{" "}
          <strong>Onayla</strong>, <strong>Reddet</strong> veya{" "}
          <strong>Yorum Gönder</strong> seçebilirsiniz.
        </>
      );
    }

    return (
      <>
        Bu talep için sizin durumunuz: <strong>{benimDurumAd || "-"}</strong>
      </>
    );
  })();

  // 📝 Not alanı zorunlu kontrolü
  const validateNotOrWarn = () => {
    if (!onayNot || !onayNot.trim()) {
      alert(
        "Lütfen Not alanını doldurunuz.\n\nOnaylıyorum ya da Faturanın kesileceği işletmeyi belirtiniz."
      );
      return false;
    }
    return true;
  };

  const btnBase = {
    padding: "4px 8px",
    fontSize: 11,
    borderRadius: 5,
    color: "#fff",
    cursor: onayLoading ? "default" : "pointer",
    opacity: onayLoading ? 0.7 : 1,
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 4,
        padding: "0.5rem 0.75rem",
        marginBottom: "0.5rem",
        backgroundColor: "#fffbeb",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <h2
        style={{
          margin: "0 0 0.35rem 0",
          fontSize: 13,
          fontWeight: 600,
          color: "#92400e",
        }}
      >
        Sizin Onayınız
      </h2>

      {!benimOnayKaydim && (
        <p style={{ margin: 0, fontSize: 12, color: "#4b5563" }}>{durumMetni}</p>
      )}

      {benimOnayKaydim && (
        <>
          <p style={{ margin: "0 0 0.35rem 0", fontSize: 12, color: "#4b5563" }}>
            {durumMetni}
          </p>

          {onayError && (
            <div
              style={{
                marginBottom: "0.35rem",
                fontSize: 11,
                color: "#b91c1c",
                backgroundColor: "#fef2f2",
                borderRadius: 3,
                padding: "3px 6px",
              }}
            >
              {onayError}
            </div>
          )}

          {onaySuccess && (
            <div
              style={{
                marginBottom: "0.35rem",
                fontSize: 11,
                color: "#166534",
                backgroundColor: "#dcfce7",
                borderRadius: 3,
                padding: "3px 6px",
              }}
            >
              {onaySuccess}
            </div>
          )}

          <div style={{ marginBottom: "0.4rem" }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                marginBottom: 3,
                color: "#4b5563",
              }}
            >
              Not <span style={{ color: "#b91c1c" }}>*</span>
            </label>

            <textarea
              value={onayNot}
              onChange={(e) => setOnayNot(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                fontSize: 11,
                borderRadius: 3,
                border: "1px solid #d1d5db",
                padding: "3px 6px",
                resize: "vertical",
              }}
              placeholder="Onaylıyorum ya da Faturanın kesileceği işletmeyi belirtiniz..."
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              disabled={onayLoading}
              onClick={() => {
                if (!validateNotOrWarn()) return;
                handleOnayIslem(true);
              }}
              style={{ ...btnBase, border: "1px solid #16a34a", backgroundColor: "#16a34a" }}
            >
              {onayLoading ? "İşleniyor..." : "Onayla"}
            </button>

            <button
              type="button"
              disabled={onayLoading}
              onClick={() => {
                if (!validateNotOrWarn()) return;
                handleOnayIslem(false);
              }}
              style={{ ...btnBase, border: "1px solid #b91c1c", backgroundColor: "#b91c1c" }}
            >
              {onayLoading ? "İşleniyor..." : "Reddet"}
            </button>

            {/* ✅ SADECE YORUM (durum değişmez) */}
            <button
              type="button"
              disabled={onayLoading}
              onClick={() => {
                if (!validateNotOrWarn()) return;
                handleOnayIslem(null); // ✅ yorum modu
              }}
              style={{ ...btnBase, border: "1px solid #d97706", backgroundColor: "#d97706" }}
              title="Durum değişmeden sadece not/yorum güncellenir"
            >
              {onayLoading ? "İşleniyor..." : "Beklemede"}
            </button>
          </div>

          
        </>
      )}
    </div>
  );
}
