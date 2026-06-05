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

function getDateValue(x) {
  return (
    x?.Tarih ||
    x?.tarih ||
    x?.OlusturmaTarihi ||
    x?.olusturmaTarihi ||
    x?.OlusturmaTarihiUtc ||
    x?.olusturmaTarihiUtc ||
    x?.CreatedAt ||
    x?.createdAt ||
    null
  );
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

  const allowedSiteIds = useMemo(() => {
    return (siteList || [])
      .map((x) => getSiteId(x))
      .filter((x) => x !== undefined && x !== null && String(x).trim() !== "")
      .map((x) => String(x));
  }, [siteList]);

  const selectedSite = useMemo(() => {
    if (!siteId) return null;

    return (
      siteList.find((x) => String(getSiteId(x)) === String(siteId)) || null
    );
  }, [siteList, siteId]);

  const selectedSiteName = useMemo(() => {
    if (siteLoading) return "Yükleniyor...";
    if (allowedSiteIds.length > 1 && !siteId) return "Tümü";
    if (selectedSite) return getSiteName(selectedSite) || "Site adı yok";
    if (allowedSiteIds.length === 1) return getSiteName(siteList[0]) || "Site adı yok";
    return "Seçili site yok";
  }, [siteLoading, allowedSiteIds, siteId, selectedSite, siteList]);

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

        const temizListe = arr.filter((x) => {
          const id = getSiteId(x);
          return id !== undefined && id !== null && String(id).trim() !== "";
        });

        setSiteList(temizListe);

        const ids = temizListe.map((x) => String(getSiteId(x)));

        if (ids.length === 0) {
          setSiteId("");
          setSiteError("Bu kullanıcı için aktif site bulunamadı.");
          return;
        }

        if (ids.length === 1) {
          setSiteId(ids[0]);
          return;
        }

        setSiteId((prev) => {
          if (prev && ids.includes(String(prev))) return String(prev);
          return "";
        });
      } catch (e) {
        if (cancelled) return;

        console.error("SITE LIST ERROR:", e);
        setSiteList([]);
        setSiteId("");
        setSiteError("Site bilgisi alınamadı. Endpoint kontrol edilmeli.");
      } finally {
        if (!cancelled) setSiteLoading(false);
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, [personelKodu]);

  useEffect(() => {
    if (!allowedSiteIds.length) return;

    if (siteId && !allowedSiteIds.includes(String(siteId))) {
      setSiteId(allowedSiteIds.length === 1 ? allowedSiteIds[0] : "");
      setPage(1);
    }
  }, [allowedSiteIds, siteId]);

  const buildEndpoint = useCallback(
    ({ selectedSiteId, currentPage, currentPageSize }) => {
      const qs = new URLSearchParams();

      qs.set("page", String(currentPage));
      qs.set("pageSize", String(currentPageSize));

      if (selectedSiteId) {
        qs.set("siteId", String(selectedSiteId));
      }

      if (talepCinsi) qs.set("talepCinsi", String(talepCinsi));
      if (teknikTalep) qs.set("teknikTalep", String(teknikTalep));

      if (start && end) {
        qs.set("startDate", start);
        qs.set("endDate", end);
      }

      return `DetayliFilterTalep?${qs.toString()}`;
    },
    [talepCinsi, teknikTalep, start, end]
  );

  const loadData = useCallback(async () => {
    if (!allowedSiteIds.length) {
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr("");

    try {
      // Tek site seçiliyse normal backend pagination çalışır.
      if (siteId) {
        const endpoint = buildEndpoint({
          selectedSiteId: siteId,
          currentPage: page,
          currentPageSize: pageSize,
        });

        const res = await getDataAsync(endpoint);
        const norm = normalizePagedResponse(res);

        setItems(norm.items || []);
        setTotalPages(norm.totalPages || 1);
        setTotalCount(norm.totalCount || 0);
        return;
      }

      // Çok site varsa ve Tümü seçiliyse SADECE tanımlı siteler için ayrı ayrı istek atılır.
      const allResults = await Promise.all(
        allowedSiteIds.map(async (sid) => {
          const endpoint = buildEndpoint({
            selectedSiteId: sid,
            currentPage: 1,
            currentPageSize: 1000,
          });

          try {
            const res = await getDataAsync(endpoint);
            const norm = normalizePagedResponse(res);
            return norm.items || [];
          } catch (e) {
            console.error(`Site ${sid} liste alınamadı:`, e);
            return [];
          }
        })
      );

      const merged = allResults
        .flat()
        .sort((a, b) => {
          const da = getDateValue(a);
          const db = getDateValue(b);

          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;

          return new Date(db).getTime() - new Date(da).getTime();
        });

      const startIndex = (page - 1) * pageSize;
      const paged = merged.slice(startIndex, startIndex + pageSize);

      setItems(paged);
      setTotalCount(merged.length);
      setTotalPages(Math.max(1, Math.ceil(merged.length / pageSize)));
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
  }, [allowedSiteIds, siteId, page, pageSize, buildEndpoint]);

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

    if (allowedSiteIds.length === 1) {
      setSiteId(allowedSiteIds[0]);
    } else {
      setSiteId("");
    }

    setPage(1);
  };

  const refresh = async () => {
    await loadData();
  };

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
                Site: {selectedSiteName}
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
              disabled={!allowedSiteIds.length}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Site</label>

            {allowedSiteIds.length > 1 ? (
              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setPage(1);
                }}
                disabled={siteLoading || !allowedSiteIds.length}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>

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
              disabled={!allowedSiteIds.length}
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

          {loading ? (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Yükleniyor…
            </span>
          ) : null}
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
        page={1}
        pageSize={pageSize}
      />
    </div>
  );
}