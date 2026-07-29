// src/pages/sakinGiris/faaliyetler.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function pickAny(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return null;
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function resolveSiteId(router) {
  const querySiteId = Number(router?.query?.siteId);

  if (Number.isInteger(querySiteId) && querySiteId > 0) {
    return querySiteId;
  }

  try {
    const rawCookie = getClientCookie("SakinUserInfo");
    if (!rawCookie) return null;

    const parsed = JSON.parse(decodeURIComponent(rawCookie));

    const sakin =
      parsed?.sakin ??
      parsed?.Sakin ??
      parsed?.kullanici ??
      parsed?.Kullanici ??
      parsed;

    const directSiteId = Number(
      pickAny(sakin, "siteId", "SiteId", "aktifSiteId", "AktifSiteId")
    );

    if (Number.isInteger(directSiteId) && directSiteId > 0) {
      return directSiteId;
    }

    const site = pickAny(sakin, "site", "Site");
    const nestedSiteId = Number(pickAny(site, "id", "Id"));

    if (Number.isInteger(nestedSiteId) && nestedSiteId > 0) {
      return nestedSiteId;
    }
  } catch (error) {
    console.error("SakinUserInfo cookie okunamadı:", error);
  }

  return null;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTypeStyle(type) {
  const normalized = String(type || "").toUpperCase();

  if (normalized === "PEYZAJ") {
    return {
      icon: "🌿",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      border: "border-l-emerald-400",
    };
  }

  if (normalized === "HAVUZ") {
    return {
      icon: "💧",
      badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
      border: "border-l-cyan-400",
    };
  }

  return {
    icon: "🛠️",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    border: "border-l-orange-400",
  };
}

function getStatusStyle(statusCode) {
  const code = Number(statusCode);

  if (code >= 100) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (code >= 50) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getInitials(ad, soyad) {
  const first = String(ad || "").trim().charAt(0);
  const last = String(soyad || "").trim().charAt(0);

  return `${first}${last}`.toLocaleUpperCase("tr-TR") || "?";
}

function extractErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;

  return error?.message || "Faaliyetler alınırken bir hata oluştu.";
}

function LoadingCards() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
        >
          <div className="h-5 w-32 rounded bg-blue-100" />
          <div className="mt-4 h-7 w-2/3 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((image) => (
              <div
                key={image}
                className="aspect-[4/3] rounded-2xl bg-blue-50"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  loading,
  onChange,
}) {
  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [];

    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }

    return pages;
  }, [page, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-7 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm font-semibold text-slate-500">
          Sayfa <span className="font-extrabold text-blue-700">{page}</span> /{" "}
          {totalPages}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={!hasPreviousPage || loading}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Önceki
          </button>

          {visiblePages[0] > 1 ? (
            <>
              <button
                type="button"
                onClick={() => onChange(1)}
                disabled={loading}
                className="h-10 min-w-10 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                1
              </button>

              {visiblePages[0] > 2 ? (
                <span className="px-1 text-slate-400">...</span>
              ) : null}
            </>
          ) : null}

          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onChange(pageNumber)}
              disabled={loading || pageNumber === page}
              className={[
                "h-10 min-w-10 rounded-xl border px-3 text-sm font-extrabold transition",
                pageNumber === page
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-blue-100 bg-white text-blue-700 hover:bg-blue-50",
              ].join(" ")}
            >
              {pageNumber}
            </button>
          ))}

          {visiblePages[visiblePages.length - 1] < totalPages ? (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 ? (
                <span className="px-1 text-slate-400">...</span>
              ) : null}

              <button
                type="button"
                onClick={() => onChange(totalPages)}
                disabled={loading}
                className="h-10 min-w-10 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                {totalPages}
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={!hasNextPage || loading}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sonraki →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FaaliyetlerPage() {
  const router = useRouter();

  const [siteId, setSiteId] = useState(null);
  const [faaliyetler, setFaaliyetler] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const loadFaaliyetler = useCallback(
    async ({ targetPage = page, refresh = false } = {}) => {
      if (!siteId) return;

      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const response = await getDataAsync(
          `AppProjeFaaliyet/site/${siteId}?page=${targetPage}&pageSize=${pageSize}`
        );

        const responseItems = normalizeList(
          pickAny(response, "items", "Items")
        ).filter(
          (item) => Number(pickAny(item, "siteId", "SiteId")) === siteId
        );

        const responsePage = Number(
          pickAny(response, "page", "Page") || targetPage
        );

        setFaaliyetler(responseItems);
        setPage(responsePage);

        setTotalPages(
          Number(pickAny(response, "totalPages", "TotalPages") || 0)
        );

        setHasPreviousPage(
          Boolean(
            pickAny(response, "hasPreviousPage", "HasPreviousPage") ??
              responsePage > 1
          )
        );

        setHasNextPage(
          Boolean(
            pickAny(response, "hasNextPage", "HasNextPage") ??
              responsePage <
                Number(pickAny(response, "totalPages", "TotalPages") || 0)
          )
        );
      } catch (error) {
        console.error("Faaliyetler alınamadı:", error);

        setFaaliyetler([]);
        setTotalPages(0);
        setHasPreviousPage(false);
        setHasNextPage(false);
        setErrorMessage(extractErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pageSize, siteId]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const resolvedSiteId = resolveSiteId(router);

    setSiteId(resolvedSiteId);
    setPage(1);

    if (!resolvedSiteId) {
      setLoading(false);
      setErrorMessage("Site bilgisi bulunamadı.");
    }
  }, [router.isReady, router.query.siteId]);

  useEffect(() => {
    if (!siteId) return;

    loadFaaliyetler({ targetPage: 1 });
  }, [siteId]);

  const handlePageChange = (targetPage) => {
    if (
      loading ||
      targetPage < 1 ||
      targetPage > totalPages ||
      targetPage === page
    ) {
      return;
    }

    loadFaaliyetler({ targetPage });

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
        <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-xl font-bold text-blue-700 transition hover:bg-blue-100"
                aria-label="Geri dön"
              >
                ←
              </button>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
                  Site çalışmaları
                </p>

                <h1 className="truncate text-2xl font-extrabold text-slate-800">
                  Faaliyetler
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                loadFaaliyetler({
                  targetPage: page,
                  refresh: true,
                })
              }
              disabled={refreshing || loading || !siteId}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>

              <span className="hidden sm:inline">
                {refreshing ? "Yenileniyor" : "Yenile"}
              </span>
            </button>
          </div>
        </header>

        <main className="mt-5">
          {errorMessage ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <LoadingCards />
          ) : faaliyetler.length === 0 ? (
            <div className="rounded-3xl border border-blue-100 bg-white px-5 py-14 text-center shadow-sm">
              <div className="text-5xl">📋</div>

              <h2 className="mt-4 text-xl font-extrabold text-slate-700">
                Henüz faaliyet bulunmuyor
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Bu site için eklenen faaliyetler burada gösterilecek.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {faaliyetler.map((item, index) => {
                const id = pickAny(item, "id", "Id") ?? index;
                const type = pickAny(item, "kaynakTipi", "KaynakTipi");

                const typeName =
                  pickAny(item, "kaynakTipiAd", "KaynakTipiAd") || "Faaliyet";

                const typeStyle = getTypeStyle(type);

                const title =
                  pickAny(item, "baslik", "Baslik") || "Başlıksız faaliyet";

                const description = pickAny(item, "aciklama", "Aciklama");

                const extraDescription = pickAny(
                  item,
                  "ekAciklama",
                  "EkAciklama"
                );

                const code = pickAny(item, "kod", "Kod");
                const statusCode = pickAny(item, "durumKod", "DurumKod");

                const statusName =
                  pickAny(item, "durumAd", "DurumAd") || "Durum yok";

                const siteName = pickAny(item, "siteAdi", "SiteAdi");
                const apartmentName = pickAny(item, "aptAdi", "AptAdi");

                const createdAt = pickAny(
                  item,
                  "olusturmaTarihiUtc",
                  "OlusturmaTarihiUtc"
                );

                const images = normalizeList(
                  pickAny(item, "gorseller", "Gorseller")
                );

                const personnel = normalizeList(
                  pickAny(item, "personeller", "Personeller")
                );

                const lastNote = pickAny(item, "sonNot", "SonNot");

                return (
                  <article
                    key={`${type}-${id}`}
                    className={`rounded-3xl border border-blue-100 border-l-4 bg-white shadow-sm transition hover:shadow-md ${typeStyle.border}`}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${typeStyle.badge}`}
                            >
                              <span>{typeStyle.icon}</span>
                              {typeName}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                                statusCode
                              )}`}
                            >
                              {statusName}
                            </span>
                          </div>

                          <h2 className="mt-3 text-xl font-extrabold leading-tight text-slate-800">
                            {title}
                          </h2>

                          {code ? (
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {code}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-sm font-semibold text-slate-500">
                          {formatDate(createdAt)}
                        </div>
                      </div>

                      {siteName || apartmentName ? (
                        <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                          <span>📍</span>

                          {[siteName, apartmentName]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      ) : null}

                      {description || extraDescription ? (
                        <div className="mt-4 space-y-2">
                          {description ? (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {description}
                            </p>
                          ) : null}

                          {extraDescription ? (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-500">
                              {extraDescription}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {images.length > 0 ? (
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {images.slice(0, 3).map((image, imageIndex) => {
                            const imageUrl = pickAny(image, "url", "Url");

                            const imageName =
                              pickAny(image, "dosyaAdi", "DosyaAdi") ||
                              `Faaliyet görseli ${imageIndex + 1}`;

                            if (!imageUrl) return null;

                            return (
                              <button
                                key={pickAny(image, "id", "Id") || imageIndex}
                                type="button"
                                onClick={() =>
                                  setSelectedImage({
                                    url: imageUrl,
                                    name: imageName,
                                  })
                                }
                                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-blue-100 bg-blue-50"
                              >
                                <img
                                  src={imageUrl}
                                  alt={imageName}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              </button>
                            );
                          })}
                        </div>
                      ) : null}


{/* 
                      {personnel.length > 0 ? (
                        <div className="mt-5 border-t border-slate-100 pt-5">
                          <h3 className="text-sm font-extrabold text-slate-700">
                            Görevli personeller
                          </h3>

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {personnel.map((person, personIndex) => {
                              const personnelId =
                                pickAny(
                                  person,
                                  "personelId",
                                  "PersonelId"
                                ) || personIndex;

                              const ad = pickAny(person, "ad", "Ad");
                              const soyad = pickAny(person, "soyad", "Soyad");

                              const roleName = pickAny(
                                person,
                                "rolAd",
                                "RolAd"
                              );

                              const personnelNote = pickAny(
                                person,
                                "personelNotu",
                                "PersonelNotu"
                              );

                              return (
                                <div
                                  key={personnelId}
                                  className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
                                      {getInitials(ad, soyad)}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-bold text-slate-700">
                                        {[ad, soyad]
                                          .filter(Boolean)
                                          .join(" ") || "Personel"}
                                      </div>

                                      {roleName ? (
                                        <div className="text-xs text-slate-500">
                                          {roleName}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>

                                  {personnelNote ? (
                                    <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
                                      {personnelNote}
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
 */}



                      {lastNote ? (
                        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700">
                              {getInitials(
                                pickAny(
                                  lastNote,
                                  "personelAd",
                                  "PersonelAd"
                                ),
                                pickAny(
                                  lastNote,
                                  "personelSoyad",
                                  "PersonelSoyad"
                                )
                              )}
                            </div>

                            <div>
                              <p className="text-sm font-bold text-indigo-800">
                                {[
                                  pickAny(
                                    lastNote,
                                    "personelAd",
                                    "PersonelAd"
                                  ),
                                  pickAny(
                                    lastNote,
                                    "personelSoyad",
                                    "PersonelSoyad"
                                  ),
                                ]
                                  .filter(Boolean)
                                  .join(" ") || "Personel"}
                              </p>

                              <p className="text-xs text-indigo-500">
                                {formatDate(
                                  pickAny(
                                    lastNote,
                                    "olusturmaTarihiUtc",
                                    "OlusturmaTarihiUtc"
                                  )
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-indigo-800">
                            {pickAny(lastNote, "metin", "Metin")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              hasPreviousPage={hasPreviousPage}
              hasNextPage={hasNextPage}
              loading={loading}
              onChange={handlePageChange}
            />
          ) : null}
        </main>
      </div>

      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-700 shadow-lg"
            aria-label="Görseli kapat"
          >
            ×
          </button>

          <img
            src={selectedImage.url}
            alt={selectedImage.name}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </div>
  );
}