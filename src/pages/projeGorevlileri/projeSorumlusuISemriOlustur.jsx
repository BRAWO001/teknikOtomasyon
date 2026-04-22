




// src/pages/projeGorevlileri/projeSorumlusuISemriOlustur.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

/**
 * Proje Sorumlusu İş Emri Oluştur
 *
 * - Site personelin bağlı olduğu aktif sitelerden gelir
 * - Tek site varsa düz gösterilir
 * - Çok site varsa kullanıcı seçer
 * - Diğer her şey aynı kalır
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

  const personelKodu = useMemo(() => {
    if (!personel) return null;
    return (
      personel?.personelKodu ||
      personel?.PersonelKodu ||
      personel?.kodu ||
      personel?.Kodu ||
      null
    );
  }, [personel]);

  // ----------------------------
  // Sites
  // ----------------------------
  const [sites, setSites] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [sitesError, setSitesError] = useState("");

  const [siteId, setSiteId] = useState("");

  const isSingleSiteLocked = useMemo(
    () => Array.isArray(sites) && sites.length === 1,
    [sites]
  );

  const getSiteId = (obj) =>
    obj?.SiteId ?? obj?.siteId ?? obj?.id ?? obj?.Id ?? null;

  const getSiteName = (obj) =>
    obj?.SiteAdi ??
    obj?.siteAdi ??
    obj?.Site?.Ad ??
    obj?.site?.ad ??
    obj?.Ad ??
    obj?.ad ??
    null;

  const selectedSite = useMemo(() => {
    const sid = String(siteId || "");
    if (!sid) return null;
    return sites.find((x) => String(getSiteId(x)) === sid) || null;
  }, [siteId, sites]);

  const selectedSiteName = useMemo(() => {
    return getSiteName(selectedSite) || null;
  }, [selectedSite]);

  // ----------------------------
  // Apt/Ev
  // ----------------------------
  const [apts, setApts] = useState([]);
  const [siteDetailLoading, setSiteDetailLoading] = useState(false);

  const [aptId, setAptId] = useState("");
  const [evId, setEvId] = useState("");

  const selectedApt = useMemo(() => {
    return apts.find((a) => Number(a.id) === Number(aptId)) || null;
  }, [apts, aptId]);

  // ----------------------------
  // Personeller
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

  const [isDisIs, setIsDisIs] = useState(false);
  const [isAcilIs, setIsAcilIs] = useState(false);

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
      setPersonel(parsed?.personel ?? parsed);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      router.replace("/");
    }
  }, [router]);

  // ----------------------------
  // Site listesi getir
  // ----------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchSites = async () => {
      if (!personelKodu) return;

      setLoadingLookups(true);
      setSitesError("");

      try {
        const resSites = await getDataAsync(
          `ProjeYoneticileri/site/personel/${encodeURIComponent(personelKodu)}`
        );

        if (cancelled) return;

        const normalized = Array.isArray(resSites)
          ? resSites
          : resSites
          ? [resSites]
          : [];

        setSites(normalized);

        if (!normalized.length) {
          setSiteId("");
          setSitesError("Bu kullanıcı için aktif site bulunamadı.");
          return;
        }

        const allowedIds = normalized
          .map((x) => String(getSiteId(x) ?? ""))
          .filter(Boolean);

        const directSiteId =
          personel?.siteId ||
          personel?.SiteId ||
          personel?.siteID ||
          personel?.SiteID ||
          null;

        if (directSiteId && allowedIds.includes(String(directSiteId))) {
          setSiteId(String(directSiteId));
          return;
        }

        setSiteId((prev) => {
          if (prev && allowedIds.includes(String(prev))) return String(prev);
          return String(allowedIds[0] || "");
        });
      } catch (err) {
        if (cancelled) return;
        console.error("SITE LIST ERROR:", err);
        setSites([]);
        setSiteId("");
        setSitesError("Site/proje bilgileri alınamadı. (endpoint kontrol edin)");
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    };

    fetchSites();

    return () => {
      cancelled = true;
    };
  }, [personelKodu, personel]);

  // ----------------------------
  // Site değişince apt/ev getir
  // ----------------------------
  useEffect(() => {
    const loadSiteDetail = async () => {
      if (!siteId) {
        setAptId("");
        setEvId("");
        setApts([]);
        return;
      }

      setAptId("");
      setEvId("");
      setApts([]);

      try {
        setSiteDetailLoading(true);
        setError("");

        const safeId = encodeURIComponent(String(siteId).trim());
        const data = await getDataAsync(`SiteAptEvControllerSet/sites/${safeId}`);

        setApts(Array.isArray(data?.aptler) ? data.aptler : []);
      } catch (err) {
        console.error("Site detay alınırken hata:", err);

        if (err?.response?.status === 404) {
          // sayfa tamamen bozulmasın
          setApts([]);
          setError(
            "Seçilen site için blok/bölüm listesi bulunamadı. (Site detay endpoint'i 404 döndü.)"
          );
        } else {
          setError(
            err?.message || "Seçilen site için bölümler alınırken hata oluştu."
          );
        }
      } finally {
        setSiteDetailLoading(false);
      }
    };

    loadSiteDetail();
  }, [siteId]);

  // ----------------------------
  // Personelleri çek
  // ----------------------------
  useEffect(() => {
    const loadPersoneller = async () => {
      try {
        setPersonelLoading(true);
        setPersonelError("");

        const data = await getDataAsync(
          "Personeller/ByDurum?rolKod=30&aktifMi=true"
        );
        setPersoneller(Array.isArray(data) ? data : []);
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
  // Personel seç / kaldır
  // ----------------------------
  const togglePersonel = (id) => {
    setSelectedPersonelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ----------------------------
  // Payload
  // ----------------------------
  const buildPayload = () => {
    return {
      siteId: siteId ? Number(siteId) : null,
      aptId: aptId ? Number(aptId) : null,
      evId: evId ? Number(evId) : null,
      kod_2: isAcilIs ? "ACIL" : null,
      kod_3: isDisIs ? "DIS_IS" : null,
      durum: 10,
      kisaBaslik: form.kisaBaslik?.trim(),
      aciklama: form.aciklama?.trim() ? form.aciklama.trim() : null,
      adresMetni: form.adresMetni?.trim() ? form.adresMetni.trim() : null,
      enlem: null,
      boylam: null,
    };
  };

  // ----------------------------
  // Validation
  // ----------------------------
  const validate = () => {
    if (!form.kisaBaslik.trim())
      return "Kısa başlık zorunlu. (Örn: Ortak alan – A Blok elektrik arızası)";
    if (!siteId) return "Site seçilmedi.";
    if (!aptId) return "Bölüm / blok seçmelisin.";
    return "";
  };

  // ----------------------------
  // Submit
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

      const res = await postDataAsync("is-emirleri/only", payload);
      setResult(res);

      const isEmriId = res?.id;
      if (isEmriId && selectedPersonelIds.length > 0) {
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

  // ----------------------------
  // Sonuç sonrası yönlendirme
  // ----------------------------
  useEffect(() => {
    if (!result) return;

    const timer = setTimeout(() => {
      router.push("/");
    }, 1500);

    return () => clearTimeout(timer);
  }, [result, router]);

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
                  Site: {selectedSiteName || "-"}
                </span>
              )}

              {isSingleSiteLocked && (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
                  (Otomatik tek site)
                </span>
              )}
            </div>
          </div>
        </div>

        {sitesError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {sitesError}
          </div>
        )}

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label={sites.length > 1 ? "Site Seçiniz" : "Site"}>
              {sites.length > 1 ? (
                <select
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  disabled={loadingLookups || !sites.length}
                >
                  {sites.map((s) => {
                    const id = getSiteId(s);
                    const ad = getSiteName(s) || "Site adı yok";

                    return (
                      <option key={id} value={String(id)}>
                        {ad}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="flex h-[38px] items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                  {loadingLookups
                    ? "Yükleniyor..."
                    : selectedSiteName || "Site bulunamadı"}
                </div>
              )}

              <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                {sites.length > 1
                  ? "Bağlı olduğunuz sitelerden seçim yapabilirsiniz."
                  : "Bu sayfada site otomatik gelmektedir."}
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
                    ? "Önce site seçilmeli"
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