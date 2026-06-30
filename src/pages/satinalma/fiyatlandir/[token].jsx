// src/pages/satinalma/fiyatlandir/[token].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import UrunCard from "@/components/satinalma/UrunCard";

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

  const [showTotals, setShowTotals] = useState(false);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (successModal || imageModalOpen) {
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
  }, [successModal, imageModalOpen]);

  const handleInputChange = (malzemeId, field, value) => {
    setTeklifForm((prev) => ({
      ...prev,
      [malzemeId]: {
        ...prev[malzemeId],
        [field]: value,
      },
    }));
  };

  const { netTotal, toplamKdv, genelToplam } = useMemo(() => {
    const malzemeler =
      data?.malzemeler ?? data?.Malzeme ?? data?.Malzemeler ?? [];

    let net = 0;
    let kdv = 0;

    (malzemeler || []).forEach((m) => {
      const id = m.id ?? m.Id;
      const adet = Number(m.adet ?? m.Adet) || 0;
      const row = teklifForm[id];
      if (!row || adet <= 0) return;

      const birimFiyatNum = parseFloat(
        (row.birimFiyat || "").toString().replace(",", ".")
      );
      if (isNaN(birimFiyatNum) || birimFiyatNum <= 0) return;

      const kdvYuzdeNum = parseFloat(row.kdvOraniYuzde || "0");
      const kdvOrani =
        !isNaN(kdvYuzdeNum) && kdvYuzdeNum > 0 ? kdvYuzdeNum / 100 : 0;

      const satirNet = birimFiyatNum * adet;
      const satirKdv = satirNet * kdvOrani;

      net += satirNet;
      kdv += satirKdv;
    });

    return { netTotal: net, toplamKdv: kdv, genelToplam: net + kdv };
  }, [data, teklifForm]);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const dosyalar = data?.dosyalar ?? data?.Dosyalar ?? [];

  const imageFiles = useMemo(() => {
    return (dosyalar || []).filter((d) => {
      const url = String(d?.url ?? d?.Url ?? "").toLowerCase();
      const ad = String(d?.dosyaAdi ?? d?.DosyaAdi ?? "").toLowerCase();
      const turKod = d?.turKod ?? d?.TurKod;

      return (
        turKod === 10 ||
        url.endsWith(".jpg") ||
        url.endsWith(".jpeg") ||
        url.endsWith(".png") ||
        url.endsWith(".webp") ||
        url.endsWith(".gif") ||
        url.endsWith(".heic") ||
        url.endsWith(".heif") ||
        url.endsWith(".avif") ||
        ad.endsWith(".jpg") ||
        ad.endsWith(".jpeg") ||
        ad.endsWith(".png") ||
        ad.endsWith(".webp") ||
        ad.endsWith(".gif") ||
        ad.endsWith(".heic") ||
        ad.endsWith(".heif") ||
        ad.endsWith(".avif")
      );
    });
  }, [dosyalar]);

  const fiyatTeklifleri = useMemo(() => {
    return (
      data?.fiyatTeklifleri ??
      data?.FiyatTeklifleri ??
      data?.teklifler ??
      data?.Teklifler ??
      []
    );
  }, [data]);

  const teklifOzetleri = useMemo(() => {
    const list = data?.teklifOzetleri ?? data?.TeklifOzetleri ?? [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  const enUygunOzetKdvDahil = useMemo(() => {
    if (!teklifOzetleri.length) return null;

    const values = teklifOzetleri
      .map((o) => Number(o?.toplamTutarKdvDahil ?? o?.ToplamTutarKdvDahil ?? 0))
      .filter((v) => v > 0);

    if (!values.length) return null;

    return Math.min(...values);
  }, [teklifOzetleri]);

  const enUygunKalemMap = useMemo(() => {
    const map = {};

    (fiyatTeklifleri || []).forEach((t) => {
      const malzemeId = t?.satinAlmaMalzemeId ?? t?.SatinAlmaMalzemeId;
      if (!malzemeId) return;

      const value = Number(
        t?.toplamTutarKdvDahil ?? t?.ToplamTutarKdvDahil ?? 0
      );

      if (value <= 0) return;

      if (!map[malzemeId] || value < map[malzemeId]) {
        map[malzemeId] = value;
      }
    });

    return map;
  }, [fiyatTeklifleri]);

  const openImageModal = (index = 0) => {
    setActiveImageIndex(index);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  const nextImage = () => {
    setActiveImageIndex((prev) =>
      imageFiles.length ? (prev + 1) % imageFiles.length : 0
    );
  };

  const prevImage = () => {
    setActiveImageIndex((prev) =>
      imageFiles.length ? (prev - 1 + imageFiles.length) % imageFiles.length : 0
    );
  };

  const activeImage = imageFiles[activeImageIndex] || null;
  const activeImageUrl = activeImage?.url ?? activeImage?.Url;
  const activeImageName =
    activeImage?.dosyaAdi ?? activeImage?.DosyaAdi ?? "Görsel";

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

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "1.25rem 1rem",
        fontSize: 14,
        color: "#000000",
        backgroundColor: "#ffffff",
        minHeight: "100dvh",
        overscrollBehaviorY: "none",
      }}
    >
      <div
        style={{
          marginBottom: "0.75rem",
          padding: "0.85rem 1rem",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            marginBottom: 6,
            color: "#0f172a",
          }}
        >
          EOS MANAGEMENT
        </div>
        <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.5 }}>
          EOS MANAGEMENT, aşağıda listelenen ürünler için sizden fiyat teklifi
          talep etmektedir. Lütfen birim fiyatlarınızı, para birimini ve KDV
          oranını eksiksiz doldurarak teklifinizi gönderiniz.
        </div>
      </div>

      <h1
        style={{
          marginBottom: "0.75rem",
          fontSize: 20,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        Satın Alma Fiyatlandırma
      </h1>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "0.9rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "#f8fafc",
        }}
      >
        <div style={{ display: "grid", gap: 6, color: "#0f172a" }}>
          <div>
            <strong>Seri No:</strong> {seriNo}
          </div>
          <div>
            <strong>Tarih:</strong>{" "}
            {tarih ? new Date(tarih).toLocaleString("tr-TR") : "-"}
          </div>
          <div>
            <strong>Talep Cinsi:</strong> {talepCinsi}
          </div>
          <div>
            <strong>Açıklama:</strong> {aciklama || "-"}
          </div>

          <div>
            <strong>Not:</strong>{" "}
            {(data.not ?? data.Not ?? data.notu ?? data.Notu) || "-"}
          </div>
        </div>
      </div>

      {imageFiles.length > 0 && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "0.9rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            Görseller
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: 6,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
            }}
          >
            {imageFiles.map((img, index) => {
              const imgUrl = img?.url ?? img?.Url;

              const imgName =
                img?.dosyaAdi ?? img?.DosyaAdi ?? `Görsel ${index + 1}`;

              return (
                <button
                  key={img?.id ?? img?.Id ?? index}
                  type="button"
                  onClick={() => openImageModal(index)}
                  title={imgName}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 14,
                    overflow: "hidden",
                    backgroundColor: "#ffffff",
                    padding: 0,
                    cursor: "pointer",
                    width: 140,
                    minWidth: 140,
                    height: 130,
                    flexShrink: 0,
                    position: "relative",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={imgName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      userSelect: "none",
                      WebkitUserDrag: "none",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: "0.35rem 0.5rem",
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {imgName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {imageModalOpen && activeImage && (
        <div
          onClick={closeImageModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.96)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            touchAction: "pan-y",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeImageModal();
            }}
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              backgroundColor: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 900,
              cursor: "pointer",
              zIndex: 10002,
              backdropFilter: "blur(4px)",
            }}
          >
            ×
          </button>

          {imageFiles.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              style={{
                position: "fixed",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 900,
                cursor: "pointer",
                zIndex: 10002,
                backdropFilter: "blur(4px)",
              }}
            >
              ‹
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "96vw",
              maxHeight: "90vh",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            <img
              src={activeImageUrl}
              alt={activeImageName}
              style={{
                maxWidth: "96vw",
                maxHeight: "84vh",
                objectFit: "contain",
                borderRadius: 14,
                display: "block",
                margin: "0 auto",
                userSelect: "none",
                WebkitUserDrag: "none",
              }}
            />

            <div
              style={{
                marginTop: 12,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                opacity: 0.92,
              }}
            >
              {activeImageIndex + 1} / {imageFiles.length} — {activeImageName}
            </div>
          </div>

          {imageFiles.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              style={{
                position: "fixed",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 900,
                cursor: "pointer",
                zIndex: 10002,
                backdropFilter: "blur(4px)",
              }}
            >
              ›
            </button>
          )}
        </div>
      )}

      {(teklifOzetleri.length > 0 || fiyatTeklifleri.length > 0) && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "0.9rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            className="text-center"
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 12,
            }}
          >
            GÖNDERİLMİŞ TEKLİFLER
          </div>

          {teklifOzetleri.length > 0 && (
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              {teklifOzetleri.map((o, index) => {
                const tedarikciAdi =
                  o?.tedarikciAdi ??
                  o?.TedarikciAdi ??
                  "Tedarikçi belirtilmemiş";

                const paraBirimi = o?.paraBirimi ?? o?.ParaBirimi ?? "TRY";
                const kalemSayisi = o?.kalemSayisi ?? o?.KalemSayisi ?? 0;
                const toplamTutar = o?.toplamTutar ?? o?.ToplamTutar ?? 0;

                const toplamTutarKdvDahil =
                  o?.toplamTutarKdvDahil ?? o?.ToplamTutarKdvDahil ?? 0;

                const sonTeklifTarihiUtc =
                  o?.sonTeklifTarihiUtc ?? o?.SonTeklifTarihiUtc;

                const isEnUygun =
                  enUygunOzetKdvDahil !== null &&
                  Number(toplamTutarKdvDahil) === Number(enUygunOzetKdvDahil);

                return (
                  <div
                    key={`${tedarikciAdi}-${paraBirimi}-${index}`}
                    style={{
                      border: isEnUygun
                        ? "2px solid #16a34a"
                        : "1px solid #d1d5db",
                      borderRadius: 12,
                      backgroundColor: isEnUygun ? "#f0fdf4" : "#ffffff",
                      padding: "0.8rem 0.9rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          color: isEnUygun ? "#166534" : "#0f172a",
                          fontSize: 14,
                        }}
                      >
                        {index + 1}. {tedarikciAdi}
                      </div>

                      {isEnUygun && (
                        <div
                          style={{
                            backgroundColor: "#16a34a",
                            color: "#ffffff",
                            borderRadius: 999,
                            padding: "0.25rem 0.65rem",
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          EN UYGUN TEKLİF
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 4,
                        fontSize: 13,
                        color: "#111827",
                      }}
                    >
                      <div>
                        <strong>Kalem Sayısı:</strong> {kalemSayisi}
                      </div>
                      <div>
                        <strong>Net Toplam:</strong>{" "}
                        {formatCurrency(toplamTutar)} {paraBirimi}
                      </div>
                      <div>
                        <strong>KDV Dahil Toplam:</strong>{" "}
                        {formatCurrency(toplamTutarKdvDahil)} {paraBirimi}
                      </div>
                      <div>
                        <strong>Son Teklif Tarihi:</strong>{" "}
                        {sonTeklifTarihiUtc
                          ? new Date(sonTeklifTarihiUtc).toLocaleString(
                              "tr-TR"
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {fiyatTeklifleri.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Teklif Kalemleri
              </div>

              {fiyatTeklifleri.map((t, index) => {
                const tedarikciAdi =
                  t?.tedarikciAdi ??
                  t?.TedarikciAdi ??
                  "Tedarikçi belirtilmemiş";

                const malzemeAdi = t?.malzemeAdi ?? t?.MalzemeAdi ?? "-";
                const birimFiyat = t?.birimFiyat ?? t?.BirimFiyat ?? 0;
                const paraBirimi = t?.paraBirimi ?? t?.ParaBirimi ?? "TRY";
                const adet = t?.adet ?? t?.Adet ?? 1;

                const toplamTutarKdvDahil =
                  t?.toplamTutarKdvDahil ?? t?.ToplamTutarKdvDahil ?? 0;

                const malzemeId =
                  t?.satinAlmaMalzemeId ?? t?.SatinAlmaMalzemeId;

                const isEnUygunKalem =
                  malzemeId &&
                  enUygunKalemMap[malzemeId] &&
                  Number(toplamTutarKdvDahil) ===
                    Number(enUygunKalemMap[malzemeId]);

                return (
                  <div
                    key={t?.id ?? t?.Id ?? index}
                    style={{
                      border: isEnUygunKalem
                        ? "1px solid #16a34a"
                        : "1px solid #e5e7eb",
                      borderRadius: 10,
                      backgroundColor: isEnUygunKalem ? "#f0fdf4" : "#ffffff",
                      padding: "0.55rem 0.7rem",
                      fontSize: 12,
                      color: "#111827",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 900,
                        color: isEnUygunKalem ? "#166534" : "#0f172a",
                      }}
                    >
                      {malzemeAdi}
                    </span>

                    <span>
                      <strong>Tedarikçi:</strong> {tedarikciAdi}
                    </span>

                    <span>
                      <strong>Birim:</strong> {formatCurrency(birimFiyat)}{" "}
                      {paraBirimi}
                    </span>

                    <span>
                      <strong>Adet:</strong> {adet}
                    </span>

                    <span
                      style={{
                        fontWeight: 900,
                        color: isEnUygunKalem ? "#166534" : "#111827",
                      }}
                    >
                      KDV Dahil: {formatCurrency(toplamTutarKdvDahil)}{" "}
                      {paraBirimi}
                    </span>

                    {isEnUygunKalem && (
                      <span
                        style={{
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          borderRadius: 999,
                          padding: "0.2rem 0.55rem",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        UYGUN
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "0.9rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "#f8fafc",
        }}
      >
        <label
          className="text-center"
          style={{
            display: "block",
            fontWeight: 900,
            marginBottom: "0.35rem",
            color: "#0f172a",
          }}
        >
          Tedarikçi Adı / Firma Adı{" "}
          <span style={{ color: "#b91c1c" }}>*</span>
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
            padding: "0.6rem 0.7rem",
            fontSize: 14,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            color: "#0f172a",
            textTransform: "uppercase",
          }}
        />
      </div>

      <div style={{ marginTop: 6, marginBottom: 25 }}>
        <div
          className="text-center"
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 10,
          }}
        >
          MALZEMELER
        </div>

        {malzemeler.length === 0 ? (
          <div style={{ fontSize: 14 }}>Bu satın almada henüz malzeme yok.</div>
        ) : (
          <div style={{ display: "grid", gap: 30 }}>
            {malzemeler.map((m) => {
              const id = m.id ?? m.Id;

              const formRow = teklifForm[id] || {
                birimFiyat: "",
                paraBirimi: "TRY",
                kdvOraniYuzde: "20",
                not: "",
              };

              return (
                <UrunCard
                  key={id}
                  urun={m}
                  formRow={formRow}
                  onChange={handleInputChange}
                />
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
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
              padding: "0.55rem 1rem",
              borderRadius: 10,
              border: "1px solid #16a34a",
              backgroundColor: netTotal > 0 ? "#16a34a" : "#9ca3af",
              color: "#ffffff",
              cursor: netTotal > 0 ? "pointer" : "default",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {showTotals
              ? "Toplamı Gizle (KDV Dahil)"
              : "Toplamı Göster (KDV Dahil)"}
          </button>

          {netTotal <= 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
              Toplamı görebilmek için en az bir ürün için geçerli birim fiyat
              giriniz.
            </div>
          )}
        </div>

        {showTotals && netTotal > 0 && (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "0.85rem 1rem",
              backgroundColor: "#f8fafc",
              minWidth: 280,
              fontSize: 13,
              color: "#0f172a",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                marginBottom: 8,
                color: "#0f172a",
              }}
            >
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
                marginTop: 8,
                fontWeight: 900,
              }}
            >
              <span>Genel Toplam (KDV Dahil):</span>
              <span>{formatCurrency(genelToplam)}</span>
            </div>
          </div>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleSubmit}
            disabled={sending}
            style={{
              padding: "0.7rem 1.4rem",
              borderRadius: 12,
              border: "none",
              backgroundColor: sending ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              cursor: sending ? "default" : "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            {sending ? "Gönderiliyor..." : "Teklifi Gönder"}
          </button>
        </div>
      </div>

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
              borderRadius: 12,
              padding: "1.5rem",
              maxWidth: 420,
              width: "92%",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            <h2
              style={{
                marginBottom: "0.5rem",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              Teşekkürler
            </h2>
            <p
              style={{
                marginTop: 0,
                marginBottom: "1rem",
                color: "#111827",
              }}
            >
              Teklifiniz başarıyla gönderildi.
            </p>
            <button
              onClick={handleCloseModal}
              style={{
                padding: "0.6rem 1.3rem",
                borderRadius: 12,
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 900,
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