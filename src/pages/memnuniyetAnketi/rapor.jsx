import { useEffect, useState } from "react";
import { getDataAsync } from "@/utils/apiService";

const PAGE_SIZE = 25;

const ANKET_TIPLERI = {
  DAIRE_SAKINI: 10,
  ORTAK_ALAN: 20,
};

const SMILEY_MAP = {
  1: {
    emoji: "😠",
    text: "Çok Kötü",
  },
  2: {
    emoji: "😞",
    text: "Kötü",
  },
  3: {
    emoji: "😐",
    text: "Orta",
  },
  4: {
    emoji: "🙂",
    text: "İyi",
  },
  5: {
    emoji: "😄",
    text: "Çok İyi",
  },
};

// ======================================================
// BACKEND ERROR
// ======================================================

function extractBackendMsg(err) {
  const data = err?.response?.data;

  if (!data) return null;

  if (typeof data === "string") {
    return data;
  }

  return (
    data?.message ||
    data?.Message ||
    data?.error ||
    data?.Error ||
    null
  );
}

// ======================================================
// SAFE TEXT
// ======================================================

function safeText(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  return String(value);
}

// ======================================================
// TARİH
// ======================================================

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

// ======================================================
// PUAN GÖSTER
// ======================================================

function PuanGoster({ puan }) {
  const numericValue = Number(puan);

  const item =
    SMILEY_MAP[numericValue];

  if (!item) {
    return (
      <div className="text-xs text-zinc-400">
        -
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">
        {item.emoji}
      </span>

      <div>
        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
          {item.text}
        </div>

        <div className="text-[10px] text-zinc-400">
          {numericValue} / 5
        </div>
      </div>
    </div>
  );
}

// ======================================================
// ORTALAMA
// ======================================================

function OrtalamaGoster({ value }) {
  if (
    value === null ||
    value === undefined
  ) {
    return (
      <span className="text-sm text-zinc-400">
        -
      </span>
    );
  }

  const numericValue =
    Number(value);

  if (
    !Number.isFinite(numericValue)
  ) {
    return "-";
  }

  const rounded =
    Math.min(
      5,
      Math.max(
        1,
        Math.round(numericValue)
      )
    );

  const item =
    SMILEY_MAP[rounded];

  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl">
        {item?.emoji}
      </span>

      <div>
        <div className="text-xl font-bold">
          {numericValue.toFixed(1)}
        </div>

        <div className="text-[10px] text-zinc-400">
          5 üzerinden
        </div>
      </div>
    </div>
  );
}

// ======================================================
// PERSONEL KARTI
// ======================================================

function PersonelKart({ atama }) {
  const personel =
    atama?.personel ??
    atama?.Personel ??
    {};

  const ad =
    personel?.ad ??
    personel?.Ad ??
    "";

  const soyad =
    personel?.soyad ??
    personel?.Soyad ??
    "";

  const telefon =
    personel?.telefon ??
    personel?.Telefon ??
    "";

  const eposta =
    personel?.eposta ??
    personel?.Eposta ??
    "";

  const rolAd =
    atama?.rolAd ??
    atama?.RolAd ??
    "";

  const sira =
    atama?.sira ??
    atama?.Sira;

  const not =
    atama?.not ??
    atama?.Not ??
    "";

  const initials =
    `${ad?.charAt(0) || ""}${
      soyad?.charAt(0) || ""
    }`.toUpperCase();

  return (
    <div className="min-w-[210px] rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {initials || "P"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {`${ad} ${soyad}`.trim() ||
              "Personel"}
          </div>

          {rolAd ? (
            <div className="mt-0.5 text-[10px] text-zinc-500">
              {rolAd}
            </div>
          ) : null}

          {sira ? (
            <div className="mt-0.5 text-[10px] text-zinc-400">
              Görev sırası: {sira}
            </div>
          ) : null}
        </div>
      </div>

      {telefon || eposta ? (
        <div className="mt-3 space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
          {telefon ? (
            <div className="text-[10px] text-zinc-500">
              Tel: {telefon}
            </div>
          ) : null}

          {eposta ? (
            <div className="break-all text-[10px] text-zinc-500">
              {eposta}
            </div>
          ) : null}
        </div>
      ) : null}

      {not ? (
        <div className="mt-2 rounded-md bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-500 dark:bg-zinc-900">
          {not}
        </div>
      ) : null}
    </div>
  );
}

// ======================================================
// ANA SAYFA
// ======================================================

