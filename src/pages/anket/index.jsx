import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

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

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function BoolPill({ value, trueText, falseText, trueClass, falseClass }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
        value ? trueClass : falseClass
      }`}
    >
      {value ? trueText : falseText}
    </span>
  );
}

export default function AnketListPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [search, setSearch] = useState("");
  const [yayinlandiMi, setYayinlandiMi] = useState("");
  const [aktifMi, setAktifMi] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    if (siteId) qs.set("siteId", String(siteId));
    if (search?.trim()) qs.set("search", search.trim());
    if (yayinlandiMi !== "") qs.set("yayinlandiMi", yayinlandiMi);
    if (aktifMi !== "") qs.set("aktifMi", aktifMi);

    return `anket/liste?${qs.toString()}`;
  }, [page, pageSize, siteId, search, yayinlandiMi, aktifMi]);

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

  const loadList = useCallback(async () => {
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
      console.error("ANKET LIST GET ERROR:", e);
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
    loadList();
  }, [loadList]);

  const resetFilters = () => {
    setSiteId("");
    setSearch("");
    setYayinlandiMi("");
    setAktifMi("");
    setPage(1);
  };

  const handleYeni = () => {
    router.push("/anket/yeni");
  };

  const handleAnaSayfayaDon = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="flex w-full items-center justify-between gap-4 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-9 w-auto object-contain"
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                Anket Yönetimi • Liste
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleAnaSayfayaDon}
              className="inline-flex items-center justify-center gap-2 rounded-md px-2 py-1 text-[11px] font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              🏠 Ana Sayfaya Dön
            </button>

            <button
              type="button"
              onClick={handleYeni}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ➕ Yeni Anket Oluştur
            </button>
          </div>
        </div>
      </div>

      <div className="w-full p-2 space-y-2">
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Anketler
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Toplam: {totalCount} kayıt • Sayfa: {page}/{totalPages}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
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

          <div className="grid grid-cols-1 gap-2 md:grid-cols-8">
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

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[11px] text-zinc-500">Yayın</label>
              <select
                value={yayinlandiMi}
                onChange={(e) => {
                  setYayinlandiMi(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>
                <option value="true">Yayında</option>
                <option value="false">Taslak</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[11px] text-zinc-500">Aktiflik</label>
              <select
                value={aktifMi}
                onChange={(e) => {
                  setAktifMi(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Tümü</option>
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[11px] text-zinc-500">Arama</label>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Başlık / Açıklama içinde ara..."
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
              Anket Listesi
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

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-[1450px] w-full border-collapse text-[11px]">
            <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
              <tr>
                {[
                  "Anket No",
                  "Tarih",
                  "Site",
                  "Anket",
                  "Durum",
                  "Soru",
                  "Katılımcı",
                  "Tekrar Cevap",
                  "İşlemler",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-[4px] text-left font-semibold border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((r, i) => {
                const id = r?.id ?? r?.Id;
                const guidLink = r?.guidLink ?? r?.GuidLink;
                const detailHref = `/anket/detay/${id}`;
                const raporHref = `/anket/rapor/${id}`;
                const cevapHref = guidLink ? `/anketCevap/${guidLink}` : "#";

                return (
                  <tr
                    key={id ?? i}
                    className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-2 py-[3px] whitespace-nowrap">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                        #{safeText(id)}
                      </span>
                    </td>

                    <td className="px-2 py-[3px] whitespace-nowrap">
                      {formatDateTR(r?.olusturmaTarihiUtc ?? r?.OlusturmaTarihiUtc)}
                    </td>

                    <td className="px-2 py-[3px] whitespace-nowrap">
                      {safeText(r?.siteAd ?? r?.SiteAd)}
                    </td>

                    <td className="px-2 py-[3px]">
                      <div className="max-w-[420px] truncate font-semibold text-zinc-800 dark:text-zinc-100">
                        {safeText(r?.baslik ?? r?.Baslik)}
                      </div>
                      <div className="max-w-[420px] truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                        {safeText(r?.aciklama ?? r?.Aciklama)}
                      </div>
                    </td>

                    <td className="px-2 py-[3px] whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <BoolPill
                          value={!!(r?.yayinlandiMi ?? r?.YayinlandiMi)}
                          trueText="Yayında"
                          falseText="Taslak"
                          trueClass="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200"
                          falseClass="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/25 dark:text-amber-200"
                        />
                        <BoolPill
                          value={!!(r?.aktifMi ?? r?.AktifMi)}
                          trueText="Aktif"
                          falseText="Pasif"
                          trueClass="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-900/25 dark:text-sky-200"
                          falseClass="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/25 dark:text-red-200"
                        />
                      </div>
                    </td>

                    <td className="px-2 py-[3px] whitespace-nowrap">
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-900/25 dark:text-indigo-200">
                        {Number(r?.soruSayisi ?? r?.SoruSayisi ?? 0)}
                      </span>
                    </td>

                    <td className="px-2 py-[3px] whitespace-nowrap">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200">
                        {Number(r?.katilimciSayisi ?? r?.KatilimciSayisi ?? 0)}
                      </span>
                    </td>

                    <td className="px-2 py-[3px] whitespace-nowrap">
                      <BoolPill
                        value={!!(r?.tekrarCevaplanabilirMi ?? r?.TekrarCevaplanabilirMi)}
                        trueText="Açık"
                        falseText="Kapalı"
                        trueClass="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200"
                        falseClass="border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      />
                    </td>

                    <td className="px-2 py-[3px] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={detailHref}
                          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          title="Detaya git"
                        >
                          Detay
                        </a>

                        <a
                          href={raporHref}
                          className="rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
                          title="Rapora git"
                        >
                          Rapor
                        </a>

                        <a
                          href={cevapHref}
                          target="_blank"
                          rel="noreferrer"
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                            guidLink
                              ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : "border border-zinc-300 bg-zinc-100 text-zinc-400 pointer-events-none dark:border-zinc-700 dark:bg-zinc-900"
                          }`}
                          title="Cevap sayfasını yeni sekmede aç"
                        >
                          Cevapla
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && !items?.length && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    Kayıt bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-200 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}