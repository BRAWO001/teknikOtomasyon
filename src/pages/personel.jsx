



// pages/personel.jsx
// ✅ TEK YAPIDA (Kurumsal Panel)
// İSTENEN:
// 1) Sayfa ilk açılınca:
//    - KPI (Toplam/Devam/Biten): YILBAŞI -> BUGÜN (SABİT)
//    - Liste: SADECE BUGÜN (status=ALL)
// 2) Sonra tab / quick / tarih / site değişince:
//    - Liste: seçilen filtreye göre backend'den gelir (status = ALL|DEVAM|BITEN)
//    - KPI: DEĞİŞMEZ (hep YTD)
//
// Backend endpoint (tek endpoint kullanıyoruz):
// GET: personeller/teknikPersonelDashboardGet?personelId=&startDate=&endDate=&siteId=&status=&limit=
// status: ALL | DEVAM | BITEN
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";

/* ========================
   Helpers
======================== */
function toDateInputValue(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}
function startOfYearStr() {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), 0, 1));
}
function todayStr() {
  return toDateInputValue(new Date());
}
function rangeLabelTR(startStr, endStr) {
  const fmt = (s) => {
    if (!s) return "—";
    const [y, m, d] = String(s).split("-");
    return `${d}.${m}.${y}`;
  };
  return `${fmt(startStr)} - ${fmt(endStr)}`;
}
function buildQS(obj) {
  const qs = [];
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (String(v).trim() === "") return;
    qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  });
  return qs.length ? `?${qs.join("&")}` : "";
}

