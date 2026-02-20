// pages/detayliTaleplerRaporu.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";
import YoneticiRaporuDetayliTalepCard from "@/components/yoneticiRaporu/YoneticiRaporuDetayliTalepCard";
import SonYorumOzetMiniPanel from "@/components/yoneticiRaporu/SonYorumOzetMiniPanel";


const TALEP_CINSI_OPTIONS = [
  { value: "Satın Alma", label: "Satın Alma" },
  { value: "Teknik Talep", label: "Teknik Talep" },
  { value: "Güvenlik", label: "Güvenlik" },
  { value: "İletişim", label: "İletişim" },
  { value: "İnsan Kaynakları", label: "İnsan Kaynakları" },
  { value: "Muhasebe", label: "Muhasebe" },
  { value: "Peyzaj", label: "Peyzaj" },
  { value: "Diğer", label: "Diğer" },
];

const TEKNIK_TALEP_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "Evet", label: "Evet" },
  { value: "Hayır", label: "Hayır" },
];

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
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(today) };
}

/* ✅ Kritik: response normalize */
function normalizePagedResponse(res) {
  if (!res) return { items: [], totalPages: 1, totalCount: 0 };

  const items = res.items ?? res.Items ?? [];
  const totalPages = Number(res.totalPages ?? res.TotalPages ?? 1) || 1;
  const totalCount = Number(res.totalCount ?? res.TotalCount ?? (Array.isArray(items) ? items.length : 0)) || 0;

  return { items, totalPages, totalCount };
}

export default function DetayliTaleplerRaporuPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [siteId, setSiteId] = useState("");
  const [talepCinsi, setTalepCinsi] = useState("");
  const [teknikTalep, setTeknikTalep] = useState("");

  const defaults = getDefaultRange();
  const [start, setStart] = useState(defaults.startDate);
  const [end, setEnd] = useState(defaults.endDate);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    if (siteId) qs.set("siteId", String(siteId));
    if (talepCinsi) qs.set("talepCinsi", String(talepCinsi));
    if (teknikTalep) qs.set("teknikTalep", String(teknikTalep));

    if (start && end) {
      qs.set("startDate", start);
      qs.set("endDate", end);
    }

    return `DetayliFilterTalep?${qs.toString()}`;
  }, [page, pageSize, siteId, talepCinsi, teknikTalep, start, end]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getDataAsync(endpoint);
      const norm = normalizePagedResponse(res);

      setItems(norm.items || []);
      setTotalPages(norm.totalPages || 1);
      setTotalCount(norm.totalCount || 0);
    } catch (e) {
      console.error("DetayliTaleplerRaporu GET hata:", e);
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const loadLists = async () => {
      try {
        const siteRes = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(siteRes || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    };
    loadLists();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const resetFilters = () => {
    setSiteId("");
    setTalepCinsi("");
    setTeknikTalep("");
    setStart("");
    setEnd("");
    setPage(1);
  };

  const refresh = async () => {
    await loadData();
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Detaylı Talepler Raporu
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {totalCount} kayıt • Sayfa: {page}/{totalPages}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">

            <button
              type="button"
              onClick={() => router.push("/satinalma/onayBekleyen")}
              className="rounded-md border cursor-pointer border-zinc-300 bg-yellow-200 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Onayımı Bekleyen Talepler
            </button>


            <SonYorumOzetMiniPanel take={30} stickyTop={8} />




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
              onClick={refresh}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Yenile
            </button>
          </div>
        </div>


        
       

        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Site</label>
            <select
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setPage(1);
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

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Talep Cinsi</label>
            <select
              value={talepCinsi}
              onChange={(e) => {
                setTalepCinsi(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>
              {TALEP_CINSI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Teknik Talep</label>
            <select
              value={teknikTalep}
              onChange={(e) => {
                setTeknikTalep(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {TEKNIK_TALEP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

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

          <div className="flex items-end gap-2 md:col-span-1">
            <button
              type="button"
              onClick={loadData}
              className="h-8 rounded-md border border-sky-200 bg-sky-50 px-3 text-[12px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/45"
            >
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Talepler
          </div>
          {loading && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Yükleniyor…
            </span>
          )}
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

      <YoneticiRaporuDetayliTalepCard
        data={items}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
