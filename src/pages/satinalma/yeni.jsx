// src/pages/satinalma/yeni.jsx
import { useEffect, useState } from "react";
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

  // Dropdown / listeler
  const [sites, setSites] = useState([]);
  const [onayciCandidates, setOnayciCandidates] = useState([]);
  const [selectedOnayciIds, setSelectedOnayciIds] = useState([]);

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
  // Sayfa açılırken: Site listesi + Rol 90 personelleri çek
  // ------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      try {
        const [sitesRes, persRes] = await Promise.all([
          getDataAsync("SiteAptEvControllerSet/sites"),
          getDataAsync("personeller"),
        ]);

        if (cancelled) return;

        setSites(sitesRes || []);

        const allPersoneller = persRes || [];
        const rol90 = allPersoneller.filter(
          (p) => (p.rolKod ?? p.RolKod) === 90
        );

        setOnayciCandidates(rol90);

        const defaultOnayciIds = rol90
          .map((p) => p.id ?? p.Id)
          .filter((id) => id != null);

        setSelectedOnayciIds(defaultOnayciIds);
      } catch (err) {
        if (cancelled) return;
        console.error("LOOKUP FETCH ERROR:", err);
        setError(
          "Site veya onaycı listesi alınırken bir hata oluştu. Yine de formu doldurabilirsiniz."
        );
      }
    };

    fetchLookups();

    return () => {
      cancelled = true;
    };
  }, []);

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
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  // ------------------------------------------------------
  // Onaycı checkbox toggle
  // ------------------------------------------------------
  const toggleOnayci = (id) => {
    setSelectedOnayciIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ------------------------------------------------------
  // Submit
  // ------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personel) return;

    setError(null);

    if (!talepCinsi.trim()) {
      setError("Talep cinsi zorunludur.");
      return;
    }

    const talepEdenId = personel.id ?? personel.Id;
    if (!talepEdenId || talepEdenId === 0) {
      setError("Talep eden personel Id bulunamadı. Tekrar giriş yapmayı deneyin.");
      return;
    }

    const validMalzemeler = malzemeler
      .map((m) => ({ ...m, adet: m.adet === "" ? 0 : Number(m.adet) }))
      .filter((m) => m.malzemeAdi.trim() !== "");

    if (validMalzemeler.length === 0) {
      setError("En az bir malzeme girişi yapmalısınız.");
      return;
    }

    const onayciPersonelIdler =
      selectedOnayciIds.length > 0 ? selectedOnayciIds : null;

    const payload = {
      tarih: new Date().toISOString(),
      seriNo: null,
      talepEdenId,
      talepCinsi: talepCinsi.trim(),
      aciklama: aciklama.trim() || null,
      onayciPersonelIdler,
      malzemeler: validMalzemeler.map((m) => ({
        malzemeAdi: m.malzemeAdi.trim(),
        marka: m.marka.trim() || null,
        adet: m.adet || 0,
        birim: m.birim.trim() || null,
        kullanimAmaci: m.kullanimAmaci.trim() || null,
        ornekUrunLinki: m.ornekUrunLinki.trim() || null,
        not: m.not.trim() || null,
      })),
    };

    try {
      setSending(true);
      setSuccessInfo(null);

      // ⭐⭐ SADECE BURASI DEĞİŞTİ ⭐⭐
      const result = await postDataAsync(
        "SatinAlma",
        payload
      );

      setSuccessInfo(result);

      setSiteId("");
      setTalepCinsi("");
      setAciklama("");
      setSelectedOnayciIds([]);
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
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Teknik Müdür Paneli
                </p>
                {personel && (
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[11px] font-medium text-zinc-700">
                    {personel.ad} {personel.soyad} – {personel.rol}
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
                    (Bu linki tedarikçilere göndererek fiyat tekliflerini
                    toplayabilirsiniz.)
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
                  placeholder="Örn: Elektrik malzemesi alımı"
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Site seçimi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Site / Proje
                  <span className="ml-1 text-[10px] font-normal text-zinc-500">
                    (opsiyonel)
                  </span>
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seçiniz</option>
                  {sites.map((s) => {
                    const id = s.id ?? s.Id;
                    const ad = s.ad ?? s.Ad;
                    return (
                      <option key={id} value={id}>
                        {ad || `Site #${id}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Onaycılar */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-700">
                Onaycı Personeller (Rol 90)
                <span className="ml-1 text-[10px] font-normal text-zinc-500">
                  (varsayılan: hepsi seçili)
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
                    const checked = selectedOnayciIds.includes(id);

                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-1 rounded bg-white px-2 py-1 text-[11px] text-zinc-800 shadow-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={checked}
                          onChange={() => toggleOnayci(id)}
                        />
                        <span className="font-medium">
                          {ad} {soyad}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          ({rolAd})
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          #{id}
                        </span>
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

          {/* Malzemeler */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">
                Malzemeler
              </h2>
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
                      Malzeme Adı
                    </th>
                    <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                      Marka
                    </th>
                    <th className="border-b border-zinc-200 px-2 py-1 text-right font-medium">
                      Adet - Metre
                    </th>
                    <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                      Birim
                    </th>
                    <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                      Kullanım Amacı
                    </th>
                    <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                      Örnek Ürün Linki
                    </th>
                    <th className="border-b border-zinc-200 px-2 py-1 text-left font-medium">
                      Not
                    </th>
                    <th className="border-b border-zinc-200 px-2 py-1 text-center font-medium">
                      Sil
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {malzemeler.map((row, index) => (
                    <tr key={index} className="odd:bg-white even:bg-zinc-50">
                      <td className="border-b border-zinc-200 px-2 py-1 align-top">
                        <input
                          type="text"
                          value={row.malzemeAdi}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "malzemeAdi",
                              e.target.value
                            )
                          }
                          placeholder="Malzeme adı"
                          className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

                      <td className="border-b border-zinc-200 px-2 py-1 align-top">
                        <input
                          type="text"
                          value={row.marka}
                          onChange={(e) =>
                            handleRowChange(index, "marka", e.target.value)
                          }
                          placeholder="Marka"
                          className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

                      <td className="border-b border-zinc-200 px-2 py-1 align-top text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.adet}
                          onChange={(e) =>
                            handleRowChange(index, "adet", e.target.value)
                          }
                          placeholder="0"
                          className="w-full rounded border border-zinc-300 px-1 py-[3px] text-right text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

                      <td className="border-b border-zinc-200 px-2 py-1 align-top">
                        <input
                          type="text"
                          value={row.birim}
                          onChange={(e) =>
                            handleRowChange(index, "birim", e.target.value)
                          }
                          placeholder="Adet / Paket / Metre..."
                          className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

                      <td className="border-b border-zinc-200 px-2 py-1 align-top">
                        <input
                          type="text"
                          value={row.kullanimAmaci}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "kullanimAmaci",
                              e.target.value
                            )
                          }
                          placeholder="Kullanım amacı"
                          className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

                      <td className="border-b border-zinc-200 px-2 py-1 align-top">
                        <input
                          type="text"
                          value={row.ornekUrunLinki}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "ornekUrunLinki",
                              e.target.value
                            )
                          }
                          placeholder="https://..."
                          className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

                      <td className="border-b border-zinc-200 px-2 py-1 align-top">
                        <input
                          type="text"
                          value={row.not}
                          onChange={(e) =>
                            handleRowChange(index, "not", e.target.value)
                          }
                          placeholder="İsteğe bağlı not"
                          className="w-full rounded border border-zinc-300 px-1 py-[3px] text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

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
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-zinc-500">
              * Sadece <strong>Malzeme Adı</strong> doluysa bile kabul edilir.
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
              disabled={sending || !personel}
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