export default function MemnuniyetAnketRaporPage() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ====================================================
  // FILTER
  // ====================================================

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    anketTipi,
    setAnketTipi,
  ] = useState("");

  const [
    cevapDurumu,
    setCevapDurumu,
  ] = useState("");

  // ====================================================
  // PAGINATION
  // ====================================================

  const [page, setPage] =
    useState(1);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  // ====================================================
  // SUMMARY
  // ====================================================

  const [
    summary,
    setSummary,
  ] = useState({
    toplamAnket: 0,
    cevaplananAnket: 0,
    bekleyenAnket: 0,
    cevaplanmaOrani: 0,
  });

  // ====================================================
  // SEARCH DEBOUNCE
  // ====================================================

  useEffect(() => {
    const timer =
      setTimeout(() => {
        setPage(1);

        setSearch(
          searchInput.trim()
        );
      }, 500);

    return () =>
      clearTimeout(timer);
  }, [searchInput]);

  // ====================================================
  // RAPOR GET
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const loadRapor =
      async () => {
        try {
          setLoading(true);
          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(page)
          );

          params.set(
            "pageSize",
            String(PAGE_SIZE)
          );

          if (search) {
            params.set(
              "search",
              search
            );
          }

          if (anketTipi) {
            params.set(
              "anketTipi",
              anketTipi
            );
          }

          if (
            cevapDurumu !== ""
          ) {
            params.set(
              "cevaplandiMi",
              cevapDurumu
            );
          }

          const res =
            await getDataAsync(
              `memnuniyet-anket/rapor?${params.toString()}`
            );

          if (cancelled) {
            return;
          }

          const list =
            res?.items ??
            res?.Items ??
            [];

          const p =
            res?.pagination ??
            res?.Pagination ??
            {};

          const s =
            res?.summary ??
            res?.Summary ??
            {};

          setItems(
            Array.isArray(list)
              ? list
              : []
          );

          setPagination({
            page: Number(
              p?.page ??
                p?.Page ??
                1
            ),

            pageSize: Number(
              p?.pageSize ??
                p?.PageSize ??
                PAGE_SIZE
            ),

            totalCount: Number(
              p?.totalCount ??
                p?.TotalCount ??
                0
            ),

            totalPages: Number(
              p?.totalPages ??
                p?.TotalPages ??
                0
            ),

            hasPreviousPage:
              Boolean(
                p?.hasPreviousPage ??
                  p?.HasPreviousPage
              ),

            hasNextPage:
              Boolean(
                p?.hasNextPage ??
                  p?.HasNextPage
              ),
          });

          setSummary({
            toplamAnket: Number(
              s?.toplamAnket ??
                s?.ToplamAnket ??
                0
            ),

            cevaplananAnket:
              Number(
                s?.cevaplananAnket ??
                  s?.CevaplananAnket ??
                  0
              ),

            bekleyenAnket: Number(
              s?.bekleyenAnket ??
                s?.BekleyenAnket ??
                0
            ),

            cevaplanmaOrani:
              Number(
                s?.cevaplanmaOrani ??
                  s?.CevaplanmaOrani ??
                  0
              ),
          });
        } catch (err) {
          console.error(
            "ANKET RAPOR ERROR:",
            err
          );

          console.error(
            "BACKEND RESPONSE:",
            err?.response?.data
          );

          if (!cancelled) {
            setError(
              extractBackendMsg(
                err
              ) ||
                err?.message ||
                "Rapor alınamadı."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadRapor();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    search,
    anketTipi,
    cevapDurumu,
  ]);

  // ====================================================
  // FILTER
  // ====================================================

  const changeAnketTipi = (
    value
  ) => {
    setPage(1);
    setAnketTipi(value);
  };

  const changeCevapDurumu = (
    value
  ) => {
    setPage(1);
    setCevapDurumu(value);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setAnketTipi("");
    setCevapDurumu("");
    setPage(1);
  };

  // ====================================================
  // ORTALAMA
  // ====================================================

  const getOrtalama = (
    item
  ) => {
    const tip = Number(
      item?.anketTipi ??
        item?.AnketTipi
    );

    let values = [];

    if (
      tip ===
      ANKET_TIPLERI.DAIRE_SAKINI
    ) {
      values = [
        item?.randevuPuani ??
          item?.RandevuPuani,

        item?.isKalitesiPuani ??
          item?.IsKalitesiPuani,

        item?.iletisimGenelGorunumPuani ??
          item?.IletisimGenelGorunumPuani,

        item?.konuyaHakimiyetPuani ??
          item?.KonuyaHakimiyetPuani,

        item?.tamamlanmaMemnuniyetPuani ??
          item?.TamamlanmaMemnuniyetPuani,
      ];
    } else if (
      tip ===
      ANKET_TIPLERI.ORTAK_ALAN
    ) {
      values = [
        item?.randevuPuani ??
          item?.RandevuPuani,

        item?.isKalitesiPuani ??
          item?.IsKalitesiPuani,

        item?.isDisipliniPuani ??
          item?.IsDisipliniPuani,

        item?.ihtiyaciKarsilamaPuani ??
          item?.IhtiyaciKarsilamaPuani,
      ];
    }

    const valid =
      values
        .map(Number)
        .filter(
          (x) =>
            Number.isFinite(x) &&
            x >= 1 &&
            x <= 5
        );

    if (!valid.length) {
      return null;
    }

    return (
      valid.reduce(
        (total, value) =>
          total + value,
        0
      ) / valid.length
    );
  };

  // ====================================================
  // SORULAR
  // ====================================================

  const getSorular = (
    item
  ) => {
    const tip = Number(
      item?.anketTipi ??
        item?.AnketTipi
    );

    const ortakSorular = [
      {
        baslik:
          "Randevu saatine uygunluk",

        puan:
          item?.randevuPuani ??
          item?.RandevuPuani,
      },

      {
        baslik:
          "Yapılan işin kalitesi",

        puan:
          item?.isKalitesiPuani ??
          item?.IsKalitesiPuani,
      },
    ];

    if (
      tip ===
      ANKET_TIPLERI.DAIRE_SAKINI
    ) {
      return [
        ...ortakSorular,

        {
          baslik:
            "İletişim ve genel görünüm",

          puan:
            item?.iletisimGenelGorunumPuani ??
            item?.IletisimGenelGorunumPuani,
        },

        {
          baslik:
            "Konuya hakimiyet ve bilgilendirme",

          puan:
            item?.konuyaHakimiyetPuani ??
            item?.KonuyaHakimiyetPuani,
        },

        {
          baslik:
            "Tamamlanma süreci ve sonuç",

          puan:
            item?.tamamlanmaMemnuniyetPuani ??
            item?.TamamlanmaMemnuniyetPuani,
        },
      ];
    }

    if (
      tip ===
      ANKET_TIPLERI.ORTAK_ALAN
    ) {
      return [
        ...ortakSorular,

        {
          baslik:
            "İş disiplini ve yaklaşım",

          puan:
            item?.isDisipliniPuani ??
            item?.IsDisipliniPuani,
        },

        {
          baslik:
            "İhtiyacı karşılama düzeyi",

          puan:
            item?.ihtiyaciKarsilamaPuani ??
            item?.IhtiyaciKarsilamaPuani,
        },
      ];
    }

    return ortakSorular;
  };

  // ====================================================
  // PAGE NUMBERS
  // ====================================================

  const getPageNumbers = () => {
    const total =
      pagination.totalPages;

    const current =
      pagination.page;

    if (total <= 1) {
      return [];
    }

    let start =
      Math.max(
        1,
        current - 2
      );

    let end =
      Math.min(
        total,
        start + 4
      );

    if (
      end - start < 4
    ) {
      start =
        Math.max(
          1,
          end - 4
        );
    }

    const pages = [];

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-zinc-50 px-3 py-5 text-zinc-900 sm:px-4 sm:py-6 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            EOS MANAGEMENT
          </div>

          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
            Memnuniyet Anket Raporları
          </h1>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            İş emirlerine ait memnuniyet
            değerlendirmelerini ve görevli
            personelleri inceleyebilirsiniz.
          </p>
        </div>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          {/* TOPLAM */}

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Toplam Anket
            </div>

            <div className="mt-2 text-2xl font-bold">
              {summary.toplamAnket}
            </div>
          </div>

          {/* CEVAPLANAN */}

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Cevaplanan
            </div>

            <div className="mt-2 text-2xl font-bold">
              {summary.cevaplananAnket}
            </div>
          </div>

          {/* BEKLEYEN */}

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Bekleyen
            </div>

            <div className="mt-2 text-2xl font-bold">
              {summary.bekleyenAnket}
            </div>
          </div>

          {/* ORAN */}

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Cevaplanma Oranı
            </div>

            <div className="mt-2 text-2xl font-bold">
              %{summary.cevaplanmaOrani}
            </div>
          </div>
        </div>

        {/* ==================================================
            FILTER
        ================================================== */}

        <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">

          <div className="grid gap-3 md:grid-cols-4">

            {/* SEARCH */}

            <input
              value={searchInput}
              onChange={(e) =>
                setSearchInput(
                  e.target.value
                )
              }
              placeholder="İş emri, açıklama veya görüş ara..."
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
            />

            {/* ANKET TIPI */}

            <select
              value={anketTipi}
              onChange={(e) =>
                changeAnketTipi(
                  e.target.value
                )
              }
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">
                Tüm Anket Tipleri
              </option>

              <option value="10">
                Daire Sakini
              </option>

              <option value="20">
                Ortak Alan / Proje Yöneticisi
              </option>
            </select>

            {/* CEVAP DURUM */}

            <select
              value={cevapDurumu}
              onChange={(e) =>
                changeCevapDurumu(
                  e.target.value
                )
              }
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">
                Tüm Durumlar
              </option>

              <option value="true">
                Cevaplandı
              </option>

              <option value="false">
                Cevap Bekliyor
              </option>
            </select>

            {/* TEMIZLE */}

            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-4 text-xs font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Filtreleri Temizle
            </button>
          </div>

          <div className="mt-3 text-[10px] text-zinc-400">
            Toplam {pagination.totalCount} kayıt bulundu.
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            Raporlar yükleniyor...
          </div>
        ) : null}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
        !error &&
        items.length === 0 ? (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            Arama kriterlerine uygun
            memnuniyet anketi bulunamadı.
          </div>
        ) : null}

        {/* ==================================================
            RAPOR LIST
        ================================================== */}

        {!loading &&
        items.length > 0 ? (
          <div className="mt-5 space-y-4">

            {items.map(
              (item) => {
                const id =
                  item?.id ??
                  item?.Id;

                const tip =
                  Number(
                    item?.anketTipi ??
                      item?.AnketTipi
                  );

                const cevaplandi =
                  Boolean(
                    item?.cevaplandiMi ??
                      item?.CevaplandiMi
                  );

                const isEmri =
                  item?.isEmri ??
                  item?.IsEmri ??
                  {};

                const personeller =
                  isEmri?.personeller ??
                  isEmri?.Personeller ??
                  [];

                const ortalama =
                  cevaplandi
                    ? getOrtalama(
                        item
                      )
                    : null;

                const sorular =
                  getSorular(
                    item
                  );

                const kod =
                  isEmri?.kod ??
                  isEmri?.Kod;

                const baslik =
                  isEmri?.kisaBaslik ??
                  isEmri?.KisaBaslik;

                const aciklama =
                  isEmri?.aciklama ??
                  isEmri?.Aciklama;

                const siteAd =
                  isEmri?.siteAd ??
                  isEmri?.SiteAd;

                const gorus =
                  item?.gorusOneri ??
                  item?.GorusOneri;

                return (
                  <div
                    key={id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >

                    {/* =========================================
                        HEADER
                    ========================================= */}

                    <div className="p-4 sm:p-5">

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0 flex-1">

                          {/* BADGES */}

                          <div className="flex flex-wrap items-center gap-2">

                            {kod ? (
                              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                                {kod}
                              </span>
                            ) : null}

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                cevaplandi
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              {cevaplandi
                                ? "Cevaplandı"
                                : "Cevap Bekliyor"}
                            </span>

                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                              {tip ===
                              ANKET_TIPLERI.DAIRE_SAKINI
                                ? "Daire Sakini"
                                : tip ===
                                    ANKET_TIPLERI.ORTAK_ALAN
                                  ? "Ortak Alan / Proje Yöneticisi"
                                  : "Anket"}
                            </span>
                          </div>

                          {/* TITLE */}

                          <h2 className="mt-3 text-base font-semibold sm:text-lg">
                            {safeText(
                              baslik
                            )}
                          </h2>

                          {/* SITE */}

                          <div className="mt-1 text-xs font-medium text-zinc-500">
                            {safeText(
                              siteAd
                            )}
                          </div>

                          {/* DESCRIPTION */}

                          {aciklama ? (
                            <p className="mt-3 max-w-4xl whitespace-pre-line text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                              {aciklama}
                            </p>
                          ) : null}
                        </div>

                        {/* ORTALAMA */}

                        {cevaplandi ? (
                          <div className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                              Genel Memnuniyet
                            </div>

                            <OrtalamaGoster
                              value={
                                ortalama
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* =========================================
                        PERSONELLER
                    ========================================= */}

                    <div className="border-y border-zinc-100 bg-zinc-50/60 px-4 py-4 sm:px-5 dark:border-zinc-800 dark:bg-zinc-900/40">

                      <div className="flex items-center justify-between gap-3">

                        <div>
                          <div className="text-xs font-semibold">
                            İş Emrinde Görevli Personeller
                          </div>

                          <div className="mt-0.5 text-[10px] text-zinc-400">
                            Değerlendirmenin ilişkili olduğu iş emrinde görev alan personeller.
                          </div>
                        </div>

                        <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-500 shadow-sm dark:bg-zinc-950">
                          {Array.isArray(
                            personeller
                          )
                            ? personeller.length
                            : 0}{" "}
                          Personel
                        </div>
                      </div>

                      {Array.isArray(
                        personeller
                      ) &&
                      personeller.length >
                        0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {personeller.map(
                            (
                              atama,
                              index
                            ) => (
                              <PersonelKart
                                key={
                                  atama?.id ??
                                  atama?.Id ??
                                  atama?.personelId ??
                                  atama?.PersonelId ??
                                  index
                                }
                                atama={
                                  atama
                                }
                              />
                            )
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-4 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
                          Bu iş emrine atanmış personel bilgisi bulunamadı.
                        </div>
                      )}
                    </div>

                    {/* =========================================
                        CEVAPLAR
                    ========================================= */}

                    {cevaplandi ? (
                      <div className="p-4 sm:p-5">

                        <div className="mb-3">
                          <div className="text-xs font-semibold">
                            Değerlendirme Sonuçları
                          </div>

                          <div className="mt-0.5 text-[10px] text-zinc-400">
                            Kullanıcının verdiği memnuniyet cevapları.
                          </div>
                        </div>

                        <div
                          className={`grid gap-3 ${
                            tip ===
                            ANKET_TIPLERI.DAIRE_SAKINI
                              ? "md:grid-cols-2 xl:grid-cols-5"
                              : "md:grid-cols-2 xl:grid-cols-4"
                          }`}
                        >
                          {sorular.map(
                            (
                              soru,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                              >
                                <div className="min-h-[35px] text-[10px] font-medium leading-4 text-zinc-500 dark:text-zinc-400">
                                  {
                                    soru.baslik
                                  }
                                </div>

                                <div className="mt-3">
                                  <PuanGoster
                                    puan={
                                      soru.puan
                                    }
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* GORUS */}

                        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            Görüş / Öneri
                          </div>

                          <div className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                            {safeText(
                              gorus
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 sm:p-5">
                        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                          Bu anket henüz cevaplanmadığı için değerlendirme sonucu bulunmuyor.
                        </div>
                      </div>
                    )}

                    {/* =========================================
                        FOOTER
                    ========================================= */}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-[10px] text-zinc-400 sm:px-5 dark:border-zinc-800 dark:bg-zinc-900/40">

                      <span>
                        Anket oluşturma:{" "}
                        {formatDate(
                          item?.olusturmaTarihiUtc ??
                            item?.OlusturmaTarihiUtc
                        )}
                      </span>

                      {cevaplandi ? (
                        <span>
                          Cevap tarihi:{" "}
                          {formatDate(
                            item?.cevaplanmaTarihiUtc ??
                              item?.CevaplanmaTarihiUtc
                          )}
                        </span>
                      ) : null}

                      <span>
                        Anket No: #
                        {id}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : null}

        {/* ==================================================
            PAGINATION
        ================================================== */}

        {!loading &&
        pagination.totalPages >
          1 ? (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950">

            <div className="text-xs text-zinc-500">
              Sayfa{" "}
              {pagination.page} /{" "}
              {pagination.totalPages}
              {" · "}
              {pagination.totalCount}{" "}
              kayıt
            </div>

            <div className="flex flex-wrap items-center gap-1.5">

              {/* ONCEKI */}

              <button
                type="button"
                disabled={
                  !pagination.hasPreviousPage
                }
                onClick={() =>
                  setPage(
                    (prev) =>
                      Math.max(
                        1,
                        prev - 1
                      )
                  )
                }
                className="h-9 rounded-lg border border-zinc-200 px-3 text-xs font-semibold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Önceki
              </button>

              {/* PAGE NUMBERS */}

              {getPageNumbers().map(
                (
                  pageNumber
                ) => {
                  const active =
                    pageNumber ===
                    pagination.page;

                  return (
                    <button
                      key={
                        pageNumber
                      }
                      type="button"
                      onClick={() =>
                        setPage(
                          pageNumber
                        )
                      }
                      className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold transition ${
                        active
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {
                        pageNumber
                      }
                    </button>
                  );
                }
              )}

              {/* SONRAKI */}

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage
                }
                onClick={() =>
                  setPage(
                    (prev) =>
                      prev + 1
                  )
                }
                className="h-9 rounded-lg border border-zinc-200 px-3 text-xs font-semibold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Sonraki
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}