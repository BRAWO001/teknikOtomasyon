// pages/projeGorevlileri/projeminTalepleri.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync } from "@/utils/apiService";

import YoneticiRaporuDetayliTalepCard from "@/components/yoneticiRaporu/YoneticiRaporuDetayliTalepCard";

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
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

function normalizePagedResponse(res) {
  if (!res) return { items: [], totalPages: 1, totalCount: 0 };

  if (Array.isArray(res)) {
    return { items: res, totalPages: 1, totalCount: res.length };
  }

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

export default function ProjeGorevlileriDetayliTaleplerPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  const [siteList, setSiteList] = useState([]);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError, setSiteError] = useState("");

  const [siteId, setSiteId] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [talepCinsi, setTalepCinsi] = useState("");
  const [teknikTalep, setTeknikTalep] = useState("");

  const defaults = getDefaultRange();
  const [start, setStart] = useState(defaults.startDate);
  const [end, setEnd] = useState(defaults.endDate);

  const personelKodu = useMemo(() => {
    return (
      personel?.personelKodu ||
      personel?.PersonelKodu ||
      personel?.kodu ||
      personel?.Kodu ||
      null
    );
  }, [personel]);

  const getSiteId = (x) => x?.SiteId ?? x?.siteId ?? x?.id ?? x?.Id ?? null;
  const getSiteName = (x) =>
    x?.SiteAdi ||
    x?.siteAdi ||
    x?.Site?.Ad ||
    x?.site?.ad ||
    x?.Ad ||
    x?.ad ||
    null;

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

  // personelin erişebildiği siteleri çek
  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      if (!personelKodu) return;

      try {
        setSiteLoading(true);
        setSiteError("");

        const data = await getDataAsync(
          `ProjeYoneticileri/site/personel/${encodeURIComponent(personelKodu)}`
        );

        if (cancelled) return;

        const arr = Array.isArray(data) ? data : data ? [data] : [];
        setSiteList(arr);

        const allowedIds = arr
          .map((x) => String(getSiteId(x) ?? ""))
          .filter(Boolean);

        const directSiteId =
          personel?.siteId ||
          personel?.SiteId ||
          personel?.siteID ||
          personel?.SiteID ||
          null;

        if (directSiteId && allowedIds.includes(String(directSiteId))) {
          setSiteId(String(directSiteId));
          return;
        }

        if (allowedIds.length === 0) {
          setSiteId("");
          setSiteError("Bu kullanıcı için aktif site bulunamadı.");
          return;
        }

        setSiteId((prev) => {
          if (prev && allowedIds.includes(String(prev))) return String(prev);
          return String(allowedIds[0]);
        });
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
  }, [personelKodu, personel]);

  // siteId whitelist dışına çıkamasın
  const safeSiteId = useMemo(() => {
    const allowed = new Set(
      (siteList || [])
        .map((x) => String(getSiteId(x) ?? ""))
        .filter(Boolean)
    );

    if (siteId && allowed.has(String(siteId))) return String(siteId);

    const first = (siteList || [])
      .map((x) => getSiteId(x))
      .find((v) => v !== undefined && v !== null);

    return first ? String(first) : "";
  }, [siteId, siteList]);

  useEffect(() => {
    if (!safeSiteId) return;
    if (siteId !== safeSiteId) setSiteId(safeSiteId);
  }, [safeSiteId, siteId]);

  const endpoint = useMemo(() => {
    if (!safeSiteId) return null;

    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    qs.set("siteId", String(safeSiteId));

    if (talepCinsi) qs.set("talepCinsi", String(talepCinsi));
    if (teknikTalep) qs.set("teknikTalep", String(teknikTalep));

    if (start && end) {
      qs.set("startDate", start);
      qs.set("endDate", end);
    }

    return `DetayliFilterTalep?${qs.toString()}`;
  }, [page, pageSize, safeSiteId, talepCinsi, teknikTalep, start, end]);

  const loadData = useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setErr("");

    try {
      const res = await getDataAsync(endpoint);
      const norm = normalizePagedResponse(res);

      setItems(norm.items || []);
      setTotalPages(norm.totalPages || 1);
      setTotalCount(norm.totalCount || 0);
    } catch (e) {
      console.error("Detayli talepler GET hata:", e);
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
    loadData();
  }, [router.isReady, loadData]);

  const resetFilters = () => {
    setTalepCinsi("");
    setTeknikTalep("");
    const freshDefaults = getDefaultRange();
    setStart(freshDefaults.startDate);
    setEnd(freshDefaults.endDate);
    setPage(1);
  };

  const refresh = async () => {
    await loadData();
  };

  const selectedSite = useMemo(() => {
    return (
      siteList.find((x) => String(getSiteId(x)) === String(safeSiteId)) || null
    );
  }, [siteList, safeSiteId]);

  const selectedSiteName = useMemo(() => {
    return getSiteName(selectedSite) || "Seçili site yok";
  }, [selectedSite]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Proje Görevlileri – Detaylı Talepler
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>
                {totalCount} kayıt • Sayfa: {page}/{totalPages}
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

            {err ? (
              <div className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
                {err}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => router.push("/satinalma/onayBekleyen")}
              className="rounded-md border cursor-pointer border-zinc-300 bg-yellow-200 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-yellow-300 dark:border-zinc-700 dark:bg-yellow-700 dark:text-zinc-100 dark:hover:bg-yellow-600"
            >
              Onayımı Bekleyen Talepler
            </button>

            <button
              type="button"
              onClick={() => router.push("/projeGorevlileri")}
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
              disabled={!safeSiteId}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Site</label>

            {siteList.length > 1 ? (
              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setPage(1);
                }}
                disabled={siteLoading || !siteList.length}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {siteList.map((s) => {
                  const id = getSiteId(s);
                  const ad = getSiteName(s) || "Site adı yok";

                  return (
                    <option key={id} value={String(id)}>
                      {ad}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="text"
                value={siteLoading ? "Yükleniyor..." : selectedSiteName}
                readOnly
                disabled
                className="h-8 rounded-md border border-zinc-300 bg-zinc-100 px-2 text-[12px] text-zinc-700 disabled:opacity-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            )}
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
              disabled={!safeSiteId}
              className="h-8 rounded-md border border-sky-200 bg-sky-50 px-3 text-[12px] font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/45"
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