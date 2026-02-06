




// pages/YonetimKuruluYoneticiRaporu/index.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

/* ===== helpers ===== */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    // backend UTC dönüyorsa TR için +3
    d.setHours(d.getHours() + 3);
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
/* =================== */

export default function YonetimKuruluYoneticiRaporuPage() {
  const router = useRouter();

  // listeler
  const [sites, setSites] = useState([]);

  // filtreler
  const [siteId, setSiteId] = useState("");
  const [search, setSearch] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // data
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // endpoint (backend: /api/projeYonetimKurulu/kararlar)
  const kararlarEndpoint = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (siteId) qs.set("siteId", String(siteId));
    if (search?.trim()) qs.set("search", search.trim());
    return `projeYonetimKurulu/kararlar?${qs.toString()}`;
  }, [page, pageSize, siteId, search]);

  // ilk açılış: siteler
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

  // kararlar loader
  const loadKararlar = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getDataAsync(kararlarEndpoint);

      const list = res?.items ?? res?.Items ?? [];
      setItems(Array.isArray(list) ? list : []);

      setTotalPages(Number(res?.totalPages ?? res?.TotalPages ?? 1) || 1);
      setTotalCount(Number(res?.totalCount ?? res?.TotalCount ?? 0) || 0);
    } catch (e) {
      console.error("KARARLAR GET ERROR:", e);
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);

      const status = e?.response?.status;
      setErr(status ? `Liste alınamadı (HTTP ${status}).` : "Liste alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  // filtre/paging değişince otomatik çek
  useEffect(() => {
    loadKararlar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kararlarEndpoint]);

  const resetFilters = () => {
    setSiteId("");
    setSearch("");
    setPage(1);
  };

  const handleYeniKararTalebi = () =>
    router.push("/YonetimKuruluYoneticiRaporu/YoneticiRaporuYeniKararOlustur");
  const handleAnaSayfayaDon = () => router.push("/");

  const rowOpen = (token) => {
    if (!token) return;
    router.push(`/YonetimKurulu/karar/${token}`);
  };

  // ✅ Düzenleme durumu pill
  const DuzenlemePill = ({ ok }) => (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/25 dark:text-red-200"
      }`}
    >
      {ok ? "Açık" : "Kapalı"}
    </span>
  );

  return (
    <div className="p-3 space-y-3">
      {/* ===== Üst Panel ===== */}
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Yönetim Kurulu – Kararlar Raporu
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Toplam: {totalCount} kayıt • Sayfa: {page}/{totalPages}
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
              onClick={handleYeniKararTalebi}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ➕ Yeni Karar Talebinde Bulun
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
              onClick={loadKararlar}
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
          {/* Site */}
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

          {/* Search */}
          <div className="flex flex-col gap-1 md:col-span-4">
            <label className="text-[11px] text-zinc-500">Arama</label>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Konu / Açıklama / Nihai sonuç içinde ara..."
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* ===== Pagination Bar ===== */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Kararlar
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

      {/* ===== Table ===== */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-[1200px] w-full border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
            <tr>
              {[
                "Karar No",
                "Tarih",
                "Site",
                "Karar Konusu",
                "Nihai Sonuç",
                "Düzenleme",
                "Öneren Kişi",
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
              const token = r?.publicToken ?? r?.PublicToken; // backend PublicToken
              const siteName = r?.site?.ad ?? r?.Site?.Ad;
              const siteIdRow = r?.siteId ?? r?.SiteId;

              // ✅ Site bazlı karar no (camelCase + PascalCase destekli)
              const siteBazliNo = r?.siteBazliNo ?? r?.SiteBazliNo;
              const kararNoText =
                typeof siteBazliNo === "number" && siteBazliNo > 0
                  ? `# ${siteBazliNo}` // örn: 6-18
                  : `${safeText(id)}`; // fallback: global id

              const duzenleme =
                typeof (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu) === "boolean"
                  ? (r?.duzenlemeDurumu ?? r?.DuzenlemeDurumu)
                  : null;

              return (
                <tr
                  key={id ?? i}
                  onClick={() => rowOpen(token)}
                  className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  title={token ? "Detaya git" : "Token yok"}
                >
                  {/* ✅ No: SiteId-SiteBazliNo */}
                  <td className="px-2 py-[4px] text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      {kararNoText}
                    </span>
                  </td>

                  <td className="px-2 py-[4px] whitespace-nowrap">
                    {formatDateTR(r?.tarih ?? r?.Tarih)}
                  </td>

                  <td className="px-2 py-[4px] whitespace-nowrap">
                    {siteName ?? `Site #${safeText(siteIdRow)}`}
                  </td>

                  <td className="px-2 py-[4px]">
                    <div className="max-w-[520px] truncate font-semibold text-zinc-800 dark:text-zinc-100">
                      {safeText(r?.kararKonusu ?? r?.KararKonusu)}
                    </div>
                    <div className="max-w-[520px] truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                      {safeText(r?.kararAciklamasi ?? r?.KararAciklamasi)}
                    </div>
                  </td>

                  <td className="px-2 py-[4px] whitespace-nowrap">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      {safeText(r?.nihaiSonuc ?? r?.NihaiSonuc)}
                    </span>
                  </td>

                  {/* ✅ Düzenleme Durumu */}
                  <td className="px-2 py-[4px] whitespace-nowrap">
                    {duzenleme === null ? (
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                        -
                      </span>
                    ) : (
                      <DuzenlemePill ok={duzenleme} />
                    )}
                  </td>

                  <td className="px-2 py-[4px] whitespace-nowrap">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200">
                      {safeText(r?.onerenKisiSayisi ?? r?.OnerenKisiSayisi)}
                    </span>
                  </td>
                </tr>
              );
            })}

            {!loading && !items?.length && (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                >
                  Kayıt bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
