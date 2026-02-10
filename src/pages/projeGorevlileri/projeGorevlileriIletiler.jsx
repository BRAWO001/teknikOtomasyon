



// pages/projeGorevlileri/projeGorevlileriIletiler.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync } from "@/utils/apiService";

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

export default function ProjeGorevlileriIletilerPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  const [siteList, setSiteList] = useState([]);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError, setSiteError] = useState("");

  // ⛔️ Artık "Tümü" yok. siteId her zaman whitelist içinden seçilecek.
  const [siteId, setSiteId] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const personelKodu = useMemo(() => {
    return (
      personel?.personelKodu ||
      personel?.PersonelKodu ||
      personel?.kodu ||
      personel?.Kodu ||
      null
    );
  }, [personel]);

  // cookie -> personel
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

  // ✅ site list + default siteId (WHITELIST)
  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      if (!personelKodu) return;

      try {
        setSiteLoading(true);
        setSiteError("");

        const data = await getDataAsync(
          `projeYonetimKurulu/site/personel/${encodeURIComponent(personelKodu)}`
        );

        if (cancelled) return;

        const arr = Array.isArray(data) ? data : [];
        setSiteList(arr);

        const allowedIds = arr
          .map((x) => String(x?.SiteId ?? x?.siteId ?? x?.id ?? x?.Id))
          .filter(Boolean);

        const directSiteId = personel?.siteId || personel?.SiteId || null;

        if (directSiteId && allowedIds.includes(String(directSiteId))) {
          setSiteId(String(directSiteId));
          return;
        }

        if (siteId && !allowedIds.includes(String(siteId))) {
          setSiteId("");
        }

        if (allowedIds.length === 0) {
          setSiteId("");
          setSiteError("Bu kullanıcı için aktif site bulunamadı.");
          return;
        }

        if (!siteId) {
          setSiteId(String(allowedIds[0]));
        }
      } catch (e) {
        if (cancelled) return;
        console.error("SITE LIST ERROR:", e);
        setSiteList([]);
        setSiteId("");
        setSiteError("Site bilgisi alınamadı. (endpoint kontrol)");
      } finally {
        if (!cancelled) setSiteLoading(false);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personelKodu]);

  // ✅ Safe siteId: whitelist dışına çıkamaz
  const safeSiteId = useMemo(() => {
    const allowed = new Set(
      (siteList || [])
        .map((x) => String(x?.SiteId ?? x?.siteId ?? x?.id ?? x?.Id))
        .filter(Boolean)
    );
    if (siteId && allowed.has(String(siteId))) return String(siteId);

    const first = (siteList || [])
      .map((x) => x?.SiteId ?? x?.siteId ?? x?.id ?? x?.Id)
      .find((v) => v !== undefined && v !== null);

    return first ? String(first) : "";
  }, [siteId, siteList]);

  useEffect(() => {
    if (!safeSiteId) return;
    if (siteId !== safeSiteId) setSiteId(safeSiteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSiteId]);

  const endpoint = useMemo(() => {
    // ✅ siteId zorunlu
    if (!safeSiteId) return null;

    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    // ✅ HER ZAMAN siteId gönder
    qs.set("siteId", String(safeSiteId));

    if (search?.trim()) qs.set("search", search.trim());

    // ✅ paged endpoint
    return `projeYonetimKurulu/ileti/iletis?${qs.toString()}`;
  }, [page, pageSize, safeSiteId, search]);

  const loadList = useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setErr("");
    setItems([]);

    try {
      const res = await getDataAsync(endpoint);
      const norm = normalizePagedResponse(res);

      setItems(norm.items);
      setTotalPages(norm.totalPages);
      setTotalCount(norm.totalCount);
    } catch (e) {
      console.error("ILETI LIST GET ERROR:", e);
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
    setSearch("");
    setPage(1);
  };

  const goBack = () => router.push("/projeGorevlileri");
  const goYeniIleti = () => router.push("/projeGorevlileri/projeGorevlileriYeniIleti");

  const rowOpen = (token) => {
    if (!token) return;
    router.push(`/YonetimKurulu/ileti/${token}`);
  };

  const selectedSiteName =
    siteList.find((x) => String(x?.SiteId ?? x?.siteId) === String(safeSiteId))?.Site?.Ad ||
    siteList.find((x) => String(x?.SiteId ?? x?.siteId) === String(safeSiteId))?.site?.ad ||
    (safeSiteId ? `Site #${safeSiteId}` : "Seçiniz");

  return (
    <div className="p-3 space-y-3">
      {/* Üst Panel */}
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Proje Görevlileri – İletiler
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>
                Toplam: {totalCount} kayıt • Sayfa: {page}/{totalPages}
              </span>

              {loading ? <span>• Yükleniyor…</span> : null}

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                Site: {siteLoading ? "Yükleniyor..." : selectedSiteName}
              </span>
            </div>

            {siteError ? (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                {siteError}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={goBack}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={goYeniIleti}
              disabled={!safeSiteId}
              className="rounded-md bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              ➕ Yeni İleti
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Filtreyi Sıfırla
            </button>

            <button
              type="button"
              onClick={loadList}
              disabled={!safeSiteId}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Yenile
            </button>
          </div>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] text-zinc-500">Site</label>
            <select
              value={safeSiteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setPage(1);
              }}
              disabled={siteList.length <= 1}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {/* ⛔️ Tümü kaldırıldı */}
              {siteList.map((s) => {
                const id = s.SiteId ?? s.siteId ?? s.id ?? s.Id;
                const ad = s.Site?.Ad ?? s.site?.ad ?? `Site #${id}`;
                return (
                  <option key={id} value={String(id)}>
                    {ad}
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
              placeholder="Başlık / Açıklama / Durum içinde ara..."
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            İletiler
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

      {err ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
          {err}
        </div>
      ) : null}

      <YoneticiRaporuIletilerTable items={items} loading={loading} onRowOpen={rowOpen} />
    </div>
  );
}
