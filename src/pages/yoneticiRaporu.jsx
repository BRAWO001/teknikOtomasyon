




// pages/yoneticiRaporu.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";
import YoneticiRaporuIsEmriCard from "@/components/yoneticiRaporu/YoneticiRaporuIsEmriCard";
import YoneticiRaporuSatinAlmaCard from "@/components/yoneticiRaporu/YoneticiRaporuSatinAlmaCard";
import YoneticiRaporuSatinAlmaGrafikPanel from "@/components/yoneticiRaporu/YoneticiRaporuSatinAlmaGrafikPanel";
import YoneticiRaporuIsEmriGrafikPanel from "@/components/yoneticiRaporu/YoneticiRaporuIsEmriGrafikPanel";

export default function YoneticiRaporuPage() {
  // =========================
  // Ortak listeler (dropdown)
  // =========================
  const [sites, setSites] = useState([]);
  const [personeller, setPersoneller] = useState([]);

  // =========================
  // İş Emri state
  // =========================
  const [isEmriItems, setIsEmriItems] = useState([]);
  const [isEmriLoading, setIsEmriLoading] = useState(true);
  const [isEmriPage, setIsEmriPage] = useState(1);
  const [isEmriPageSize] = useState(100);
  const [isEmriTotalPages, setIsEmriTotalPages] = useState(1);
  const [isEmriTotalCount, setIsEmriTotalCount] = useState(0);

  // =========================
  // Satın Alma state
  // =========================
  const [saItems, setSaItems] = useState([]);
  const [saLoading, setSaLoading] = useState(true);
  const [saPage, setSaPage] = useState(1);
  const [saPageSize] = useState(100);
  const [saTotalPages, setSaTotalPages] = useState(1);
  const [saTotalCount, setSaTotalCount] = useState(0);

  // =========================
  // Filtreler (opsiyonel)
  // =========================
  const [siteId, setSiteId] = useState("");
  const [personelId, setPersonelId] = useState("");
function toDateInputValue(d) {
  try {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return "";
  }
}

function getDefaultRange() {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1); // 1 ay önce
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

// ✅ default: 1 ay önce -> bugün
const defaults = getDefaultRange();

const [start, setStart] = useState(defaults.startDate);
const [end, setEnd] = useState(defaults.endDate);

  // =========================
  // Excel download state
  // =========================
  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState("");

  // =========================
  // Endpoints (LIST)
  // =========================
  const isEmriEndpoint = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(isEmriPage));
    qs.set("pageSize", String(isEmriPageSize));

    if (siteId) qs.set("siteId", String(siteId));
    if (personelId) qs.set("personelId", String(personelId));
    if (start && end) {
      qs.set("start", start);
      qs.set("end", end);
    }

    return `yoneticiraporu/isEmirleriDetayliYoneticiRaporu?${qs.toString()}`;
  }, [isEmriPage, isEmriPageSize, siteId, personelId, start, end]);

  const satinAlmaEndpoint = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(saPage));
    qs.set("pageSize", String(saPageSize));
    return `yoneticiraporu/satinalmaGetDetayliYoneticiRaporu?${qs.toString()}`;
  }, [saPage, saPageSize]);

  // =========================
  // Loaders
  // =========================
  async function loadIsEmri() {
    setIsEmriLoading(true);
    try {
      const res = await getDataAsync(isEmriEndpoint);
      setIsEmriItems(res?.items || []);
      setIsEmriTotalPages(res?.totalPages || 1);
      setIsEmriTotalCount(res?.totalCount || 0);
    } catch (e) {
      console.error("IsEmri YoneticiRaporu GET hata:", e);
      setIsEmriItems([]);
      setIsEmriTotalPages(1);
      setIsEmriTotalCount(0);
    } finally {
      setIsEmriLoading(false);
    }
  }

  async function loadSatinAlma() {
    setSaLoading(true);
    try {
      const res = await getDataAsync(satinAlmaEndpoint);
      setSaItems(res?.items || []);
      setSaTotalPages(res?.totalPages || 1);
      setSaTotalCount(res?.totalCount || 0);
    } catch (e) {
      console.error("SatınAlma YoneticiRaporu GET hata:", e);
      setSaItems([]);
      setSaTotalPages(1);
      setSaTotalCount(0);
    } finally {
      setSaLoading(false);
    }
  }

  // =========================
  // İlk açılış: Siteler + Personeller
  // =========================
  useEffect(() => {
    let cancelled = false;

    const loadLists = async () => {
      try {
        const [siteRes, perRes] = await Promise.allSettled([
          getDataAsync("SiteAptEvControllerSet/sites"),
          // burada rolKod’u ihtiyacına göre değiştirirsin
          getDataAsync("Personeller/ByDurum?rolKod=30&aktifMi=true"),
        ]);

        if (cancelled) return;

        if (siteRes.status === "fulfilled") setSites(siteRes.value || []);
        else console.error("SITES FETCH ERROR:", siteRes.reason);

        if (perRes.status === "fulfilled") setPersoneller(perRes.value || []);
        else console.error("PERSONELLER FETCH ERROR:", perRes.reason);
      } catch (err) {
        console.error("LIST LOAD ERROR:", err);
      }
    };

    loadLists();
    return () => {
      cancelled = true;
    };
  }, []);

  // İş emri: filtre/paging değişince otomatik
  useEffect(() => {
    loadIsEmri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmriEndpoint]);

  // Satın alma: paging değişince otomatik
  useEffect(() => {
    loadSatinAlma();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satinAlmaEndpoint]);

  // =========================
  // UI handlers
  // =========================
  const resetFilters = () => {
    setSiteId("");
    setPersonelId("");
    setStart("");
    setEnd("");
    setIsEmriPage(1);
    setSaPage(1);
  };

  const refreshAll = async () => {
    await Promise.all([loadIsEmri(), loadSatinAlma()]);
  };

  // =========================
  // ✅ EXCEL DOWNLOAD (getDataAsync ile BLOB)
  // =========================
  const buildExcelQueryString = () => {
    const qs = new URLSearchParams();

    if (siteId) qs.set("siteId", String(siteId));
    if (personelId) qs.set("personelId", String(personelId));

    // ✅ tarih: sadece ikisi birlikte
    if (start && end) {
      qs.set("start", start);
      qs.set("end", end);
    }

    const s = qs.toString();
    return s ? `?${s}` : "";
  };

  function downloadBlob(blob, baseFilename) {
  const d = new Date();
  const gun = String(d.getDate()).padStart(2, "0");
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  const yil = d.getFullYear();

  const filename = baseFilename.replace(
    /\.xlsx$/i,
    `-${gun}-${ay}-${yil}.xlsx`
  );

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


  const handleDownloadIsEmriExcel = async () => {
    try {
      setDownloadErr("");
      setDownloading(true);

      const qs = buildExcelQueryString();
      const blob = await getDataAsync(
        `yoneticiraporu/IS-EMIRLERI-DETAYLI-RAPOR-EXCEL${qs}`,
        { responseType: "blob" }
      );

      downloadBlob(blob, "is-emirleri-rapor.xlsx");
    } catch (e) {
      console.error("IS EMRI EXCEL DOWNLOAD ERROR:", e);
      const status = e?.response?.status;
      const msg =
        status === 401
          ? "401: Token yok/expired. Tekrar giriş yap."
          : status === 403
          ? "403: Yetkin yok."
          : status
          ? `İndirme hatası: ${status}`
          : "İndirme hatası oluştu.";
      setDownloadErr(msg);
    } finally {
      setDownloading(false);
    }
  };




  const handleDownloadSatinAlmaExcel = async () => {
    try {
      setDownloadErr("");
      setDownloading(true);

      const qs = buildExcelQueryString();
      const blob = await getDataAsync(
        `yoneticiraporu/SATIN-ALMA-DETAYLI-RAPOR-EXCEL${qs}`,
        { responseType: "blob" }
      );

      downloadBlob(blob, "satinalma-rapor.xlsx");
    } catch (e) {
      console.error("SATIN ALMA EXCEL DOWNLOAD ERROR:", e);
      const status = e?.response?.status;
      const msg =
        status === 401
          ? "401: Token yok/expired. Tekrar giriş yap."
          : status === 403
          ? "403: Yetkin yok."
          : status
          ? `İndirme hatası: ${status}`
          : "İndirme hatası oluştu.";
      setDownloadErr(msg);
    } finally {
      setDownloading(false);
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="p-3 space-y-3">
      {/* ===== Üst Panel ===== */}
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Yönetici Raporu – İş Emirleri + Satın Alma
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              İş Emri: {isEmriTotalCount} kayıt • Sayfa: {isEmriPage}/
              {isEmriTotalPages}
              <span className="mx-2">•</span>
              Satın Alma: {saTotalCount} kayıt • Sayfa: {saPage}/{saTotalPages}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Filtreleri Sıfırla
            </button>

            <button
              type="button"
              onClick={refreshAll}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Tümünü Yenile
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadIsEmriExcel}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold text-white ${
                downloading ? "bg-zinc-400" : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              {downloading ? "İndiriliyor..." : "İŞ EMRİ EXCEL"}
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadSatinAlmaExcel}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold text-white ${
                downloading
                  ? "bg-zinc-400"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {downloading ? "İndiriliyor..." : "SATIN ALMA EXCEL"}
            </button>
          </div>
        </div>

        {downloadErr ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {downloadErr}
          </div>
        ) : null}

        {/* Filtre satırı (iş emri için) */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          {/* Site dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Site</label>
            <select
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setIsEmriPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>
              {sites.map((s) => (
                <option key={s.id ?? s.Id} value={s.id ?? s.Id}>
                  {s.ad ?? s.Ad ?? `Site #${s.id ?? s.Id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Personel dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Personel</label>
            <select
              value={personelId}
              onChange={(e) => {
                setPersonelId(e.target.value);
                setIsEmriPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>
              {personeller.map((p) => {
                const id = p.id ?? p.Id;
                const ad = p.ad ?? p.Ad ?? "";
                const soyad = p.soyad ?? p.Soyad ?? "";
                const label = `${ad} ${soyad}`.trim() || `Personel #${id}`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setIsEmriPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">End</label>
            <input
              type="date"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setIsEmriPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={loadIsEmri}
              className="h-8 rounded-md border border-sky-200 bg-sky-50 px-3 text-[12px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/45"
            >
              İş Emri Yenile
            </button>

            <button
              type="button"
              onClick={loadSatinAlma}
              className="h-8 rounded-md border border-indigo-200 bg-indigo-50 px-3 text-[12px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/45"
            >
              Satın Alma Yenile
            </button>
          </div>
        </div>
      </div>


      <YoneticiRaporuIsEmriGrafikPanel />

      {/* ===== İş Emri Pagination ===== */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            İş Emirleri
          </div>
          {isEmriLoading && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Yükleniyor…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isEmriPage <= 1}
            onClick={() => setIsEmriPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ◀ Önceki
          </button>

          <button
            type="button"
            disabled={isEmriPage >= isEmriTotalPages}
            onClick={() =>
              setIsEmriPage((p) => Math.min(isEmriTotalPages, p + 1))
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Sonraki ▶
          </button>
        </div>
      </div>

      <YoneticiRaporuIsEmriCard data={isEmriItems} />

      {/* ✅ Satın Alma Grafik Özet (yukarıda olsun daha iyi) */}
      <YoneticiRaporuSatinAlmaGrafikPanel className="mt-2" />

      {/* ===== Satın Alma Pagination ===== */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Satın Alma
          </div>
          {saLoading && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Yükleniyor…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saPage <= 1}
            onClick={() => setSaPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ◀ Önceki
          </button>

          <button
            type="button"
            disabled={saPage >= saTotalPages}
            onClick={() => setSaPage((p) => Math.min(saTotalPages, p + 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Sonraki ▶
          </button>
        </div>
      </div>

      <YoneticiRaporuSatinAlmaCard data={saItems} />
    </div>
  );
}
