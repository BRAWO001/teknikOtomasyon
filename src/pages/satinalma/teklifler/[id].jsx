// src/pages/satinalma/teklifler/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

import SatinalmaShareLinkBar from "@/components/SatinalmaShareLinkBar";
import SatinalmaHeaderCard from "@/components/SatinalmaHeaderCard";
import SatinalmaOnaylayanPersoneller from "@/components/SatinalmaOnaylayanPersoneller";
import SatinalmaOnayPanel from "@/components/SatinalmaOnayPanel";
import SatinalmaTedarikciOzet from "@/components/SatinalmaTedarikciOzet";
import SatinalmaMalzemeTeklifList from "@/components/SatinalmaMalzemeTeklifList";

// const BASE_URL = "http://localhost:3000";
const BASE_URL = "http://teknik-otomasyon.vercel.app";

// API BASE (POST için)
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

  const onaylayanPersoneller =
    data.onaylayanPersoneller ?? data.OnaylayanPersoneller ?? [];

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

    // KDV oranı (0.20 gibi, API'den KdvOrani geliyor varsayıyoruz)
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
      const res = await axios.post(`${API_BASE_URL}satinalma/onay`, {
        satinAlmaId: Number(id),
        personelId: currentPersonelId,
        onaylandiMi,
        not: onayNot || null,
      });

      const apiMessage =
        res?.data?.Message ??
        (onaylandiMi
          ? "Onayınız kaydedildi / güncellendi."
          : "Red işleminiz kaydedildi / güncellendi.");

      setOnaySuccess(apiMessage);
      setOnayNot("");

      await fetchData(id); // güncel veriyi tekrar çek
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

      <SatinalmaShareLinkBar
        shareUrl={shareUrl}
        copied={copied}
        onCopy={copyLink}
      />

      <SatinalmaHeaderCard
        seriNo={seriNo}
        tarih={tarih}
        talepCinsi={talepCinsi}
        talepEden={talepEden}
        aciklama={aciklama}
      />

      <SatinalmaOnaylayanPersoneller
        onaylayanPersoneller={onaylayanPersoneller}
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

      <SatinalmaTedarikciOzet tedarikciOzetList={tedarikciOzetList} />

      <SatinalmaMalzemeTeklifList
        malzemeler={malzemeler}
        tekliflerByMalzeme={tekliflerByMalzeme}
      />
    </div>
  );
}