/* ========================
   Kurumsal UI Components
======================== */
function TopButton({ onClick, className = "", children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] font-extrabold shadow-sm transition active:scale-[0.98] ${className}`}
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({ title, value, sub, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 shadow-sm transition active:scale-[0.99]
        ${
          active
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        }`}
      title={title}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{title}</div>
          <div className="mt-1 text-[22px] font-extrabold text-zinc-900 dark:text-zinc-100">
            {value}
          </div>
          {sub ? <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</div> : null}
        </div>
        <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-[18px] dark:bg-zinc-800">{icon}</div>
      </div>
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-[12px] font-extrabold shadow-sm transition active:scale-[0.98]
        ${
          active
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        }`}
    >
      {children}
    </button>
  );
}

/* ========================
   Page
======================== */
export default function PersonelPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const currentPersonelId = personel ? (personel.id ?? personel.Id) : null;

  // ✅ KPI (SABİT: YTD)
  const [kpi, setKpi] = useState({
    total: 0,
    devamEden: 0,
    biten: 0,
    durumDagilimi: [],
  });
  const [loadingKpi, setLoadingKpi] = useState(false);

  // ✅ Liste state (filtreye göre değişir)
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [error, setError] = useState("");

  // ✅ Liste filtreleri (ilk açılışta BUGÜN)
  const [startDate, setStartDate] = useState(() => todayStr());
  const [endDate, setEndDate] = useState(() => todayStr());
  const [siteId, setSiteId] = useState("");
  const [selectedQuick, setSelectedQuick] = useState(0); // ilk: BUGÜN
  const [tab, setTab] = useState("ALL"); // ALL | DEVAM | BITEN

  // Site listesi (istersen sonra kaldırırız; sen bu kodda kullanıyorsun)
  const [sites, setSites] = useState([]);

  const ytdStart = useMemo(() => startOfYearStr(), []);
  const today = useMemo(() => todayStr(), []);

  const rangeLabel = useMemo(
    () => rangeLabelTR(startDate, endDate),
    [startDate, endDate],
  );
  const kpiRangeLabel = useMemo(
    () => rangeLabelTR(ytdStart, today),
    [ytdStart, today],
  );

  const completionPct = useMemo(() => {
    const t = Number(kpi.total || 0);
    const b = Number(kpi.biten || 0);
    if (!t) return 0;
    return Math.round((b / t) * 100);
  }, [kpi.total, kpi.biten]);

  // Cookie
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (personelCookie) setPersonel(JSON.parse(personelCookie));
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  // Site listesi
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

  // ✅ Dashboard endpoint çağırıcı (tek helper)
  const callDashboard = async ({
    personelId,
    startDate,
    endDate,
    siteId,
    status,
    limit,
  }) => {
    const qs = buildQS({
      personelId,
      startDate,
      endDate,
      siteId,
      status,
      limit,
    });
    const path = `personeller/teknikPersonelDashboardGet${qs}`;
    return await getDataAsync(path);
  };

  // ✅ KPI çek (YTD sabit) - SADECE 1 kez
  const didKpi = useRef(false);
  useEffect(() => {
    if (!currentPersonelId) return;
    if (didKpi.current) return;
    didKpi.current = true;

    (async () => {
      try {
        setLoadingKpi(true);
        setError("");

        const data = await callDashboard({
          personelId: currentPersonelId,
          startDate: ytdStart,
          endDate: today,
          siteId: "", // KPI'da site filtreleme istemiyorsan boş bırak
          status: "ALL", // KPI her zaman tümü
          limit: 1, // items önemli değil, summary alıyoruz
        });

        const sum = data?.summary ?? {};
        setKpi({
          total: Number(sum.total ?? 0),
          devamEden: Number(sum.devamEden ?? 0),
          biten: Number(sum.biten ?? 0),
          durumDagilimi: Array.isArray(sum.durumDagilimi)
            ? sum.durumDagilimi
            : [],
        });
      } catch (err) {
        console.error("KPI fetch error:", err);
        setError(
          (prev) => prev || err?.message || "KPI çekilirken hata oluştu.",
        );
      } finally {
        setLoadingKpi(false);
      }
    })();
  }, [currentPersonelId, ytdStart, today]);

  // ✅ Liste çek (BUGÜN veya filtre)
  const fetchList = async (options = {}) => {
    if (!currentPersonelId) return;

    const sDate = options.startDate ?? startDate;
    const eDate = options.endDate ?? endDate;
    const sId = options.siteId ?? siteId;
    const status = options.status ?? tab;

    try {
      setLoadingList(true);
      setError("");

      const data = await callDashboard({
        personelId: currentPersonelId,
        startDate: sDate,
        endDate: eDate,
        siteId: sId,
        status: status || "ALL",
        limit: 80,
      });

      const list = Array.isArray(data?.items) ? data.items : [];
      const sorted = [...list].sort((a, b) => {
        const da = new Date(a.olusturmaTarihiUtc || a.OlusturmaTarihiUtc || 0);
        const db = new Date(b.olusturmaTarihiUtc || b.OlusturmaTarihiUtc || 0);
        return db - da;
      });
      setItems(sorted);
    } catch (err) {
      console.error("List fetch error:", err);
      setError(err?.message || "Liste çekilirken hata oluştu.");
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  };

  // ✅ İlk açılışta liste = BUGÜN (tab=ALL)
  const didInitList = useRef(false);
  useEffect(() => {
    if (!currentPersonelId) return;
    if (didInitList.current) return;
    didInitList.current = true;

    const t = todayStr();
    setStartDate(t);
    setEndDate(t);
    setSelectedQuick(0);
    setTab("ALL");
    fetchList({ startDate: t, endDate: t, status: "ALL" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersonelId]);

  // Logout / Barcode
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
    }
  };

  // ✅ Quick ranges (listeyi değiştirir) — KPI sabit kalır
  const applyQuickRange = async (key) => {
    const now = new Date();
    const e = toDateInputValue(now);

    let s;
    if (key === "YTD") {
      s = startOfYearStr();
    } else {
      const daysBack = Number(key);
      const d = new Date();
      d.setDate(now.getDate() - daysBack);
      s = toDateInputValue(d);
    }

    setSelectedQuick(key);
    setStartDate(s);
    setEndDate(e);

    // ✅ burada tab’i resetleme! (sen tıklayınca ne seçtiyse o kalsın)
    await fetchList({ startDate: s, endDate: e, status: tab });
  };

  const handleFilterApply = async () => {
    setSelectedQuick(null);
    await fetchList({ status: tab });
  };

  const handleFilterReset = async () => {
    const t = todayStr();
    setSelectedQuick(0);
    setStartDate(t);
    setEndDate(t);
    setSiteId("");
    setTab("ALL");
    await fetchList({ startDate: t, endDate: t, siteId: "", status: "ALL" });
  };

  // ✅ Tab tıklayınca: SADECE liste filtrelenir (KPI sabit)
  // ✅ Tab tıklayınca: otomatik YTD seç + listeyi YTD aralıkta çek
  const handleSelectTab = async (nextTab) => {
    const ytd = startOfYearStr();
    const t = todayStr();

    setTab(nextTab);

    // Devam/Biten/Toplam tıklanınca YTD seçilmiş görünsün
    setSelectedQuick("YTD");
    setStartDate(ytd);
    setEndDate(t);

    // listeyi YTD aralık + seçilen tab status ile çek
    await fetchList({
      startDate: ytd,
      endDate: t,
      status: nextTab,
    });
  };

  const quickBtnClass = (key) => {
    const selected = selectedQuick === key;
    return selected
      ? "rounded-xl bg-emerald-600 px-2 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
      : "rounded-xl border border-zinc-200 bg-white px-2 py-2 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-3">
        {/* HEADER */}
        <header className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-[3px] text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  TEKNİK PERSONEL PANELİ
                </span>
                
              </div>

              <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
                <div className="text-[14px] font-extrabold text-zinc-900 dark:text-zinc-100">
                  {personel
                    ? `${personel.ad} ${personel.soyad}`
                    : "Personel yükleniyor..."}
                </div>
                {personel?.personelKodu ? (
                  <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              
              <TopButton
                onClick={handleLogout}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                ⛔ Çıkış Yap
              </TopButton>
            </div>
          </div>
        </header>

        {/* KPI / STATS (SABİT YTD) */}
        <section className="grid gap-2 md:grid-cols-3">
          <StatCard
            title="Toplam İş"
            value={loadingKpi ? "…" : kpi.total}
            sub={kpiRangeLabel}
            icon="📌"
            active={tab === "ALL"}
            onClick={() => handleSelectTab("ALL")}
          />
          <StatCard
            title="Devam Eden"
            value={loadingKpi ? "…" : kpi.devamEden}
            
            icon="⏳"
            active={tab === "DEVAM"}
            onClick={() => handleSelectTab("DEVAM")}
          />
          <StatCard
            title="Biten"
            value={loadingKpi ? "…" : kpi.biten}
            sub={`Tamamlanma: %${completionPct}`}
            icon="✅"
            active={tab === "BITEN"}
            onClick={() => handleSelectTab("BITEN")}
          />
        </section>

        {/* FILTER CARD */}
        <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[13px] font-extrabold text-emerald-800 dark:text-emerald-200">
                  Atandığım İş Emirleri
                </div>
                
              </div>

              <div className="flex items-center gap-2">
                <TabButton
                  active={tab === "ALL"}
                  onClick={() => handleSelectTab("ALL")}
                >
                  Tümü
                </TabButton>
                <TabButton
                  active={tab === "DEVAM"}
                  onClick={() => handleSelectTab("DEVAM")}
                >
                  Devam
                </TabButton>
                <TabButton
                  active={tab === "BITEN"}
                  onClick={() => handleSelectTab("BITEN")}
                >
                  Biten
                </TabButton>
              </div>
            </div>

            {/* Tarih + Site */}
            <div className="grid gap-2 md:grid-cols-3">
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                  Başlangıç
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setSelectedQuick(null);
                    setStartDate(e.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm
                             focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100
                             dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                  Bitiş
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setSelectedQuick(null);
                    setEndDate(e.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm
                             focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100
                             dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                  Site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => {
                    setSelectedQuick(null);
                    setSiteId(e.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm
                             focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100
                             dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="">Tüm Siteler</option>
                  {sites.map((s) => {
                    const sid = s.id ?? s.Id;
                    const ad = s.ad ?? s.Ad;
                    return (
                      <option key={sid} value={sid}>
                        {ad || `Site #${sid}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Quick ranges */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <button
                type="button"
                onClick={() => applyQuickRange("YTD")}
                disabled={loadingList || !currentPersonelId}
                className={quickBtnClass("YTD")}
              >
                Yılbaşı
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange(30)}
                disabled={loadingList || !currentPersonelId}
                className={quickBtnClass(30)}
              >
                30 gün
              </button>
              
              <button
                type="button"
                onClick={() => applyQuickRange(7)}
                disabled={loadingList || !currentPersonelId}
                className={quickBtnClass(7)}
              >
                7 gün
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange(1)}
                disabled={loadingList || !currentPersonelId}
                className={quickBtnClass(1)}
              >
                Dün
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange(0)}
                disabled={loadingList || !currentPersonelId}
                className={quickBtnClass(0)}
              >
                Bugün
              </button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFilterApply}
                disabled={loadingList || !currentPersonelId}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                Filtrele
              </button>
              <button
                type="button"
                onClick={handleFilterReset}
                disabled={loadingList || !currentPersonelId}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[12px] font-extrabold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Temizle
              </button>
            </div>

            
          </div>
        </section>

        {/* LIST */}
        <main className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {(loadingList || loadingKpi) && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-900">
              {loadingList ? "Liste yükleniyor..." : "İstatistik yükleniyor..."}
            </div>
          )}

          {error && !loadingList && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-800">
              Hata: {error}
            </div>
          )}

          {!loadingList && !error && items.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300">
              Filtrelere uygun iş emri bulunamadı.
            </div>
          )}

          {!loadingList && !error && items.length > 0 && (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[12px] font-extrabold text-zinc-800 dark:text-zinc-100">
                  Liste ({items.length})
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tab filtresi backend’den gelir •{" "}
                  {tab === "ALL" ? "Tümü" : tab}
                </div>
              </div>

              <div className="pr-1 md:max-h-[70vh] md:overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
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
                        kod_2:
                          item.kod_2 ?? item.Kod_2 ?? item.kod2 ?? item.Kod2,
                        kod_3:
                          item.kod_3 ?? item.Kod_3 ?? item.kod3 ?? item.Kod3,
                      }}
                      currentPersonelId={currentPersonelId}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="pb-1 text-center text-[10px] text-zinc-400">
          EOS Teknik Otomasyon • Personel Panel
        </footer>
      </div>
    </div>
  );
}
