// src/pages/teknikIsEmriEkle.jsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "../utils/apiService"; // PATH'i projene göre ayarla

export default function TeknikIsEmriEkle() {
  const router = useRouter();

  // API'den gelen site listesi
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");

  // Seçilen siteye ait aptler (bölümler)
  const [apts, setApts] = useState([]);
  const [siteDetailLoading, setSiteDetailLoading] = useState(false);

  // API'den gelen personel listesi
  const [personeller, setPersoneller] = useState([]);
  const [personelLoading, setPersonelLoading] = useState(true);
  const [personelError, setPersonelError] = useState("");
  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]); // [4,5,6] gibi

  // Form state
  const [form, setForm] = useState({
    siteId: "",
    aptId: "",
    evId: "", // opsiyonel
    kisaBaslik: "",
    aciklama: "",
    adresMetni: "",
  });

  // DIŞ İŞ toggle
  const [isDisIs, setIsDisIs] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedSite = sites.find((s) => s.id === Number(form.siteId)) || null;
  const selectedApt = apts.find((a) => a.id === Number(form.aptId)) || null;
  const selectedEv =
    selectedApt?.evler?.find((e) => e.id === Number(form.evId)) || null;

  // ============================
  // 1) SAYFA AÇILINCA SİTELERİ ÇEK
  // ============================
  useEffect(() => {
    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError("");
        const data = await getDataAsync("SiteAptEvControllerSet/sites");
        setSites(data || []);
      } catch (err) {
        console.error("Site listesi alınırken hata:", err);
        setSitesError(
          err?.message || "Site listesi alınırken bir hata oluştu."
        );
      } finally {
        setSitesLoading(false);
      }
    };

    loadSites();
  }, []);

  // ============================
  // 2) SAYFA AÇILINCA PERSONELLERİ ÇEK
  // ============================
  useEffect(() => {
    const loadPersoneller = async () => {
      try {
        setPersonelLoading(true);
        setPersonelError("");
        const data = await getDataAsync("Personeller");
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

  // ============================
  // 3) Site değişince apt'leri çek
  // ============================
  const onSiteChange = async (v) => {
    setForm((prev) => ({
      ...prev,
      siteId: v,
      aptId: "",
      evId: "",
    }));
    setApts([]);

    if (!v) return;

    try {
      setSiteDetailLoading(true);
      setError("");

      const data = await getDataAsync(`SiteAptEvControllerSet/sites/${v}`);
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

  const onAptChange = (v) => {
    setForm((prev) => ({
      ...prev,
      aptId: v,
      evId: "",
    }));
  };

  // ============================
  // 4) PERSONEL SEÇ / KALDIR
  // ============================
  const togglePersonel = (id) => {
    setSelectedPersonelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ============================
  // 5) PAYLOAD HAZIRLAMA
  // ============================
  const buildPayload = () => {
    return {
      siteId: form.siteId ? Number(form.siteId) : null,
      aptId: form.aptId ? Number(form.aptId) : null,
      evId: form.evId ? Number(form.evId) : null, // opsiyonel

      kod_2: "TEKNIK", // sabit
      kod_3: isDisIs ? "DIS_IS" : null, // DIŞ İŞ toggle'a göre
      durum: 10, // Beklemede

      kisaBaslik: form.kisaBaslik?.trim(),
      aciklama: form.aciklama?.trim() ? form.aciklama.trim() : null,

      adresMetni: form.adresMetni?.trim() ? form.adresMetni.trim() : null,
      enlem: null,
      boylam: null,
    };
  };

  // ============================
  // 6) VALIDATION
  // ============================
  const validate = () => {
    if (!form.kisaBaslik.trim())
      return "Kısa başlık zorunlu. (Örn: Ortak alan – A Blok elektrik arızası)";
    if (!form.siteId) return "Site seçmelisin.";
    if (!form.aptId) return "Bölüm / blok seçmelisin.";
    // evId opsiyonel
    return "";
  };

  // ============================
  // 7) SUBMIT
  // ============================
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

      // 1) Önce iş emrini oluştur
      const res = await postDataAsync("is-emirleri/only", payload);
      setResult(res);

      const isEmriId = res?.id;
      if (isEmriId && selectedPersonelIds.length > 0) {
        // 2) Sonra seçili personelleri bu iş emrine ata
        const body = selectedPersonelIds.map((pid) => ({
          personelId: pid,
        }));

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

  // Debug JSON
  const buildDebugPayload = () => ({
    ...buildPayload(),
    atananPersoneller: selectedPersonelIds,
    isDisIs,
  });

  // ✅ İş emri oluşturulunca 1.5 saniye sonra geri git
  useEffect(() => {
    if (!result) return;

    const timer = setTimeout(() => {
      router.push("/teknikMudur");
    }, 1500);

    return () => clearTimeout(timer);
  }, [result, router]);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Teknik İş Emri Ekle
          </h1>

          
        </div>

        {/* Site / Personel yüklenme hataları */}
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
          {/* Site / Bölüm / Ev */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

            <Field label="Bölüm / Blok">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.aptId}
                onChange={(e) => onAptChange(e.target.value)}
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

            <Field label="Ev (opsiyonel)">
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.evId}
                onChange={(e) => setField("evId", e.target.value)}
                disabled={!form.aptId}
              >
                <option value="">
                  {!form.aptId ? "Önce bölüm seç" : "Daire seç (opsiyonel)"}
                </option>
                {(selectedApt?.evler || []).map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.kapiNo
                      ? `Kapı ${ev.kapiNo} ${
                          ev.pkNo ? `— ${ev.pkNo}` : ""
                        }`
                      : `Ev #${ev.id}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* DIŞ İŞ toggle */}
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
              <span className="font-semibold">DIŞ İŞ</span>{" "}
            </span>
          </div>

          {/* Kısa başlık & açıklama */}
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
                  placeholder="Örn: Lusso – A Blok – Ortak alan giriş holü"
                />
              </Field>
            </div>
          </div>

          {/* Personel seçimi */}
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
                    — Kod:{" "}
                    <span className="font-semibold">{result.kod}</span>
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
                disabled={loading}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                {loading ? "Gönderiliyor..." : "İş Emri Oluştur"}
              </button>
            )}
          </div>

          {/* Debug payload */}
          {/* <details className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
            <summary className="cursor-pointer font-semibold">
              Debug: Gönderilen JSON (+ atanacak personeller / DIŞ İŞ)
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(buildDebugPayload(), null, 2)}
            </pre>
          </details> */}
        </form>

        {/* <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          İş Emri Endpoint:{" "}
          <span className="font-semibold">
            https://localhost:7289/api/is-emirleri/only
          </span>
          <br />
          Personel Atama Endpoint:{" "}
          <span className="font-semibold">
            https://localhost:7289/api/Personeller/{"{isEmriId}"}/personeller
          </span>
        </div> */}
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
