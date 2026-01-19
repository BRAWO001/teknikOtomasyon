




// pages/projeGorevlileriIsEmirleri.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync } from "@/utils/apiService";
import ProjeGorevlileriIsEmriCard from "@/components/projeGorevlileri/ProjeGorevlileriIsEmriCard";

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
  start.setMonth(start.getMonth() - 1);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

export default function ProjeGorevlileriIsEmirleriPage() {
  const router = useRouter();

  // ----------------------------
  // Personel (cookie)
  // ----------------------------
  const [personel, setPersonel] = useState(null);
  const personelId = useMemo(() => {
    if (!personel) return null;
    return personel?.id ?? personel?.Id ?? null;
  }, [personel]);

  // ----------------------------
  // Lookups -> site otomatik
  // ----------------------------
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(""); // otomatik set
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [sitesError, setSitesError] = useState("");

  const getId = (obj) => obj?.id ?? obj?.Id;
  const getAd = (obj) => obj?.ad ?? obj?.Ad;

  const selectedSiteName = useMemo(() => {
    const sid = siteId ? Number(siteId) : null;
    if (!sid) return null;
    const s = sites.find((x) => Number(getId(x)) === sid);
    return s ? getAd(s) : null;
  }, [siteId, sites]);

  // ----------------------------
  // İş emri state
  // ----------------------------
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ----------------------------
  // Filtreler (site yok -> otomatik)
  // ----------------------------
  const defaults = getDefaultRange();
  const [start, setStart] = useState(defaults.startDate);
  const [end, setEnd] = useState(defaults.endDate);

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
  // Lookups: site otomatik set
  // ----------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      if (!personelId) return;

      setLoadingLookups(true);
      setSitesError("");

      try {
        // ✅ senin mevcut kullandığın endpoint
        const res = await getDataAsync(
          `Personeller/satinalma-yeni/lookups?personelId=${personelId}`
        );

        if (cancelled) return;

        const resSites = res?.sites || [];
        const defaultSiteId = res?.defaultSiteId ?? null;

        setSites(resSites);

        // otomatik seçim kuralı
        if (Array.isArray(resSites) && resSites.length === 1) {
          const onlyId = getId(resSites[0]);
          setSiteId(onlyId ? String(onlyId) : "");
        } else if (defaultSiteId) {
          setSiteId(String(defaultSiteId));
        } else if (Array.isArray(resSites) && resSites.length > 0) {
          const firstId = getId(resSites[0]);
          setSiteId(firstId ? String(firstId) : "");
        } else {
          setSiteId("");
          setSitesError("Bu kullanıcı için otomatik site bulunamadı.");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("LOOKUPS ERROR:", err);
        setSitesError("Site/proje bilgileri alınamadı. (lookups endpoint kontrol)");
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    };

    fetchLookups();
    return () => {
      cancelled = true;
    };
  }, [personelId]);

  // ----------------------------
  // ✅ Endpoint: senin CURL ile aynı controller
  // ----------------------------
  const endpoint = useMemo(() => {
    if (!siteId) return null; // site gelmeden fetch yok

    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    qs.set("siteId", String(siteId)); // ✅ otomatik site filtresi

    // tarih filtresi: sadece ikisi birlikte
    if (start && end) {
      qs.set("start", start);
      qs.set("end", end);
    }

    // ✅ CURL: /api/ProjeYoneticileri/isEmirleriDetayliYoneticiRaporu
    return `ProjeYoneticileri/isEmirleriDetayliYoneticiRaporu?${qs.toString()}`;
  }, [siteId, page, pageSize, start, end]);

  // ----------------------------
  // Loader
  // ----------------------------
  async function loadItems() {
    if (!endpoint) return;
    setLoading(true);
    try {
      const res = await getDataAsync(endpoint);

      setItems(res?.items || []);
      setTotalPages(res?.totalPages || 1);
      setTotalCount(res?.totalCount || 0);
    } catch (e) {
      console.error("ProjeGorevlileri IsEmri GET hata:", e);
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const resetFilters = () => {
    setStart("");
    setEnd("");
    setPage(1);
  };

  return (
    <div className="p-3 space-y-3">
      {/* Üst Panel */}
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Proje Görevlileri – İş Emirleri
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>
                {totalCount} kayıt • Sayfa: {page}/{totalPages}
              </span>

              {loading ? <span>• Yükleniyor…</span> : null}

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                Site:{" "}
                {loadingLookups
                  ? "Yükleniyor..."
                  : selectedSiteName || (siteId ? `#${siteId}` : "-")}
              </span>

              
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Tarihi Sıfırla
            </button>

            <button
              type="button"
              onClick={loadItems}
              disabled={!siteId}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Yenile
            </button>
          </div>
        </div>

        {sitesError ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {sitesError}
          </div>
        ) : null}

        {/* Filtre satırı: sadece tarih */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setPage(1);
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
                setPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={loadItems}
              disabled={!siteId}
              className="h-8 rounded-md border border-sky-200 bg-sky-50 px-3 text-[12px] font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/45"
            >
              Listeyi Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
          İş Emirleri
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ◀ Önceki
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Sonraki ▶
          </button>
        </div>
      </div>

      <ProjeGorevlileriIsEmriCard data={items} />
    </div>
  );
}
