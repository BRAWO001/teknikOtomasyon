




// ✅ src/pages/satinalma/teklifler/[id].jsx
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

// ✅ yeni componentler
import SatinalmaFaturaPdfDurumCard from "@/components/satinalma/SatinalmaFaturaPdfDurumCard";
import SatinalmaDurumCard from "@/components/satinalma/SatinalmaDurumCard";
import SatinalmaSurecDurumCard from "@/components/satinalma/SatinalmaSurecDurumCard";

// const BASE_URL = "http://localhost:3000";
const BASE_URL = "http://teknik-otomasyon.vercel.app";

// ✅ güvenli url mi? (share link için)
function isValidHttpUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
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

  // ✅ UI için local Not_1 & Not_5
  const [localNot1, setLocalNot1] = useState("");
  const [localNot5, setLocalNot5] = useState("");

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

  // ✅ data geldikçe local Not'ları senkronla
  useEffect(() => {
    if (!data) return;
    setLocalNot1((data.not_1 ?? data.Not_1 ?? "") || "");
    setLocalNot5((data.not_5 ?? data.Not_5 ?? "") || "");
  }, [data]);

  // Malzeme map (Id -> malzeme)
  const malzemeMap = useMemo(() => {
    if (!data) return {};
    const malzemeler = data.malzemeler ?? data.Malzeme ?? data.Malzemeler ?? [];
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

  const malzemeler = data.malzemeler ?? data.Malzeme ?? data.Malzemeler ?? [];
  const fiyatTeklifleri = data.fiyatTeklifleri ?? data.FiyatTeklifleri ?? [];
  const onaylayanPersoneller =
    data.onaylayanPersoneller ?? data.OnaylayanPersoneller ?? [];

  const publicToken = data.publicToken ?? data.PublicToken;

  // ✅ Not_2 (fatura pdf url)
  const not2Raw = data.not_2 ?? data.Not_2 ?? "";

  // ✅ Tedarikçi paylaşım linki
  const sistemUretilmisLink =
    data.sistemUretilmisLink ??
    data.SistemUretilmisLink ??
    (publicToken ? `/satinalma/fiyatlandir/${publicToken}` : null);

  const shareUrl = sistemUretilmisLink ? `${BASE_URL}${sistemUretilmisLink}` : "";

  // ✅ Fatura sayfası linki
  const faturaPath = publicToken ? `/satinalma/fatura/${publicToken}` : null;
  const faturaShareUrl = faturaPath ? `${BASE_URL}${faturaPath}` : "";

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

  // ✅ Rol 35 satın alındı yetkisi
  const currentRolRaw = personel ? personel.rol ?? personel.Rol : null;
  const currentRol = currentRolRaw != null ? Number(currentRolRaw) : null;
  const satinAlindiYetkiliMi = currentRol === 35;

  // ✅ Talep açan kişi mi? (Not_5 sadece talep açan için)
  const talepEdenId = talepEden ? (talepEden.id ?? talepEden.Id) : null;
  const surecIsaretYetkiliMi =
    currentPersonelId && talepEdenId
      ? Number(currentPersonelId) === Number(talepEdenId)
      : false;

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

  // Tedarikçi bazlı özet
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

  // ✅ Onay / Red / Yorum (tek endpoint)
  // onaylandiMi: true=Onay, false=Red, null=Yorum (durum değişmez)
  const handleOnayIslem = async (onaylandiMi) => {
    if (!id || !currentPersonelId) return;

    setOnayLoading(true);
    setOnayError(null);
    setOnaySuccess(null);

    try {
      const res = await postDataAsync(`satinalma/onay`, {
        satinAlmaId: Number(id),
        personelId: Number(currentPersonelId),
        onaylandiMi: onaylandiMi === undefined ? null : onaylandiMi, // true/false/null
        not: (onayNot || "").trim() || null,
      });

      const apiMessage =
        res?.Message ??
        (onaylandiMi === true
          ? "Onayınız kaydedildi / güncellendi."
          : onaylandiMi === false
          ? "Red işleminiz kaydedildi / güncellendi."
          : "Yorum güncellendi (durum değişmedi).");

      setOnaySuccess(apiMessage);
      setOnayNot("");

      await fetchData(id);
      await router.replace(router.asPath);
    } catch (err) {
      console.error("ONAY POST ERROR:", err?.response?.data || err);
      setOnayError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "Onay/Yorum işlemi sırasında bir hata oluştu."
      );
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

        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0b1220" }}>
          Satın Alma Teklifleri
        </h1>
      </div>

      {/* PAYLAŞIM LINK */}
      <SatinalmaShareLinkBar shareUrl={shareUrl} copied={copied} onCopy={copyLink} />

      {/* ✅ FATURA + PDF DURUM KARTI */}
      <SatinalmaFaturaPdfDurumCard faturaShareUrl={faturaShareUrl} not2Raw={not2Raw} />

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

        <SatinalmaOnaylayanPersoneller onaylayanPersoneller={onaylayanPersoneller} />
      </div>

      {/* ✅ Satın Alım Durumu (Not_1) */}
      <SatinalmaDurumCard
        localNot1={localNot1}
        setLocalNot1={setLocalNot1}
        satinAlindiYetkiliMi={satinAlindiYetkiliMi}
        id={id}
        postDataAsync={postDataAsync}
        fetchData={fetchData}
        router={router}
      />

      {/* ✅ Süreç Durumu (Not_5) — Talep Açan */}
      <SatinalmaSurecDurumCard
        id={id}
        localNot5={localNot5}
        setLocalNot5={setLocalNot5}
        surecIsaretYetkiliMi={surecIsaretYetkiliMi}
        postDataAsync={postDataAsync}
        fetchData={fetchData}
        router={router}
      />

      <SatinalmaTedarikciOzet
        tedarikciOzetList={tedarikciOzetList}
        satinAlmaId={id}
        onAfterFastApprove={() => window.location.reload()}
      />

      <SatinalmaMalzemeTeklifList
        malzemeler={malzemeler}
        tekliflerByMalzeme={tekliflerByMalzeme}
      />
    </div>
  );
}
