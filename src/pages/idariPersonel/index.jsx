// src/pages/idariPersonel/index.jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";

// Teknik iş emirleri – durum filtreleri
const TEKNIK_STATUS_FILTERS = [
  { key: "ALL", label: "Tüm İşler", description: "0–100 tüm iş emirleri" },
  {
    key: "DEVAM",
    label: "Devam Edenler",
    description: "%100 olmayan tüm işler",
  },
  {
    key: "BITEN",
    label: "Biten İşler",
    description: "Sadece %100 (tamamlanmış) işler",
  },
];

// Teknik iş emirleri backend path builder
function buildTeknikPath({
  statusFilter,
  startDate,
  endDate,
  siteId,
  personelId,
}) {
  const qs = [];

  if (personelId) qs.push(`personelId=${encodeURIComponent(personelId)}`);
  if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);
  if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);

  const statusKey = statusFilter || "ALL";
  qs.push(`status=${encodeURIComponent(statusKey)}`);

  const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";

  // API: GET /api/Personeller/teknikMudurFilterGet
  return `personeller/teknikMudurFilterGet${queryString}`;
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function IdariPersonelListePage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [tamOnaylananlar, setTamOnaylananlar] = useState([]); // İDARİ – Tüm onaycılar onaylamış
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // İDARİ filtre state'leri
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return toDateInputValue(d);
  }); // "yyyy-MM-dd"
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return toDateInputValue(d);
  }); // "yyyy-MM-dd"
  const [siteId, setSiteId] = useState("");

  // Site listesi (hem idari hem teknik için kullanılacak)
  const [sites, setSites] = useState([]);

  // Çıkış
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
    }
  };

  // Yeni satın alma talebi → idariPersonel/yeni.jsx
  const handleYeniTalep = () => {
    router.push("/idariPersonel/yeni");
  };

  // ------------------------------------------------------
  // Personel cookie'sini oku (idari personel bilgisi)
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // Site listesini çek (filtre dropdown'u için)
  // ------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        const res = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(res || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
        // Hata olsa bile sayfa çalışmaya devam eder
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------------------------------------------
  // İDARİ – Tüm onaycıları onaylamış talepleri filtrelerle yükle
  // GET: /api/satinalma/idariPersonelSatinAlmaGetir/onaylananlarTumOnaycilar
  // ------------------------------------------------------
  const fetchIdariTamOnaylananlar = async () => {
    try {
      setLoading(true);
      setError(null);

      const qs = [];
      if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);
      if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);

      const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";

      const url = `satinalma/idariPersonelSatinAlmaGetir/onaylananlarTumOnaycilar${queryString}`;
      const fullApprovedData = await getDataAsync(url);

      setTamOnaylananlar(fullApprovedData || []);
    } catch (err) {
      console.error("IDARI KONTROL SATINALMA LIST ERROR:", err);
      setError(
        "İdari: Tüm onaycıları tarafından onaylanmış satın alma talepleri alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  // İlk açılışta (backend default tarih mantığıyla) yükle
  useEffect(() => {
    fetchIdariTamOnaylananlar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterApply = async () => {
    await fetchIdariTamOnaylananlar();
  };

  const handleFilterReset = async () => {
    setStartDate("");
    setEndDate("");
    setSiteId("");
    await fetchIdariTamOnaylananlar();
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // ======================================================
  // AŞAĞI: TEKNİK İŞ EMİRLERİ BLOĞU İÇİN STATE + LOGİK
  // ======================================================

  // Teknik iş emri state'leri
  const [teknikIsEmirleri, setTeknikIsEmirleri] = useState([]);
  const [teknikStatusFilter, setTeknikStatusFilter] = useState("ALL"); // ALL | DEVAM | BITEN
  const [teknikLoading, setTeknikLoading] = useState(false);
  const [teknikError, setTeknikError] = useState(null);

  // Teknik filtre state'leri
  const [teknikFilterPersonelId, setTeknikFilterPersonelId] = useState("");
  const [teknikFilterSiteId, setTeknikFilterSiteId] = useState("");
  const [teknikStartDate, setTeknikStartDate] = useState("");
  const [teknikEndDate, setTeknikEndDate] = useState("");

  // Teknik personel listesi (dropdown)
  const [teknikPersonelList, setTeknikPersonelList] = useState([]);

  // Teknik personel listesi (sadece teknik personeller – rolKod=30, aktif=true)
  useEffect(() => {
    let cancelled = false;

    const loadPersonelList = async () => {
      try {
        const res = await getDataAsync(
          "Personeller/ByDurum?rolKod=30&aktifMi=true"
        );
        if (cancelled) return;
        setTeknikPersonelList(res || []);
      } catch (err) {
        console.error("PERSONELLER FETCH ERROR:", err);
      }
    };

    loadPersonelList();

    return () => {
      cancelled = true;
    };
  }, []);

  // Teknik iş emirlerini backend'den çek
  const fetchTeknikIsEmirleri = async (options = {}) => {
    try {
      setTeknikLoading(true);
      setTeknikError(null);

      const path = buildTeknikPath({
        statusFilter: options.statusFilter ?? teknikStatusFilter,
        startDate: options.startDate ?? teknikStartDate,
        endDate: options.endDate ?? teknikEndDate,
        siteId: options.siteId ?? teknikFilterSiteId,
        personelId: options.personelId ?? teknikFilterPersonelId,
      });

      const data = await getDataAsync(path);
      const list = Array.isArray(data) ? data : data ? [data] : [];

      setTeknikIsEmirleri(list);
    } catch (err) {
      console.error("İş emirleri yüklenirken hata:", err);
      setTeknikError(err.message || "Bilinmeyen bir hata oluştu.");
      setTeknikIsEmirleri([]);
    } finally {
      setTeknikLoading(false);
    }
  };

  // Teknik durum filtresi değiştiğinde otomatik yükle
  useEffect(() => {
    fetchTeknikIsEmirleri({ statusFilter: teknikStatusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teknikStatusFilter]);

  // Sayfa ilk açılışında teknik iş emirlerini yükle (backend default)
  useEffect(() => {
    fetchTeknikIsEmirleri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTeknikRefresh = async () => {
    await fetchTeknikIsEmirleri();
  };

  const handleTeknikFilterApply = async () => {
    await fetchTeknikIsEmirleri();
  };

  const handleTeknikFilterReset = async () => {
    setTeknikFilterPersonelId("");
    setTeknikFilterSiteId("");
    setTeknikStartDate("");
    setTeknikEndDate("");
    setTeknikStatusFilter("ALL");
    // status filter değişince zaten fetch tetikleniyor
  };

  const teknikActiveFilterObj =
    TEKNIK_STATUS_FILTERS.find((f) => f.key === teknikStatusFilter) ||
    TEKNIK_STATUS_FILTERS[0];

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Üst başlık + butonlar */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-300">
              İdari Personel
            </h1>

            {personel && (
              <p className="mt-1 text-[16px] text-emerald-500 dark:text-emerald-400">
                İdari Personel:{" "}
                <span className="font-semibold">
                  {personel.ad} {personel.soyad}
                </span>{" "}
                ({personel.personelKodu})
              </p>
            )}

            <p className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-400">
              Toplam kayıt sayısı:{" "}
              <span className="font-bold">{tamOnaylananlar.length}</span>
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {/* AnaSayfaya git */}
            <button
              onClick={() => router.push("/")}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100"
            >
              Ana Sayfa
            </button>

            {/* İDARİ Onayı Bekleyenler */}
            <button
              onClick={() => router.push("/idariPersonel/onayiBekleyenler")}
              className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
            >
              İdari – Onayı Bekleyen Talepler
            </button>

            {/* İDARİ Reddedilenler */}
            <button
              onClick={() => router.push("/idariPersonel/reddedilenler")}
              className="rounded-md border border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
            >
              İdari – Reddedilen Talepler
            </button>

            {/* Yeni Talep Butonu */}
            <button
              onClick={handleYeniTalep}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Yeni Satın Alma Talebi Oluştur
            </button>

            {/* Çıkış */}
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* İDARİ – Hata */}
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        {/* İDARİ – Yükleniyor */}
        {loading && (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Yükleniyor...
          </div>
        )}

        {/* İDARİ – Liste boşsa */}
        {!loading && tamOnaylananlar.length === 0 && !error && (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Filtrelere uygun, tüm onaylayıcıları tarafından onaylanmış idari
            talep bulunmuyor.
          </div>
        )}

        {/* ===========================
            ALTA: TEKNİK İŞ EMİRLERİ BLOĞU
           =========================== */}
        <section className="mt-8 rounded-lg border   border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Başlık + durum filtresi + yenile */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">
                Teknik İş Emirleri
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {TEKNIK_STATUS_FILTERS.map((f) => {
                const isActive = teknikStatusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setTeknikStatusFilter(f.key)}
                    className={[
                      "rounded-md border px-3 py-1 text-xs sm:text-sm transition",
                      "dark:border-zinc-700",
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                );
              })}

              <button
                onClick={handleTeknikRefresh}
                disabled={teknikLoading}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Yenile
              </button>
            </div>
          </div>

          {/* Filtre bar – personel + site + tarih */}
          <section className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              {/* Personel filtresi */}
              <div className="w-full md:w-64">
                <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                  Personel (Atanan)
                </label>
                <select
                  value={teknikFilterPersonelId}
                  onChange={(e) => setTeknikFilterPersonelId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="">Tüm Personeller</option>
                  {teknikPersonelList.map((p) => {
                    const id = p.id ?? p.Id;
                    const ad = p.ad ?? p.Ad;
                    const soyad = p.soyad ?? p.Soyad;
                    return (
                      <option key={id} value={id}>
                        {ad} {soyad}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Site filtresi */}
              <div className="w-full md:w-64">
                <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                  Site / Proje
                </label>
                <select
                  value={teknikFilterSiteId}
                  onChange={(e) => setTeknikFilterSiteId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="">Tüm Siteler</option>
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

              {/* Tarih aralığı */}
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={teknikStartDate}
                    onChange={(e) => setTeknikStartDate(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={teknikEndDate}
                    onChange={(e) => setTeknikEndDate(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
              </div>

              {/* Filtre butonları */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTeknikFilterApply}
                  disabled={teknikLoading}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Filtrele
                </button>
                <button
                  type="button"
                  onClick={handleTeknikFilterReset}
                  disabled={teknikLoading}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  Temizle
                </button>
              </div>
            </div>
          </section>

          {/* İçerik */}
          {teknikLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              İş emirleri yükleniyor...
            </p>
          )}

          {teknikError && !teknikLoading && (
            <p className="text-sm text-red-600">
              İş emirleri yüklenirken hata: {teknikError}
            </p>
          )}

          {!teknikLoading && !teknikError && teknikIsEmirleri.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Bu filtrelere uygun iş emri bulunamadı.
            </p>
          )}

          {!teknikLoading && !teknikError && teknikIsEmirleri.length > 0 && (
            <div className="mt-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {teknikIsEmirleri.map((item) => (
                  <TeknikIsEmriCard key={item.id} data={item} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* BAŞLIK + Filtreler kartı (İDARİ) */}
        <section className="mb-4 mt-20 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3">
            <h2 className="text-[18px]  text-center  font-extrabold tracking-wide text-emerald-800 dark:text-emerald-300">
              İDARİ – TÜM ONAYLARI ALMIŞ TALEPLER
            </h2>
            
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            {/* Tarih Aralığı */}
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>

            {/* Site filtresi */}
            <div className="w-full md:w-64">
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Site / Proje
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="">Tüm Siteler</option>
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

            {/* Filtre Butonları */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFilterApply}
                disabled={loading}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Filtrele
              </button>
              <button
                type="button"
                onClick={handleFilterReset}
                disabled={loading}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Temizle
              </button>
            </div>
          </div>
        </section>

        {/* İDARİ – Tüm onaylayıcıları onaylamış talepler – kartlar */}
        {!loading && !error && tamOnaylananlar.length > 0 && (
          <section className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tamOnaylananlar.map((x) => {
                const id = x.id ?? x.Id;
                const seriNo = x.seriNo ?? x.SeriNo;
                const tarih = x.tarih ?? x.Tarih;
                const talepCinsi = x.talepCinsi ?? x.TalepCinsi;
                const aciklama = x.aciklama ?? x.Aciklama;
                const site = x.site ?? x.Site ?? null;
                const talepEden = x.talepEden ?? x.TalepEden ?? null;
                const toplamOnayciSayisi =
                  x.toplamOnayciSayisi ?? x.ToplamOnayciSayisi ?? 0;
                const malzemeSayisi =
                  x.malzemeSayisi ?? x.MalzemeSayisi ?? null;

                return (
                  <Link
                    key={id}
                    href={`/satinalma/teklifler/${id}`}
                    className="block rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-emerald-700 dark:bg-zinc-900"
                  >
                    {/* Seri No + Tarih */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {seriNo}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatDate(tarih)}
                      </span>
                    </div>

                    {/* Talep cinsi */}
                    <div className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {talepCinsi}
                    </div>

                    {/* Site */}
                    {site ? (
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">
                          Site:
                        </span>{" "}
                        {site.ad ?? site.Ad}
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Site bilgisi yok
                      </div>
                    )}

                    {/* Talep Eden */}
                    {talepEden && (
                      <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">
                          Talep Eden:
                        </span>{" "}
                        {talepEden.ad ?? talepEden.Ad}{" "}
                        {talepEden.soyad ?? talepEden.Soyad}
                      </div>
                    )}

                    {/* Bilgi etiketleri */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                      <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Tüm {toplamOnayciSayisi} onaycı onayladı
                      </span>
                      {malzemeSayisi != null && (
                        <span className="rounded-full bg-zinc-100 px-2 py-[2px] dark:bg-zinc-800">
                          {malzemeSayisi} kalem malzeme
                        </span>
                      )}
                    </div>

                    {/* Açıklama */}
                    {aciklama && (
                      <p className="mt-2 line-clamp-2 text-[12px] text-zinc-600 dark:text-zinc-300">
                        {aciklama}
                      </p>
                    )}

                    <div className="mt-3 flex justify-end">
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        Detayı Gör →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}
