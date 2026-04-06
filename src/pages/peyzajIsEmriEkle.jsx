// src/pages/peyzajIsEmriEkle.jsx

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "../utils/apiService";

export default function PeyzajIsEmriEkle() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");

  const [apts, setApts] = useState([]);
  const [siteDetailLoading, setSiteDetailLoading] = useState(false);

  const [personeller, setPersoneller] = useState([]);
  const [personelLoading, setPersonelLoading] = useState(true);
  const [personelError, setPersonelError] = useState("");

  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);

  const [form, setForm] = useState({
    isEmriTipi: "PEYZAJ", // PEYZAJ | HAVUZ
    siteId: "",
    aptId: "",
    kisaBaslik: "",
    aciklama: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedSite = useMemo(() => {
    return sites.find((x) => Number(x.id) === Number(form.siteId)) || null;
  }, [sites, form.siteId]);

  const selectedApt = useMemo(() => {
    return apts.find((x) => Number(x.id) === Number(form.aptId)) || null;
  }, [apts, form.aptId]);

  const isHavuz = form.isEmriTipi === "HAVUZ";
  const sayfaBaslik = "Havuz / Peyzaj İş Emri Oluştur";

  const kisaBaslikPlaceholder = isHavuz
    ? "Örn: Havuz motor dairesi kontrolü"
    : "Örn: Peyzaj sulama hattı arızası";

  const aciklamaPlaceholder = isHavuz
    ? "Havuz işi detayını yaz..."
    : "Peyzaj işi detayını yaz...";

  useEffect(() => {
    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError("");
        const data = await getDataAsync("SiteAptEvControllerSet/sites");
        setSites(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Site listesi alınırken hata:", err);
        setSitesError(
          err?.response?.data?.message ||
            err?.message ||
            "Site listesi alınırken hata oluştu."
        );
      } finally {
        setSitesLoading(false);
      }
    };

    loadSites();
  }, []);

  useEffect(() => {
    const loadPersoneller = async () => {
      try {
        setPersonelLoading(true);
        setPersonelError("");

        // Peyzaj = 33, Havuz = 34
        const rolKod = form.isEmriTipi === "HAVUZ" ? 34 : 33;

        const data = await getDataAsync(
          `Personeller/ByDurum?rolKod=${rolKod}&aktifMi=true`
        );

        setPersoneller(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Personel listesi alınırken hata:", err);
        setPersonelError(
          err?.response?.data?.message ||
            err?.message ||
            "Personel listesi alınırken hata oluştu."
        );
        setPersoneller([]);
      } finally {
        setPersonelLoading(false);
      }
    };

    loadPersoneller();
  }, [form.isEmriTipi]);

  // Tür değişince eski seçili personeller temizlensin
  useEffect(() => {
    setSelectedPersonelIds([]);
  }, [form.isEmriTipi]);

  const onSiteChange = async (value) => {
    setForm((prev) => ({
      ...prev,
      siteId: value,
      aptId: "",
    }));
    setApts([]);
    setError("");

    if (!value) return;

    try {
      setSiteDetailLoading(true);
      const data = await getDataAsync(`SiteAptEvControllerSet/sites/${value}`);
      setApts(Array.isArray(data?.aptler) ? data.aptler : []);
    } catch (err) {
      console.error("Site detay alınırken hata:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Seçilen site için bloklar alınırken hata oluştu."
      );
    } finally {
      setSiteDetailLoading(false);
    }
  };

  const togglePersonel = (id) => {
    setSelectedPersonelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validate = () => {
    if (!form.siteId) return "Site seçmelisin.";
    if (!form.aptId) return "Blok / bölüm seçmelisin.";
    if (!form.kisaBaslik?.trim()) return "Kısa başlık zorunlu.";
    return "";
  };

  const buildPayload = () => {
    return {
      siteId: form.siteId ? Number(form.siteId) : 0,
      aptId: form.aptId ? Number(form.aptId) : 0,
      kod_2: form.isEmriTipi === "HAVUZ" ? "HAVUZ" : "PEYZAJ",
      durum: 10,
      kisaBaslik: form.kisaBaslik?.trim(),
      aciklama: form.aciklama?.trim() ? form.aciklama.trim() : null,
      personeller: selectedPersonelIds.map((pid, index) => ({
        personelId: pid,
        sira: index + 1,
        not: null,
      })),
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = buildPayload();

    try {
      setLoading(true);

      const res = await postDataAsync("peyzaj-is-emri-formu", payload);

      setResult({
        id: res?.id || res?.Id || null,
        kod: res?.kod || res?.Kod || null,
        message:
          res?.message ||
          res?.Message ||
          "İş emri formu oluşturuldu.",
        personellers: res?.personeller || res?.Personeller || [],
      });
    } catch (err) {
      console.error("İş emri oluşturulurken hata:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "İş emri oluşturulurken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!result?.id) return;

    const timer = setTimeout(() => {
      router.push("/teknikMudur");
    }, 1500);

    return () => clearTimeout(timer);
  }, [result, router]);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {sayfaBaslik}
            </h1>
          </div>
        </div>

        {sitesLoading && (
          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-100 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            Siteler yükleniyor...
          </div>
        )}

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
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setField("isEmriTipi", "PEYZAJ")}
                className={`group rounded-2xl border px-6 py-5 text-left transition-all duration-200 ${
                  form.isEmriTipi === "PEYZAJ"
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "border-zinc-300 bg-white text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-emerald-700 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
                      İş Emri Türü
                    </div>
                    <div className="mt-2 text-2xl font-extrabold leading-none">
                      Peyzaj
                    </div>
                    <div
                      className={`mt-3 text-sm ${
                        form.isEmriTipi === "PEYZAJ"
                          ? "text-white/90"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      Bahçe, sulama, çevre düzeni ve peyzaj işleri
                    </div>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold ${
                      form.isEmriTipi === "PEYZAJ"
                        ? "border-white/30 bg-white/15 text-white"
                        : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    }`}
                  >
                    {form.isEmriTipi === "PEYZAJ" ? "✓" : "P"}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setField("isEmriTipi", "HAVUZ")}
                className={`group rounded-2xl border px-6 py-5 text-left transition-all duration-200 ${
                  form.isEmriTipi === "HAVUZ"
                    ? "border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                    : "border-zinc-300 bg-white text-zinc-800 hover:border-sky-300 hover:bg-sky-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-sky-700 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
                      İş Emri Türü
                    </div>
                    <div className="mt-2 text-2xl font-extrabold leading-none">
                      Havuz
                    </div>
                    <div
                      className={`mt-3 text-sm ${
                        form.isEmriTipi === "HAVUZ"
                          ? "text-white/90"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      Havuz ekipmanı, bakım ve teknik havuz işlemleri
                    </div>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold ${
                      form.isEmriTipi === "HAVUZ"
                        ? "border-white/30 bg-white/15 text-white"
                        : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    }`}
                  >
                    {form.isEmriTipi === "HAVUZ" ? "✓" : "H"}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Site">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.siteId}
                onChange={(e) => onSiteChange(e.target.value)}
              >
                <option value="">Seçiniz</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Blok / Bölüm">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.aptId}
                onChange={(e) => setField("aptId", e.target.value)}
                disabled={!form.siteId || siteDetailLoading}
              >
                <option value="">
                  {!form.siteId
                    ? "Önce site seç"
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
          </div>

          {(selectedSite || selectedApt) && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <MiniInfo label="Tür" value={isHavuz ? "Havuz" : "Peyzaj"} />
              <MiniInfo label="Seçilen Site" value={selectedSite?.ad || "-"} />
              <MiniInfo label="Seçilen Blok" value={selectedApt?.ad || "-"} />
            </div>
          )}

          <div className="mt-4">
            <Field label="Kısa Başlık">
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.kisaBaslik}
                onChange={(e) => setField("kisaBaslik", e.target.value)}
                placeholder={kisaBaslikPlaceholder}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Açıklama">
              <textarea
                rows={5}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.aciklama}
                onChange={(e) => setField("aciklama", e.target.value)}
                placeholder={aciklamaPlaceholder}
              />
            </Field>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {isHavuz ? "Havuz Personeli Görevlendir" : "Peyzaj Personeli Görevlendir"}
            </div>

            <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
              {personeller.length === 0 ? (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Uygun personel bulunamadı.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {personeller.map((p) => {
                    const personelId = p.id;
                    const selected = selectedPersonelIds.includes(personelId);
                    const adSoyad =
                      p.adSoyad ||
                      [p.ad, p.soyad].filter(Boolean).join(" ").trim() ||
                      p.personelKodu ||
                      `Personel #${personelId}`;

                    return (
                      <button
                        key={personelId}
                        type="button"
                        onClick={() => togglePersonel(personelId)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          selected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {adSoyad}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Seçilen personel sayısı: {selectedPersonelIds.length}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {typeof error === "string" ? error : JSON.stringify(error)}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              <div className="font-semibold">Kayıt başarılı ✅</div>
              <div className="mt-1">{result.message}</div>
              <div className="mt-1 text-xs">
                {result.id ? (
                  <>
                    ID: <span className="font-semibold">{result.id}</span>
                  </>
                ) : null}
                {result.kod ? (
                  <>
                    {" "}
                    — Kod: <span className="font-semibold">{result.kod}</span>
                  </>
                ) : null}
              </div>

              {Array.isArray(result.personellers) &&
                result.personellers.length > 0 && (
                  <div className="mt-2 text-xs">
                    Görevlendirilen personel sayısı:{" "}
                    <span className="font-semibold">
                      {result.personellers.length}
                    </span>
                  </div>
                )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end">
            {!result && (
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {loading ? "Kaydediliyor..." : "İş Emri Oluştur"}
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
      <div className="mb-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      {children}
    </label>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

