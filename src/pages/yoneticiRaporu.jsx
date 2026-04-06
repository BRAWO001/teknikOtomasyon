




// pages/yoneticiRaporu.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";
import YoneticiRaporuIsEmriCard from "@/components/yoneticiRaporu/YoneticiRaporuIsEmriCard";
import YoneticiRaporuIsEmriGrafikPanel from "@/components/yoneticiRaporu/YoneticiRaporuIsEmriGrafikPanel";
import IsEmriRemoveModal from "@/components/yoneticiRaporu/IsEmriRemoveModal";

const SUREC_OPTIONS = ["İncelemede", "Kontrol Ediliyor", "Tamamlandı"];

export default function YoneticiRaporuPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [personeller, setPersoneller] = useState([]);

  const [isEmriItems, setIsEmriItems] = useState([]);
  const [isEmriLoading, setIsEmriLoading] = useState(true);
  const [isEmriPage, setIsEmriPage] = useState(1);
  const [isEmriPageSize] = useState(25);
  const [isEmriTotalPages, setIsEmriTotalPages] = useState(1);
  const [isEmriTotalCount, setIsEmriTotalCount] = useState(0);

  const [siteId, setSiteId] = useState("");
  const [personelId, setPersonelId] = useState("");
  const [pySurecDurumu, setPySurecDurumu] = useState("");
  const [otmSurecDurumu, setOtmSurecDurumu] = useState("");
  const [ogmSurecDurumu, setOgmSurecDurumu] = useState("");
  const [arama, setArama] = useState("");
  const [seriKod, setSeriKod] = useState("");

  function toDateInputValue(d) {
    try {
      return d.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }

  function getDefaultRange() {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(start.getMonth() - 6);
    return {
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(today),
    };
  }

  const defaults = getDefaultRange();

  const [start, setStart] = useState(defaults.startDate);
  const [end, setEnd] = useState(defaults.endDate);

  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);

  const isEmriEndpoint = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(isEmriPage));
    qs.set("pageSize", String(isEmriPageSize));

    if (personelId) qs.set("personelId", String(personelId));
    if (pySurecDurumu) qs.set("pySurecDurumu", pySurecDurumu);
    if (otmSurecDurumu) qs.set("otmSurecDurumu", otmSurecDurumu);
    if (ogmSurecDurumu) qs.set("ogmSurecDurumu", ogmSurecDurumu);
    if (arama.trim()) qs.set("arama", arama.trim());
    if (seriKod.trim()) qs.set("seriKod", seriKod.trim());
    if (siteId) qs.set("siteId", String(siteId));

    if (start && end) {
      qs.set("start", start);
      qs.set("end", end);
    }

    return `yoneticiraporu/isEmirleriDetayliYoneticiRaporu?${qs.toString()}`;
  }, [
    isEmriPage,
    isEmriPageSize,
    personelId,
    pySurecDurumu,
    otmSurecDurumu,
    ogmSurecDurumu,
    arama,
    seriKod,
    siteId,
    start,
    end,
  ]);

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

  useEffect(() => {
    let cancelled = false;

    const loadLists = async () => {
      try {
        const [siteRes, perRes] = await Promise.allSettled([
          getDataAsync("SiteAptEvControllerSet/sites"),
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

  useEffect(() => {
    loadIsEmri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmriEndpoint]);

  const resetFilters = () => {
    setPersonelId("");
    setPySurecDurumu("");
    setOtmSurecDurumu("");
    setOgmSurecDurumu("");
    setArama("");
    setSeriKod("");
    setSiteId("");
    setStart("");
    setEnd("");
    setIsEmriPage(1);
  };

  const refreshAll = async () => {
    await loadIsEmri();
  };

  const buildExcelQueryString = () => {
    const qs = new URLSearchParams();

    if (personelId) qs.set("personelId", String(personelId));
    if (pySurecDurumu) qs.set("pySurecDurumu", pySurecDurumu);
    if (otmSurecDurumu) qs.set("otmSurecDurumu", otmSurecDurumu);
    if (ogmSurecDurumu) qs.set("ogmSurecDurumu", ogmSurecDurumu);
    if (arama.trim()) qs.set("arama", arama.trim());
    if (seriKod.trim()) qs.set("seriKod", seriKod.trim());
    if (siteId) qs.set("siteId", String(siteId));

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

    const filename = baseFilename.replace(/\.xlsx$/i, `-${gun}-${ay}-${yil}.xlsx`);

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
      const blob = await getDataAsync(`yoneticiraporu/IS-EMIRLERI-DETAYLI-RAPOR-EXCEL${qs}`, {
        responseType: "blob",
      });

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

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Yönetici Raporu – İş Emirleri
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              İş Emri: {isEmriTotalCount} kayıt • Sayfa: {isEmriPage}/
              {isEmriTotalPages}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ⌂ Anasayfa
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Filtreleri Sıfırla
            </button>

            <button
              type="button"
              onClick={() => setRemoveOpen(true)}
              className="rounded-md border cursor-pointer border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30"
            >
              🗑 İş Emri Sil
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
          </div>
        </div>

        {downloadErr ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {downloadErr}
          </div>
        ) : null}

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[150px] flex-1">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Personel
              </label>
              <select
                value={personelId}
                onChange={(e) => {
                  setPersonelId(e.target.value);
                  setIsEmriPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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

            <div className="min-w-[130px] flex-1">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Site
              </label>
              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setIsEmriPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>
                {sites.map((s) => (
                  <option key={s.id ?? s.Id} value={s.id ?? s.Id}>
                    {s.ad ?? s.Ad ?? `Site #${s.id ?? s.Id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[88px]">
              <label className="mb-1 block text-[11px] text-zinc-500">PY</label>
              <select
                value={pySurecDurumu}
                onChange={(e) => {
                  setPySurecDurumu(e.target.value);
                  setIsEmriPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>
                {SUREC_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[88px]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                OTM
              </label>
              <select
                value={otmSurecDurumu}
                onChange={(e) => {
                  setOtmSurecDurumu(e.target.value);
                  setIsEmriPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>
                {SUREC_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[88px]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                OGM
              </label>
              <select
                value={ogmSurecDurumu}
                onChange={(e) => {
                  setOgmSurecDurumu(e.target.value);
                  setIsEmriPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>
                {SUREC_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[180px] flex-[1.2]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Başlık / Açıklama
              </label>
              <input
                type="text"
                value={arama}
                onChange={(e) => {
                  setArama(e.target.value);
                  setIsEmriPage(1);
                }}
                placeholder="Metin ara"
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="min-w-[150px] flex-1">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Seri Kod
              </label>
              <input
                type="text"
                value={seriKod}
                onChange={(e) => {
                  setSeriKod(e.target.value);
                  setIsEmriPage(1);
                }}
                placeholder="Seri kod ara"
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="w-[135px]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Başlangıç
              </label>
              <input
                type="date"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setIsEmriPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="w-[135px]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Bitiş
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setIsEmriPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="h-8 rounded-md border border-zinc-300 bg-white px-3 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sıfırla
              </button>

              <button
                type="button"
                onClick={loadIsEmri}
                className="h-8 rounded-md border border-sky-200 bg-sky-50 px-3 text-[12px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/45"
              >
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>


      <IsEmriRemoveModal
        isOpen={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onDeleted={() => {
          setRemoveOpen(false);
          loadIsEmri();
        }}
      />

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

      <YoneticiRaporuIsEmriCard
        data={isEmriItems}
        page={isEmriPage}
        pageSize={isEmriPageSize}
      />
    </div>
  );
}