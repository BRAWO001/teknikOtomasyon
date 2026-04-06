import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";

export default function PeyzajYoneticiRaporuPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [siteId, setSiteId] = useState("");
  const [personelId, setPersonelId] = useState("");
  const [status, setStatus] = useState("");
  const [arama, setArama] = useState("");

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

  const defaults = getDefaultRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  useEffect(() => {
    let cancelled = false;

    const loadLists = async () => {
      try {
        const [siteRes, perRes] = await Promise.allSettled([
          getDataAsync("SiteAptEvControllerSet/sites"),
          getDataAsync("Personeller/ByDurum?rolKod=33&aktifMi=true"),
        ]);

        if (cancelled) return;

        if (siteRes.status === "fulfilled") setSites(siteRes.value || []);
        else console.error("SITES FETCH ERROR:", siteRes.reason);

        if (perRes.status === "fulfilled") {
          const firstList = Array.isArray(perRes.value) ? perRes.value : [];

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
        } else {
          console.error("PERSONELLER FETCH ERROR:", perRes.reason);
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
        console.error("LIST LOAD ERROR:", err);
      }
    };

    loadLists();
    return () => {
      cancelled = true;
    };
  }, []);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    if (personelId) qs.set("personelId", String(personelId));
    if (siteId) qs.set("siteId", String(siteId));
    if (status) qs.set("status", status);
    if (arama.trim()) qs.set("arama", arama.trim());
    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);
    qs.set("limit", "500");

    return `peyzaj-is-emri-formu/peyzaj-yonetici-raporu?${qs.toString()}`;
  }, [personelId, siteId, status, arama, startDate, endDate]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getDataAsync(endpoint);
      const data = Array.isArray(res?.items || res?.Items) ? (res?.items || res?.Items) : [];
      setItems(data);
    } catch (err) {
      console.error("Peyzaj yönetici raporu yükleme hatası:", err);
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
  }, [siteId, personelId, status, arama, startDate, endDate]);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pagedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, page, pageSize]);

  const resetFilters = () => {
    setSiteId("");
    setPersonelId("");
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

  const getId = (item) => pick(item, "Id", "id");
  const getSiteText = (item) => pick(pick(item, "Site", "site"), "Ad", "ad") || "-";
  const getKodText = (item) => pick(item, "Kod", "kod") || "-";
  const getBaslikText = (item) => pick(item, "KisaBaslik", "kisaBaslik") || "-";
  const getAciklamaText = (item) => pick(item, "Aciklama", "aciklama") || "-";

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
              Yönetici Raporu – Peyzaj İşleri
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Toplam kayıt: {totalCount} • Sayfa: {page}/{totalPages}
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
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Personel
            </label>
            <select
              value={personelId}
              onChange={(e) => setPersonelId(e.target.value)}
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
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>
              {sites.map((s) => (
                <option key={pick(s, "id", "Id")} value={pick(s, "id", "Id")}>
                  {pick(s, "ad", "Ad")}
                </option>
              ))}
            </select>
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
                    key={getId(item)}
                    onClick={() => goDetail(getId(item))}
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
                          goDetail(getId(item));
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
    </div>
  );
}