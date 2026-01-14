




// pages/personel.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function PersonelPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [isEmirleri, setIsEmirleri] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtreler (default: son 14 gün)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return toDateInputValue(d);
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return toDateInputValue(d);
  });

  const [siteId, setSiteId] = useState("");

  // Site listesi
  const [sites, setSites] = useState([]);

  // Cookie’den personel bilgisi
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (personelCookie) {
        const parsed = JSON.parse(personelCookie);
        setPersonel(parsed);
      }
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  const currentPersonelId = personel ? personel.id ?? personel.Id : null;

  // Site listesini çek
  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        const res = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(res || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
  }, []);

  // İş emirlerini çek
  const fetchIsEmirleri = async (options = {}) => {
    if (!currentPersonelId) return;

    const personelId = options.personelId ?? currentPersonelId;
    const sDate = options.startDate ?? startDate;
    const eDate = options.endDate ?? endDate;
    const sId = options.siteId ?? siteId;

    try {
      setLoading(true);
      setError(null);

      const qs = [];
      qs.push(`personelId=${encodeURIComponent(personelId)}`);
      if (sDate) qs.push(`startDate=${encodeURIComponent(sDate)}`);
      if (eDate) qs.push(`endDate=${encodeURIComponent(eDate)}`);
      if (sId) qs.push(`siteId=${encodeURIComponent(sId)}`);

      const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";
      const path = `personeller/teknikPersonelFilterGet${queryString}`;

      const data = await getDataAsync(path);
      const list = Array.isArray(data) ? data : data ? [data] : [];

      const sorted = [...list].sort((a, b) => {
        const da = new Date(a.olusturmaTarihiUtc || a.OlusturmaTarihiUtc || 0);
        const db = new Date(b.olusturmaTarihiUtc || b.OlusturmaTarihiUtc || 0);
        return db - da;
      });

      setIsEmirleri(sorted);
    } catch (err) {
      console.error("Personel iş emirleri yüklenirken hata:", err);
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      setIsEmirleri([]);
    } finally {
      setLoading(false);
    }
  };

  // Sayfaya girince çek
  useEffect(() => {
    if (!currentPersonelId) return;
    fetchIsEmirleri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersonelId]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
    }
  };

  // ✅ Hızlı tarih butonları
  const applyQuickRange = async (daysBack) => {
    // daysBack:
    // 0 = bugün (start=end=today)
    // 1 = dün
    // 2 = son 2 gün (bugün + dün)
    // 7 = son 7 gün
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);

    const s = toDateInputValue(start);
    const e = toDateInputValue(end);

    setStartDate(s);
    setEndDate(e);

    await fetchIsEmirleri({ startDate: s, endDate: e });
  };

  const handleFilterApply = async () => {
    await fetchIsEmirleri();
  };

  const handleFilterReset = async () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 14);
    const d2 = new Date();

    const defaultStart = toDateInputValue(d1);
    const defaultEnd = toDateInputValue(d2);

    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setSiteId("");

    await fetchIsEmirleri({
      startDate: defaultStart,
      endDate: defaultEnd,
      siteId: "",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4">
        {/* ÜST BAR */}
        <header className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white px-3 py-0.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Teknik Personel Paneli
            </p>
            {personel ? (
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {personel.ad} {personel.soyad}{" "}
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  ({personel.personelKodu})
                </span>
              </p>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Personel bilgisi yükleniyor...
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="self-start rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 md:self-auto"
          >
            Çıkış Yap
          </button>
        </header>

        {/* FİLTRE KARTI */}
        <section className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center text-center justify-center gap-2">
            <h2 className="text-[12px] text-center font-extrabold tracking-wide text-emerald-800 dark:text-emerald-300">
              Atandığım İş Emirleri
            </h2>

            {/* Sağ üst mini butonlar */}
            <div className="hidden gap-2 md:flex">
              <button
                type="button"
                onClick={handleFilterApply}
                disabled={loading || !currentPersonelId}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Filtrele
              </button>
              <button
                type="button"
                onClick={handleFilterReset}
                disabled={loading || !currentPersonelId}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Temizle
              </button>
            </div>
          </div>

          {/* ÜST: Başlangıç / Bitiş */}
          <div className="grid grid-row-1 gap-3 sm:grid-cols-2">
            <div className="grid grid-cols-2  ">
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 py-0.5 py-0.5 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="grid grid-cols-2  ">
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 py-0.5 py-0.5 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          {/* Site filtresi */}
          <div className="mt-2">
            
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 py-0.5 py-0.5 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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

          {/* ALT: 4 hızlı buton */}
          <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => applyQuickRange(7)}
              disabled={loading || !currentPersonelId}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-0.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Son 7 gün
            </button>

            <button
              type="button"
              onClick={() => applyQuickRange(2)}
              disabled={loading || !currentPersonelId}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-0.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Son 2 gün
            </button>

            <button
              type="button"
              onClick={() => applyQuickRange(1)}
              disabled={loading || !currentPersonelId}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-0.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Dün
            </button>

            <button
              type="button"
              onClick={() => applyQuickRange(0)}
              disabled={loading || !currentPersonelId}
              className="rounded-md bg-emerald-600 px-3 py-0.5 text-[12px] font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              Bugün
            </button>
          </div>

          {/* Mobilde Filtrele / Temizle altta görünsün */}
          <div className="mt-3 flex gap-2 md:hidden">
            <button
              type="button"
              onClick={handleFilterApply}
              disabled={loading || !currentPersonelId}
              className="flex-1 rounded-md bg-emerald-600 px-3 py-0.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Filtrele
            </button>
            <button
              type="button"
              onClick={handleFilterReset}
              disabled={loading || !currentPersonelId}
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-0.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Temizle
            </button>
          </div>
        </section>

        {/* LİSTE */}
        <main className="flex-1 rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
              Filtrelere uygun iş emri bulunamadı.
            </p>
          )}

          {!loading && !error && isEmirleri.length > 0 && (
            <div className="mt-2 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isEmirleri.map((item) => (
                  <TeknikIsEmriCard
                    key={item.isEmriId || item.id || item.Id}
                    data={{
                      id: item.isEmriId || item.id || item.Id,
                      kod: item.isEmriKod || item.kod || item.Kod,
                      kisaBaslik: item.kisaBaslik || item.KisaBaslik,
                      aciklama: item.aciklama || item.Aciklama,
                      olusturmaTarihiUtc:
                        item.olusturmaTarihiUtc || item.OlusturmaTarihiUtc,
                      konum: item.konum || item.Konum,
                      site: item.site || item.Site,
                      apt: item.apt || item.Apt,
                      ev: item.ev || item.Ev,
                      dosyalar: item.dosyalar || item.Dosyalar || [],
                      personeller: item.personeller || item.Personeller || [],
                      notlar: item.notlar || item.Notlar || [],
                      malzemeler: item.malzemeler || item.Malzemeler || [],
                      DurumKod: item.durumKod ?? item.DurumKod,
                      kod_2: item.kod_2 ?? item.Kod_2 ?? item.kod2 ?? item.Kod2,
                      kod_3: item.kod_3 ?? item.Kod_3 ?? item.kod3 ?? item.Kod3,
                    }}
                    currentPersonelId={currentPersonelId}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
