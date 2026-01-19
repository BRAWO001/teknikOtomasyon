// src/pages/projeSorumlusuISemriOlustur.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

/**
 * Proje Sorumlusu İş Emri Oluştur
 *
 * TeknikIsEmriEkle.jsx ile neredeyse aynı:
 * - Site otomatik gelir (personelin tek sitesine kilitli)
 * - Diğer her şey aynı (apt/ev seçimi, personel atama, toggle'lar, payload, postlar)
 *
 * Varsayım:
 * - Lookups endpoint zaten var:  Personeller/satinalma-yeni/lookups?personelId=...
 *   Buradan sites + defaultSiteId (veya tek site) alıp siteyi otomatik set ediyoruz.
 *
 * Not:
 * - Apt/Ev listesi için yine SiteAptEvControllerSet/sites/{siteId} çağrılır.
 * - İş emri POST: is-emirleri/only
 * - Personel atama POST: Personeller/{isEmriId}/personeller
 */

export default function ProjeSorumlusuISemriOlustur() {
  const router = useRouter();

  // ----------------------------
  // Personel (cookie)
  // ----------------------------
  const [personel, setPersonel] = useState(null);
  const personelId = useMemo(() => {
    if (!personel) return null;
    return personel?.id ?? personel?.Id ?? null;
  }, [personel]);

  // ----------------------------
  // Sites (otomatik)
  // ----------------------------
  const [sites, setSites] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [sitesError, setSitesError] = useState("");

  const [siteId, setSiteId] = useState(""); // otomatik set edilecek
  const isSingleSiteLocked = useMemo(
    () => Array.isArray(sites) && sites.length === 1,
    [sites]
  );

  const getId = (obj) => obj?.id ?? obj?.Id;
  const getAd = (obj) => obj?.ad ?? obj?.Ad;

  const selectedSiteName = useMemo(() => {
    const sid = siteId ? Number(siteId) : null;
    if (!sid) return null;
    const s = sites.find((x) => Number(getId(x)) === sid);
    return s ? getAd(s) : null;
  }, [siteId, sites]);

  // ----------------------------
  // Apt/Ev
  // ----------------------------
  const [apts, setApts] = useState([]);
  const [siteDetailLoading, setSiteDetailLoading] = useState(false);

  const [aptId, setAptId] = useState("");
  const [evId, setEvId] = useState("");

  const selectedApt = useMemo(() => {
    return apts.find((a) => a.id === Number(aptId)) || null;
  }, [apts, aptId]);

  // ----------------------------
  // Personeller (atanacak teknik ekip)
  // ----------------------------
  const [personeller, setPersoneller] = useState([]);
  const [personelLoading, setPersonelLoading] = useState(true);
  const [personelError, setPersonelError] = useState("");
  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);

  // ----------------------------
  // Form
  // ----------------------------
  const [form, setForm] = useState({
    kisaBaslik: "",
    aciklama: "",
    adresMetni: "",
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Togglelar (aynı)
  const [isDisIs, setIsDisIs] = useState(false);
  const [isAcilIs, setIsAcilIs] = useState(false);

  // Submit state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // ----------------------------
  // Cookie oku
  // ----------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const c = getClientCookie("PersonelUserInfo");
      if (!c) {
        router.replace("/");
        return;
      }
      const parsed = JSON.parse(c);
      // bazı projelerde { personel: {...} } formatı var
      setPersonel(parsed?.personel ?? parsed);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      router.replace("/");
    }
  }, [router]);

  // ----------------------------
  // Lookups -> site otomatik
  // ----------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      if (!personelId) return;

      setLoadingLookups(true);
      setSitesError("");

      try {
        // ✅ Satınalma sayfasında kullandığın aynı endpoint
        const res = await getDataAsync(
          `Personeller/satinalma-yeni/lookups?personelId=${personelId}`
        );

        if (cancelled) return;

        const resSites = res?.sites || [];
        const defaultSiteId = res?.defaultSiteId ?? null;

        setSites(resSites);

        // Site seçimi:
        // - tek site => otomatik
        // - defaultSiteId varsa => otomatik
        // - aksi halde: burada da otomatik olsun istiyorsun ama veri yoksa seçtiremeyiz
        //   (bu durumda hata basıyoruz)
        if (Array.isArray(resSites) && resSites.length === 1) {
          const onlyId = getId(resSites[0]);
          setSiteId(onlyId ? String(onlyId) : "");
        } else if (defaultSiteId) {
          setSiteId(String(defaultSiteId));
        } else if (Array.isArray(resSites) && resSites.length > 0) {
          // default yok ama liste var -> ilkini otomatik seçelim (proje sorumlusu sayfası)
          const firstId = getId(resSites[0]);
          setSiteId(firstId ? String(firstId) : "");
        } else {
          setSiteId("");
          setSitesError("Bu kullanıcı için otomatik site bulunamadı.");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("LOOKUPS ERROR:", err);
        setSitesError(
          "Site/proje bilgileri alınamadı. (404 ise backend endpoint yok demektir.)"
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

  // ----------------------------
  // SiteId set olunca aptleri çek (otomatik)
  // ----------------------------
  useEffect(() => {
    const loadSiteDetail = async () => {
      if (!siteId) return;

      // site değişince alt seçimleri sıfırla
      setAptId("");
      setEvId("");
      setApts([]);

      try {
        setSiteDetailLoading(true);
        setError("");

        const data = await getDataAsync(`SiteAptEvControllerSet/sites/${siteId}`);
        setApts(data?.aptler || []);
      } catch (err) {
        console.error("Site detay alınırken hata:", err);
        setError(
          err?.message || "Seçilen site için bölümler alınırken hata oluştu."
        );
      } finally {
        setSiteDetailLoading(false);
      }
    };

    loadSiteDetail();
  }, [siteId]);

  // ----------------------------
  // Personelleri çek (aynı)
  // ----------------------------
  useEffect(() => {
    const loadPersoneller = async () => {
      try {
        setPersonelLoading(true);
        setPersonelError("");

        const data = await getDataAsync(
          "Personeller/ByDurum?rolKod=30&aktifMi=true"
        );
        setPersoneller(data || []);
      } catch (err) {
        console.error("Personel listesi alınırken hata:", err);
        setPersonelError(
          err?.message || "Personel listesi alınırken bir hata oluştu."
        );
      } finally {
        setPersonelLoading(false);
      }
    };

    loadPersoneller();
  }, []);

  // ----------------------------
  // Personel seç / kaldır (aynı)
  // ----------------------------
  const togglePersonel = (id) => {
    setSelectedPersonelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ----------------------------
  // Payload (aynı, sadece siteId otomatik)
  // ----------------------------
  const buildPayload = () => {
    return {
      siteId: siteId ? Number(siteId) : null,
      aptId: aptId ? Number(aptId) : null,
      evId: evId ? Number(evId) : null, // opsiyonel

      kod_2: isAcilIs ? "ACIL" : null,
      kod_3: isDisIs ? "DIS_IS" : null,
      durum: 10, // Beklemede

      kisaBaslik: form.kisaBaslik?.trim(),
      aciklama: form.aciklama?.trim() ? form.aciklama.trim() : null,

      adresMetni: form.adresMetni?.trim() ? form.adresMetni.trim() : null,
      enlem: null,
      boylam: null,
    };
  };

  // ----------------------------
  // Validation (aynı - site otomatik ama boş kalırsa hata)
  // ----------------------------
  const validate = () => {
    if (!form.kisaBaslik.trim())
      return "Kısa başlık zorunlu. (Örn: Ortak alan – A Blok elektrik arızası)";
    if (!siteId) return "Otomatik site bulunamadı. (Lookups kontrol edin)";
    if (!aptId) return "Bölüm / blok seçmelisin.";
    return "";
  };

  // ----------------------------
  // Submit (aynı)
  // ----------------------------
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const payload = buildPayload();

    try {
      setLoading(true);

      // 1) iş emrini oluştur
      const res = await postDataAsync("is-emirleri/only", payload);
      setResult(res);

      const isEmriId = res?.id;
      if (isEmriId && selectedPersonelIds.length > 0) {
        // 2) seçili personelleri ata
        const body = selectedPersonelIds.map((pid) => ({ personelId: pid }));

        try {
          await postDataAsync(`Personeller/${isEmriId}/personeller`, body);
        } catch (assignErr) {
          console.error("Personel ataması sırasında hata:", assignErr);
          setError(
            assignErr?.message ||
              "İş emri oluşturuldu fakat personel ataması sırasında hata oluştu."
          );
        }
      }
    } catch (err) {
      console.error("İş emri oluşturulurken hata:", err);
      setError(err?.message || "İş emri oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ İş emri oluşturulunca 1.5 saniye sonra geri git (aynı)
  useEffect(() => {
    if (!result) return;

    const timer = setTimeout(() => {
      router.push("/");
    }, 1500);

    return () => clearTimeout(timer);
  }, [result, router]);

  // ------------------------------------------------------
  // JSX
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Proje Sorumlusu – İş Emri Oluştur
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
              {personel ? (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
                  {personel?.ad ?? personel?.Ad} {personel?.soyad ?? personel?.Soyad}
                  {personel?.rol ? ` – ${personel.rol}` : ""}
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
                  Personel okunuyor...
                </span>
              )}

              {loadingLookups ? (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
                  Site bilgileri yükleniyor...
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Site: {selectedSiteName || (siteId ? `#${siteId}` : "-")}
                </span>
              )}

              {isSingleSiteLocked && (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
                  (Otomatik kilitli)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lookups hata */}
        {sitesError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {sitesError}
          </div>
        )}

        {/* Personel load hata */}
        {personelLoading && (
          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-100 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            Personeller yükleniyor...
          </div>
        )}

        {personelError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {personelError}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* Site (otomatik) + Bölüm + Ev */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Site (otomatik)">
              <div className="flex h-[38px] items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                {loadingLookups
                  ? "Yükleniyor..."
                  : selectedSiteName || (siteId ? `Site #${siteId}` : "Site bulunamadı")}
              </div>
              <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                Bu sayfada site seçimi otomatik yapılır.
              </div>
            </Field>

            <Field label="Bölüm / Blok">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={aptId}
                onChange={(e) => {
                  setAptId(e.target.value);
                  setEvId("");
                }}
                disabled={!siteId || siteDetailLoading}
              >
                <option value="">
                  {!siteId
                    ? "Önce site bulunmalı"
                    : siteDetailLoading
                    ? "Yükleniyor..."
                    : "Seçiniz"}
                </option>
                {apts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ad}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Ev (opsiyonel)">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={evId}
                onChange={(e) => setEvId(e.target.value)}
                disabled={!aptId}
              >
                <option value="">
                  {!aptId ? "Önce bölüm seç" : "Daire seç (opsiyonel)"}
                </option>
                {(selectedApt?.evler || []).map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.kapiNo
                      ? `Kapı ${ev.kapiNo} ${ev.pkNo ? `— ${ev.pkNo}` : ""}`
                      : `Ev #${ev.id}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Togglelar (aynı) */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200">
            <button
              type="button"
              onClick={() => setIsDisIs((v) => !v)}
              className={[
                "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition",
                isDisIs
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-zinc-400 bg-zinc-300 dark:border-zinc-600 dark:bg-zinc-700",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                  isDisIs ? "translate-x-4" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
            <span>
              <span className="font-semibold">DIŞ İŞ</span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200">
            <button
              type="button"
              onClick={() => setIsAcilIs((v) => !v)}
              className={[
                "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition",
                isAcilIs
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-zinc-400 bg-zinc-300 dark:border-zinc-600 dark:bg-zinc-700",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                  isAcilIs ? "translate-x-4" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
            <span>
              <span className="font-semibold">ACİL İŞ</span>
            </span>
          </div>

          {/* Kısa başlık & açıklama & adres */}
          <div className="mt-4">
            <Field label="Kısa Başlık (zorunlu)">
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.kisaBaslik}
                onChange={(e) => setField("kisaBaslik", e.target.value)}
                placeholder="Örn: Ortak alan – A Blok elektrik arızası"
              />
            </Field>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Açıklama">
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                  value={form.aciklama}
                  onChange={(e) => setField("aciklama", e.target.value)}
                  placeholder="Detaylı açıklama..."
                />
              </Field>

              <Field label="Adres Metni">
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                  value={form.adresMetni}
                  onChange={(e) => setField("adresMetni", e.target.value)}
                  placeholder="Örn: NÜANS – A Blok – Ortak alan giriş holü"
                />
              </Field>
            </div>
          </div>

          {/* Personel ata (aynı) */}
          <div className="mt-3">
            <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Personel Ata (opsiyonel – birden fazla seçebilirsin)
            </div>

            {personeller.length === 0 && !personelLoading && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Kayıtlı personel bulunamadı.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {personeller.map((p) => {
                const id = p.id;
                const adSoyad =
                  p.adSoyad || `${p.ad || ""} ${p.soyad || ""}`.trim();
                const selected = selectedPersonelIds.includes(id);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePersonel(id)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      selected
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {adSoyad || `Personel #${id}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hata / sonuç */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              <div className="font-semibold">İş emri oluşturuldu ✅</div>
              <div className="mt-1 text-xs">
                {result.id && (
                  <>
                    ID: <span className="font-semibold">{result.id}</span>{" "}
                  </>
                )}
                {result.kod && (
                  <>
                    — Kod: <span className="font-semibold">{result.kod}</span>
                  </>
                )}
                {selectedPersonelIds.length > 0 && (
                  <span className="ml-1">
                    — Atanan personel sayısı:{" "}
                    <span className="font-semibold">
                      {selectedPersonelIds.length}
                    </span>
                  </span>
                )}
                {isDisIs && (
                  <span className="ml-1">
                    — <span className="font-semibold">DIŞ İŞ</span>
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-200">
                1.5 saniye içinde teknik ana sayfaya yönlendirileceksiniz...
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-5 flex items-center justify-end gap-3">
            {!result && (
              <button
                type="submit"
                disabled={loading || loadingLookups}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                {loading ? "Gönderiliyor..." : "İş Emri Oluştur"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      {children}
    </label>
  );
}
