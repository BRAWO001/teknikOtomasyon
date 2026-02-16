




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
import SatinalmaYorumlarCard from "@/components/satinalma/SatinalmaYorumlarCard";

// ✅ yeni componentler
import SatinalmaFaturaPdfDurumCard from "@/components/satinalma/SatinalmaFaturaPdfDurumCard";
import SatinalmaDurumCard from "@/components/satinalma/SatinalmaDurumCard";
import SatinalmaSurecDurumCard from "@/components/satinalma/SatinalmaSurecDurumCard";

// ✅ DOSYA MODAL
import TalepFotoModals from "@/components/satinalma/TalepFotoModals";

// const BASE_URL = "http://localhost:3000";
const BASE_URL = "http://teknik-otomasyon.vercel.app";

/* =========================
   helpers
========================= */
function isValidHttpUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

function fileExt(name) {
  const s = String(name || "");
  const idx = s.lastIndexOf(".");
  return idx >= 0 ? s.slice(idx + 1).toLowerCase() : "";
}

function isImageUrl(url, dosyaAdi) {
  const u = String(url || "");
  const n = String(dosyaAdi || "");
  const ext = fileExt(n) || fileExt(u.split("?")[0]);
  return ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext);
}

function isPdf(url, dosyaAdi) {
  const u = String(url || "");
  const n = String(dosyaAdi || "");
  const ext = fileExt(n) || fileExt(u.split("?")[0]);
  return ext === "pdf";
}
/* ========================= */

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
  // ✅ UI için local Not_4 (Teknik Açıklama)
  const [localNot4, setLocalNot4] = useState("");

  const [localNot5, setLocalNot5] = useState("");

  // ✅ DOSYA MODAL STATE
  const [dosyaModalOpen, setDosyaModalOpen] = useState(false);

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
    setLocalNot4((data.not_4 ?? data.Not_4 ?? "") || "");
    setLocalNot5((data.not_5 ?? data.Not_5 ?? "") || "");
  }, [data]);

  // ✅ DTO’ya eklediğimiz DOSYALAR
  const dosyalar = useMemo(() => {
    const list = data?.dosyalar ?? data?.Dosyalar ?? [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  // ✅ Görsel/Belge ayrımı + sayılar
  const dosyaOzet = useMemo(() => {
    const foto = [];
    const belge = [];

    dosyalar.forEach((d) => {
      const turKod = Number(pickAny(d, "TurKod", "turKod")) || 0;
      const url = pickAny(d, "Url", "url");
      const dosyaAdi = pickAny(d, "DosyaAdi", "dosyaAdi");

      if (turKod === 10) foto.push(d);
      else if (turKod === 20) belge.push(d);
      else {
        if (isImageUrl(url, dosyaAdi)) foto.push(d);
        else belge.push(d);
      }
    });

    return { foto, belge, total: dosyalar.length };
  }, [dosyalar]);

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
    return <div className="p-6 text-sm text-zinc-900 dark:text-zinc-100">Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-sm text-zinc-900 dark:text-zinc-100">Kayıt bulunamadı.</div>;
  }

  const seriNo = data.seriNo ?? data.SeriNo;
  const tarih = data.tarih ?? data.Tarih;
  const talepCinsi = data.talepCinsi ?? data.TalepCinsi;
  const aciklama = data.aciklama ?? data.Aciklama;
  const talepEden = data.talepEden ?? data.TalepEden;
  const site = data.site ?? data.Site ?? null;
  const yorumlar = data.yorumlar ?? data.Yorumlar ?? [];

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
  const handleOnayIslem = async (onaylandiMi) => {
    if (!id || !currentPersonelId) return;

    setOnayLoading(true);
    setOnayError(null);
    setOnaySuccess(null);

    try {
      const res = await postDataAsync(`satinalma/onay`, {
        satinAlmaId: Number(id),
        personelId: Number(currentPersonelId),
        onaylandiMi: onaylandiMi === undefined ? null : onaylandiMi,
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
          "Onay/Yorum işlemi sırasında bir hata oluştu.",
      );
    } finally {
      setOnayLoading(false);
    }
  };

const DosyaTile = ({ d, mode }) => {
  const url = pickAny(d, "Url", "url");
  const dosyaAdi = pickAny(d, "DosyaAdi", "dosyaAdi") ?? "-";
  const turAd = pickAny(d, "TurAd", "turAd") ?? "-";
  const sira = pickAny(d, "Sira", "sira") ?? "-";
  const did = pickAny(d, "Id", "id") ?? `${Math.random()}`;
  const isImg = mode === "foto" ? true : isImageUrl(url, dosyaAdi);
  const pdf = isPdf(url, dosyaAdi);

  const canOpen = url && isValidHttpUrl(url);

  // ✅ tüm kart tıklanınca aç
  const handleOpen = () => {
    if (!canOpen) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : -1}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (!canOpen) return;
        if (e.key === "Enter" || e.key === " ") handleOpen();
      }}
      className={[
        "overflow-hidden rounded-xl border bg-white p-2 shadow-sm dark:bg-zinc-900",
        "border-zinc-200 dark:border-zinc-800",
        canOpen ? "cursor-pointer transition hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700" : "opacity-70",
      ].join(" ")}
      title={canOpen ? "Aç / İndir" : "Link yok"}
    >
      {/* preview */}
      {isImg && canOpen ? (
        <div className="h-[88px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={dosyaAdi} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-[88px] w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-center text-[11px] font-extrabold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {pdf ? "PDF" : isImg ? "GÖRSEL" : "BELGE"}
        </div>
      )}

      <div className="mt-1 space-y-1">
        <div className="line-clamp-1 text-[10px] font-normal text-zinc-900 dark:text-zinc-100">
          {dosyaAdi}
        </div>

        

      </div>
    </div>
  );
};


  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 text-sm text-zinc-900 dark:text-zinc-100">
      {/* ✅ DOSYA MODAL */}
      <TalepFotoModals
        isOpen={dosyaModalOpen}
        onClose={() => setDosyaModalOpen(false)}
        satinAlmaId={id}
        satinAlmaSeriNo={seriNo}
      />

      {/* ÜST BAR */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-[12px] font-extrabold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          Sıra No: <span className="font-black">{id}</span>
        </div>

        <h1 className="m-0 text-[18px] font-extrabold text-zinc-900 dark:text-zinc-100">
          Talep Detayı
        </h1>

        {/* SAĞ AKSİYONLAR */}
        <div className="flex items-center gap-2">
          {/* Geri */}
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[12px] font-extrabold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            title="Geri"
          >
            ← Geri
          </button>

          {/* Ana Sayfa */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[12px] font-extrabold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            title="Ana sayfaya git"
          >
            ⌂ Ana Sayfa
          </button>
        </div>
      </div>

      {/* PAYLAŞIM LINK */}
      <SatinalmaShareLinkBar
        shareUrl={shareUrl}
        copied={copied}
        onCopy={copyLink}
      />

      {/* ✅ FATURA + PDF DURUM KARTI */}
      <div className="mt-3">
        <SatinalmaFaturaPdfDurumCard
          faturaShareUrl={faturaShareUrl}
          not2Raw={not2Raw}
        />
      </div>

      {/* ÜST GRID */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SatinalmaHeaderCard
            seriNo={seriNo}
            tarih={tarih}
            talepCinsi={talepCinsi}
            talepEden={talepEden}
            site={site}
            aciklama={aciklama}
            teknikAciklama={data?.not_4 ?? data?.Not_4 ?? ""}
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

        <div className="flex flex-col gap-3">
          <SatinalmaOnaylayanPersoneller
            onaylayanPersoneller={onaylayanPersoneller}
          />

          <SatinalmaYorumlarCard
            satinAlmaId={id}
            yorumlar={yorumlar}
            currentPersonelId={currentPersonelId}
            postDataAsync={postDataAsync}
            onAfterSaved={() => fetchData(id)}
          />
        </div>
      </div>

      {/* ✅ DOSYA ÖZET (Tailwind, 4x..) */}
      <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px] font-extrabold text-zinc-900 dark:text-zinc-100">
            Talep İçin Yüklenen Belgeler
          </div>

          <button
            type="button"
            onClick={() => setDosyaModalOpen(true)}
            className="rounded-xl border cursor-pointer border-zinc-300 bg-blue-100 px-1.5 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            title="Dosyaları görüntüle / yükle"
          >
            Belge Ekleme Yapabilirsiniz ({dosyaOzet.total})
          </button>

          <div className="flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full border border-zinc-200 bg-white px-2 py-[2px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              Foto: <b>{dosyaOzet.foto.length}</b>
            </span>
            <span className="rounded-full border border-zinc-200 bg-white px-2 py-[2px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              Belge: <b>{dosyaOzet.belge.length}</b>
            </span>
          </div>
        </div>

        {dosyalar.length === 0 ? (
          <div className="mt-2 text-[12px] text-zinc-600 dark:text-zinc-300">
            Henüz dosya yok yükleyebilirsiniz.
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {/* FOTO */}
            <div>
              <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
                Fotoğraflar
              </div>

              {dosyaOzet.foto.length === 0 ? (
                <div className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300">
                  Fotoğraf yok.
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {dosyaOzet.foto.map((d) => (
                    <DosyaTile
                      key={`${pickAny(d, "Id", "id")}-${pickAny(d, "Url", "url")}-${pickAny(d, "Sira", "sira")}`}
                      d={d}
                      mode="foto"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* BELGE */}
            <div>
              <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
                Belgeler
              </div>

              {dosyaOzet.belge.length === 0 ? (
                <div className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300">
                  Belge yok.
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {dosyaOzet.belge.map((d) => (
                    <DosyaTile
                      key={`${pickAny(d, "Id", "id")}-${pickAny(d, "Url", "url")}-${pickAny(d, "Sira", "sira")}`}
                      d={d}
                      mode="belge"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Satın Alım Durumu (Not_1) */}
      <div className="mt-3">
        <SatinalmaDurumCard
          localNot1={localNot1}
          setLocalNot1={setLocalNot1}
          satinAlindiYetkiliMi={satinAlindiYetkiliMi}
          id={id}
          postDataAsync={postDataAsync}
          fetchData={fetchData}
          router={router}
        />
      </div>

      {/* ✅ Süreç Durumu (Not_5) — Talep Açan */}
      <div className="mt-3">
        <SatinalmaSurecDurumCard
          id={id}
          localNot5={localNot5}
          setLocalNot5={setLocalNot5}
          surecIsaretYetkiliMi={surecIsaretYetkiliMi}
          postDataAsync={postDataAsync}
          fetchData={fetchData}
          router={router}
        />
      </div>

      <div className="mt-3">
        <SatinalmaTedarikciOzet
          tedarikciOzetList={tedarikciOzetList}
          satinAlmaId={id}
          onAfterFastApprove={() => window.location.reload()}
        />
      </div>

      <div className="mt-3">
        <SatinalmaMalzemeTeklifList
          malzemeler={malzemeler}
          tekliflerByMalzeme={tekliflerByMalzeme}
        />
      </div>
    </div>
  );
}
