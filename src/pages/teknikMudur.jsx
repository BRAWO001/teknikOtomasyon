




// pages/teknikMudur.jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

// Basit durum filtreleri: Tüm / Devam / Biten
const STATUS_FILTERS = [
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

// Backend path builder
function buildPath({ statusFilter, startDate, endDate, siteId, personelId }) {
  const qs = [];

  if (personelId) qs.push(`personelId=${encodeURIComponent(personelId)}`);
  if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);
  if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);

  const statusKey = statusFilter || "ALL";
  qs.push(`status=${encodeURIComponent(statusKey)}`);

  const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";

  // 🔥 API: GET /api/Personeller/teknikMudurFilterGet
  // getDataAsync içinde base + "personeller/..." şeklinde gidiyor
  return `personeller/teknikMudurFilterGet${queryString}`;
}

export default function TeknikMudurPage() {
  const router = useRouter();

  // İş emri state'leri
  const [isEmirleri, setIsEmirleri] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | DEVAM | BITEN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Üst panel state'leri (cookie)
  const [personel, setPersonel] = useState(null); // teknik müdür kendi bilgisi

  // Filtre state'leri
  const [filterPersonelId, setFilterPersonelId] = useState(""); // personel filtresi
  const [filterSiteId, setFilterSiteId] = useState(""); // site filtresi
  const [startDate, setStartDate] = useState(""); // yyyy-MM-dd
  const [endDate, setEndDate] = useState(""); // yyyy-MM-dd

  // Dropdown verileri
  const [personelList, setPersonelList] = useState([]);
  const [siteList, setSiteList] = useState([]);

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

  // Yeni iş emri ekle
  const handleNewIsEmri = () => {
    router.push("/teknikIsEmriEkle");
  };
  // Yonetici raporu
  const handleYoneticiRaporu = () => {
    router.push("/yoneticiRaporu");
  };
  // Yönetim Kurulu Yönetici Raporu
  const handleYonetimKurulu= () => {
    router.push("/YonetimKuruluYoneticiRaporu");
  };

  // Satın alma sayfası
  const handleSatinalma = () => {
    router.push("/satinalma/liste");
  };

  // Üst panel: PersonelUserInfo (cookie)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");

      // Cookie yoksa → anasayfaya
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

  // Personel listesi (dropdown)
  useEffect(() => {
    let cancelled = false;

    const loadPersonelList = async () => {
      try {
        const res = await getDataAsync(
          "Personeller/ByDurum?rolKod=30&aktifMi=true"
        );

        if (cancelled) return;
        setPersonelList(res || []);
      } catch (err) {
        console.error("PERSONELLER FETCH ERROR:", err);
      }
    };

    loadPersonelList();

    return () => {
      cancelled = true;
    };
  }, []);

  // Site listesi (dropdown)
  useEffect(() => {
    let cancelled = false;

    const loadSiteList = async () => {
      try {
        const res = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSiteList(res || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    };

    loadSiteList();

    return () => {
      cancelled = true;
    };
  }, []);

  // İş emirlerini backend'den çek
  const fetchIsEmirleri = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const path = buildPath({
        statusFilter: options.statusFilter ?? statusFilter,
        startDate: options.startDate ?? startDate,
        endDate: options.endDate ?? endDate,
        siteId: options.siteId ?? filterSiteId,
        personelId: options.personelId ?? filterPersonelId,
      });

      const data = await getDataAsync(path);
      const list = Array.isArray(data) ? data : data ? [data] : [];

      setIsEmirleri(list);
    } catch (err) {
      console.error("İş emirleri yüklenirken hata:", err);
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      setIsEmirleri([]);
    } finally {
      setLoading(false);
    }
  };

  // Durum filtresi değiştiğinde otomatik yükle
  useEffect(() => {
    fetchIsEmirleri({ statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Sayfa ilk açılışında (backend default: son 30 gün)
  useEffect(() => {
    fetchIsEmirleri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    await fetchIsEmirleri();
  };

  const handleFilterApply = async () => {
    await fetchIsEmirleri();
  };

  const handleFilterReset = async () => {
    setFilterPersonelId("");
    setFilterSiteId("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("ALL");
    // statusFilter değişimi zaten fetch tetikliyor
  };

  const activeFilterObj =
    STATUS_FILTERS.find((f) => f.key === statusFilter) || STATUS_FILTERS[0];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-4">
        {/* ÜSTTE TEKNİK MÜDÜR PANELİ */}

        <section className="rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-sm">
  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">

    {/* SOL: Kimlik + Bilgi */}
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">

        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          TEKNİK MÜDÜR PANELİ
        </span>

        {personel ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[10px] font-medium text-zinc-700">
            <span className="font-semibold text-zinc-900">
              {personel.ad} {personel.soyad}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-600">Rol: {personel.rol}</span>
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-800">
            PersonelUserInfo bulunamadı
          </span>
        )}
      </div>
    </div>

    {/* SAĞ: Aksiyonlar */}
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">

      {/* ===== YÖNETİM GRUBU ===== */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 p-1.5 shadow-sm backdrop-blur">

        <button
          onClick={handleYonetimKurulu}
          className="group inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[11px] font-semibold text-zinc-900 shadow-sm transition
                     hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-900 active:scale-[0.98]"
        >
          <svg className="h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          Yönetim Kurulu Karar / İleti
        </button>

        <button
          onClick={handleYoneticiRaporu}
          className="group inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[11px] font-semibold text-zinc-900 shadow-sm transition
                     hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 active:scale-[0.98]"
        >
          <svg className="h-3.5 w-3.5 text-zinc-500 group-hover:text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
          </svg>
          Yönetici Raporu
        </button>
      </div>

      {/* ===== OPERASYON GRUBU ===== */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 p-1.5 shadow-sm backdrop-blur">

        <button
          onClick={handleNewIsEmri}
          className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white shadow-sm transition
                     hover:bg-emerald-700 active:scale-[0.98]"
        >
          <svg className="h-3.5 w-3.5 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni İş
        </button>

        <button
          onClick={handleSatinalma}
          className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-[11px] font-semibold text-white shadow-sm transition
                     hover:bg-amber-600 active:scale-[0.98]"
        >
          <svg className="h-3.5 w-3.5 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 3h2l3.6 7.59M7 13h10l4-8H5.4" />
          </svg>
          Satın Alma
        </button>
      </div>

      {/* ===== ÇIKIŞ ===== */}
      <button
        onClick={handleLogout}
        className="group inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-[11px] font-semibold text-red-700 shadow-sm transition
                   hover:bg-red-50 hover:border-red-300 active:scale-[0.98]"
      >
        <svg className="h-3.5 w-3.5 text-red-500 group-hover:text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 3h4v18h-4M10 17l5-5-5-5M15 12H3" />
        </svg>
        Çıkış
      </button>

    </div>
  </div>
</section>


        {/* ALTA GENİŞ TEKNİK İŞ EMİRLERİ */}
        <main className="flex-1 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Başlık + durum filtresi + yenile */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                Teknik İş Emirleri
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Aktif filtre:{" "}
                <span className="font-semibold">{activeFilterObj.label}</span> –{" "}
                {activeFilterObj.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((f) => {
                const isActive = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={[
                      "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] sm:text-[12px] font-semibold shadow-sm transition active:scale-[0.99]",
                      isActive
                        ? "border-zinc-300 bg-zinc-500 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                );

              })}

              <button
                onClick={handleRefresh}
                disabled={loading}
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
                  value={filterPersonelId}
                  onChange={(e) => setFilterPersonelId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="">Tüm Personeller</option>
                  {personelList.map((p) => {
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
                  value={filterSiteId}
                  onChange={(e) => setFilterSiteId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="">Tüm Siteler</option>
                  {siteList.map((s) => {
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

              {/* Filtre butonları */}
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

          {/* İçerik */}
          {loading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              İş emirleri yükleniyor...
            </p>
          )}

          {error && !loading && (
            <p className="text-sm text-red-600">
              İş emirleri yüklenirken hata: {error}
            </p>
          )}

          {!loading && !error && isEmirleri.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Bu filtrelere uygun iş emri bulunamadı.
            </p>
          )}

          {!loading && !error && isEmirleri.length > 0 && (
            <div className="mt-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {isEmirleri.map((item) => (
                  <TeknikIsEmriCard key={item.id} data={item} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
