




// src/pages/satinalma/teklifler/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

import SatinalmaShareLinkBar from "@/components/SatinalmaShareLinkBar";
import SatinalmaHeaderCard from "@/components/SatinalmaHeaderCard";
import SatinalmaOnaylayanPersoneller from "@/components/SatinalmaOnaylayanPersoneller";
import SatinalmaOnayPanel from "@/components/SatinalmaOnayPanel";
import SatinalmaTedarikciOzet from "@/components/SatinalmaTedarikciOzet";
import SatinalmaMalzemeTeklifList from "@/components/SatinalmaMalzemeTeklifList";

// const BASE_URL = "http://localhost:3000";
const BASE_URL = "http://teknik-otomasyon.vercel.app";

// ✅ Not_1 normalize helper
function normalizeNot1(val) {
  if (val == null) return "";
  return String(val)
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " "); // çoklu boşlukları tek boşluk yap
}

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

  // Satın alındı / alınmadı state
  const [durumLoading, setDurumLoading] = useState(false);
  const [durumError, setDurumError] = useState(null);
  const [durumSuccess, setDurumSuccess] = useState(null);

  // ✅ UI için local durum
  const [localNot1, setLocalNot1] = useState("");

  // Personel cookie'sini oku
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

  // Detay verisini yükle
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ data geldikçe local Not_1'i senkronla
  useEffect(() => {
    if (!data) return;
    const not1FromApi = data.not_1 ?? data.Not_1 ?? "";
    setLocalNot1(not1FromApi || "");
  }, [data]);

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

  const onaylayanPersoneller =
    data.onaylayanPersoneller ?? data.OnaylayanPersoneller ?? [];

  const publicToken = data.publicToken ?? data.PublicToken;
  const sistemUretilmisLink =
    data.sistemUretilmisLink ??
    data.SistemUretilmisLink ??
    (publicToken ? `/satinalma/fiyatlandir/${publicToken}` : null);

  const shareUrl = sistemUretilmisLink ? `${BASE_URL}${sistemUretilmisLink}` : "";

  // ✅ Not_1'e göre DURUM tespiti (asıl fix burada)
  const not1Norm = normalizeNot1(localNot1);

  // “satın alındı” kelimesini içeriyorsa ALINDI say (case/space sorunlarını tolere eder)
  const isAlindi = not1Norm.includes("satın alındı") || not1Norm.includes("satin alindi");

  // “satın alınmadı” kelimesini içeriyorsa ALINMADI say
  const isAlinmadi =
    not1Norm.includes("satın alınmadı") ||
    not1Norm.includes("satin alinmadi") ||
    not1Norm.includes("satın alinmadi");

  // Öncelik: ALINDI > ALINMADI > BOS
  const satinAlimStatus = isAlindi ? "ALINDI" : isAlinmadi ? "ALINMADI" : "BOS";

  // Rol kontrol (sadece Rol 35)
  const currentRolRaw = personel ? personel.rol ?? personel.Rol : null;
  const currentRol = currentRolRaw != null ? Number(currentRolRaw) : null;
  const satinAlindiYetkiliMi = currentRol === 35;

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

  const currentPersonelId = personel ? personel.id ?? personel.Id : null;

  const benimOnayKaydim = onaylayanPersoneller
    ? onaylayanPersoneller.find((o) => {
        const pid =
          o.personelId ?? o.PersonelId ?? o.personel?.id ?? o.Personel?.Id;
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

  // Tedarikçi bazlı özet (Net, KDV, KDV dahil)
  const toplamMalzemeSayisi = malzemeler.length;
  const tedarikciOzetMap = {};

  fiyatTeklifleri.forEach((t) => {
    const name =
      t.tedarikciAdi ?? t.TedarikciAdi ?? "Tedarikçi (isim belirtilmemiş)";

    const mid = t.satinAlmaMalzemeId ?? t.SatinAlmaMalzemeId;
    const malzeme = malzemeMap[mid];

    const adetNum = malzeme ? Number(malzeme.adet ?? malzeme.Adet) || 0 : 0;
    const bfNum = Number(t.birimFiyat ?? t.BirimFiyat) || 0;

    const toplamTutarDto = t.toplamTutar ?? t.ToplamTutar;
    const satirNet =
      toplamTutarDto != null ? Number(toplamTutarDto) || 0 : adetNum * bfNum;

    const paraBirimi = t.paraBirimi ?? t.ParaBirimi ?? "TRY";

    const kdvOraniRaw = t.kdvOrani ?? t.KdvOrani ?? null;
    let kdvOrani = 0;
    if (kdvOraniRaw != null) {
      const num = Number(kdvOraniRaw);
      if (!isNaN(num) && num > 0) kdvOrani = num;
    }

    const satirKdv = satirNet * kdvOrani;

    if (!tedarikciOzetMap[name]) {
      tedarikciOzetMap[name] = {
        materialIds: new Set(),
        totalNet: 0,
        totalKdv: 0,
        currencies: new Set(),
      };
    }

    const ozet = tedarikciOzetMap[name];
    ozet.materialIds.add(mid);
    ozet.totalNet += satirNet;
    ozet.totalKdv += satirKdv;
    ozet.currencies.add(paraBirimi);
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
      currArr.length === 1 ? currArr[0] : `Çoklu (${currArr.join(", ")})`;

    const totalNet = ozet.totalNet;
    const totalKdv = ozet.totalKdv;
    const totalBrut = totalNet + totalKdv;

    return {
      name,
      totalNet,
      totalKdv,
      totalBrut,
      teklifVerilenMalzemeSayisi,
      kapsamaText,
      paraBirimiText,
    };
  });

  // Onay / Red işlemi
  const handleOnayIslem = async (onaylandiMi) => {
    if (!id || !currentPersonelId) return;

    setOnayLoading(true);
    setOnayError(null);
    setOnaySuccess(null);

    try {
      const res = await postDataAsync(`satinalma/onay`, {
        satinAlmaId: Number(id),
        personelId: currentPersonelId,
        onaylandiMi,
        not: onayNot || null,
      });

      const apiMessage =
        res?.Message ??
        (onaylandiMi
          ? "Onayınız kaydedildi / güncellendi."
          : "Red işleminiz kaydedildi / güncellendi.");

      setOnaySuccess(apiMessage);
      setOnayNot("");

      await fetchData(id);
      await router.replace(router.asPath);
    } catch (err) {
      console.error("ONAY POST ERROR:", err);
      setOnayError("Onay işlemi sırasında bir hata oluştu.");
    } finally {
      setOnayLoading(false);
    }
  };

  // ✅ Çift taraflı güncelleme (ALINDI / ALINMADI)
  const handleDurumDegistir = async (targetDurum) => {
    if (!id) return;

    if (!satinAlindiYetkiliMi) {
      setDurumError("Bu işlem için yetkiniz yok. (Sadece Rol 35)");
      return;
    }

    setDurumLoading(true);
    setDurumError(null);
    setDurumSuccess(null);

    const prevNot1 = localNot1;

    try {
      if (targetDurum === "SATIN_ALINDI") {
        // ✅ Not_1 açıkça satın alındı yazsın
        setLocalNot1("Satın alındı");

        const res = await postDataAsync(`satinalma/isaret/satin-alindi/${id}`, {
          not1: "Satın alındı",
        });

        setDurumSuccess(res?.Message ?? "Satın alındı olarak işaretlendi.");
      } else {
        // ✅ Not_1 açıkça satın alınmadı yazsın (backend boşaltmıyorsa bile UI doğru anlayacak)
        setLocalNot1("Satın alınmadı");

        const res = await postDataAsync(
          `satinalma/isaret/satin-alinmadi/${id}`,
          { not1: "Satın alınmadı" } // backend body istemese bile sorun olmaz; yok sayar
        );

        setDurumSuccess(res?.Message ?? "Satın alınmadı olarak işaretlendi.");
      }

      await fetchData(id);
      await router.replace(router.asPath);
    } catch (err) {
      console.error("DURUM POST ERROR:", err);
      setLocalNot1(prevNot1);
      setDurumError("Durum güncelleme sırasında hata oluştu.");
    } finally {
      setDurumLoading(false);
    }
  };

  const canSetAlindi = satinAlimStatus !== "ALINDI";
  const canSetAlinmadi = satinAlimStatus !== "ALINMADI";

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
      {/* ÜST BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            backgroundColor: "#f8fafc",
            fontSize: 12,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Sıra No: <span style={{ fontWeight: 900 }}>{id}</span>
        </div>

        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#000" }}>
          Satın Alma Teklifleri --Tedarikçi Paylaşım Linki --
        </h1>
      </div>

      <SatinalmaShareLinkBar
        shareUrl={shareUrl}
        copied={copied}
        onCopy={copyLink}
      />

      {/* ÜST GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1.3fr)",
          gap: "0.75rem",
          alignItems: "flex-start",
          marginTop: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <SatinalmaHeaderCard
            seriNo={seriNo}
            tarih={tarih}
            talepCinsi={talepCinsi}
            talepEden={talepEden}
            aciklama={aciklama}
          />

          <SatinalmaOnayPanel
            currentPersonelId={currentPersonelId}
            benimOnayKaydim={benimOnayKaydim}
            benimBeklemedeMi={benimBeklemedeMi}
            benimDurumAd={benimDurumAd}
            onayNot={onayNot}
            setOnayNot={setOnayNot}
            onayError={onayError}
            onaySuccess={onaySuccess}
            onayLoading={onayLoading}
            handleOnayIslem={handleOnayIslem}
          />
        </div>

        <SatinalmaOnaylayanPersoneller
          onaylayanPersoneller={onaylayanPersoneller}
        />
      </div>

      {/* DURUM SEÇENEKLERİ */}
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
              Satın Alım Durumu:
            </span>

            {satinAlimStatus === "ALINDI" ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: "1px solid #86efac",
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                }}
                title={localNot1}
              >
                ✅ Satın Alındı
              </span>
            ) : satinAlimStatus === "ALINMADI" ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: "1px solid #fed7aa",
                  backgroundColor: "#fff7ed",
                  color: "#9a3412",
                }}
                title={localNot1}
              >
                🚫 Satın Alınmadı
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
              >
                ⏳ İşaretlenmedi
              </span>
            )}
          </div>

          {satinAlindiYetkiliMi ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => handleDurumDegistir("SATIN_ALINDI")}
                disabled={durumLoading || !canSetAlindi}
                style={{
                  cursor: durumLoading || !canSetAlindi ? "not-allowed" : "pointer",
                  opacity: durumLoading || !canSetAlindi ? 0.6 : 1,
                  border: "1px solid #16a34a",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Satın Alındı
              </button>

              <button
                type="button"
                onClick={() => handleDurumDegistir("SATIN_ALINMADI")}
                disabled={durumLoading || !canSetAlinmadi}
                style={{
                  cursor: durumLoading || !canSetAlinmadi ? "not-allowed" : "pointer",
                  opacity: durumLoading || !canSetAlinmadi ? 0.6 : 1,
                  border: "1px solid #334155",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Satın Alınmadı
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
              .
            </div>
          )}
        </div>

        {(durumError || durumSuccess) && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 8,
              border: durumError ? "1px solid #fecaca" : "1px solid #bbf7d0",
              backgroundColor: durumError ? "#fef2f2" : "#ecfdf5",
              color: durumError ? "#b91c1c" : "#065f46",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {durumError || durumSuccess}
          </div>
        )}
      </div>

      <SatinalmaTedarikciOzet tedarikciOzetList={tedarikciOzetList} />

      <SatinalmaMalzemeTeklifList
        malzemeler={malzemeler}
        tekliflerByMalzeme={tekliflerByMalzeme}
      />
    </div>
  );
}
