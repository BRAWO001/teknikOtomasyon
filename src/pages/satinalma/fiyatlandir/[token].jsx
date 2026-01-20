



// src/pages/satinalma/fiyatlandir/[token].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

// ===============================
// ✅ Helpers
// ===============================
function parseNumberTR(val) {
  const num = parseFloat((val || "").toString().replace(",", "."));
  return Number.isFinite(num) ? num : NaN;
}

function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => setIsMobile(window.innerWidth < breakpointPx);
    check();

    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [breakpointPx]);

  return isMobile;
}

function useTotals(malzemeler, teklifForm) {
  return useMemo(() => {
    let netTotal = 0;
    let toplamKdv = 0;

    (malzemeler || []).forEach((m) => {
      const id = m.id ?? m.Id;
      const adet = Number(m.adet ?? m.Adet) || 0;
      const formRow = teklifForm[id];
      if (!formRow || adet <= 0) return;

      const birimFiyatNum = parseNumberTR(formRow.birimFiyat);
      if (!Number.isFinite(birimFiyatNum) || birimFiyatNum <= 0) return;

      const kdvYuzdeNum = parseNumberTR(formRow.kdvOraniYuzde || "0");
      const kdvOrani =
        Number.isFinite(kdvYuzdeNum) && kdvYuzdeNum > 0 ? kdvYuzdeNum / 100 : 0;

      const satirNet = birimFiyatNum * adet;
      const satirKdv = satirNet * kdvOrani;

      netTotal += satirNet;
      toplamKdv += satirKdv;
    });

    return { netTotal, toplamKdv, genelToplam: netTotal + toplamKdv };
  }, [malzemeler, teklifForm]);
}

