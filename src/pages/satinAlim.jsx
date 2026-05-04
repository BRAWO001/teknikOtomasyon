import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";
import SatinAlmaPersonelTalepCard from "@/components/satinalma/SatinAlmaPersonelTalepCard";
import SonYorumOzetMiniPanel from "@/components/yoneticiRaporu/SonYorumOzetMiniPanel";

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
  start.setMonth(start.getMonth() - 3);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

function normalizePagedResponse(res) {
  if (!res) return { items: [], totalPages: 1, totalCount: 0 };

  const items = res.items ?? res.Items ?? [];
  const totalPages = Number(res.totalPages ?? res.TotalPages ?? 1) || 1;
  const totalCount =
    Number(
      res.totalCount ??
        res.TotalCount ??
        (Array.isArray(items) ? items.length : 0)
    ) || 0;

  return { items, totalPages, totalCount };
}

export default function SatinAlmaPersonelPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [siteId, setSiteId] = useState("");
  const [sadeceTumOnaydanGecenler, setSadeceTumOnaydanGecenler] =
    useState(false);

  const defaults = getDefaultRange();
  const [start, setStart] = useState(defaults.startDate);
  const [end, setEnd] = useState(defaults.endDate);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    if (siteId) qs.set("siteId", String(siteId));

    if (start && end) {
      qs.set("startDate", start);
      qs.set("endDate", end);
    }

    if (sadeceTumOnaydanGecenler) {
      qs.set("tumOnaylananlar", "true");
    }

    return `SatinAlmaPersonel?${qs.toString()}`;
  }, [page, pageSize, siteId, start, end, sadeceTumOnaydanGecenler]);

  async function loadData() {
    setLoading(true);

    try {
      const res = await getDataAsync(endpoint);
      const norm = normalizePagedResponse(res);

      setItems(norm.items || []);
      setTotalPages(norm.totalPages || 1);
      setTotalCount(norm.totalCount || 0);
    } catch (e) {
      console.error("SatinAlmaPersonel GET hata:", e);
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        const siteRes = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(siteRes || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const resetFilters = () => {
    const d = getDefaultRange();

    setSiteId("");
    setStart(d.startDate);
    setEnd(d.endDate);
    setSadeceTumOnaydanGecenler(false);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-3 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-3">
        <SonYorumOzetMiniPanel
          endpoint="SatinAlmaPersonel/son-yorumlu-ozet"
          take={10}
          stickyTop={8}
        />

        <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Satın Alma Talepleri
              </div>

              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {totalCount} kayıt • Sayfa {page}/{totalPages}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSadeceTumOnaydanGecenler((v) => !v);
                  setPage(1);
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition ${
                  sadeceTumOnaydanGecenler
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {sadeceTumOnaydanGecenler
                  ? "✓ Tüm Onaylananlar"
                  : "Tüm Onaylananları Göster"}
              </button>

              {/* <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                ← Geri
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                ⌂ Anasayfa
              </button> */}

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sıfırla
              </button>

              <button
                type="button"
                onClick={loadData}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
              >
                Yenile
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-zinc-500">
                Site
              </label>

              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>
                {sites.map((s) => (
                  <option key={s.id ?? s.Id} value={s.id ?? s.Id}>
                    {s.ad ?? s.Ad ?? `Site #${s.id ?? s.Id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-zinc-500">
                Başlangıç
              </label>

              <input
                type="date"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-zinc-500">
                Bitiş
              </label>

              <input
                type="date"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Talepler
            {loading && (
              <span className="ml-2 text-xs font-normal text-zinc-500">
                Yükleniyor…
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              ◀ Önceki
            </button>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Sonraki ▶
            </button>
          </div>
        </div>

        <SatinAlmaPersonelTalepCard
          data={items}
          page={page}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}