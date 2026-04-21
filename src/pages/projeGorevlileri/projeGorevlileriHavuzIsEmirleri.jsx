import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync } from "@/utils/apiService";

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

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

export default function ProjeGorevlileriHavuzIsEmirleriPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  const personelId = useMemo(() => {
    if (!personel) return null;
    return pick(personel, "id", "Id");
  }, [personel]);

  // otomatik site
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [sitesError, setSitesError] = useState("");

  // havuz filtreleri
  const [personeller, setPersoneller] = useState([]);
  const [selectedPersonelId, setSelectedPersonelId] = useState("");
  const [status, setStatus] = useState("");
  const [arama, setArama] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const defaults = getDefaultRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const getId = (obj) => pick(obj, "id", "Id");
  const getAd = (obj) => pick(obj, "ad", "Ad");

  const selectedSiteName = useMemo(() => {
    const sid = siteId ? Number(siteId) : null;
    if (!sid) return "-";
    const found = sites.find((x) => Number(getId(x)) === sid);
    return found ? getAd(found) : `#${siteId}`;
  }, [siteId, sites]);

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

  // personel listesi
  useEffect(() => {
    let cancelled = false;

    const loadPersoneller = async () => {
      try {
        const res = await getDataAsync("Personeller/ByDurum?rolKod=34&aktifMi=true");
        if (cancelled) return;

        const firstList = Array.isArray(res) ? res : [];
        if (firstList.length > 0) {
          setPersoneller(firstList);
        } else {
          try {
            const fallback = await getDataAsync("Personeller/ByDurum?aktifMi=true");
            if (!cancelled) {
              setPersoneller(Array.isArray(fallback) ? fallback : []);
            }
          } catch (fallbackErr) {
            console.error("PERSONELLER FALLBACK ERROR:", fallbackErr);
            if (!cancelled) setPersoneller([]);
          }
        }
      } catch (err) {
        console.error("PERSONELLER FETCH ERROR:", err);
        try {
          const fallback = await getDataAsync("Personeller/ByDurum?aktifMi=true");
          if (!cancelled) {
            setPersoneller(Array.isArray(fallback) ? fallback : []);
          }
        } catch (fallbackErr) {
          console.error("PERSONELLER FALLBACK ERROR:", fallbackErr);
          if (!cancelled) setPersoneller([]);
        }
      }
    };

    loadPersoneller();

    return () => {
      cancelled = true;
    };
  }, []);

  // site lookup otomatik
  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      if (!personelId) return;

      setLoadingLookups(true);
      setSitesError("");

      try {
        const res = await getDataAsync(
          `Personeller/satinalma-yeni/lookups?personelId=${personelId}`
        );

        if (cancelled) return;

        const resSites = Array.isArray(res?.sites) ? res.sites : [];
        const defaultSiteId = res?.defaultSiteId ?? null;

        setSites(resSites);

        if (resSites.length === 1) {
          const onlyId = getId(resSites[0]);
          setSiteId(onlyId ? String(onlyId) : "");
        } else if (defaultSiteId) {
          setSiteId(String(defaultSiteId));
        } else if (resSites.length > 0) {
          const firstId = getId(resSites[0]);
          setSiteId(firstId ? String(firstId) : "");
        } else {
          setSiteId("");
          setSitesError("Bu kullanıcı için otomatik site bulunamadı.");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("LOOKUPS ERROR:", err);
        setSitesError("Site/proje bilgileri alınamadı.");
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    };

    fetchLookups();

    return () => {
      cancelled = true;
    };
  }, [personelId]);

  const endpoint = useMemo(() => {
    if (!siteId) return null;

    const qs = new URLSearchParams();

    if (selectedPersonelId) qs.set("personelId", String(selectedPersonelId));
    if (siteId) qs.set("siteId", String(siteId));
    if (status) qs.set("status", status);
    if (arama.trim()) qs.set("arama", arama.trim());
    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);
    qs.set("limit", "500");

    return `peyzaj-is-emri-formu/havuz-yonetici-raporu?${qs.toString()}`;
  }, [selectedPersonelId, siteId, status, arama, startDate, endDate]);

  async function loadData() {
    if (!endpoint) return;

    setLoading(true);
    try {
      const res = await getDataAsync(endpoint);
      const data = Array.isArray(res?.items || res?.Items)
        ? (res?.items || res?.Items)
        : [];
      setItems(data);
    } catch (err) {
      console.error("Proje Görevlileri Havuz İşleri yükleme hatası:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    setPage(1);
  }, [siteId, selectedPersonelId, status, arama, startDate, endDate]);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pagedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, page, pageSize]);

  const resetFilters = () => {
    setSelectedPersonelId("");
    setStatus("");
    setArama("");
    setStartDate(defaults.startDate);
    setEndDate(defaults.endDate);
    setPage(1);
  };

  const goDetail = (id) => {
    const safeId = Number(id);
    if (!safeId) return;
    router.push(`/peyzaj/isEmriDetay/${safeId}`);
  };

  const getSiteText = (item) => pick(pick(item, "Site", "site"), "Ad", "ad") || "-";
  const getKodText = (item) => pick(item, "Kod", "kod") || "-";
  const getBaslikText = (item) => pick(item, "KisaBaslik", "kisaBaslik") || "-";
  const getAciklamaText = (item) => pick(item, "Aciklama", "aciklama") || "-";
  const getItemId = (item) => pick(item, "Id", "id");

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("tr-TR");
    } catch {
      return String(value);
    }
  };

  return (
    <div className="p-2.5 space-y-2.5">
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
              Proje Görevlileri – Havuz İşleri
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>
                Toplam kayıt: {totalCount} • Sayfa: {page}/{totalPages}
              </span>

              {loading ? <span>• Yükleniyor...</span> : null}

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                Site:{" "}
                {loadingLookups
                  ? "Yükleniyor..."
                  : selectedSiteName || (siteId ? `#${siteId}` : "-")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              ⌂ Anasayfa
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Filtreleri Sıfırla
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={!siteId}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
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
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Personel
            </label>
            <select
              value={selectedPersonelId}
              onChange={(e) => setSelectedPersonelId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>
              {personeller.map((p) => (
                <option key={pick(p, "id", "Id")} value={pick(p, "id", "Id")}>
                  {pick(p, "ad", "Ad", "AdSoyad") || ""} {pick(p, "soyad", "Soyad") || ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Site
            </label>
            <input
              type="text"
              value={loadingLookups ? "Yükleniyor..." : selectedSiteName}
              disabled
              className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-2.5 py-2 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Durum
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>
              <option value="DEVAM">Devam Eden</option>
              <option value="BITEN">Biten</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Başlangıç
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Bitiş
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Arama
            </label>
            <input
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kod / başlık / açıklama"
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px]">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold">Oluşturma</th>
                <th className="px-3 py-2.5 text-left font-semibold">Site</th>
                <th className="px-3 py-2.5 text-left font-semibold">Kod</th>
                <th className="px-3 py-2.5 text-left font-semibold">Başlık</th>
                <th className="px-3 py-2.5 text-left font-semibold">Açıklama</th>
                <th className="px-3 py-2.5 text-left font-semibold">Detay</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => (
                  <tr
                    key={getItemId(item)}
                    onClick={() => goDetail(getItemId(item))}
                    className="cursor-pointer border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatDate(pick(item, "OlusturmaTarihiUtc", "olusturmaTarihiUtc"))}
                    </td>
                    <td className="px-3 py-2.5">{getSiteText(item)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-zinc-800 dark:text-zinc-100">
                      {getKodText(item)}
                    </td>
                    <td className="px-3 py-2.5 min-w-[180px]">{getBaslikText(item)}</td>
                    <td className="px-3 py-2.5 min-w-[220px]">{getAciklamaText(item)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goDetail(getItemId(item));
                        }}
                        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        Detaya Git
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Görünen kayıt: {pagedItems.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ◀ Önceki
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Sonraki ▶
          </button>
        </div>
      </div>
    </div>
  );
}