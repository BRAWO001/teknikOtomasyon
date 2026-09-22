import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getDataAsync,
  postDataAsync,
} from "@/utils/apiService";

const PAGE_SIZE = 25;

// ======================================================
// ERROR
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

function formatTR(iso) {
  if (!iso) return "-";

  try {
    const d = new Date(iso);

    d.setHours(
      d.getHours() + 3
    );

    return d.toLocaleString(
      "tr-TR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
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
    value === undefined
  ) {
    return "-";
  }

  const text =
    String(value).trim();

  return text || "-";
}

// ======================================================
// COMPONENT
// ======================================================

export default function IsEmriEslemeDrawer({
  open,
  satinAlmaId,
  site,
  mevcutEsleme,
  onClose,
  onSuccess,
}) {
  // ====================================================
  // DATA
  // ====================================================

  const [items, setItems] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [
    hasNextPage,
    setHasNextPage,
  ] = useState(false);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

  // ====================================================
  // LOADING
  // ====================================================

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(false);

  const [
    nextPageLoading,
    setNextPageLoading,
  ] = useState(false);

  const [
    eslemeLoadingId,
    setEslemeLoadingId,
  ] = useState(null);

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
  // ERROR
  // ====================================================

  const [error, setError] =
    useState("");

  // ====================================================
  // INFINITE SCROLL
  // ====================================================

  const observerRef =
    useRef(null);

  const loadingRef =
    useRef(false);

  // ====================================================
  // SITE
  // ====================================================

  const siteAd =
    site?.ad ??
    site?.Ad ??
    "";

  // ====================================================
  // MEVCUT EŞLEME
  // ====================================================

  const mevcutIsEmri =
    mevcutEsleme?.isEmri ??
    mevcutEsleme?.IsEmri ??
    null;

  const mevcutIsEmriId =
    mevcutIsEmri?.id ??
    mevcutIsEmri?.Id ??
    mevcutEsleme?.isEmriId ??
    mevcutEsleme?.IsEmriId ??
    null;

  const mevcutIsEmriKod =
    mevcutIsEmri?.kod ??
    mevcutIsEmri?.Kod ??
    "";

  // ====================================================
  // SEARCH DEBOUNCE
  // ====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSearch(
          searchInput.trim()
        );
      }, 500);

    return () =>
      clearTimeout(timer);
  }, [searchInput, open]);

  // ====================================================
  // DRAWER AÇILDIĞINDA RESET
  // ====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setItems([]);
    setPage(1);
    setHasNextPage(false);
    setTotalCount(0);
    setError("");
    setSearchInput("");
    setSearch("");
  }, [open, satinAlmaId]);

  // ====================================================
  // İŞ EMRİ GET
  // ====================================================

  const loadIsEmirleri =
    useCallback(
      async ({
        targetPage = 1,
        append = false,
      } = {}) => {
        if (
          !open ||
          !satinAlmaId
        ) {
          return;
        }

        if (loadingRef.current) {
          return;
        }

        try {
          loadingRef.current =
            true;

          setError("");

          if (append) {
            setNextPageLoading(
              true
            );
          } else {
            setInitialLoading(
              true
            );
          }

          const params =
            new URLSearchParams();

          params.set(
            "satinAlmaId",
            String(satinAlmaId)
          );

          params.set(
            "page",
            String(targetPage)
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
              `satinalma-is-emri-esleme/is-emirleri?${params.toString()}`
            );

          const newItems =
            res?.items ??
            res?.Items ??
            [];

          const pagination =
            res?.pagination ??
            res?.Pagination ??
            {};

          const next =
            Boolean(
              pagination?.hasNextPage ??
                pagination?.HasNextPage ??
                false
            );

          const count =
            Number(
              pagination?.totalCount ??
                pagination?.TotalCount ??
                0
            );

          setHasNextPage(next);
          setTotalCount(count);
          setPage(targetPage);

          setItems((prev) => {
            if (!append) {
              return Array.isArray(
                newItems
              )
                ? newItems
                : [];
            }

            const oldItems =
              Array.isArray(prev)
                ? prev
                : [];

            const incoming =
              Array.isArray(newItems)
                ? newItems
                : [];

            const map =
              new Map();

            [
              ...oldItems,
              ...incoming,
            ].forEach((item) => {
              const id =
                item?.id ??
                item?.Id;

              if (id) {
                map.set(
                  Number(id),
                  item
                );
              }
            });

            return Array.from(
              map.values()
            );
          });
        } catch (err) {
          console.error(
            "İş emirleri yüklenemedi:",
            err
          );

          console.error(
            "BACKEND RESPONSE:",
            err?.response?.data
          );

          setError(
            extractBackendMsg(
              err
            ) ||
              err?.message ||
              "İş emirleri yüklenemedi."
          );
        } finally {
          loadingRef.current =
            false;

          setInitialLoading(
            false
          );

          setNextPageLoading(
            false
          );
        }
      },
      [
        open,
        satinAlmaId,
        search,
      ]
    );

  // ====================================================
  // SEARCH DEĞİŞİNCE BAŞTAN GET
  // ====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setItems([]);
    setPage(1);
    setHasNextPage(false);

    loadIsEmirleri({
      targetPage: 1,
      append: false,
    });
  }, [
    open,
    search,
    satinAlmaId,
    loadIsEmirleri,
  ]);

  // ====================================================
  // SONRAKİ SAYFA
  // ====================================================

  const loadNextPage =
    useCallback(() => {
      if (
        !open ||
        !hasNextPage ||
        initialLoading ||
        nextPageLoading ||
        loadingRef.current
      ) {
        return;
      }

      loadIsEmirleri({
        targetPage: page + 1,
        append: true,
      });
    }, [
      open,
      hasNextPage,
      initialLoading,
      nextPageLoading,
      page,
      loadIsEmirleri,
    ]);

  // ====================================================
  // INTERSECTION OBSERVER
  // ====================================================

  const lastItemRef =
    useCallback(
      (node) => {
        if (
          initialLoading ||
          nextPageLoading
        ) {
          return;
        }

        if (
          observerRef.current
        ) {
          observerRef.current.disconnect();
        }

        observerRef.current =
          new IntersectionObserver(
            (entries) => {
              if (
                entries[0]
                  ?.isIntersecting &&
                hasNextPage
              ) {
                loadNextPage();
              }
            },
            {
              rootMargin:
                "200px",
            }
          );

        if (node) {
          observerRef.current.observe(
            node
          );
        }
      },
      [
        initialLoading,
        nextPageLoading,
        hasNextPage,
        loadNextPage,
      ]
    );

  // ====================================================
  // ESC
  // ====================================================

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      e
    ) => {
      if (e.key === "Escape") {
        if (!eslemeLoadingId) {
          onClose?.();
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
    eslemeLoadingId,
  ]);

  // ====================================================
  // BODY SCROLL
  // ====================================================

  useEffect(() => {
    if (!open) return;

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        oldOverflow;
    };
  }, [open]);

  // ====================================================
  // EŞLE
  // ====================================================

  const handleEsle =
    async (isEmri) => {
      const isEmriId =
        isEmri?.id ??
        isEmri?.Id;

      if (
        !isEmriId ||
        !satinAlmaId
      ) {
        return;
      }

      if (
        Number(isEmriId) ===
        Number(mevcutIsEmriId)
      ) {
        return;
      }

      try {
        setEslemeLoadingId(
          Number(isEmriId)
        );

        setError("");

        await postDataAsync(
          "satinalma-is-emri-esleme",
          {
            satinAlmaId:
              Number(
                satinAlmaId
              ),

            isEmriId:
              Number(isEmriId),
          },
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

        await onSuccess?.(
          isEmri
        );
      } catch (err) {
        console.error(
          "İş emri eşleme hatası:",
          err
        );

        console.error(
          "BACKEND RESPONSE:",
          err?.response?.data
        );

        setError(
          extractBackendMsg(
            err
          ) ||
            err?.message ||
            "İş emri eşlenirken hata oluştu."
        );
      } finally {
        setEslemeLoadingId(
          null
        );
      }
    };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">

      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Kapat"
        onClick={() => {
          if (!eslemeLoadingId) {
            onClose?.();
          }
        }}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-[1px]"
      />

      {/* DRAWER */}

      <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

        {/* ================================================
            HEADER
        ================================================ */}

        <div className="shrink-0 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">

          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-zinc-400">
                TALEP EŞLEME
              </div>

              <h2 className="mt-1 text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                İş Emri Eşle
              </h2>

              <div className="mt-1 text-[11px] text-zinc-500">
                Talep  No:{" "}
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  #{satinAlmaId}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={
                Boolean(
                  eslemeLoadingId
                )
              }
              onClick={() =>
                onClose?.()
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-sm font-bold text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              ✕
            </button>
          </div>

          {/* PROJE */}

          {siteAd ? (
            <div className="mt-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-extrabold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Proje: {siteAd}
            </div>
          ) : null}

          {/* MEVCUT EŞLEME */}

          {mevcutIsEmriId ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/20">

              <div className="text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Mevcut Görevlendirme
              </div>

              <div className="mt-0.5 text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                {safeText(
                  mevcutIsEmriKod
                )}
              </div>
            </div>
          ) : null}

          {/* SEARCH */}

          <div className="relative mt-4">

            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />

              <path d="m21 21-4.3-4.3" />
            </svg>

            <input
              type="text"
              value={searchInput}
              onChange={(e) =>
                setSearchInput(
                  e.target.value
                )
              }
              placeholder="İş emri kodu, başlık veya açıklama ara..."
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-xs font-medium text-zinc-900 outline-none transition focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
            />

            {searchInput ? (
              <button
                type="button"
                onClick={() =>
                  setSearchInput("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* COUNT */}

          <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-400">

            <span>
              {totalCount} iş emri
            </span>

            <span>
              25'er kayıt yüklenir
            </span>
          </div>
        </div>

        {/* ================================================
            BODY
        ================================================ */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4">

          {/* ERROR */}

          {error ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[11px] leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {/* INITIAL LOADING */}

          {initialLoading &&
          items.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />

                <div className="mt-3 text-[11px] font-semibold text-zinc-500">
                  İş emirleri yükleniyor...
                </div>
              </div>
            </div>
          ) : null}

          {/* EMPTY */}

          {!initialLoading &&
          items.length === 0 &&
          !error ? (
            <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">

              <div className="text-2xl">
                ○
              </div>

              <div className="mt-2 text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                İş emri bulunamadı
              </div>

              <div className="mt-1 text-[10px] leading-4 text-zinc-400">
                Bu projeye veya arama kriterine uygun iş emri bulunamadı.
              </div>
            </div>
          ) : null}

          {/* LIST */}

          {items.length > 0 ? (
            <div className="space-y-2">

              {items.map(
                (item, index) => {
                  const isEmriId =
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

                  const durum =
                    item?.durumAd ??
                    item?.DurumAd;

                  const tarih =
                    item?.olusturmaTarihiUtc ??
                    item?.OlusturmaTarihiUtc;

                  const personelSayisi =
                    Number(
                      item?.personelSayisi ??
                        item?.PersonelSayisi ??
                        0
                    );

                  const isCurrent =
                    Number(
                      isEmriId
                    ) ===
                    Number(
                      mevcutIsEmriId
                    );

                  const isLoading =
                    Number(
                      eslemeLoadingId
                    ) ===
                    Number(
                      isEmriId
                    );

                  const isLast =
                    index ===
                    items.length - 1;

                  return (
                    <div
                      key={
                        isEmriId
                      }
                      ref={
                        isLast
                          ? lastItemRef
                          : null
                      }
                      className={`rounded-xl border p-3 transition ${
                        isCurrent
                          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                      }`}
                    >

                      {/* TOP */}

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-black text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                              {safeText(
                                kod
                              )}
                            </span>

                            {durum ? (
                              <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                                {durum}
                              </span>
                            ) : null}

                            {isCurrent ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                ✓ Eşli
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 text-xs font-extrabold leading-5 text-zinc-900 dark:text-zinc-100">
                            {safeText(
                              baslik
                            )}
                          </div>

                          {aciklama ? (
                            <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500">
                              {aciklama}
                            </div>
                          ) : null}
                        </div>

                        {/* BUTTON */}

                        {isCurrent ? (
                          <button
                            type="button"
                            disabled
                            className="h-8 shrink-0 cursor-not-allowed rounded-lg bg-emerald-100 px-3 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          >
                            Eşli
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              Boolean(
                                eslemeLoadingId
                              )
                            }
                            onClick={() =>
                              handleEsle(
                                item
                              )
                            }
                            className="h-8 shrink-0 rounded-lg bg-zinc-900 px-3 text-[10px] font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                          >
                            {isLoading
                              ? "Eşleniyor..."
                              : mevcutIsEmriId
                                ? "Bununla Değiştir"
                                : "Eşle"}
                          </button>
                        )}
                      </div>

                      {/* FOOTER */}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-2 text-[9px] text-zinc-400 dark:border-zinc-800">

                        <span>
                          {formatTR(
                            tarih
                          )}
                        </span>

                        <span>
                          {personelSayisi} görevli personel
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : null}

          {/* NEXT PAGE */}

          {nextPageLoading ? (
            <div className="py-5 text-center">

              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />

              <div className="mt-2 text-[9px] text-zinc-400">
                Sonraki 25 iş emri yükleniyor...
              </div>
            </div>
          ) : null}

          {/* END */}

          {!initialLoading &&
          !nextPageLoading &&
          items.length > 0 &&
          !hasNextPage ? (
            <div className="py-5 text-center text-[9px] font-semibold text-zinc-400">
              Tüm iş emirleri gösterildi.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}