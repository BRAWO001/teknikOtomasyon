




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

  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));

  const [siteId, setSiteId] = useState("");

  // ✅ Seçili hızlı filtre (başlangıçta 7 gün seçili)
  const [selectedQuick, setSelectedQuick] = useState(7);

  // Site listesi
  const [sites, setSites] = useState([]);

  // Cookie’den personel bilgisi
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (personelCookie) setPersonel(JSON.parse(personelCookie));
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  const currentPersonelId = personel ? personel.id ?? personel.Id : null;

  // Site listesini çek
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getDataAsync("SiteAptEvControllerSet/sites");
        if (!cancelled) setSites(res || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    })();

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

      const queryString = qs.length ? `?${qs.join("&")}` : "";
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
  const handleBarcode = async () => {
    try {
      router.push("/barcode");
    } catch (err) {
      console.error("Barcode error:", err);
    } finally {
      router.push("/");
    }
  };

  // ✅ Hızlı tarih butonları
  const applyQuickRange = async (daysBack) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);

    const s = toDateInputValue(start);
    const e = toDateInputValue(end);

    setSelectedQuick(daysBack);
    setStartDate(s);
    setEndDate(e);

    await fetchIsEmirleri({ startDate: s, endDate: e });
  };

  const handleFilterApply = async () => {
    setSelectedQuick(null); // manuel filtre
    await fetchIsEmirleri();
  };

  const handleFilterReset = async () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 14);
    const d2 = new Date();

    const defaultStart = toDateInputValue(d1);
    const defaultEnd = toDateInputValue(d2);

    setSelectedQuick(7);
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setSiteId("");

    await fetchIsEmirleri({
      startDate: defaultStart,
      endDate: defaultEnd,
      siteId: "",
    });
  };

  // ✅ seçili buton yeşil
  const quickBtnClass = (key) => {
    const selected = selectedQuick === key;
    return selected
      ? "rounded-md bg-emerald-600 px-2 py-1 text-[12px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
      : "rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-800";
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-3">
        {/* ÜST BAR (daha dar) */}
        <header className="flex flex-col gap-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Teknik Personel Paneli
            </p>
            {personel ? (
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                {personel.ad} {personel.soyad}{" "}
                <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                  ({personel.personelKodu})
                </span>
              </p>
            ) : (
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                Personel bilgisi yükleniyor...
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="self-start rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-red-700 md:self-auto"
          >
            Çıkış Yap
          </button>
          <button
            onClick={handleBarcode}
            className="self-start rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-red-700 md:self-auto"
          >
            Barcode
          </button>
        </header>

        {/* FİLTRE KARTI (kompakt + mobil alan kazancı) */}
        <section className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-center">
            <h2 className="text-[13px] font-extrabold tracking-wide text-emerald-800 dark:text-emerald-300">
              Atandığım İş Emirleri
            </h2>
          </div>

          {/* Tarihler (kompakt satır) */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid grid-cols-[110px_1fr] items-center gap-2">
              <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Başlangıç
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setSelectedQuick(null);
                  setStartDate(e.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="grid grid-cols-[110px_1fr] items-center gap-2">
              <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setSelectedQuick(null);
                  setEndDate(e.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          {/* Site (kompakt) */}
          <div className="mt-2">
            <select
              value={siteId}
              onChange={(e) => {
                setSelectedQuick(null);
                setSiteId(e.target.value);
              }}
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

          {/* Hızlı butonlar (kompakt) */}
          <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => applyQuickRange(7)}
              disabled={loading || !currentPersonelId}
              className={quickBtnClass(7)}
            >
              Son 7 gün
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange(2)}
              disabled={loading || !currentPersonelId}
              className={quickBtnClass(2)}
            >
              Son 2 gün
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange(1)}
              disabled={loading || !currentPersonelId}
              className={quickBtnClass(1)}
            >
              Dün
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange(0)}
              disabled={loading || !currentPersonelId}
              className={quickBtnClass(0)}
            >
              Bugün
            </button>
          </div>

          {/* Filtrele/Temizle (kompakt) */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFilterApply}
              disabled={loading || !currentPersonelId}
              className="rounded-md bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Filtrele
            </button>
            <button
              type="button"
              onClick={handleFilterReset}
              disabled={loading || !currentPersonelId}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
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

          {/* ✅ SCROLL FIX:
              - Mobilde nested scroll YOK (body scroll) => zıplama biter
              - Desktop'ta (md+) istersen yine 70vh içinde scroll var
           */}
          {!loading && !error && isEmirleri.length > 0 && (
            <div className="mt-2 pr-1 md:max-h-[70vh] md:overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
