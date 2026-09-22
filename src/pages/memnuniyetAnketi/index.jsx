import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getDataAsync,
  postDataAsync,
} from "@/utils/apiService";

const PAGE_SIZE = 25;

const ANKET_TIPLERI = {
  DAIRE_SAKINI: 10,
  ORTAK_ALAN: 20,
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

  if (
    data?.errors &&
    typeof data.errors === "object"
  ) {
    const messages = Object.values(
      data.errors
    )
      .flat()
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return (
    data?.message ||
    data?.Message ||
    data?.error ||
    data?.Error ||
    data?.title ||
    null
  );
}

// ======================================================
// TARİH
// ======================================================

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat(
      "tr-TR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(value));
  } catch {
    return "-";
  }
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
// ANKET DURUM BADGE
// ======================================================

function AnketDurumBadge({
  title,
  varMi,
  cevaplandiMi,
}) {
  if (!varMi) {
    return (
      <div
        title={`${title} anketi oluşturulmadı`}
        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
      >
        <span className="text-sm leading-none">
          ○
        </span>

        <span>{title}</span>

        <span className="hidden opacity-60 sm:inline">
          Anket oluşturulmadı
        </span>
      </div>
    );
  }

  if (cevaplandiMi) {
    return (
      <div
        title={`${title} anketi cevaplandı`}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        <span className="text-xs">
          ✓
        </span>

        <span>{title}</span>

        <span className="hidden opacity-70 sm:inline">
          Cevaplandı
        </span>
      </div>
    );
  }

  return (
    <div
      title={`${title} anketi oluşturuldu, cevap bekleniyor`}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <span className="text-[9px]">
        ●
      </span>

      <span>{title}</span>

      <span className="hidden opacity-70 sm:inline">
        Cevap Bekliyor
      </span>
    </div>
  );
}

// ======================================================
// ANA SAYFA
// ======================================================

export default function MemnuniyetAnketIndexPage() {
  const router = useRouter();

  // ====================================================
  // LIST
  // ====================================================

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ====================================================
  // SEARCH
  // ====================================================

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

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
  // CREATE MODAL
  // ====================================================

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [
    selectedIsEmri,
    setSelectedIsEmri,
  ] = useState(null);

  const [
    selectedAnketTipi,
    setSelectedAnketTipi,
  ] = useState(null);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");

  // ====================================================
  // SUCCESS MODAL
  // ====================================================

  const [
    showSuccessModal,
    setShowSuccessModal,
  ] = useState(false);

  const [
    createdAnket,
    setCreatedAnket,
  ] = useState(null);

  const [
    copied,
    setCopied,
  ] = useState(false);

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
  // GET İŞ EMİRLERİ
  // ====================================================

  const loadIsEmirleri =
    useCallback(async () => {
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

        const res =
          await getDataAsync(
            `memnuniyet-anket/is-emirleri?${params.toString()}`
          );

        const list =
          res?.items ??
          res?.Items ??
          [];

        const p =
          res?.pagination ??
          res?.Pagination ??
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
      } catch (err) {
        console.error(
          "Memnuniyet anketi iş emirleri yükleme hata:",
          err
        );

        console.error(
          "BACKEND RESPONSE:",
          err?.response?.data
        );

        setError(
          extractBackendMsg(err) ||
            err?.message ||
            "İş emirleri alınamadı."
        );

        setItems([]);
      } finally {
        setLoading(false);
      }
    }, [page, search]);

  useEffect(() => {
    loadIsEmirleri();
  }, [loadIsEmirleri]);

  // ====================================================
  // CREATE MODAL AÇ
  // ====================================================

  const openCreateModal = (
    item
  ) => {
    const daireVar =
      Boolean(
        item?.daireSakiniAnketiVar ??
          item?.DaireSakiniAnketiVar ??
          false
      );

    const ortakVar =
      Boolean(
        item?.ortakAlanAnketiVar ??
          item?.OrtakAlanAnketiVar ??
          false
      );

    if (daireVar && ortakVar) {
      return;
    }

    setSelectedIsEmri(item);
    setSelectedAnketTipi(null);
    setCreateError("");
    setCreatedAnket(null);
    setCopied(false);
    setShowCreateModal(true);
  };

  // ====================================================
  // CREATE MODAL KAPAT
  // ====================================================

  const closeCreateModal = () => {
    if (creating) {
      return;
    }

    setShowCreateModal(false);
    setSelectedIsEmri(null);
    setSelectedAnketTipi(null);
    setCreateError("");
  };

  // ====================================================
  // ANKET OLUŞTUR
  // ====================================================

  const handleCreateAnket =
    async () => {
      if (
        !selectedIsEmri ||
        !selectedAnketTipi ||
        creating
      ) {
        return;
      }

      const isEmriId =
        selectedIsEmri?.id ??
        selectedIsEmri?.Id;

      if (!isEmriId) {
        setCreateError(
          "İş emri bilgisi bulunamadı."
        );

        return;
      }

      const daireVar =
        Boolean(
          selectedIsEmri
            ?.daireSakiniAnketiVar ??
            selectedIsEmri
              ?.DaireSakiniAnketiVar ??
            false
        );

      const ortakVar =
        Boolean(
          selectedIsEmri
            ?.ortakAlanAnketiVar ??
            selectedIsEmri
              ?.OrtakAlanAnketiVar ??
            false
        );

      if (
        selectedAnketTipi ===
          ANKET_TIPLERI.DAIRE_SAKINI &&
        daireVar
      ) {
        setCreateError(
          "Bu iş emri için Daire Sakini anketi zaten oluşturulmuş."
        );

        return;
      }

      if (
        selectedAnketTipi ===
          ANKET_TIPLERI.ORTAK_ALAN &&
        ortakVar
      ) {
        setCreateError(
          "Bu iş emri için Ortak Alan / Proje Yöneticisi anketi zaten oluşturulmuş."
        );

        return;
      }

      try {
        setCreating(true);
        setCreateError("");

        const payload = {
          isEmriId:
            Number(isEmriId),

          anketTipi:
            Number(
              selectedAnketTipi
            ),
        };

        const res =
          await postDataAsync(
            "memnuniyet-anket",
            payload,
            {
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        setCreatedAnket(res);

        setShowCreateModal(false);

        setShowSuccessModal(true);

        setSelectedIsEmri(null);
        setSelectedAnketTipi(null);

        await loadIsEmirleri();
      } catch (err) {
        console.error(
          "Memnuniyet anketi oluşturma hatası:",
          err
        );

        console.error(
          "BACKEND RESPONSE:",
          err?.response?.data
        );

        setCreateError(
          extractBackendMsg(err) ||
            err?.message ||
            "Anket oluşturulurken bir hata oluştu."
        );
      } finally {
        setCreating(false);
      }
    };

  // ====================================================
  // LINK KOPYALA
  // ====================================================

  const copyLink =
    async () => {
      const link =
        createdAnket
          ?.sistemUretilmisLink ??
        createdAnket
          ?.SistemUretilmisLink;

      if (!link) return;

      try {
        await navigator.clipboard.writeText(
          link
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error(
          "Link kopyalama hata:",
          err
        );
      }
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              EOS MANAGEMENT
            </div>

            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
              Memnuniyet Anketleri
            </h1>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              İş emirleri için Daire Sakini
              veya Ortak Alan memnuniyet
              anketi oluşturabilirsiniz.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/memnuniyetAnketi/rapor"
              )
            }
            className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Anket Raporları
          </button>
        </div>

        {/* ==================================================
            DURUM AÇIKLAMASI
        ================================================== */}

        <div className="mt-5 flex flex-wrap gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[10px] shadow-sm dark:border-zinc-800 dark:bg-zinc-950">

          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="text-sm">
              ○
            </span>

            <span>
              Anket oluşturulmadı
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-700">
            <span>●</span>

            <span>
              Oluşturuldu / cevap bekliyor
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700">
            <span>✓</span>

            <span>
              Cevaplandı
            </span>
          </div>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            <div className="flex-1">
              <input
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(
                    e.target.value
                  )
                }
                placeholder="İş emri kodu, başlık veya açıklama ara..."
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-900"
              />
            </div>

            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-zinc-200 px-4 text-xs font-semibold transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Temizle
              </button>
            ) : null}
          </div>

          <div className="mt-2 text-[10px] text-zinc-400">
            {pagination.totalCount} iş emri
            bulundu.
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
            İş emirleri yükleniyor...
          </div>
        ) : null}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
        !error &&
        items.length === 0 ? (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            İş emri bulunamadı.
          </div>
        ) : null}

        {/* ==================================================
            CARDS
        ================================================== */}

        {!loading &&
        items.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {items.map(
              (item) => {
                const id =
                  item?.id ??
                  item?.Id;

                const kod =
                  item?.kod ??
                  item?.Kod;

                const baslik =
                  item?.kisaBaslik ??
                  item?.KisaBaslik;

                const aciklama =
                  item?.aciklama ??
                  item?.Aciklama;

                const durumAd =
                  item?.durumAd ??
                  item?.DurumAd;

                const tarih =
                  item?.olusturmaTarihiUtc ??
                  item?.OlusturmaTarihiUtc;

                const site =
                  item?.site ??
                  item?.Site ??
                  {};

                const siteAd =
                  site?.ad ??
                  site?.Ad;

                // ==========================================
                // ANKET DURUMLARI
                // ==========================================

                const daireSakiniAnketiVar =
                  Boolean(
                    item?.daireSakiniAnketiVar ??
                      item?.DaireSakiniAnketiVar ??
                      false
                  );

                const daireSakiniCevaplandiMi =
                  Boolean(
                    item?.daireSakiniCevaplandiMi ??
                      item?.DaireSakiniCevaplandiMi ??
                      false
                  );

                const ortakAlanAnketiVar =
                  Boolean(
                    item?.ortakAlanAnketiVar ??
                      item?.OrtakAlanAnketiVar ??
                      false
                  );

                const ortakAlanCevaplandiMi =
                  Boolean(
                    item?.ortakAlanCevaplandiMi ??
                      item?.OrtakAlanCevaplandiMi ??
                      false
                  );

                const tumAnketlerOlusturuldu =
                  daireSakiniAnketiVar &&
                  ortakAlanAnketiVar;

                return (
                  <div
                    key={id}
                    className="flex min-h-[330px] flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                  >

                    {/* ======================================
                        KOD + DURUM
                    ====================================== */}

                    <div className="flex items-center justify-between gap-2">

                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                        {safeText(kod)}
                      </span>

                      {durumAd ? (
                        <span className="truncate text-[10px] font-medium text-zinc-400">
                          {durumAd}
                        </span>
                      ) : null}
                    </div>

                    {/* ======================================
                        TITLE
                    ====================================== */}

                    <h2 className="mt-3 line-clamp-2 text-base font-semibold leading-5">
                      {safeText(
                        baslik
                      )}
                    </h2>

                    {/* ======================================
                        SITE + DATE
                    ====================================== */}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400">

                      <span className="font-medium text-zinc-500 dark:text-zinc-400">
                        {safeText(
                          siteAd
                        )}
                      </span>

                      <span>
                        {formatDate(
                          tarih
                        )}
                      </span>
                    </div>

                    {/* ======================================
                        ANKET DURUMLARI
                    ====================================== */}

                    <div className="mt-4">

                      <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                        Anket Durumu
                      </div>

                      <div className="flex flex-wrap gap-1.5">

                        <AnketDurumBadge
                          title="Daire Sakini"
                          varMi={
                            daireSakiniAnketiVar
                          }
                          cevaplandiMi={
                            daireSakiniCevaplandiMi
                          }
                        />

                        <AnketDurumBadge
                          title="Ortak Alan"
                          varMi={
                            ortakAlanAnketiVar
                          }
                          cevaplandiMi={
                            ortakAlanCevaplandiMi
                          }
                        />

                      </div>
                    </div>

                    {/* ======================================
                        DESCRIPTION
                    ====================================== */}

                    <p className="mt-4 line-clamp-4 flex-1 whitespace-pre-line text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {safeText(
                        aciklama
                      )}
                    </p>

                    {/* ======================================
                        BUTTONS
                    ====================================== */}

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/is-emirleri/${id}`
                          )
                        }
                        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      >
                        Detay
                      </button>

                      {tumAnketlerOlusturuldu ? (
                        <button
                          type="button"
                          disabled
                          title="Bu iş emri için her iki anket de oluşturuldu."
                          className="h-9 cursor-not-allowed rounded-lg bg-emerald-50 px-3 text-[11px] font-semibold text-emerald-700 opacity-90 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          ✓ Anketler Oluşturuldu
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openCreateModal(
                              item
                            )
                          }
                          className="h-9 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          Anket Oluştur
                        </button>
                      )}
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

      {/* ====================================================
          CREATE MODAL
      ==================================================== */}

      {showCreateModal &&
      selectedIsEmri ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

            {/* MODAL HEADER */}

            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-start justify-between gap-4">

                <div>
                  <h2 className="text-base font-semibold">
                    Memnuniyet Anketi Oluştur
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    İş emri için oluşturmak
                    istediğiniz anket tipini
                    seçiniz.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={creating}
                  onClick={
                    closeCreateModal
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5">

              {/* IS EMRI */}

              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">

                <div className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                  İş Emri
                </div>

                <div className="mt-1 text-sm font-semibold">
                  {safeText(
                    selectedIsEmri
                      ?.kisaBaslik ??
                      selectedIsEmri
                        ?.KisaBaslik
                  )}
                </div>

                <div className="mt-1 text-[10px] text-zinc-500">
                  {safeText(
                    selectedIsEmri
                      ?.kod ??
                      selectedIsEmri
                        ?.Kod
                  )}
                </div>
              </div>

              {/* ANKET SECENEKLERI */}

              <div className="mt-5 space-y-3">

                {/* DAIRE SAKINI */}

                {(() => {
                  const mevcut =
                    Boolean(
                      selectedIsEmri
                        ?.daireSakiniAnketiVar ??
                        selectedIsEmri
                          ?.DaireSakiniAnketiVar ??
                        false
                    );

                  const cevaplandi =
                    Boolean(
                      selectedIsEmri
                        ?.daireSakiniCevaplandiMi ??
                        selectedIsEmri
                          ?.DaireSakiniCevaplandiMi ??
                        false
                    );

                  const selected =
                    selectedAnketTipi ===
                    ANKET_TIPLERI.DAIRE_SAKINI;

                  return (
                    <button
                      type="button"
                      disabled={
                        mevcut ||
                        creating
                      }
                      onClick={() => {
                        setSelectedAnketTipi(
                          ANKET_TIPLERI.DAIRE_SAKINI
                        );

                        setCreateError(
                          ""
                        );
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        mevcut
                          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-70 dark:border-zinc-800 dark:bg-zinc-900"
                          : selected
                            ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 dark:border-zinc-100 dark:bg-zinc-900"
                            : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">

                        <div>
                          <div className="text-sm font-semibold">
                            Daire Sakini
                          </div>

                          <div className="mt-1 text-[10px] leading-4 text-zinc-500">
                            Daire sakininin
                            tamamlanan iş ve
                            teknik personel
                            hakkındaki
                            değerlendirmesi.
                          </div>
                        </div>

                        {mevcut ? (
                          <div
                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${
                              cevaplandi
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {cevaplandi
                              ? "✓ Cevaplandı"
                              : "● Oluşturuldu"}
                          </div>
                        ) : selected ? (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
                            ✓
                          </div>
                        ) : (
                          <div className="h-6 w-6 shrink-0 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
                        )}
                      </div>
                    </button>
                  );
                })()}

                {/* ORTAK ALAN */}

                {(() => {
                  const mevcut =
                    Boolean(
                      selectedIsEmri
                        ?.ortakAlanAnketiVar ??
                        selectedIsEmri
                          ?.OrtakAlanAnketiVar ??
                        false
                    );

                  const cevaplandi =
                    Boolean(
                      selectedIsEmri
                        ?.ortakAlanCevaplandiMi ??
                        selectedIsEmri
                          ?.OrtakAlanCevaplandiMi ??
                        false
                    );

                  const selected =
                    selectedAnketTipi ===
                    ANKET_TIPLERI.ORTAK_ALAN;

                  return (
                    <button
                      type="button"
                      disabled={
                        mevcut ||
                        creating
                      }
                      onClick={() => {
                        setSelectedAnketTipi(
                          ANKET_TIPLERI.ORTAK_ALAN
                        );

                        setCreateError(
                          ""
                        );
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        mevcut
                          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-70 dark:border-zinc-800 dark:bg-zinc-900"
                          : selected
                            ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 dark:border-zinc-100 dark:bg-zinc-900"
                            : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">

                        <div>
                          <div className="text-sm font-semibold">
                            Ortak Alan / Proje Yöneticisi
                          </div>

                          <div className="mt-1 text-[10px] leading-4 text-zinc-500">
                            Ortak alan işlerinde
                            proje yöneticisinin
                            iş ve teknik personel
                            değerlendirmesi.
                          </div>
                        </div>

                        {mevcut ? (
                          <div
                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${
                              cevaplandi
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {cevaplandi
                              ? "✓ Cevaplandı"
                              : "● Oluşturuldu"}
                          </div>
                        ) : selected ? (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
                            ✓
                          </div>
                        ) : (
                          <div className="h-6 w-6 shrink-0 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
                        )}
                      </div>
                    </button>
                  );
                })()}
              </div>

              {/* ERROR */}

              {createError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {createError}
                </div>
              ) : null}

              {/* BUTTONS */}

              <div className="mt-5 grid grid-cols-2 gap-2">

                <button
                  type="button"
                  disabled={creating}
                  onClick={
                    closeCreateModal
                  }
                  className="h-10 rounded-lg border border-zinc-200 px-3 text-xs font-semibold transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  disabled={
                    creating ||
                    !selectedAnketTipi
                  }
                  onClick={
                    handleCreateAnket
                  }
                  className="h-10 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {creating
                    ? "Oluşturuluyor..."
                    : "Anket Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ====================================================
          SUCCESS MODAL
      ==================================================== */}

      {showSuccessModal &&
      createdAnket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                ✓
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                Anket Hazır
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Memnuniyet anketi
                başarıyla oluşturuldu.
                Aşağıdaki bağlantıyı
                ilgili kişiye
                gönderebilirsiniz.
              </p>
            </div>

            {/* LINK */}

            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">

              <div className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                Anket Bağlantısı
              </div>

              <div className="mt-2 break-all text-xs leading-5 text-zinc-700 dark:text-zinc-300">
                {createdAnket
                  ?.sistemUretilmisLink ??
                  createdAnket
                    ?.SistemUretilmisLink ??
                  "-"}
              </div>
            </div>

            {/* BUTTONS */}

            <div className="mt-4 grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={
                  copyLink
                }
                className="h-10 rounded-lg border border-zinc-200 px-3 text-xs font-semibold transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                {copied
                  ? "✓ Kopyalandı"
                  : "Linki Kopyala"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(
                    false
                  );

                  setCreatedAnket(
                    null
                  );

                  setCopied(false);
                }}
                className="h-10 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}