// SatinalmaOnayPanel.jsx
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
  handleOnayIslem,
}) {
  if (!currentPersonelId) return null;

  const durumMetni = (() => {
    if (!benimOnayKaydim) {
      return "Bu talep için sizin adınıza tanımlı bir onay kaydı bulunmuyor.";
    }

    // Onay kaydı var
    if (benimBeklemedeMi) {
      return (
        <>
          Bu talep için sizin onayınız bekleniyor. Aşağıdan{" "}
          <strong>Onayla</strong> veya <strong>Reddet</strong> seçebilirsiniz.
        </>
      );
    }

    // Daha önce Onaylandı / Reddedildi ama artık güncellenebilir
    return (
      <>
        Bu talep için onay kaydınız işlenmiş durumda:{" "}
        <strong>{benimDurumAd}</strong>. İsterseniz aşağıdan
        <strong> tekrar Onayla</strong> veya <strong>Reddet</strong> ile
        güncelleyebilirsiniz.
      </>
    );
  })();

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 6,
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
        backgroundColor: "#fffbeb",
      }}
    >
      <h2
        style={{
          margin: "0 0 0.5rem 0",
          fontSize: 15,
          fontWeight: 600,
          color: "#92400e",
        }}
      >
        Sizin Onayınız
      </h2>

      {!benimOnayKaydim && (
        <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
          {durumMetni}
        </p>
      )}

      {benimOnayKaydim && (
        <>
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: 13,
              color: "#4b5563",
            }}
          >
            {durumMetni}
          </p>

          {onayError && (
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: 12,
                color: "#b91c1c",
                backgroundColor: "#fef2f2",
                borderRadius: 4,
                padding: "4px 8px",
              }}
            >
              {onayError}
            </div>
          )}

          {onaySuccess && (
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: 12,
                color: "#166534",
                backgroundColor: "#dcfce7",
                borderRadius: 4,
                padding: "4px 8px",
              }}
            >
              {onaySuccess}
            </div>
          )}

          <div style={{ marginBottom: "0.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                marginBottom: 4,
                color: "#4b5563",
              }}
            >
              Not (opsiyonel):
            </label>
            <textarea
              value={onayNot}
              onChange={(e) => setOnayNot(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid #d1d5db",
                padding: "4px 8px",
                resize: "vertical",
              }}
              placeholder="Onay / red gerekçenizi yazabilirsiniz..."
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              disabled={onayLoading}
              onClick={() => handleOnayIslem(true)}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid #16a34a",
                backgroundColor: "#16a34a",
                color: "#fff",
                cursor: onayLoading ? "default" : "pointer",
                opacity: onayLoading ? 0.7 : 1,
              }}
            >
              {onayLoading ? "İşleniyor..." : "Onayla"}
            </button>
            <button
              type="button"
              disabled={onayLoading}
              onClick={() => handleOnayIslem(false)}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid #b91c1c",
                backgroundColor: "#b91c1c",
                color: "#fff",
                cursor: onayLoading ? "default" : "pointer",
                opacity: onayLoading ? 0.7 : 1,
              }}
            >
              {onayLoading ? "İşleniyor..." : "Reddet"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
