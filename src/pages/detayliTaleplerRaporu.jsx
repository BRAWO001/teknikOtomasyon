// pages/detayliTaleplerRaporu.jsx

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

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

/*
 * Endpoint tarafına gönderilecek değerler:
 *
 * ""      => Filtre uygulanmaz
 * "true"  => Not_1 dolu olanlar
 * "false" => Not_1 boş olanlar
 */
const SATIN_ALMA_DURUM_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "true", label: "Satın Alındı" },
  { value: "false", label: "Satın Alınmadı" },
];

/*
 * Endpoint tarafına gönderilecek değerler:
 *
 * ""      => Filtre uygulanmaz
 * "true"  => Not_5 dolu olanlar
 * "false" => Not_5 boş olanlar
 */
const TAMAMLANMA_DURUM_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "true", label: "Tamamlandı" },
  { value: "false", label: "Tamamlanmadı" },
];

function toDateInputValue(date) {
  try {
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getDefaultRange() {
  const today = new Date();
  const startDate = new Date(today);

  startDate.setMonth(startDate.getMonth() - 3);

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(today),
  };
}

function normalizePagedResponse(response) {
  if (!response) {
    return {
      items: [],
      totalPages: 1,
      totalCount: 0,
    };
  }

  const items = response.items ?? response.Items ?? [];

  const totalPages =
    Number(response.totalPages ?? response.TotalPages ?? 1) || 1;

  const totalCount =
    Number(
      response.totalCount ??
        response.TotalCount ??
        (Array.isArray(items) ? items.length : 0)
    ) || 0;

  return {
    items,
    totalPages,
    totalCount,
  };
}

export default function DetayliTaleplerRaporuPage() {
  const router = useRouter();

  /*
   * Liste verileri
   */

  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  /*
   * Sayfalama
   */

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  /*
   * Filtreler
   */

  const [siteId, setSiteId] = useState("");
  const [talepCinsi, setTalepCinsi] = useState("");
  const [teknikTalep, setTeknikTalep] = useState("");

  /*
   * Not_1 filtresi
   *
   * ""      => Tümü
   * "true"  => Satın Alındı
   * "false" => Satın Alınmadı
   */
  const [satinAlindi, setSatinAlindi] = useState("");

  /*
   * Not_5 filtresi
   *
   * ""      => Tümü
   * "true"  => Tamamlandı
   * "false" => Tamamlanmadı
   */
  const [tamamlandi, setTamamlandi] = useState("");

  const [notArama, setNotArama] = useState("");
  const [onayciAdi, setOnayciAdi] = useState("");
  const [talepEdenAdi, setTalepEdenAdi] = useState("");

  const [start, setStart] = useState(
    () => getDefaultRange().startDate
  );

  const [end, setEnd] = useState(
    () => getDefaultRange().endDate
  );

  /*
   * Endpoint oluşturma
   */

  const endpoint = useMemo(() => {
    const queryParams = new URLSearchParams();

    queryParams.set("page", String(page));
    queryParams.set("pageSize", String(pageSize));

    if (siteId) {
      queryParams.set("siteId", String(siteId));
    }

    if (talepCinsi) {
      queryParams.set("talepCinsi", talepCinsi);
    }

    if (teknikTalep) {
      queryParams.set("teknikTalep", teknikTalep);
    }

    /*
     * Boş string gönderilmez.
     *
     * satinAlindi değeri "true" veya "false" olabilir.
     * JavaScript'te "false" stringi truthy olduğu için:
     *
     * if (satinAlindi)
     *
     * kontrolü hem true hem false seçeneklerinde çalışır.
     */
    if (satinAlindi !== "") {
      queryParams.set("satinAlindi", satinAlindi);
    }

    if (tamamlandi !== "") {
      queryParams.set("tamamlandi", tamamlandi);
    }

    if (notArama.trim()) {
      queryParams.set("notArama", notArama.trim());
    }

    if (onayciAdi.trim()) {
      queryParams.set("onayciAdi", onayciAdi.trim());
    }

    if (talepEdenAdi.trim()) {
      queryParams.set("talepEdenAdi", talepEdenAdi.trim());
    }

    /*
     * Tarihler ayrı ayrı gönderilebilir.
     */

    if (start) {
      queryParams.set("startDate", start);
    }

    if (end) {
      queryParams.set("endDate", end);
    }

    return `DetayliFilterTalep?${queryParams.toString()}`;
  }, [
    page,
    pageSize,
    siteId,
    talepCinsi,
    teknikTalep,
    satinAlindi,
    tamamlandi,
    notArama,
    onayciAdi,
    talepEdenAdi,
    start,
    end,
  ]);

  /*
   * Talepleri getir
   */

  async function loadData() {
    setLoading(true);

    try {
      const response = await getDataAsync(endpoint);
      const normalizedResponse = normalizePagedResponse(response);

      setItems(normalizedResponse.items);
      setTotalPages(normalizedResponse.totalPages);
      setTotalCount(normalizedResponse.totalCount);
    } catch (error) {
      console.error(
        "DetayliTaleplerRaporu GET hata:",
        error
      );

      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  /*
   * Site listesini getir
   */

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      try {
        const siteResponse = await getDataAsync(
          "SiteAptEvControllerSet/sites"
        );

        if (cancelled) {
          return;
        }

        setSites(
          Array.isArray(siteResponse)
            ? siteResponse
            : []
        );
      } catch (error) {
        console.error(
          "SITES FETCH ERROR:",
          error
        );

        if (!cancelled) {
          setSites([]);
        }
      }
    }

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Endpoint değiştiğinde veriyi yeniden getir
   */

  useEffect(() => {
    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  /*
   * Filtreleri sıfırla
   */

  const resetFilters = () => {
    const defaultRange = getDefaultRange();

    setSiteId("");
    setTalepCinsi("");
    setTeknikTalep("");

    setSatinAlindi("");
    setTamamlandi("");

    setNotArama("");
    setOnayciAdi("");
    setTalepEdenAdi("");

    setStart(defaultRange.startDate);
    setEnd(defaultRange.endDate);

    setPage(1);
  };

  /*
   * Manuel yenileme
   */

  const refresh = async () => {
    await loadData();
  };

  return (
    <div className="space-y-2 p-2">
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Başlık ve butonlar */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Detaylı Talepler Raporu
            </div>

            <div className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              {totalCount} kayıt • Sayfa: {page}/{totalPages}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-1.5 lg:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/satinalma/onayBekleyen")
              }
              className="cursor-pointer rounded-md border border-yellow-300 bg-yellow-200 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-yellow-300 dark:border-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-100 dark:hover:bg-yellow-900/60"
            >
              Onayımı Bekleyen Talepler
            </button>

            <SonYorumOzetMiniPanel
              take={30}
              stickyTop={8}
            />

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
              disabled={loading}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>
          </div>
        </div>




        {/* Filtreler */}
        <div className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {/* Site */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Site
            </label>

            <select
              value={siteId}
              onChange={(event) => {
                setSiteId(event.target.value);
                setPage(1);
              }}
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>

              {sites.map((site) => {
                const currentSiteId =
                  site.id ?? site.Id;

                const currentSiteName =
                  site.ad ??
                  site.Ad ??
                  `Site #${currentSiteId}`;

                return (
                  <option
                    key={currentSiteId}
                    value={currentSiteId}
                  >
                    {currentSiteName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Talep cinsi */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Talep Cinsi
            </label>

            <select
              value={talepCinsi}
              onChange={(event) => {
                setTalepCinsi(event.target.value);
                setPage(1);
              }}
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>

              {TALEP_CINSI_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>  


          {/* Satın alma durumu */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Satın Alma Durumu
            </label>

            <select
              value={satinAlindi}
              onChange={(event) => {
                setSatinAlindi(event.target.value);
                setPage(1);
              }}
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {SATIN_ALMA_DURUM_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tamamlanma durumu */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Tamamlanma Durumu
            </label>

            <select
              value={tamamlandi}
              onChange={(event) => {
                setTamamlandi(event.target.value);
                setPage(1);
              }}
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {TAMAMLANMA_DURUM_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Onaycı */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Onaycı Ara
            </label>

            <input
              type="text"
              value={onayciAdi}
              onChange={(event) => {
                setOnayciAdi(event.target.value);
                setPage(1);
              }}
              placeholder="Onaycı adı..."
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Talebi açan */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Talebi Açan Ara
            </label>

            <input
              type="text"
              value={talepEdenAdi}
              onChange={(event) => {
                setTalepEdenAdi(event.target.value);
                setPage(1);
              }}
              placeholder="Talebi açan kişi..."
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Not ve yorum arama */}
          <div className="min-w-0 flex flex-col gap-0.5 sm:col-span-2 lg:col-span-2">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Not / Yorum Ara
            </label>

            <input
              type="text"
              value={notArama}
              onChange={(event) => {
                setNotArama(event.target.value);
                setPage(1);
              }}
              placeholder="Notlar, açıklama ve yorumlarda ara..."
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Başlangıç tarihi */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Başlangıç
            </label>

            <input
              type="date"
              value={start}
              max={end || undefined}
              onChange={(event) => {
                setStart(event.target.value);
                setPage(1);
              }}
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Bitiş tarihi */}
          <div className="min-w-0 flex flex-col gap-0.5">
            <label className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Bitiş
            </label>

            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(event) => {
                setEnd(event.target.value);
                setPage(1);
              }}
              className="h-7 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>



      </div>

      {/* Liste başlığı ve sayfalama */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Talepler
          </div>

          {loading && (
            <span className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
              Yükleniyor…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() =>
              setPage((currentPage) =>
                Math.max(1, currentPage - 1)
              )
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ◀ Önceki
          </button>

          <span className="min-w-[55px] text-center text-[11px] text-zinc-500 dark:text-zinc-400">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={
              loading ||
              page >= totalPages
            }
            onClick={() =>
              setPage((currentPage) =>
                Math.min(
                  totalPages,
                  currentPage + 1
                )
              )
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Sonraki ▶
          </button>
        </div>
      </div>

      {/* Sonuç bulunamadı */}
      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Seçilen filtrelere uygun talep bulunamadı.
        </div>
      )}

      {/* Talep kartları */}
      {items.length > 0 && (
        <YoneticiRaporuDetayliTalepCard
          data={items}
          page={page}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}