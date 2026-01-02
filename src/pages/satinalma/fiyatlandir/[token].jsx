// src/pages/satinalma/fiyatlandir/[token].jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

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

    if (!globalTedarikciAdi.trim()) {
      alert("Lütfen tedarikçi / firma adını giriniz.");
      return;
    }

    const payload = [];

    for (const m of malzemeler) {
      const malzemeId = m.id ?? m.Id;
      const formRow = teklifForm[malzemeId];
      if (!formRow) continue;

      const birimFiyatNum = parseFloat(
        (formRow.birimFiyat || "").toString().replace(",", ".")
      );

      if (isNaN(birimFiyatNum) || birimFiyatNum <= 0) continue;

      payload.push({
        satinAlmaMalzemeId: malzemeId,
        tedarikciAdi: globalTedarikciAdi.trim(),
        birimFiyat: birimFiyatNum,
        paraBirimi: formRow.paraBirimi || "TRY",
        not: formRow.not || null,
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
      }}
    >
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

      {/* Tedarikçi adı – tüm satırlar için ortak */}
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
          Tedarikçi Adı / Firma Adı
        </label>
        <input
          type="text"
          value={globalTedarikciAdi}
          onChange={(e) => setGlobalTedarikciAdi(e.target.value)}
          placeholder="Örn: ABC Elektrik A.Ş."
          style={{
            width: "100%",
            padding: "0.45rem 0.5rem",
            fontSize: 14,
            borderRadius: 4,
            border: "1px solid #9ca3af",
            color: "#000",
          }}
        />
        <p
          style={{
            marginTop: "0.3rem",
            fontSize: 12,
            color: "#4b5563",
          }}
        >
          Bu isim, aşağıdaki tüm ürünler için gönderilen tekliflerde
          kullanılacaktır.
        </p>
      </div>

      <h2
        style={{
          marginBottom: "0.5rem",
          fontSize: 16,
          fontWeight: 600,
          color: "#000",
        }}
      >
        Malzemeler
      </h2>

      {malzemeler.length === 0 ? (
        <div style={{ fontSize: 14 }}>Bu satın almada henüz malzeme yok.</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "0.25rem",
                fontSize: 13,
                color: "#000",
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
                    }}
                  >
                    Birim
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "left",
                      padding: "0.4rem",
                      minWidth: 120,
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
                    }}
                  >
                    Örnek Ürün Linki
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "right",
                      padding: "0.4rem",
                      whiteSpace: "nowrap",
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
                    }}
                  >
                    Para Birimi
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "left",
                      padding: "0.4rem",
                      minWidth: 120,
                    }}
                  >
                    Not
                  </th>
                </tr>
              </thead>
              <tbody>
                {malzemeler.map((m) => {
                  const id = m.id ?? m.Id;
                  const malzemeAdi = m.malzemeAdi ?? m.MalzemeAdi;
                  const marka = m.marka ?? m.Marka ?? "-";
                  const adet = m.adet ?? m.Adet;
                  const birim = m.birim ?? m.Birim ?? "-";
                  const kullanimAmaci =
                    m.kullanimAmaci ?? m.KullanimAmaci ?? "-";
                  const ornekLink = m.ornekUrunLinki ?? m.OrnekUrunLinki;

                  const formRow = teklifForm[id] || {
                    birimFiyat: "",
                    paraBirimi: "TRY",
                    not: "",
                  };

                  return (
                    <tr key={id}>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {malzemeAdi}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {marka}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                          textAlign: "right",
                        }}
                      >
                        {adet}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {birim}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {kullanimAmaci}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
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

                      {/* Birim Fiyat */}
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
                            handleInputChange(id, "birimFiyat", e.target.value)
                          }
                          placeholder="0,00"
                          style={{
                            width: "100%",
                            textAlign: "right",
                            fontSize: 13,
                            padding: "0.25rem",
                            borderRadius: 4,
                            border: "1px solid #9ca3af",
                            color: "#000",
                          }}
                        />
                      </td>

                      {/* Para Birimi */}
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        <select
                          value={formRow.paraBirimi}
                          onChange={(e) =>
                            handleInputChange(id, "paraBirimi", e.target.value)
                          }
                          style={{
                            fontSize: 13,
                            padding: "0.2rem 0.35rem",
                            borderRadius: 4,
                            border: "1px solid #9ca3af",
                            color: "#000",
                          }}
                        >
                          <option value="TRY">TRY</option>
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                        </select>
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
                          onChange={(e) =>
                            handleInputChange(id, "not", e.target.value)
                          }
                          placeholder="İsteğe bağlı not"
                          style={{
                            width: "100%",
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

          {/* Gönder butonu */}
          <div
            style={{
              marginTop: "0.9rem",
              textAlign: "right",
            }}
          >
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
            <h2
              style={{
                marginBottom: "0.5rem",
                fontSize: 18,
                fontWeight: 600,
                color: "#000",
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
