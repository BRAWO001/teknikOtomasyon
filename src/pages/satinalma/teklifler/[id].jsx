// src/pages/satinalma/teklifler/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

// const BASE_URL = "http://localhost:3000";
const BASE_URL = "http://teknik-otomasyon.vercel.app";

// API BASE (POST için) – gerekirse değiştir
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pilotapisrc.com/api/";

export default function SatinAlmaTekliflerPage() {
  const router = useRouter();
  const rawId = router.query.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  const [data, setData] = useState(null);
  const [personel, setPersonel] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Onay işlemi state
  const [onayLoading, setOnayLoading] = useState(false);
  const [onayError, setOnayError] = useState(null);
  const [onaySuccess, setOnaySuccess] = useState(null);
  const [onayNot, setOnayNot] = useState("");

  // ------------------------------------------------------
  // Personel cookie'sini oku
  // ------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;

      const parsed = JSON.parse(cookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  // ------------------------------------------------------
  // Detay verisini yükle
  // ------------------------------------------------------
  const fetchData = async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await getDataAsync(`satinalma/${targetId}`);
      setData(res);
    } catch (err) {
      console.error("API ERROR:", err);
      setError("Kayıt bulunamadı veya bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  // Malzeme map (Id -> malzeme)
  const malzemeMap = useMemo(() => {
    if (!data) return {};
    const malzemeler =
      data.malzemeler ?? data.Malzeme ?? data.Malzemeler ?? [];
    const map = {};
    malzemeler.forEach((m) => {
      const mid = m.id ?? m.Id;
      map[mid] = m;
    });
    return map;
  }, [data]);

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
  const talepEden = data.talepEden ?? data.TalepEden;
  const malzemeler =
    data.malzemeler ?? data.Malzeme ?? data.Malzemeler ?? [];
  const fiyatTeklifleri =
    data.fiyatTeklifleri ?? data.FiyatTeklifleri ?? [];

  // 🔔 Onaylayan personeller
  const onaylayanPersoneller =
    data.onaylayanPersoneller ?? data.OnaylayanPersoneller ?? [];

  // 🔑 Public token & sistem üretilmiş link
  const publicToken = data.publicToken ?? data.PublicToken;
  const sistemUretilmisLink =
    data.sistemUretilmisLink ??
    data.SistemUretilmisLink ??
    (publicToken ? `/satinalma/fiyatlandir/${publicToken}` : null);

  const shareUrl = sistemUretilmisLink ? `${BASE_URL}${sistemUretilmisLink}` : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Kopyalama hatası:", err);
    }
  };

  // Şu anki personel bilgisi
  const currentPersonelId = personel
    ? personel.id ?? personel.Id
    : null;

  const benimOnayKaydim = onaylayanPersoneller
    ? onaylayanPersoneller.find((o) => {
        const pid =
          o.personelId ??
          o.PersonelId ??
          o.personel?.id ??
          o.Personel?.Id;
        return pid === currentPersonelId;
      })
    : null;

  const benimDurumKod =
    benimOnayKaydim?.durumKod ?? benimOnayKaydim?.DurumKod ?? null;
  const benimDurumAd =
    benimOnayKaydim?.durumAd ?? benimOnayKaydim?.DurumAd ?? null;

  const benimBeklemedeMi =
    currentPersonelId && (benimDurumKod === 0 || benimDurumKod == null);

  // MalzemeId -> teklifler listesi
  const tekliflerByMalzeme = {};
  fiyatTeklifleri.forEach((t) => {
    const mid = t.satinAlmaMalzemeId ?? t.SatinAlmaMalzemeId;
    if (!tekliflerByMalzeme[mid]) tekliflerByMalzeme[mid] = [];
    tekliflerByMalzeme[mid].push(t);
  });

  // ===============================
  // Tedarikçi bazlı özet
  // ===============================
  const toplamMalzemeSayisi = malzemeler.length;
  const tedarikciOzetMap = {};

  fiyatTeklifleri.forEach((t) => {
    const name =
      t.tedarikciAdi ??
      t.TedarikciAdi ??
      "Tedarikçi (isim belirtilmemiş)";

    const mid = t.satinAlmaMalzemeId ?? t.SatinAlmaMalzemeId;
    const malzeme = malzemeMap[mid];

    const adetNum = malzeme
      ? Number(malzeme.adet ?? malzeme.Adet) || 0
      : 0;
    const bfNum = Number(t.birimFiyat ?? t.BirimFiyat) || 0;
    const toplamTutarDto = t.toplamTutar ?? t.ToplamTutar;
    const satirToplam =
      toplamTutarDto != null ? Number(toplamTutarDto) || 0 : adetNum * bfNum;

    const paraBirimi = t.paraBirimi ?? t.ParaBirimi ?? "TRY";

    if (!tedarikciOzetMap[name]) {
      tedarikciOzetMap[name] = {
        materialIds: new Set(),
        total: 0,
        currencies: new Set(),
      };
    }

    tedarikciOzetMap[name].materialIds.add(mid);
    tedarikciOzetMap[name].total += satirToplam;
    tedarikciOzetMap[name].currencies.add(paraBirimi);
  });

  const tedarikciOzetList = Object.keys(tedarikciOzetMap).map((name) => {
    const ozet = tedarikciOzetMap[name];
    const teklifVerilenMalzemeSayisi = ozet.materialIds.size;
    const eksik = toplamMalzemeSayisi - teklifVerilenMalzemeSayisi;

    let kapsamaText = "";
    if (toplamMalzemeSayisi === 0) {
      kapsamaText = "Bu satın almada malzeme bulunmuyor.";
    } else if (eksik <= 0) {
      kapsamaText = `Tüm ${toplamMalzemeSayisi} malzeme için teklif vermiştir.`;
    } else {
      kapsamaText = `${toplamMalzemeSayisi} malzemeden ${teklifVerilenMalzemeSayisi} tanesi için teklif vermiştir. (Eksik: ${eksik} kalem)`;
    }

    const currArr = Array.from(ozet.currencies);
    const paraBirimiText =
      currArr.length === 1
        ? currArr[0]
        : `Çoklu (${currArr.join(", ")})`;

    return {
      name,
      total: ozet.total,
      teklifVerilenMalzemeSayisi,
      kapsamaText,
      paraBirimiText,
    };
  });

  tedarikciOzetList.sort((a, b) =>
    a.name.localeCompare(b.name, "tr-TR")
  );

  // ------------------------------------------------------
  // Onay / Red işlemi
  // ------------------------------------------------------
  const handleOnayIslem = async (onaylandiMi) => {
    if (!id || !currentPersonelId) return;

    setOnayLoading(true);
    setOnayError(null);
    setOnaySuccess(null);

    try {
      await axios.post(`${API_BASE_URL}satinalma/onay`, {
        satinAlmaId: Number(id),
        personelId: currentPersonelId,
        onaylandiMi,
        not: onayNot || null,
      });

      setOnaySuccess(
        onaylandiMi ? "Onayınız kaydedildi." : "Red işleminiz kaydedildi."
      );
      setOnayNot("");

      // Güncel durumu tekrar çek
      await fetchData(id);
    } catch (err) {
      console.error("ONAY POST ERROR:", err);
      setOnayError("Onay işlemi sırasında bir hata oluştu.");
    } finally {
      setOnayLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "1rem 1.25rem",
        fontSize: 14,
        color: "#000",
        backgroundColor: "#fff",
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
        Satın Alma Teklifleri
      </h1>

      {/* 🔗 Sistem üretilmiş link (kopyalanabilir) */}
      {sistemUretilmisLink && (
        <div
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: 12,
              color: "#4b5563",
              fontWeight: 500,
              marginRight: 4,
              minWidth: 130,
            }}
          >
            Tedarikçi Paylaşım Linki:
          </label>
          <input
            value={shareUrl}
            readOnly
            style={{
              flexGrow: 1,
              minWidth: 250,
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 12,
              backgroundColor: "#f9fafb",
            }}
          />
          <button
            type="button"
            onClick={copyLink}
            style={{
              padding: "5px 10px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid #2563eb",
              backgroundColor: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "Kopyalandı ✓" : "Linki Kopyala"}
          </button>
        </div>
      )}

      {/* Üst bilgi kartı */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "0.75rem 1rem",
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
        <p style={{ margin: "0 0 0.25rem 0" }}>
          <strong>Talep Eden:</strong>{" "}
          {talepEden
            ? `${talepEden.ad ?? talepEden.Ad} ${
                talepEden.soyad ?? talepEden.Soyad ?? ""
              }`
            : "-"}
        </p>
        <p style={{ margin: 0 }}>
          <strong>Açıklama:</strong> {aciklama || "-"}
        </p>
      </div>

      {/* ==========================
          Onaylayan Personeller
          ========================== */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: 16,
            fontWeight: 600,
            color: "#000",
          }}
        >
          Onaylayan / Onaylayacak Personeller
        </h2>

        {onaylayanPersoneller.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
            Bu satın alma için kayıtlı onaylayıcı personel bulunmuyor.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                color: "#000",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "left",
                      padding: "0.35rem",
                    }}
                  >
                    Sıra
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "left",
                      padding: "0.35rem",
                    }}
                  >
                    Personel
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "left",
                      padding: "0.35rem",
                    }}
                  >
                    Durum
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "left",
                      padding: "0.35rem",
                    }}
                  >
                    Tarih
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #9ca3af",
                      textAlign: "left",
                      padding: "0.35rem",
                    }}
                  >
                    Not
                  </th>
                </tr>
              </thead>
              <tbody>
                {onaylayanPersoneller.map((o) => {
                  const oid = o.id ?? o.Id;
                  const sira = o.sira ?? o.Sira;
                  const durumAd = o.durumAd ?? o.DurumAd ?? "";
                  const durumKod = o.durumKod ?? o.DurumKod ?? null;
                  const tarihUtc = o.onayTarihiUtc ?? o.OnayTarihiUtc;
                  const not = o.not ?? o.Not ?? "";

                  const p = o.personel ?? o.Personel ?? {};
                  const adSoyad = `${p.ad ?? p.Ad ?? ""} ${
                    p.soyad ?? p.Soyad ?? ""
                  }`.trim();

                  let rowBg = "#ffffff";
                  if (durumKod === 1) rowBg = "#ecfdf3"; // onay
                  else if (durumKod === 2) rowBg = "#fef2f2"; // red

                  return (
                    <tr key={oid} style={{ backgroundColor: rowBg }}>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {sira}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {adSoyad || "-"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {durumAd}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {tarihUtc
                          ? new Date(tarihUtc).toLocaleString("tr-TR")
                          : "-"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          padding: "0.35rem",
                        }}
                      >
                        {not || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================
          Sizin Onay Bölümünüz
          ========================== */}
      {currentPersonelId && (
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
              Bu talep için sizin adınıza tanımlı bir onay kaydı bulunmuyor.
            </p>
          )}

          {benimOnayKaydim && !benimBeklemedeMi && (
            <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
              Bu talep için onay kaydınız işlenmiş durumda:{" "}
              <strong>{benimDurumAd}</strong>.
            </p>
          )}

          {benimOnayKaydim && benimBeklemedeMi && (
            <>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: 13, color: "#4b5563" }}>
                Bu talep için sizin onayınız bekleniyor. Aşağıdan{" "}
                <strong>Onayla</strong> veya <strong>Reddet</strong>{" "}
                seçebilirsiniz.
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
      )}

      {/* ==========================
          Tedarikçi Bazlı Özet
          ========================== */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: 16,
            fontWeight: 600,
            color: "#000",
          }}
        >
          Tedarikçi Bazlı Özet
        </h2>

        {tedarikciOzetList.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
            Henüz herhangi bir tedarikçi teklif girmemiş.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {tedarikciOzetList.map((t) => (
              <div
                key={t.name}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 2,
                        color: "#111827",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}
                    >
                      {t.kapsamaText}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13 }}>
                    <div style={{ color: "#111827" }}>
                      <strong>Toplam Tutar:</strong>{" "}
                      {t.total.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#4b5563",
                        marginTop: 2,
                      }}
                    >
                      Para Birimi: {t.paraBirimiText}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================
          Malzeme Bazlı Detay
          ========================== */}
      <h2
        style={{
          marginBottom: "0.5rem",
          fontSize: 16,
          fontWeight: 600,
          color: "#000",
        }}
      >
        Malzemeler & Teklif Detayları
      </h2>

      {malzemeler.length === 0 ? (
        <div style={{ fontSize: 14 }}>
          Bu satın almada malzeme bulunmuyor.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {malzemeler.map((m) => {
            const mid = m.id ?? m.Id;
            const malzemeAdi = m.malzemeAdi ?? m.MalzemeAdi;
            const marka = m.marka ?? m.Marka ?? "-";
            const adet = m.adet ?? m.Adet;
            const birim = m.birim ?? m.Birim ?? "-";
            const kullanimAmaci =
              m.kullanimAmaci ?? m.KullanimAmaci ?? "-";

            const offers = tekliflerByMalzeme[mid] || [];

            return (
              <div
                key={mid}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "0.75rem 1rem",
                  backgroundColor: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: "0.5rem",
                    flexWrap: "wrap",
                    color: "#000",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 2,
                        color: "#111827",
                      }}
                    >
                      {malzemeAdi}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Marka: {marka}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    <div>
                      Adet:{" "}
                      <strong>
                        {adet} {birim}
                      </strong>
                    </div>
                    <div>Kullanım Amacı: {kullanimAmaci}</div>
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: 14,
                    margin: "0.25rem 0 0.5rem 0",
                    fontWeight: 600,
                    color: "#000",
                  }}
                >
                  Fiyat Teklifleri
                </h3>

                {offers.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Bu malzeme için henüz fiyat teklifi girilmemiş.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 12,
                        color: "#000",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "#f3f4f6" }}>
                          <th
                            style={{
                              borderBottom: "1px solid #9ca3af",
                              textAlign: "left",
                              padding: "0.35rem",
                            }}
                          >
                            Tedarikçi
                          </th>
                          <th
                            style={{
                              borderBottom: "1px solid #9ca3af",
                              textAlign: "right",
                              padding: "0.35rem",
                            }}
                          >
                            Birim Fiyat
                          </th>
                          <th
                            style={{
                              borderBottom: "1px solid #9ca3af",
                              textAlign: "left",
                              padding: "0.35rem",
                            }}
                          >
                            Para Birimi
                          </th>
                          <th
                            style={{
                              borderBottom: "1px solid #9ca3af",
                              textAlign: "right",
                              padding: "0.35rem",
                            }}
                          >
                            Toplam Tutar
                          </th>
                          <th
                            style={{
                              borderBottom: "1px solid #9ca3af",
                              textAlign: "left",
                              padding: "0.35rem",
                            }}
                          >
                            Tarih
                          </th>
                          <th
                            style={{
                              borderBottom: "1px solid #9ca3af",
                              textAlign: "left",
                              padding: "0.35rem",
                            }}
                          >
                            Not
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {offers.map((t) => {
                          const tid = t.id ?? t.Id;
                          const tedarikciAdi =
                            t.tedarikciAdi ?? t.TedarikciAdi;
                          const birimFiyat = t.birimFiyat ?? t.BirimFiyat;
                          const paraBirimi =
                            t.paraBirimi ?? t.ParaBirimi ?? "TRY";
                          const teklifTarihi =
                            t.teklifTarihiUtc ?? t.TeklifTarihiUtc;
                          const not = t.not ?? t.Not;

                          const adetNum = Number(adet) || 0;
                          const bfNum = Number(birimFiyat) || 0;
                          const toplamTutarDto =
                            t.toplamTutar ?? t.ToplamTutar;
                          const toplam =
                            toplamTutarDto != null
                              ? Number(toplamTutarDto)
                              : adetNum * bfNum;

                          return (
                            <tr key={tid}>
                              <td
                                style={{
                                  borderBottom: "1px solid #e5e7eb",
                                  padding: "0.35rem",
                                }}
                              >
                                {tedarikciAdi}
                              </td>
                              <td
                                style={{
                                  borderBottom: "1px solid #e5e7eb",
                                  padding: "0.35rem",
                                  textAlign: "right",
                                }}
                              >
                                {bfNum.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td
                                style={{
                                  borderBottom: "1px solid #e5e7eb",
                                  padding: "0.35rem",
                                }}
                              >
                                {paraBirimi}
                              </td>
                              <td
                                style={{
                                  borderBottom: "1px solid #e5e7eb",
                                  padding: "0.35rem",
                                  textAlign: "right",
                                }}
                              >
                                {toplam.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td
                                style={{
                                  borderBottom: "1px solid #e5e7eb",
                                  padding: "0.35rem",
                                }}
                              >
                                {teklifTarihi
                                  ? new Date(
                                      teklifTarihi
                                    ).toLocaleString("tr-TR")
                                  : "-"}
                              </td>
                              <td
                                style={{
                                  borderBottom: "1px solid #e5e7eb",
                                  padding: "0.35rem",
                                }}
                              >
                                {not || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