// ===============================
// ✅ Mobile (alt alta card)
// ===============================
function MalzemelerMobileList({ malzemeler, teklifForm, onInputChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {(malzemeler || []).map((m) => {
        const id = m.id ?? m.Id;
        const malzemeAdi = m.malzemeAdi ?? m.MalzemeAdi;
        const marka = m.marka ?? m.Marka ?? "-";
        const adet = m.adet ?? m.Adet;
        const birim = m.birim ?? m.Birim ?? "-";
        const kullanimAmaci = m.kullanimAmaci ?? m.KullanimAmaci ?? "-";
        const ornekLink = m.ornekUrunLinki ?? m.OrnekUrunLinki;

        const formRow = teklifForm[id] || {
          birimFiyat: "",
          paraBirimi: "TRY",
          kdvOraniYuzde: "20",
          not: "",
        };

        return (
          <div
            key={id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "0.75rem",
              backgroundColor: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#000" }}>
              {malzemeAdi}
            </div>

            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
              <div>
                <strong>Marka:</strong> {marka}
              </div>
              <div>
                <strong>Adet:</strong> {adet} {birim}
              </div>
              <div>
                <strong>Kullanım Amacı:</strong> {kullanimAmaci}
              </div>
              <div>
                <strong>Örnek Link:</strong>{" "}
                {ornekLink ? (
                  <a
                    href={ornekLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#1d4ed8" }}
                  >
                    Aç
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Birim Fiyat
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formRow.birimFiyat}
                  onChange={(e) => onInputChange(id, "birimFiyat", e.target.value)}
                  placeholder="0,00"
                  style={{
                    width: "100%",
                    textAlign: "right",
                    fontSize: 14,
                    padding: "0.45rem 0.5rem",
                    borderRadius: 6,
                    border: "1px solid #9ca3af",
                    color: "#000",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Para Birimi
                </div>
                <select
                  value={formRow.paraBirimi}
                  onChange={(e) => onInputChange(id, "paraBirimi", e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: 14,
                    padding: "0.45rem 0.5rem",
                    borderRadius: 6,
                    border: "1px solid #9ca3af",
                    color: "#000",
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="TRY">TRY</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  KDV (%)
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formRow.kdvOraniYuzde}
                  onChange={(e) =>
                    onInputChange(id, "kdvOraniYuzde", e.target.value)
                  }
                  placeholder="20"
                  style={{
                    width: "100%",
                    fontSize: 14,
                    padding: "0.45rem 0.5rem",
                    borderRadius: 6,
                    border: "1px solid #9ca3af",
                    color: "#000",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Not
                </div>
                <input
                  type="text"
                  value={formRow.not}
                  onChange={(e) => onInputChange(id, "not", e.target.value)}
                  placeholder="İsteğe bağlı"
                  style={{
                    width: "100%",
                    fontSize: 14,
                    padding: "0.45rem 0.5rem",
                    borderRadius: 6,
                    border: "1px solid #9ca3af",
                    color: "#000",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===============================
// ✅ Desktop Table (yatay)
// ===============================
function MalzemelerDesktopTable({ malzemeler, teklifForm, onInputChange }) {
  // Drag ile yatay scroll (mobil/tablet dokunuşu için de iyi)
  const scrollerRef = useRef(null);
  const dragRef = useRef({ isDown: false, startX: 0, startScrollLeft: 0 });

  const onPointerDown = (e) => {
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current.isDown = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e) => {
    const el = scrollerRef.current;
    if (!el || !dragRef.current.isDown) return;
    const dx = e.clientX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.startScrollLeft - dx;
  };

  const onPointerUp = (e) => {
    const el = scrollerRef.current;
    dragRef.current.isDown = false;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorX: "contain",
        overscrollBehaviorY: "none",
        touchAction: "pan-y pinch-zoom",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 1100,
          borderCollapse: "collapse",
          fontSize: 13,
          color: "#000",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={th(180)}>Malzeme</th>
            <th style={th(120)}>Marka</th>
            <th style={th(70, "right")}>Adet</th>
            <th style={th(90)}>Birim</th>
            <th style={th(220)}>Kullanım Amacı</th>
            <th style={th(120)}>Örnek Link</th>
            <th style={th(140, "right")}>Birim Fiyat</th>
            <th style={th(110)}>Para Birimi</th>
            <th style={th(110)}>KDV (%)</th>
            <th style={th(220)}>Not</th>
          </tr>
        </thead>

        <tbody>
          {(malzemeler || []).map((m) => {
            const id = m.id ?? m.Id;
            const malzemeAdi = m.malzemeAdi ?? m.MalzemeAdi;
            const marka = m.marka ?? m.Marka ?? "-";
            const adet = m.adet ?? m.Adet;
            const birim = m.birim ?? m.Birim ?? "-";
            const kullanimAmaci = m.kullanimAmaci ?? m.KullanimAmaci ?? "-";
            const ornekLink = m.ornekUrunLinki ?? m.OrnekUrunLinki;

            const formRow = teklifForm[id] || {
              birimFiyat: "",
              paraBirimi: "TRY",
              kdvOraniYuzde: "20",
              not: "",
            };

            return (
              <tr key={id}>
                <td style={td()} title={malzemeAdi}>
                  {malzemeAdi}
                </td>
                <td style={td()} title={marka}>
                  {marka}
                </td>
                <td style={td("right")}>{adet}</td>
                <td style={td()}>{birim}</td>
                <td style={td()} title={kullanimAmaci}>
                  {kullanimAmaci}
                </td>
                <td style={td()}>
                  {ornekLink ? (
                    <a
                      href={ornekLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#1d4ed8" }}
                    >
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td style={td("right")}>
                  <input
                    type="number"
                    step="0.01"
                    value={formRow.birimFiyat}
                    onChange={(e) =>
                      onInputChange(id, "birimFiyat", e.target.value)
                    }
                    placeholder="0,00"
                    style={inputStyle({ textAlign: "right", minWidth: 90 })}
                  />
                </td>

                <td style={td()}>
                  <select
                    value={formRow.paraBirimi}
                    onChange={(e) =>
                      onInputChange(id, "paraBirimi", e.target.value)
                    }
                    style={selectStyle({ minWidth: 90 })}
                  >
                    <option value="TRY">TRY</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </td>

                <td style={td()}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formRow.kdvOraniYuzde}
                    onChange={(e) =>
                      onInputChange(id, "kdvOraniYuzde", e.target.value)
                    }
                    placeholder="20"
                    style={inputStyle({ minWidth: 80 })}
                  />
                </td>

                <td style={td()}>
                  <input
                    type="text"
                    value={formRow.not}
                    onChange={(e) => onInputChange(id, "not", e.target.value)}
                    placeholder="İsteğe bağlı not"
                    style={inputStyle({ minWidth: 140 })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function th(width, align = "left") {
  return {
    borderBottom: "1px solid #9ca3af",
    textAlign: align,
    padding: "0.4rem",
    whiteSpace: "nowrap",
    width,
  };
}
function td(align = "left") {
  return {
    borderBottom: "1px solid #e5e7eb",
    padding: "0.35rem",
    textAlign: align,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    verticalAlign: "middle",
  };
}
function inputStyle(extra = {}) {
  return {
    width: "100%",
    fontSize: 13,
    padding: "0.25rem",
    borderRadius: 6,
    border: "1px solid #9ca3af",
    color: "#000",
    backgroundColor: "#fff",
    ...extra,
  };
}
function selectStyle(extra = {}) {
  return {
    width: "100%",
    fontSize: 13,
    padding: "0.25rem",
    borderRadius: 6,
    border: "1px solid #9ca3af",
    color: "#000",
    backgroundColor: "#fff",
    ...extra,
  };
}

// ===============================
// ✅ Page
// ===============================
export default function SatinAlmaFiyatlandirPage() {
  const router = useRouter();
  const isMobile = useIsMobile(768);

  const rawToken = router.query.token;
  const token =
    typeof rawToken === "string"
      ? rawToken
      : Array.isArray(rawToken)
      ? rawToken[0]
      : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [globalTedarikciAdi, setGlobalTedarikciAdi] = useState("");
  const [teklifForm, setTeklifForm] = useState({});
  const [sending, setSending] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Token ile çek
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    getDataAsync(`satinalma/public/${token}`)
      .then((res) => {
        setData(res);

        const malzemeler =
          res.malzemeler ?? res.Malzeme ?? res.Malzemeler ?? [];
        const initial = {};
        (malzemeler || []).forEach((m) => {
          const id = m.id ?? m.Id;
          initial[id] = {
            birimFiyat: "",
            paraBirimi: "TRY",
            kdvOraniYuzde: "20",
            not: "",
          };
        });
        setTeklifForm(initial);
      })
      .catch((err) => {
        console.error("API ERROR:", err);
        setError("Kayıt bulunamadı veya bir hata oluştu.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Modal açıkken body scroll kilidi
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (successModal) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [successModal]);

  const handleInputChange = (malzemeId, field, value) => {
    setTeklifForm((prev) => ({
      ...prev,
      [malzemeId]: { ...prev[malzemeId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!data) return;

    const satinAlmaId = data.id ?? data.Id;
    const malzemeler =
      data.malzemeler ?? data.Malzeme ?? data.Malzemeler ?? [];

    const trimmedName = globalTedarikciAdi.trim();
    if (!trimmedName) {
      alert("Lütfen tedarikçi / firma adını giriniz.");
      return;
    }

    const firmaAdiUpper = trimmedName.toUpperCase("tr-TR");
    const payload = [];

    for (const m of malzemeler) {
      const malzemeId = m.id ?? m.Id;
      const formRow = teklifForm[malzemeId];
      if (!formRow) continue;

      const birimFiyatNum = parseNumberTR(formRow.birimFiyat);
      if (!Number.isFinite(birimFiyatNum) || birimFiyatNum <= 0) continue;

      const kdvYuzdeNum = parseNumberTR(formRow.kdvOraniYuzde || "0");
      const kdvOrani =
        Number.isFinite(kdvYuzdeNum) && kdvYuzdeNum > 0 ? kdvYuzdeNum / 100 : 0;

      payload.push({
        satinAlmaMalzemeId: malzemeId,
        tedarikciAdi: firmaAdiUpper,
        birimFiyat: birimFiyatNum,
        paraBirimi: formRow.paraBirimi || "TRY",
        not: formRow.not || null,
        kdvOrani: kdvOrani > 0 ? kdvOrani : null,
      });
    }

    if (payload.length === 0) {
      alert("En az bir malzeme için geçerli birim fiyat girmelisiniz.");
      return;
    }

    try {
      setSending(true);
      setError(null);
      await postDataAsync(`satinalma/${satinAlmaId}/teklifler`, payload);
      setSuccessModal(true);
    } catch (err) {
      console.error("TEKLIF POST ERROR:", err);
      setError("Teklif gönderilirken bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  const handleCloseModal = () => {
    setSuccessModal(false);
    if (typeof window !== "undefined") {
      if (window.history.length > 1) router.back();
      else window.close();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", fontSize: 14, color: "#000" }}>
        Yükleniyor...
      </div>
    );
  }
  if (error) {
    return (
      <div
        style={{
          padding: "1.5rem",
          fontSize: 14,
          color: "#b91c1c",
          backgroundColor: "#fef2f2",
        }}
      >
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: "1.5rem", fontSize: 14, color: "#000" }}>
        Kayıt bulunamadı.
      </div>
    );
  }

  const seriNo = data.seriNo ?? data.SeriNo;
  const tarih = data.tarih ?? data.Tarih;
  const talepCinsi = data.talepCinsi ?? data.TalepCinsi;
  const aciklama = data.aciklama ?? data.Aciklama;
  const malzemeler =
    data.malzemeler ?? data.Malzeme ?? data.Malzemeler ?? [];

  const { netTotal, toplamKdv, genelToplam } = useTotals(malzemeler, teklifForm);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "1.25rem 1rem",
        fontSize: 14,
        color: "#000000",
        backgroundColor: "#ffffff",
        minHeight: "100dvh",
        overscrollBehaviorY: "none",
      }}
    >
      {/* Giriş */}
      <div
        style={{
          marginBottom: "0.75rem",
          padding: "0.75rem 1rem",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#000" }}>
          EOS MANAGEMENT
        </div>
        <div style={{ fontSize: 13, color: "#111827" }}>
          EOS MANAGEMENT, aşağıda listelenen ürünler için sizden fiyat teklifi
          talep etmektedir. Lütfen birim fiyatlarınızı, para birimini ve KDV
          oranını eksiksiz doldurarak teklifinizi gönderiniz.
        </div>
      </div>

      <h1 style={{ marginBottom: "0.75rem", fontSize: 20, fontWeight: 600, color: "#000" }}>
        Satın Alma Fiyatlandırma
      </h1>

      {/* Üst kart */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "0.8rem 1rem",
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
        <p style={{ margin: 0 }}>
          <strong>Açıklama:</strong> {aciklama || "-"}
        </p>
      </div>

      {/* Firma adı */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "0.8rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "#ffffff",
        }}
      >
        <label style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>
          Tedarikçi Adı / Firma Adı <span style={{ color: "#b91c1c", fontSize: 12 }}>*</span>
        </label>
        <input
          type="text"
          value={globalTedarikciAdi}
          onChange={(e) => setGlobalTedarikciAdi(e.target.value.toUpperCase("tr-TR"))}
          placeholder="Örn: ABC ELEKTRİK A.Ş."
          style={{
            width: "100%",
            padding: "0.45rem 0.5rem",
            fontSize: 14,
            borderRadius: 6,
            border: "1px solid #9ca3af",
            color: "#000",
            textTransform: "uppercase",
          }}
        />
        <p style={{ marginTop: "0.3rem", fontSize: 12, color: "#4b5563" }}>
          Girilen firma adı otomatik olarak BÜYÜK harfe çevrilir ve tüm malzemeler için aynı tedarikçi adı ile kayıt edilir.
        </p>
      </div>

      <h2 style={{ marginBottom: "0.5rem", fontSize: 16, fontWeight: 600, color: "#000" }}>
        Malzemeler
      </h2>

      {malzemeler.length === 0 ? (
        <div style={{ fontSize: 14 }}>Bu satın almada henüz malzeme yok.</div>
      ) : (
        <>
          {/* ✅ Mobil: alt alta  /  ✅ Desktop: tablo */}
          {isMobile ? (
            <MalzemelerMobileList
              malzemeler={malzemeler}
              teklifForm={teklifForm}
              onInputChange={handleInputChange}
            />
          ) : (
            <MalzemelerDesktopTable
              malzemeler={malzemeler}
              teklifForm={teklifForm}
              onInputChange={handleInputChange}
            />
          )}

          {/* Totaller (her iki görünümde de) */}
          <div
            style={{
              marginTop: 12,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "0.75rem 0.9rem",
              backgroundColor: "#f9fafb",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Net Toplam:</span>
              <span>{formatCurrency(netTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Toplam KDV:</span>
              <span>{formatCurrency(toplamKdv)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontWeight: 700,
                color: "#000",
              }}
            >
              <span>Genel Toplam (KDV Dahil):</span>
              <span>{formatCurrency(genelToplam)}</span>
            </div>
          </div>

          {/* Gönder */}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSubmit}
              disabled={sending}
              style={{
                padding: "0.55rem 1.4rem",
                borderRadius: 8,
                border: "none",
                backgroundColor: sending ? "#9ca3af" : "#2563eb",
                color: "#ffffff",
                cursor: sending ? "default" : "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {sending ? "Gönderiliyor..." : "Teklifi Gönder"}
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {successModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 10,
              padding: "1.5rem",
              maxWidth: 380,
              width: "90%",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              fontSize: 14,
              color: "#000",
            }}
          >
            <h2 style={{ marginBottom: "0.5rem", fontSize: 18, fontWeight: 700 }}>
              Teşekkürler
            </h2>
            <p style={{ marginTop: 0, marginBottom: "1rem", color: "#111827" }}>
              Teklifiniz başarıyla gönderildi.
            </p>
            <button
              onClick={handleCloseModal}
              style={{
                padding: "0.5rem 1.3rem",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
