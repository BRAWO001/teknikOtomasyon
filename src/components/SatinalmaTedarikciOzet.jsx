




// SatinalmaTedarikciOzet.jsx
import { useMemo, useState, useEffect } from "react";
import { postDataAsync } from "@/utils/apiService";

export default function SatinalmaTedarikciOzet({
  tedarikciOzetList,
  satinAlmaId, // ✅ hızlı onay için gerekli
  showFastApprove = true, // ✅ butonu kontrol
  onAfterFastApprove, // ✅ başarılı olunca parent refresh

  // ✅ Rol kontrolü için opsiyonel prop (parent'tan göndermen en sağlıklısı)
  // Örnek: personelRolKod={personel?.RolKod}
  personelRolKod,
  // Alternatif isimle de gelebilir diye destek:
  personelRoleCode,
}) {
  const [fastApproveLoading, setFastApproveLoading] = useState(false);
  const [fastApproveMsg, setFastApproveMsg] = useState("");
  const [fastApproveErr, setFastApproveErr] = useState("");

  // ✅ Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ✅ Rol: önce prop'tan, yoksa client-side storage/cookie'den bul (fallback)
  const resolvedRoleCode = useMemo(() => {
    const direct =
      personelRolKod ??
      personelRoleCode ??
      tedarikciOzetList?.personelRolKod ??
      null;

    if (direct != null) return Number(direct);

    // Fallback: localStorage / cookie (client-side)
    if (typeof window === "undefined") return null;

    // 1) localStorage "PersonelUserInfo" (senin projede yaygın)
    try {
      const raw = window.localStorage.getItem("PersonelUserInfo");
      if (raw) {
        const obj = JSON.parse(raw);
        const r =
          obj?.RolKod ??
          obj?.rolKod ??
          obj?.RoleCode ??
          obj?.roleCode ??
          obj?.Rol ??
          obj?.rol ??
          null;
        if (r != null) return Number(r);
      }
    } catch {}

    // 2) cookie "PersonelUserInfo" (JSON olabilir)
    try {
      const cookieStr = document.cookie || "";
      const match = cookieStr
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("PersonelUserInfo="));

      if (match) {
        const val = decodeURIComponent(match.split("=").slice(1).join("="));
        const obj = JSON.parse(val);
        const r =
          obj?.RolKod ??
          obj?.rolKod ??
          obj?.RoleCode ??
          obj?.roleCode ??
          obj?.Rol ??
          obj?.rol ??
          null;
        if (r != null) return Number(r);
      }
    } catch {}

    return null;
  }, [personelRolKod, personelRoleCode, tedarikciOzetList]);

  // ✅ Rol 40 ise hızlı onay görünmesin
  const isRole40 = resolvedRoleCode === 40;

  // ⭐ Küçükten büyüğe sırala (GENEL TOPLAM / KDV DAHİL)
  const sorted = useMemo(() => {
    const list = Array.isArray(tedarikciOzetList) ? tedarikciOzetList : [];
    return [...list].sort(
      (a, b) =>
        (a.totalBrut ?? a.totalNet ?? a.total) -
        (b.totalBrut ?? b.totalNet ?? b.total)
    );
  }, [tedarikciOzetList]);

  const formatCurrency = (val) =>
    (Number(val) || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ✅ En iyi teklif (1. sıradaki)
  const bestOffer = useMemo(() => {
    if (!sorted || sorted.length === 0) return null;
    const t = sorted[0];
    const totalNet = t.totalNet ?? t.total ?? 0;
    const totalKdv = t.totalKdv ?? 0;
    const totalBrut = t.totalBrut ?? totalNet + totalKdv;
    const paraBirimiText = t.paraBirimiText || "TRY";
    return {
      name: t.name,
      totalNet,
      totalKdv,
      totalBrut,
      paraBirimiText,
    };
  }, [sorted]);

  const closeModal = () => setConfirmOpen(false);

  // ✅ ESC ile modal kapat
  useEffect(() => {
    if (!confirmOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [confirmOpen]);

  // ✅ Hızlı onay güncellemesi (token'lı postDataAsync)
  const doFastApprove = async () => {
    if (!satinAlmaId) {
      setFastApproveErr(
        "SatınAlmaId bulunamadı (component'e satinAlmaId gönder)."
      );
      setFastApproveMsg("");
      return;
    }

    try {
      setFastApproveLoading(true);
      setFastApproveErr("");
      setFastApproveMsg("");

      const res = await postDataAsync("satinalma/HizliOnayGuncellemesi", {
        satinAlmaId,
        not: "Hızlı Onay (UI)",
      });

      const msg =
        res?.message || res?.Message || "Hızlı onay işlemi tamamlandı.";
      setFastApproveMsg(msg);

      if (typeof onAfterFastApprove === "function") {
        await onAfterFastApprove(res);
      }
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data ||
        err?.message ||
        "Hızlı onay sırasında hata oluştu.";

      setFastApproveErr(
        typeof apiMsg === "string"
          ? apiMsg
          : "Hızlı onay sırasında hata oluştu."
      );
      setFastApproveMsg("");
    } finally {
      setFastApproveLoading(false);
    }
  };

  // ✅ Butona tıklanınca önce modal aç
  const handleFastApproveClick = () => {
    setFastApproveErr("");
    setFastApproveMsg("");
    setConfirmOpen(true);
  };

  // ✅ Modal içinden “Onaylıyorum”
  const handleConfirmApprove = async () => {
    setConfirmOpen(false);
    await doFastApprove();
  };

  // ✅ Modal içinden “Red”
  const handleReject = () => {
    setConfirmOpen(false);
    setFastApproveErr("Red seçildi. Hızlı onay işlemi uygulanmadı.");
    setFastApproveMsg("");
  };

  // ✅ Final: Rol 40 ise gösterme (parent showFastApprove=true gelse bile)
  const canShowFastApprove = showFastApprove && !isRole40;

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 10,
        padding: "0.85rem 1rem",
        marginBottom: "1rem",
        backgroundColor: "#ffffff",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: "0.45rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Tedarikçi Bazlı Özet
          </h2>

          {sorted.length > 0 && (
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              Toplam {sorted.length} tedarikçi teklifi
            </span>
          )}
        </div>
      </div>

      {/* ✅ GENİŞ HIZLI ONAY BUTONU (Rol 40 ise görünmez) */}
      {canShowFastApprove && (
        <div style={{ marginBottom: "0.65rem" }}>
          <button
            type="button"
            onClick={handleFastApproveClick}
            disabled={fastApproveLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 900,
              border: "1px solid #ecfdf5", // soft yeşil border
              backgroundColor: fastApproveLoading ? "#a7f3d0" : "#ecfdf5", // soft green
              color: "#064e3b", // koyu yeşil yazı
              cursor: fastApproveLoading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(16,185,129,0.25)", // yeşil tonlu shadow
            }}
            title="Onay vermeden önce bilgilendirme ekranı açılır."
          >
            {fastApproveLoading
              ? "Hızlı Onay Uygulanıyor..."
              : "✅ Hızlı Onayla"}
          </button>

          {/* küçük açıklama satırı */}
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "#6b7280",
              lineHeight: 1.35,
            }}
          >
            Bu işlem onay kayıtlarını kuralına göre <b>Onaylandı</b> durumuna
            getirir.
          </div>
        </div>
      )}

      {/* ✅ Hızlı onay mesajları */}
      {(fastApproveMsg || fastApproveErr) && (
        <div style={{ marginBottom: "0.75rem" }}>
          {fastApproveMsg && (
            <div
              style={{
                border: "1px solid #22c55e",
                backgroundColor: "#ecfdf5",
                color: "#166534",
                padding: "10px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {fastApproveMsg}
            </div>
          )}

          {fastApproveErr && (
            <div
              style={{
                border: "1px solid #ef4444",
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                padding: "10px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {fastApproveErr}
            </div>
          )}
        </div>
      )}

      {/* ✅ ONAY MODALI */}
      {confirmOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.60)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 28px 80px rgba(0,0,0,0.30)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>
                  Onay İşlemi
                </div>
                <div style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>
                  Satın alma onay güncellemesi yapılacak.
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  borderRadius: 12,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
                title="Kapat"
              >
                Kapat
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "14px 16px" }}>
              {/* Uyarı */}
              <div
                style={{
                  border: "1px solid #fde68a",
                  backgroundColor: "#fffbeb",
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#92400e",
                    marginBottom: 8,
                  }}
                >
                  Onay Yetki Bilgilendirmesi
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 12,
                    color: "#78350f",
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    • <strong>0 – 1.500 ₺</strong> tutar aralığı için onay
                    yetkilisi: <strong>Cem Eren</strong>
                  </div>

                  <div>
                    • <strong>1.500 – 10.000 ₺</strong> tutar aralığı için onay
                    yetkilisi: <strong>Ali Oğuz</strong>
                  </div>

                  <div>
                    • <strong>10.000 ₺ ve üzeri</strong> tutarlar için onay
                    yetkilisi: <strong>Özer Aydın</strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: "1px dashed #fcd34d",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#92400e",
                  }}
                >
                  Lütfen gerekli onayların verilmiş olduğunu{" "}
                  <strong>teyit ediniz</strong>.
                </div>
              </div>

              {/* En iyi teklif bilgisi */}
              {bestOffer && (
                <div
                  style={{
                    marginTop: 10,
                    border: "1px solid #dcfce7",
                    backgroundColor: "#f0fdf4",
                    color: "#166534",
                    padding: "10px 12px",
                    borderRadius: 14,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 900 }}>
                    En iyi teklif (KDV dahil en düşük):
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#166534" }}>{bestOffer.name}</div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: "#15803d",
                          fontWeight: 800,
                        }}
                      >
                        Net: {formatCurrency(bestOffer.totalNet)} • KDV:{" "}
                        {formatCurrency(bestOffer.totalKdv)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 900 }}>
                        {formatCurrency(bestOffer.totalBrut)}{" "}
                        <span style={{ fontSize: 12, fontWeight: 800 }}>
                          {bestOffer.paraBirimiText}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: "#15803d",
                          fontWeight: 800,
                        }}
                      >
                        Genel Toplam (KDV Dahil)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#374151",
                  lineHeight: 1.55,
                }}
              >
                Bu işlem, sistemdeki onay kayıtlarını kuralına göre{" "}
                <strong>“Onaylandı”</strong> durumuna günceller. Devam etmek
                istiyor musunuz?
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleReject}
                style={{
                  border: "1px solid #ef4444",
                  backgroundColor: "#ffffff",
                  color: "#b91c1c",
                  borderRadius: 12,
                  padding: "9px 12px",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                  minWidth: 120,
                }}
              >
                Red
              </button>

              <button
                type="button"
                onClick={handleConfirmApprove}
                style={{
                  border: "1px solid #111827",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  borderRadius: 12,
                  padding: "9px 12px",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                  minWidth: 170,
                }}
              >
                Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEKLİFLER */}
      {sorted.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
          Henüz herhangi bir tedarikçi teklif girmemiş.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {sorted.map((t, index) => {
            const isBest = index === 0;

            const cardStyle = isBest
              ? { border: "1px solid #22c55e", backgroundColor: "#ecfdf5" }
              : { border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" };

            const totalNet = t.totalNet ?? t.total ?? 0;
            const totalKdv = t.totalKdv ?? 0;
            const totalBrut = t.totalBrut ?? totalNet + totalKdv;
            const paraBirimiText = t.paraBirimiText || "TRY";

            return (
              <div
                key={t.name}
                style={{
                  ...cardStyle,
                  borderRadius: 10,
                  padding: "0.7rem 0.85rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.85rem",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Sol */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 999,
                          backgroundColor: "#e5e7eb",
                          color: "#374151",
                          fontWeight: 900,
                        }}
                      >
                        #{index + 1}
                      </span>

                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 240,
                        }}
                      >
                        {t.name}
                      </span>

                      {isBest && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                          }}
                        >
                          En iyi teklif
                        </span>
                      )}
                    </div>

                    {t.kapsamaText && (
                      <div style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>
                        {t.kapsamaText}
                      </div>
                    )}
                  </div>

                  {/* Sağ */}
                  <div style={{ textAlign: "right", fontSize: 13, minWidth: 220 }}>
                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 900,
                        fontSize: 14,
                      }}
                    >
                      {formatCurrency(totalBrut)}{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: "#4b5563",
                        }}
                      >
                        {paraBirimiText}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 3,
                        fontWeight: 700,
                      }}
                    >
                      <span>Net: {formatCurrency(totalNet)}</span>
                      {" • "}
                      <span>KDV: {formatCurrency(totalKdv)}</span>
                    </div>

                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      Genel Toplam (KDV Dahil)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
