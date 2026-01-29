




// src/pages/satinalma/yeni.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

export default function YeniSatinAlmaPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  // Form alanları
  const [siteId, setSiteId] = useState("");
  const [talepCinsi, setTalepCinsi] = useState("");
  const [aciklama, setAciklama] = useState("");

  // ✅ Teknik Talep (Not_3 / Not_4)
  const [teknikTalepVarMi, setTeknikTalepVarMi] = useState(false); // Not_3
  const [teknikAciklama, setTeknikAciklama] = useState(""); // Not_4

  // ✅ Malzeme istemiyorum (teknik talep tek başına)
  const [malzemeIstemiyorum, setMalzemeIstemiyorum] = useState(false);

  // Lookups
  const [sites, setSites] = useState([]);
  const [onayciCandidates, setOnayciCandidates] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Malzemeler
  const [malzemeler, setMalzemeler] = useState([
    {
      malzemeAdi: "",
      marka: "",
      adet: "",
      birim: "Adet",
      kullanimAmaci: "",
      ornekUrunLinki: "",
      not: "",
    },
  ]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // ------------------------------------------------------
  // Helpers
  // ------------------------------------------------------
  const getId = (obj) => obj?.id ?? obj?.Id;
  const getAd = (obj) => obj?.ad ?? obj?.Ad;

  const personelId = useMemo(() => {
    if (!personel) return null;
    return personel.id ?? personel.Id ?? null;
  }, [personel]);

  const isSingleSiteLocked = useMemo(() => {
    return Array.isArray(sites) && sites.length === 1;
  }, [sites]);

  const selectedSiteName = useMemo(() => {
    const sid = siteId ? Number(siteId) : null;
    if (!sid) return null;
    const s = sites.find((x) => Number(getId(x)) === sid);
    return s ? getAd(s) : null;
  }, [siteId, sites]);

  // ------------------------------------------------------
  // Personel cookie'sini oku
  // ------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (!personelCookie) {
        router.replace("/");
        return;
      }

      const parsed = JSON.parse(personelCookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      router.replace("/");
    }
  }, [router]);

  // ------------------------------------------------------
  // Lookups: personel varsa tek GET ile getir
  // - 1 proje -> dropdown gizle, proje adını göster
  // - 0 / çoklu -> dropdown ile seçtir
  // ------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      if (!personelId) return;

      setLoadingLookups(true);
      setError(null);

      try {
        // ✅ Yeni endpoint (tek çağrı)
        const res = await getDataAsync(
          `Personeller/satinalma-yeni/lookups?personelId=${personelId}`
        );

        if (cancelled) return;

        const resSites = res?.sites || [];
        const resOnaycilar = res?.onaycilar || [];
        const defaultSiteId = res?.defaultSiteId ?? null;

        setSites(resSites);
        setOnayciCandidates(resOnaycilar);

        // site seçimi:
        // - tek site varsa otomatik set
        // - defaultSiteId varsa set
        // - aksi halde kullanıcı seçecek
        if (Array.isArray(resSites) && resSites.length === 1) {
          const onlyId = getId(resSites[0]);
          setSiteId(onlyId ? String(onlyId) : "");
        } else if (defaultSiteId) {
          setSiteId(String(defaultSiteId));
        } else {
          setSiteId("");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("LOOKUP FETCH ERROR:", err);
        setError(
          "Proje/Site veya onaycı listesi alınırken bir hata oluştu. (404 ise backend endpoint yok demektir.)"
        );
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    };

    fetchLookups();

    return () => {
      cancelled = true;
    };
  }, [personelId]);

  // ------------------------------------------------------
  // Malzeme satırı ekle / sil / değiştir
  // ------------------------------------------------------
  const handleAddRow = () => {
    setMalzemeler((prev) => [
      ...prev,
      {
        malzemeAdi: "",
        marka: "",
        adet: "",
        birim: "Adet",
        kullanimAmaci: "",
        ornekUrunLinki: "",
        not: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setMalzemeler((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setMalzemeler((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // ------------------------------------------------------
  // Submit
  // ------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personel) return;

    setError(null);

    // Talep cinsi zorunlu
    if (!talepCinsi.trim()) {
      setError("Talep cinsi zorunludur.");
      return;
    }

    const talepEdenId = personel.id ?? personel.Id;
    if (!talepEdenId || talepEdenId === 0) {
      setError("Talep eden personel Id bulunamadı. Tekrar giriş yapın.");
      return;
    }

    // Site zorunlu
    const siteIdNum = siteId ? Number(siteId) : 0;
    if (!siteIdNum || siteIdNum <= 0) {
      setError("Site / Proje seçimi zorunludur.");
      return;
    }

    // Teknik talep varsa teknik açıklama zorunlu
    if (teknikTalepVarMi && !teknikAciklama.trim()) {
      setError("Teknik talep seçildi. Teknik açıklama zorunludur.");
      return;
    }

    // Malzeme doğrulama:
    // - malzeme istemiyorum ise: malzemeleri null gönder, doğrulama yok
    const cleanedMalzemeler = [];

    if (!malzemeIstemiyorum) {
      for (let i = 0; i < malzemeler.length; i++) {
        const row = malzemeler[i];

        const malzemeAdi = (row.malzemeAdi || "").trim();
        const marka = (row.marka || "").trim();
        const birim = (row.birim || "").trim();
        const kullanimAmaci = (row.kullanimAmaci || "").trim();
        const ornekUrunLinki = (row.ornekUrunLinki || "").trim();
        const notText = (row.not || "").trim();

        const adetRaw = row.adet === "" ? "" : String(row.adet);
        const adetNum =
          adetRaw === "" || isNaN(Number(adetRaw)) ? NaN : Number(adetRaw);

        const hepsiBos =
          !malzemeAdi &&
          !marka &&
          !birim &&
          !kullanimAmaci &&
          !ornekUrunLinki &&
          !notText &&
          (adetRaw === "" || adetNum === 0);

        if (hepsiBos) continue;

        if (!malzemeAdi || !marka || !birim || !kullanimAmaci || !notText) {
          setError(
            `Malzeme satır ${
              i + 1
            } için örnek ürün linki hariç tüm alanlar zorunludur.`
          );
          return;
        }

        if (!adetNum || adetNum <= 0) {
          setError(
            `Malzeme satır ${
              i + 1
            } için adet alanı zorunludur ve 0'dan büyük olmalıdır.`
          );
          return;
        }

        cleanedMalzemeler.push({
          malzemeAdi,
          marka,
          adet: adetNum,
          birim,
          kullanimAmaci,
          ornekUrunLinki: ornekUrunLinki || null,
          not: notText,
        });
      }

      if (cleanedMalzemeler.length === 0) {
        setError("En az bir malzeme girişi yapmalısınız. (Ya da 'malzeme istemiyorum' seçin.)");
        return;
      }
    }

    // Onaycı personel Id'leri
    const onayciPersonelIdler = (onayciCandidates || [])
      .map((p) => p.id ?? p.Id)
      .filter((id) => id != null);

    const payload = {
      tarih: new Date().toISOString(),
      seriNo: null,
      talepEdenId,
      siteId: siteIdNum, // ✅ DTO'na ekle
      talepCinsi: talepCinsi.trim(),
      aciklama: aciklama.trim() || null,
      onayciPersonelIdler: onayciPersonelIdler.length ? onayciPersonelIdler : null,

      // ✅ Teknik talep alanları (Not_3 / Not_4)
      not_3: teknikTalepVarMi ? "Evet" : "Hayır",
      not_4: teknikTalepVarMi ? teknikAciklama.trim() : null,

      // ✅ Malzeme istemiyorum ise null
      malzemeler: malzemeIstemiyorum ? null : cleanedMalzemeler,
    };

    try {
      setSending(true);
      setSuccessInfo(null);

      const result = await postDataAsync("SatinAlma", payload);

      setSuccessInfo(result);

      // reset
      if (!isSingleSiteLocked) setSiteId("");
      setTalepCinsi("");
      setAciklama("");

      setTeknikTalepVarMi(false);
      setTeknikAciklama("");
      setMalzemeIstemiyorum(false);

      setMalzemeler([
        {
          malzemeAdi: "",
          marka: "",
          adet: "",
          birim: "Adet",
          kullanimAmaci: "",
          ornekUrunLinki: "",
          not: "",
        },
      ]);
    } catch (err) {
      console.error("SATINALMA CREATE ERROR:", err);
      setError("Satın alma talebi kaydedilirken bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  // ------------------------------------------------------
  // JSX
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Başlık + personel bilgisi */}
        <header className="mb-6 border-b border-zinc-200 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">
                Yeni Satın Alma Talebi
              </h1>

              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                {personel && (
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[11px] font-medium text-zinc-700">
                    {personel.ad} {personel.soyad} – {personel.rol}
                  </span>
                )}

                {loadingLookups && (
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[11px] font-medium text-zinc-600">
                    Proje bilgileri yükleniyor...
                  </span>
                )}

                {!loadingLookups && isSingleSiteLocked && selectedSiteName && (
                  <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[11px] font-medium text-emerald-700">
                    Proje: {selectedSiteName}
                  </span>
                )}
              </div>

              {personel && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600">
                  <span>
                    <span className="font-semibold">Kod:</span>{" "}
                    {personel.personelKodu}
                  </span>
                  {personel.kullaniciAdi && (
                    <span>
                      <span className="font-semibold">Kullanıcı:</span>{" "}
                      {personel.kullaniciAdi}
                    </span>
                  )}
                  {personel.telefon && (
                    <span>
                      <span className="font-semibold">Tel:</span>{" "}
                      {personel.telefon}
                    </span>
                  )}
                  {personel.eposta && (
                    <span>
                      <span className="font-semibold">E-posta:</span>{" "}
                      {personel.eposta}
                    </span>
                  )}
                </div>
              )}

              {!personel && (
                <p className="mt-1 text-[10px] text-zinc-500">
                  PersonelUserInfo cookie içinde bulunamadı.
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Hata / başarı mesajları */}
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {successInfo && (
          <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
            <div className="font-semibold">
              Satın alma talebi başarıyla oluşturuldu.
            </div>
            <div className="mt-1 space-y-0.5">
              <p>
                <span className="font-semibold">Seri No:</span>{" "}
                {successInfo.seriNo ?? successInfo.SeriNo}
              </p>
              <p>
                <span className="font-semibold">Oluşturma Tarihi:</span>{" "}
                {successInfo.tarih
                  ? new Date(successInfo.tarih).toLocaleString("tr-TR")
                  : successInfo.Tarih
                  ? new Date(successInfo.Tarih).toLocaleString("tr-TR")
                  : "-"}
              </p>
              {successInfo.publicUrl && (
                <p>
                  <span className="font-semibold">Tedarikçi Linki:</span>{" "}
                  <span className="underline">{successInfo.publicUrl}</span>{" "}
                  <span className="text-[11px] text-zinc-600">
                    (Bu linki tedarikçilere göndererek fiyat tekliflerini toplayabilirsiniz.)
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg bg-white p-4 shadow-sm"
        >
          {/* Talep + Site + Onaycı bilgileri */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-800">
              Talep Bilgileri
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Talep Cinsi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Talep Cinsi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={talepCinsi}
                  onChange={(e) => setTalepCinsi(e.target.value)}
                  required
                  placeholder="Örn: Elektrik malzemesi alımı"
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Site/Proje */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Site / Proje <span className="text-red-500">*</span>
                </label>

                {isSingleSiteLocked ? (
                  <div className="flex h-[38px] items-center rounded-md border border-zinc-300 bg-zinc-50 px-2 text-sm text-zinc-800">
                    {selectedSiteName || "Proje bilgisi bulunamadı"}
                  </div>
                ) : (
                  <select
                    value={siteId}
                    required
                    disabled={loadingLookups}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  >
                    <option value="">
                      {loadingLookups ? "Yükleniyor..." : "Seçiniz"}
                    </option>
                    {sites.map((s) => {
                      const id = getId(s);
                      const ad = getAd(s);
                      return (
                        <option key={id} value={id}>
                          {ad || `Site #${id}`}
                        </option>
                      );
                    })}
                  </select>
                )}

                <p className="text-[10px] text-zinc-500">
                  {isSingleSiteLocked
                    ? "Bu personelin sorumlu olduğu proje bulunduğu için proje otomatik seçildi."
                    : "Eğer personelin tek sorumlu projesi yoksa tüm projeler listelenir ve seçim yapılır."}
                </p>
              </div>
            </div>

            {/* Teknik talep bloğu */}
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-4">
                <label className="flex w-full items-center justify-center gap-3 text-sm font-semibold text-emerald-900">
                  <input
                    type="checkbox"
                    checked={teknikTalepVarMi}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTeknikTalepVarMi(checked);

                      // kapatınca her şeyi sıfırla
                      if (!checked) {
                        setTeknikAciklama("");
                        setMalzemeIstemiyorum(false);
                      }
                    }}
                    className="h-5 w-5 rounded border-emerald-400"
                  />
                  Teknik talebiniz var mı?
                </label>
              </div>

              {teknikTalepVarMi && (
                <div className="mt-3 space-y-3">
                  <div className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                    <label className="flex w-full items-center justify-center gap-3 text-sm font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={malzemeIstemiyorum}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setMalzemeIstemiyorum(checked);

                          // işaretlenirse satırları temizle (opsiyonel ama pratik)
                          if (checked) {
                            setMalzemeler([
                              {
                                malzemeAdi: "",
                                marka: "",
                                adet: "",
                                birim: "Adet",
                                kullanimAmaci: "",
                                ornekUrunLinki: "",
                                not: "",
                              },
                            ]);
                          }
                        }}
                        className="h-5 w-5 rounded border-amber-400"
                      />
                      Malzeme istemiyorum (sadece teknik talep)
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-700">
                      Teknik Açıklama <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={teknikAciklama}
                      onChange={(e) => setTeknikAciklama(e.target.value)}
                      placeholder="Teknik talep ile ilgili detay açıklama yazınız."
                      className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Onaycılar (otomatik, değiştirilemez) */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-700">
                Onaycı Personeller (Rol 90)
                <span className="ml-1 text-[10px] font-normal text-zinc-500">
                  – Tüm rol 90 personeller otomatik onaycıdır (değiştirilemez).
                </span>
              </label>

              {onayciCandidates.length === 0 ? (
                <p className="text-[11px] text-zinc-500">
                  Uygun onaycı personel bulunamadı.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                  {onayciCandidates.map((p) => {
                    const id = p.id ?? p.Id;
                    const ad = p.ad ?? p.Ad;
                    const soyad = p.soyad ?? p.Soyad;
                    const rolAd = p.rolAd ?? p.RolAd;

                    return (
                      <label
                        key={id}
                        className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] text-zinc-800 shadow-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked
                          readOnly
                          disabled
                        />
                        <span className="font-medium">
                          {ad} {soyad}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          ({rolAd})
                        </span>
                        <span className="text-[10px] text-zinc-400">#{id}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Açıklama
              </label>
              <textarea
                rows={3}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Talep ile ilgili ek açıklama yazabilirsiniz."
                className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </section>

          {/* Malzemeler (malzeme istemiyorum ise disable görünüm) */}
              {/* Malzemeler (malzeme istemiyorum ise disable görünüm) */}
<section
  className={`space-y-3 ${
    malzemeIstemiyorum ? "opacity-50 pointer-events-none" : ""
  }`}
>
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold text-zinc-800">Malzemeler</h2>
    <button
      type="button"
      onClick={handleAddRow}
      className="rounded-md border border-sky-500 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
    >
      + Malzeme Ekle
    </button>
  </div>

  <div className="overflow-x-auto rounded-md border border-zinc-200">
    <table className="min-w-full border-separate border-spacing-0 text-[11px] text-zinc-900">
      <thead className="bg-zinc-100">
        <tr>
          <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
            Malzeme Adı *
          </th>

          <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
            Marka *
            <div className="mt-[2px] text-[10px] font-normal text-zinc-500">
              (Bilinmiyorsa “Marka belirtmiyorum”)
            </div>
          </th>

          <th className="border-b border-zinc-200 px-2 py-1 text-right font-medium">
            Adet - Metre *
          </th>
          <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
            Birim *
          </th>
          <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
            Kullanım Amacı *
          </th>
          <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
            Örnek Ürün Linki
          </th>

          <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
            Not *
            <div className="mt-[2px] text-[10px] font-normal text-zinc-500">
              (Yoksa “Not belirtmiyorum”)
            </div>
          </th>

          <th className="border-b border-zinc-200 px-2 py-1 text-center font-medium">
            Sil
          </th>
        </tr>
      </thead>

      <tbody>
        {malzemeler.map((row, index) => {
          const markaBelirtmiyorum = row.marka === "BELİRTİLMEMİŞ";
          const notBelirtmiyorum = row.not === "BELİRTİLMEMİŞ";

          return (
            <tr key={index} className="odd:bg-white even:bg-zinc-50">
              {/* Malzeme adı */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top">
                <input
                  type="text"
                  value={row.malzemeAdi}
                  onChange={(e) =>
                    handleRowChange(index, "malzemeAdi", e.target.value)
                  }
                  required={!malzemeIstemiyorum}
                  placeholder="Malzeme adı"
                  className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </td>

              {/* Marka + tick */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top">
                <input
                  type="text"
                  value={markaBelirtmiyorum ? "" : row.marka}
                  onChange={(e) =>
                    handleRowChange(index, "marka", e.target.value)
                  }
                  required={!malzemeIstemiyorum && !markaBelirtmiyorum}
                  placeholder="Marka"
                  disabled={markaBelirtmiyorum}
                  className={`w-full rounded border px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                    markaBelirtmiyorum
                      ? "border-zinc-200 bg-zinc-100 text-zinc-500"
                      : "border-zinc-300 bg-white text-zinc-900"
                  }`}
                />

                <label className="mt-1 flex items-center gap-2 text-[10px] text-zinc-700">
                  <input
                    type="checkbox"
                    checked={markaBelirtmiyorum}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // işaretlendi → BELİRTİLMEMİŞ yaz
                        handleRowChange(index, "marka", "BELİRTİLMEMİŞ");
                      } else {
                        // kaldırıldı → boşalt
                        handleRowChange(index, "marka", "");
                      }
                    }}
                    className="h-3 w-3 accent-sky-600"
                  />
                  Marka belirtmiyorum
                </label>

                {markaBelirtmiyorum && (
                  <div className="mt-0.5 text-[10px] font-medium text-sky-700">
                    Marka: BELİRTİLMEMİŞ
                  </div>
                )}
              </td>

              {/* Adet */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top text-right">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={row.adet}
                  onChange={(e) => {
                    const val = e.target.value;

                    // sadece tam sayı
                    if (/^\d*$/.test(val)) {
                      handleRowChange(index, "adet", val);
                    }
                  }}
                  required={!malzemeIstemiyorum}
                  placeholder="0"
                  className="w-full rounded border border-zinc-300 px-1 py-[3px] text-right text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </td>

              {/* Birim */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top">
                <input
                  type="text"
                  value={row.birim}
                  onChange={(e) =>
                    handleRowChange(index, "birim", e.target.value)
                  }
                  required={!malzemeIstemiyorum}
                  placeholder="Adet / Paket / Metre..."
                  className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </td>

              {/* Kullanım amacı */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top">
                <input
                  type="text"
                  value={row.kullanimAmaci}
                  onChange={(e) =>
                    handleRowChange(index, "kullanimAmaci", e.target.value)
                  }
                  required={!malzemeIstemiyorum}
                  placeholder="Kullanım amacı"
                  className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </td>

              {/* Örnek link */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top">
                <input
                  type="text"
                  value={row.ornekUrunLinki}
                  onChange={(e) =>
                    handleRowChange(index, "ornekUrunLinki", e.target.value)
                  }
                  placeholder="https://..."
                  className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </td>

              {/* Not + tick */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top">
                <input
                  type="text"
                  value={notBelirtmiyorum ? "" : row.not}
                  onChange={(e) =>
                    handleRowChange(index, "not", e.target.value)
                  }
                  required={!malzemeIstemiyorum && !notBelirtmiyorum}
                  placeholder="Not"
                  disabled={notBelirtmiyorum}
                  className={`w-full rounded border px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                    notBelirtmiyorum
                      ? "border-zinc-200 bg-zinc-100 text-zinc-500"
                      : "border-zinc-300 bg-white text-zinc-900"
                  }`}
                />

                <label className="mt-1 flex items-center gap-2 text-[10px] text-zinc-700">
                  <input
                    type="checkbox"
                    checked={notBelirtmiyorum}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleRowChange(index, "not", "BELİRTİLMEMİŞ");
                      } else {
                        handleRowChange(index, "not", "");
                      }
                    }}
                    className="h-3 w-3 accent-sky-600"
                  />
                  Not belirtmiyorum
                </label>

                {notBelirtmiyorum && (
                  <div className="mt-0.5 text-[10px] font-medium text-sky-700">
                    Not: BELİRTİLMEMİŞ
                  </div>
                )}
              </td>

              {/* Sil */}
              <td className="border-b border-zinc-200 px-2 py-1 align-top text-center">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  disabled={malzemeler.length === 1}
                  className="rounded border border-red-400 px-2 py-[1px] text-[11px] text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
                >
                  Sil
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  <p className="text-[10px] text-zinc-500">
    * Her satır için <strong>örnek ürün linki hariç</strong> tüm alanlar zorunludur.
    Marka veya Not bilinmiyorsa ilgili “belirtmiyorum” seçeneğini işaretleyebilirsiniz.
  </p>
</section>




          {/* Kaydet butonu */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Geri
            </button>

            <button
              type="submit"
              disabled={sending || !personel || loadingLookups}
              className="rounded-md border border-sky-600 bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {sending ? "Kaydediliyor..." : "Satın Alma Talebini Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
