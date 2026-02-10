



// pages/YonetimKuruluYoneticiRaporu/index.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

import YoneticiRaporuKararlarTable from "@/components/yoneticiRaporu/YoneticiRaporuKararlarTable";
import YoneticiRaporuIletilerTable from "@/components/yoneticiRaporu/YoneticiRaporuIletilerTable";

/* ===== safe normalize ===== */
function normalizePagedResponse(res) {
  if (Array.isArray(res)) {
    return { items: res, totalPages: 1, totalCount: res.length };
  }
  const list = res?.items ?? res?.Items ?? [];
  const items = Array.isArray(list) ? list : [];
  const totalPages = Number(res?.totalPages ?? res?.TotalPages ?? 1) || 1;
  const totalCount = Number(res?.totalCount ?? res?.TotalCount ?? items.length) || 0;
  return { items, totalPages, totalCount };
}
/* ======================== */

export default function YonetimKuruluYoneticiRaporuPage() {
  const router = useRouter();

  // ✅ View: karar | ileti
  const [view, setView] = useState("karar");

  // listeler
  const [sites, setSites] = useState([]);

  // filtreler
  const [siteId, setSiteId] = useState("");
  const [search, setSearch] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // data
  const [items, setItems] = useState([]); // ✅ her zaman array
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ “Kararlar/İletiler” click davranışını tek yerden yönetelim
  const selectView = useCallback(
    (nextView) => {
      setView(nextView);
      setPage(1);

      // ✅ tıklanmış gibi: URL de aynı şekilde güncellensin
      if (nextView === "karar") {
        router.replace("/YonetimKuruluYoneticiRaporu", undefined, { shallow: true });
      } else {
        router.replace("/YonetimKuruluYoneticiRaporu?view=ileti", undefined, { shallow: true });
      }
    },
    [router]
  );

  // ✅ GERİ GELİNCE: sanki “Kararlar” butonuna tıklanmış gibi olsun
  const didAutoClickRef = useRef(false);
  useEffect(() => {
    if (!router.isReady) return;
    if (didAutoClickRef.current) return;
    didAutoClickRef.current = true;

    // her durumda kararlar “tıklansın”
    selectView("karar");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // ✅ endpoint view’a göre değişir
  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (siteId) qs.set("siteId", String(siteId));
    if (search?.trim()) qs.set("search", search.trim());

    if (view === "ileti") {
      return `projeYonetimKurulu/ileti/iletis?${qs.toString()}`;
    }
    return `projeYonetimKurulu/kararlar?${qs.toString()}`;
  }, [view, page, pageSize, siteId, search]);

  // siteler
  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        const siteRes = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(Array.isArray(siteRes) ? siteRes : []);
      } catch (e) {
        console.error("SITES LOAD ERROR:", e);
        if (cancelled) return;
        setSites([]);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
  }, []);

  // liste loader
  const loadList = useCallback(async () => {
    setLoading(true);
    setErr("");
    setItems([]); // ✅ map güvenliği

    try {
      const res = await getDataAsync(endpoint);
      const norm = normalizePagedResponse(res);

      setItems(norm.items);
      setTotalPages(norm.totalPages);
      setTotalCount(norm.totalCount);
    } catch (e) {
      console.error("LIST GET ERROR:", e);
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);

      const status = e?.response?.status;
      setErr(status ? `Liste alınamadı (HTTP ${status}).` : "Liste alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!router.isReady) return;
    loadList();
  }, [router.isReady, loadList]);

  const resetFilters = () => {
    setSiteId("");
    setSearch("");
    setPage(1);
  };

  const handleYeni = () => {
    if (view === "ileti") {
      router.push("/YonetimKuruluYoneticiRaporu/YoneticiRaporuYeniIletiOlustur");
      return;
    }
    router.push("/YonetimKuruluYoneticiRaporu/YoneticiRaporuYeniKararOlustur");
  };

  const handleAnaSayfayaDon = () => router.push("/");

  const rowOpen = (token) => {
    if (!token) return;

    if (view === "karar") {
      router.push(`/YonetimKurulu/karar/${token}`);
      return;
    }
    router.push(`/YonetimKurulu/ileti/${token}`);
  };

  const title =
    view === "ileti" ? "Yönetim Kurulu – İletiler Raporu" : "Yönetim Kurulu – Kararlar Raporu";
  const listLabel = view === "ileti" ? "İletiler" : "Kararlar";
  const searchPlaceholder =
    view === "ileti"
      ? "Başlık / Açıklama / Durum içinde ara..."
      : "Konu / Açıklama / Nihai sonuç içinde ara...";

  return (
    <div className="p-3 space-y-3">
      {/* ===== Üst Panel ===== */}
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Toplam: {totalCount} kayıt • Sayfa: {page}/{totalPages}
            </div>

            {/* ✅ Seçim: Kararlar / İletiler */}
            <div className="mt-2 inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => selectView("karar")}
                className={[
                  "px-3 py-1 text-[11px] font-semibold rounded-md",
                  view === "karar"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-300",
                ].join(" ")}
              >
                Kararlar
              </button>

              <button
                type="button"
                onClick={() => selectView("ileti")}
                className={[
                  "px-3 py-1 text-[11px] font-semibold rounded-md",
                  view === "ileti"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-300",
                ].join(" ")}
              >
                İletiler
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleAnaSayfayaDon}
              className="
                inline-flex items-center justify-center gap-2
                rounded-md px-2 py-1 text-[11px] font-semibold
                bg-blue-600 text-white shadow-sm
                hover:bg-blue-700 active:scale-[0.99]
                focus:outline-none focus:ring-2 focus:ring-blue-300
                dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-blue-900/40
              "
            >
              🏠 Ana Sayfaya Dön
            </button>

            <button
              type="button"
              onClick={handleYeni}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ➕ Yeni {view === "ileti" ? "İleti" : "Karar"} Oluştur
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
              onClick={loadList}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Yenile
            </button>
          </div>
        </div>

        {err ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {err}
          </div>
        ) : null}

        {/* Filtre satırı */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1 md:col-span-2">
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
              {sites.map((s) => {
                const id = s.id ?? s.Id;
                const ad = s.ad ?? s.Ad;
                return (
                  <option key={id} value={id}>
                    {ad ?? `Site #${id}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-4">
            <label className="text-[11px] text-zinc-500">Arama</label>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* ===== Pagination Bar ===== */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            {listLabel}
          </div>
          {loading && <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Yükleniyor…</span>}
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

      {/* ✅ TABLO */}
      {view === "ileti" ? (
        <YoneticiRaporuIletilerTable items={items} loading={loading} onRowOpen={rowOpen} />
      ) : (
        <YoneticiRaporuKararlarTable items={items} loading={loading} onRowOpen={rowOpen} />
      )}
    </div>
  );
}
