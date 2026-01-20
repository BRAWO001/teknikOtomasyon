// src/pages/satinalma/fiyatlandir/[token].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

// ===============================
// ✅ Components
// ===============================
function MalzemelerTable({
  malzemeler,
  teklifForm,
  onInputChange,
  formatCurrency,
}) {
  // ⭐ Toplam ve KDV hesaplama (satır bazlı)
  const { netTotal, toplamKdv, genelToplam } = useMemo(() => {
    let net = 0;
    let kdv = 0;

    (malzemeler || []).forEach((m) => {
      const id = m.id ?? m.Id;
      const adet = Number(m.adet ?? m.Adet) || 0;
      const formRow = teklifForm[id];
      if (!formRow || adet <= 0) return;

      const birimFiyatNum = parseFloat(
        (formRow.birimFiyat || "").toString().replace(",", ".")
      );
      if (isNaN(birimFiyatNum) || birimFiyatNum <= 0) return;

      const kdvYuzdeNum = parseFloat(formRow.kdvOraniYuzde || "0");
      const kdvOrani =
        !isNaN(kdvYuzdeNum) && kdvYuzdeNum > 0 ? kdvYuzdeNum / 100 : 0;

      const satirNet = birimFiyatNum * adet;
      const satirKdv = satirNet * kdvOrani;

      net += satirNet;
      kdv += satirKdv;
    });

    return { netTotal: net, toplamKdv: kdv, genelToplam: net + kdv };
  }, [malzemeler, teklifForm]);

  const [showTotals, setShowTotals] = useState(false);

  return (
    <>
      {/* ✅ Gesture-conflict fix: yatay scroll alanını izole ediyoruz */}
      <div
        style={{
          overflowX: "auto",
          overflowY: "hidden", // ✅ ikinci dikey scroll oluşmasın
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          overscrollBehaviorY: "none",
          touchAction: "auto", // ✅ dikey swipe body’ye gitsin (kritik)
          border: "1px solid #e5e7eb",
          borderRadius: 6,
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 980, // ✅ mobilde tablo stabilize
            borderCollapse: "collapse",
            fontSize: 13,
            color: "#000",
            tableLayout: "fixed", // ✅ kolonlar zıplamasın
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 160,
                }}
              >
                Malzeme
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 110,
                }}
              >
                Marka
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "right",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 70,
                }}
              >
                Adet
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 80,
                }}
              >
                Birim
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 150,
                }}
              >
                Kullanım Amacı
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 120,
                }}
              >
                Örnek Link
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "right",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 120,
                }}
              >
                Birim Fiyat
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 110,
                }}
              >
                Para Birimi
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 120,
                }}
              >
                KDV (%)
              </th>
              <th
                style={{
                  borderBottom: "1px solid #9ca3af",
                  textAlign: "left",
                  padding: "0.4rem",
                  whiteSpace: "nowrap",
                  width: 190,
                }}
              >
                Not
              </th>
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
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={malzemeAdi}
                  >
                    {malzemeAdi}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={marka}
                  >
                    {marka}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {adet}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {birim}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={kullanimAmaci}
                  >
                    {kullanimAmaci}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                      whiteSpace: "nowrap",
                    }}
                  >
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

                  {/* Birim fiyat */}
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                      textAlign: "right",
                    }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      value={formRow.birimFiyat}
                      onChange={(e) =>
                        onInputChange(id, "birimFiyat", e.target.value)
                      }
                      placeholder="0,00"
                      style={{
                        width: "100%",
                        minWidth: 90,
                        textAlign: "right",
                        fontSize: 13,
                        padding: "0.25rem",
                        borderRadius: 4,
                        border: "1px solid #9ca3af",
                        color: "#000",
                      }}
                    />
                  </td>

                  {/* Para birimi */}
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                    }}
                  >
                    <select
                      value={formRow.paraBirimi}
                      onChange={(e) =>
                        onInputChange(id, "paraBirimi", e.target.value)
                      }
                      style={{
                        fontSize: 13,
                        padding: "0.2rem 0.35rem",
                        borderRadius: 4,
                        border: "1px solid #9ca3af",
                        color: "#000",
                        minWidth: 85,
                        width: "100%",
                      }}
                    >
                      <option value="TRY">TRY</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </td>

                  {/* KDV */}
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                    }}
                  >
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
                        minWidth: 70,
                        fontSize: 13,
                        padding: "0.25rem",
                        borderRadius: 4,
                        border: "1px solid #9ca3af",
                        color: "#000",
                      }}
                    />
                  </td>

                  {/* Not */}
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "0.35rem",
                    }}
                  >
                    <input
                      type="text"
                      value={formRow.not}
                      onChange={(e) => onInputChange(id, "not", e.target.value)}
                      placeholder="İsteğe bağlı not"
                      style={{
                        width: "100%",
                        minWidth: 140,
                        fontSize: 13,
                        padding: "0.25rem",
                        borderRadius: 4,
                        border: "1px solid #9ca3af",
                        color: "#000",
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Alt aksiyonlar */}
      <div
        style={{
          marginTop: "0.9rem",
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => setShowTotals((prev) => !prev)}
            disabled={netTotal <= 0}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: 6,
              border: "1px solid #16a34a",
              backgroundColor: netTotal > 0 ? "#16a34a" : "#9ca3af",
              color: "#ffffff",
              cursor: netTotal > 0 ? "pointer" : "default",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {showTotals ? "Toplamı Gizle (KDV Dahil)" : "Toplamı Göster (KDV Dahil)"}
          </button>

          {netTotal <= 0 && (
            <div style={{ marginTop: "0.35rem", fontSize: 11, color: "#6b7280" }}>
              Toplamı görebilmek için en az bir ürün için geçerli birim fiyat giriniz.
            </div>
          )}
        </div>

        {showTotals && netTotal > 0 && (
          <div
            style={{
              borderRadius: 6,
              border: "1px solid #d1d5db",
              padding: "0.6rem 0.9rem",
              backgroundColor: "#f9fafb",
              minWidth: 260,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "#111827" }}>
              Toplam Özet (Satır bazlı KDV)
            </div>
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
            <div style={{ marginTop: "0.35rem", fontSize: 11, color: "#6b7280" }}>
              Hesaplamalar, satır bazında girilen KDV oranlarına göre yapılmıştır.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ===============================
// ✅ Page
// ===============================
export default function SatinAlmaFiyatlandirPage() {
  const router = useRouter();

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

  // Satın alma detayını token ile çek
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

  // ✅ Modal açıkken body scroll kilidi
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
      [malzemeId]: {
        ...prev[malzemeId],
        [field]: value,
      },
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

      const birimFiyatNum = parseFloat(
        (formRow.birimFiyat || "").toString().replace(",", ".")
      );
      if (isNaN(birimFiyatNum) || birimFiyatNum <= 0) continue;

      const kdvYuzdeNum = parseFloat(formRow.kdvOraniYuzde || "0");
      const kdvOrani =
        !isNaN(kdvYuzdeNum) && kdvYuzdeNum > 0 ? kdvYuzdeNum / 100 : 0;

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
      if (window.history.length > 1) {
        router.back();
      } else {
        window.close();
      }
    }
  };

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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
      {/* Profesyonel giriş metni */}
      <div
        style={{
          marginBottom: "0.75rem",
          padding: "0.75rem 1rem",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 4,
            color: "#000",
          }}
        >
          EOS MANAGEMENT
        </div>
        <div style={{ fontSize: 13, color: "#111827" }}>
          EOS MANAGEMENT, aşağıda listelenen ürünler için sizden fiyat teklifi
          talep etmektedir. Lütfen birim fiyatlarınızı, para birimini ve KDV
          oranını eksiksiz doldurarak teklifinizi gönderiniz.
        </div>
      </div>

      <h1
        style={{
          marginBottom: "0.75rem",
          fontSize: 20,
          fontWeight: 600,
          color: "#000",
        }}
      >
        Satın Alma Fiyatlandırma
      </h1>

      {/* Üst bilgi kartı */}
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

      {/* Tedarikçi adı */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "0.8rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "#ffffff",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "0.35rem",
            fontSize: 14,
            color: "#000",
          }}
        >
          Tedarikçi Adı / Firma Adı{" "}
          <span style={{ color: "#b91c1c", fontSize: 12 }}>*</span>
        </label>
        <input
          type="text"
          value={globalTedarikciAdi}
          onChange={(e) =>
            setGlobalTedarikciAdi(e.target.value.toUpperCase("tr-TR"))
          }
          placeholder="Örn: ABC ELEKTRİK A.Ş."
          style={{
            width: "100%",
            padding: "0.45rem 0.5rem",
            fontSize: 14,
            borderRadius: 4,
            border: "1px solid #9ca3af",
            color: "#000",
            textTransform: "uppercase",
          }}
        />
        <p style={{ marginTop: "0.3rem", fontSize: 12, color: "#4b5563" }}>
          Girilen firma adı otomatik olarak BÜYÜK harfe çevrilir ve tüm
          malzemeler için aynı tedarikçi adı ile kayıt edilir.
        </p>
      </div>

      <h2 style={{ marginBottom: "0.5rem", fontSize: 16, fontWeight: 600, color: "#000" }}>
        Malzemeler
      </h2>

      {malzemeler.length === 0 ? (
        <div style={{ fontSize: 14 }}>Bu satın almada henüz malzeme yok.</div>
      ) : (
        <>
          <MalzemelerTable
            malzemeler={malzemeler}
            teklifForm={teklifForm}
            onInputChange={handleInputChange}
            formatCurrency={formatCurrency}
          />

          <div style={{ marginTop: "0.9rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSubmit}
              disabled={sending}
              style={{
                padding: "0.55rem 1.4rem",
                borderRadius: 6,
                border: "none",
                backgroundColor: sending ? "#9ca3af" : "#2563eb",
                color: "#ffffff",
                cursor: sending ? "default" : "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {sending ? "Gönderiliyor..." : "Teklifi Gönder"}
            </button>
          </div>
        </>
      )}

      {/* Başarılı modal */}
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
              borderRadius: 8,
              padding: "1.5rem",
              maxWidth: 380,
              width: "90%",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              fontSize: 14,
              color: "#000",
            }}
          >
            <h2 style={{ marginBottom: "0.5rem", fontSize: 18, fontWeight: 600, color: "#000" }}>
              Teşekkürler
            </h2>
            <p style={{ marginTop: 0, marginBottom: "1rem", color: "#111827" }}>
              Teklifiniz başarıyla gönderildi.
            </p>
            <button
              onClick={handleCloseModal}
              style={{
                padding: "0.5rem 1.3rem",
                borderRadius: 6,
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
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
