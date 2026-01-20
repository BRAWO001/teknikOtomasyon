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
      [malzemeId]: {
        ...prev[malzemeId],
        [field]: value,
      },
    }));
  };

  // Toplamlar (kartlarda girilen değerlere göre)
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
      {/* Profesyonel giriş metni */}
      <div
        style={{
          marginBottom: "0.75rem",
          padding: "0.85rem 1rem",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>
          EOS MANAGEMENT
        </div>
        <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.5 }}>
          EOS MANAGEMENT, aşağıda listelenen ürünler için sizden fiyat teklifi talep etmektedir.
          Lütfen birim fiyatlarınızı, para birimini ve KDV oranını eksiksiz doldurarak teklifinizi gönderiniz.
        </div>
      </div>

      <h1 style={{ marginBottom: "0.75rem", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
        Satın Alma Fiyatlandırma
      </h1>

      {/* Üst bilgi kartı */}
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
          <div><strong>Seri No:</strong> {seriNo}</div>
          <div><strong>Tarih:</strong> {tarih ? new Date(tarih).toLocaleString("tr-TR") : "-"}</div>
          <div><strong>Talep Cinsi:</strong> {talepCinsi}</div>
          <div><strong>Açıklama:</strong> {aciklama || "-"}</div>
        </div>
      </div>

      {/* Tedarikçi adı */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "0.9rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "#ffffff",
        }}
      >
        <label style={{ display: "block", fontWeight: 900, marginBottom: "0.35rem", color: "#0f172a" }}>
          Tedarikçi Adı / Firma Adı <span style={{ color: "#b91c1c" }}>*</span>
        </label>

        <input
          type="text"
          value={globalTedarikciAdi}
          onChange={(e) => setGlobalTedarikciAdi(e.target.value.toUpperCase("tr-TR"))}
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

        <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
          Girilen firma adı otomatik olarak BÜYÜK harfe çevrilir ve tüm malzemeler için aynı tedarikçi adı ile kayıt edilir.
        </div>
      </div>

      {/* Ürün kartları */}
      <div style={{ marginTop: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>
          Malzemeler
        </div>

        {malzemeler.length === 0 ? (
          <div style={{ fontSize: 14 }}>Bu satın almada henüz malzeme yok.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
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

      {/* Toplam + Gönder */}
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
            {showTotals ? "Toplamı Gizle (KDV Dahil)" : "Toplamı Göster (KDV Dahil)"}
          </button>

          {netTotal <= 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
              Toplamı görebilmek için en az bir ürün için geçerli birim fiyat giriniz.
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
            <div style={{ fontWeight: 900, marginBottom: 8, color: "#0f172a" }}>
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
            <h2 style={{ marginBottom: "0.5rem", fontSize: 18, fontWeight: 900 }}>
              Teşekkürler
            </h2>
            <p style={{ marginTop: 0, marginBottom: "1rem", color: "#111827" }}>
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
