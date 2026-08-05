// src/pages/YonetimKurulu/belgeler/index.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const toArraySafe = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [data];
};

const getFileExtension = (item) => {
  const value = `${item?.dosyaAdi ?? ""} ${item?.url ?? ""}`
    .split("?")[0]
    .toLowerCase();

  const match = value.match(/\.([a-z0-9]+)(?:\s|$)/);
  return match?.[1] ?? "";
};

const isImageFile = (item) =>
  ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(
    getFileExtension(item)
  );

const isPdfFile = (item) => getFileExtension(item) === "pdf";

const formatTR = (iso) => {
  if (!iso) return "-";

  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const openFile = (url) => {
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
};

export default function ProjeBelgeleriPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [belgeler, setBelgeler] = useState([]);

  const [siteLoading, setSiteLoading] = useState(true);
  const [belgeLoading, setBelgeLoading] = useState(false);
  const [error, setError] = useState("");
  const [acikAciklamalar, setAcikAciklamalar] = useState({});

  useEffect(() => {
    if (!router.isReady) return;

    const querySiteId = Array.isArray(router.query.siteId)
      ? router.query.siteId[0]
      : router.query.siteId;

    if (querySiteId) {
      setSiteId(String(querySiteId));
    }
  }, [router.isReady, router.query.siteId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cookie = getClientCookie("PersonelUserInfo");

      if (!cookie) {
        setSiteLoading(false);
        return;
      }

      const parsed = JSON.parse(cookie);
      setPersonel(parsed?.personel ?? parsed ?? null);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      setPersonel(null);
      setSiteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!personel?.personelKodu) {
      if (personel !== null) setSiteLoading(false);
      return;
    }

    let cancelled = false;

    const loadSites = async () => {
      try {
        setSiteLoading(true);

        const response = await getDataAsync(
          `ProjeYonetimKurulu/site/personel/${encodeURIComponent(
            personel.personelKodu
          )}`
        );

        if (cancelled) return;

        const normalized = toArraySafe(response).filter(Boolean);
        setSites(normalized);

        if (!siteId) {
          const firstId = normalized?.[0]?.siteId ?? normalized?.[0]?.id;
          if (firstId) setSiteId(String(firstId));
        }
      } catch (err) {
        console.error("SITE LIST ERROR:", err);
        if (!cancelled) {
          setSites([]);
          setError("Kullanıcıya bağlı proje bilgileri alınamadı.");
        }
      } finally {
        if (!cancelled) setSiteLoading(false);
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, [personel?.personelKodu]);

  useEffect(() => {
    if (!siteId) {
      setBelgeler([]);
      return;
    }

    let cancelled = false;

    const loadBelgeler = async () => {
      try {
        setBelgeLoading(true);
        setError("");

        const response = await getDataAsync(
          `ProjeYonetimKurulu/site/${encodeURIComponent(siteId)}/dosyalar`
        );

        if (cancelled) return;

        setBelgeler(
          toArraySafe(response)
            .filter(Boolean)
            .sort((a, b) => {
              const aTime = new Date(a?.yuklemeTarihiUtc ?? 0).getTime();
              const bTime = new Date(b?.yuklemeTarihiUtc ?? 0).getTime();

              if (bTime !== aTime) return bTime - aTime;
              return Number(b?.id ?? 0) - Number(a?.id ?? 0);
            })
        );
      } catch (err) {
        console.error("BELGE LIST ERROR:", err);

        if (!cancelled) {
          setBelgeler([]);
          setError("Proje belgeleri alınamadı. Lütfen tekrar deneyin.");
        }
      } finally {
        if (!cancelled) setBelgeLoading(false);
      }
    };

    loadBelgeler();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const selectedSiteName = useMemo(() => {
    const selected = sites.find(
      (item) => String(item?.siteId ?? item?.id) === String(siteId)
    );

    return (
      selected?.site?.ad ??
      selected?.ad ??
      (siteId ? `Site #${siteId}` : "Proje seçilmedi")
    );
  }, [sites, siteId]);

  const groupedBelgeler = useMemo(() => {
    return belgeler.reduce((acc, belge) => {
      const tur = String(belge?.tur ?? "").trim() || "Genel";

      if (!acc[tur]) acc[tur] = [];
      acc[tur].push(belge);

      return acc;
    }, {});
  }, [belgeler]);

  const toggleAciklama = (belgeId) => {
    setAcikAciklamalar((prev) => ({
      ...prev,
      [belgeId]: !prev[belgeId],
    }));
  };

  const handleSiteChange = (value) => {
    setSiteId(value);
    setAcikAciklamalar({});

    router.replace(
      {
        pathname: "/YonetimKurulu/belgeler",
        query: value ? { siteId: value } : {},
      },
      undefined,
      { shallow: true }
    );
  };

  const pageLoading = siteLoading || belgeLoading;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/YonetimKurulu")}
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Yönetim Kuruluna Dön
            </button>

            <h1 className="text-2xl font-bold tracking-tight">
              Proje Belgeleri
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Projeye ait resmi belgeleri, açıklamalarını ve dosya bilgilerini
              bu sayfadan görüntüleyebilirsiniz.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Seçili Proje
            </span>

            {sites.length > 1 ? (
              <select
                value={siteId}
                onChange={(event) => handleSiteChange(event.target.value)}
                className="h-10 min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
              >
                {sites.map((site) => {
                  const value = String(site?.siteId ?? site?.id ?? "");

                  return (
                    <option key={value} value={value}>
                      {site?.site?.ad ?? site?.ad ?? `Site #${value}`}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="flex h-10 min-w-[220px] items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {selectedSiteName}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm dark:border-blue-900/50 dark:from-blue-950/30 dark:via-zinc-900 dark:to-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                Belge Arşivi
              </div>

              <h2 className="mt-1 text-xl font-bold">{selectedSiteName}</h2>

              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Toplam {belgeler.length} belge kayıtlıdır.
              </p>
            </div>

            <button
              type="button"
              onClick={() => siteId && handleSiteChange(siteId)}
              disabled={!siteId || pageLoading}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Yenile
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {pageLoading && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Belgeler yükleniyor...
          </div>
        )}

        {!pageLoading && siteId && belgeler.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="text-lg font-bold">Henüz belge bulunmuyor</div>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Bu proje için yüklenmiş bir belge kaydı bulunamadı.
            </p>
          </div>
        )}

        {!pageLoading &&
          Object.entries(groupedBelgeler).map(([tur, items]) => (
            <section key={tur} className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-lg font-bold">{tur}</h2>
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {items.length}
                </span>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {items.map((belge) => {
                  const image = isImageFile(belge);
                  const pdf = isPdfFile(belge);

                  return (
                    <article
                      key={belge.id}
                      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      {image ? (
                        <button
                          type="button"
                          onClick={() => openFile(belge.url)}
                          className="block h-56 w-full overflow-hidden bg-zinc-100 text-left dark:bg-zinc-950"
                          title="Görseli yeni sekmede aç"
                        >
                          <img
                            src={belge.url}
                            alt={belge.belgeBasligi || belge.dosyaAdi || "Belge"}
                            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        </button>
                      ) : (
                        <div className="flex h-36 items-center justify-center border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                          <div className="text-center">
                            <div className="text-4xl" aria-hidden="true">
                              {pdf ? "📄" : "📎"}
                            </div>
                            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                              {pdf
                                ? "PDF Belgesi"
                                : getFileExtension(belge)?.toUpperCase() ||
                                  "Dosya"}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                            {belge.tur || "Genel"}
                          </span>

                          {belge.sira != null && (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              Sıra: {belge.sira}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold leading-snug">
                          {belge.belgeBasligi || "Başlıksız Belge"}
                        </h3>

                        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
                          <button
                            type="button"
                            onClick={() => toggleAciklama(belge.id)}
                            aria-expanded={Boolean(acikAciklamalar[belge.id])}
                            aria-controls={`belge-aciklama-${belge.id}`}
                            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                          >
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                              Belge Açıklaması
                            </span>

                            <span
                              aria-hidden="true"
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-base font-bold text-zinc-700 transition-transform duration-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${
                                acikAciklamalar[belge.id] ? "rotate-180" : ""
                              }`}
                            >
                              ⌄
                            </span>
                          </button>

                          <div
                            id={`belge-aciklama-${belge.id}`}
                            className={`grid transition-all duration-300 ease-in-out ${
                              acikAciklamalar[belge.id]
                                ? "grid-rows-[1fr] border-t border-zinc-200 opacity-100 dark:border-zinc-800"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <p className="whitespace-pre-wrap break-words px-4 py-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                                {belge.belgeAciklamasi ||
                                  "Belge açıklaması bulunmuyor."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                          <div className="grid gap-2">
                            <div>
                              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                                Dosya:
                              </span>{" "}
                              <span className="break-all text-zinc-500 dark:text-zinc-400">
                                {belge.dosyaAdi || "-"}
                              </span>
                            </div>

                            <div>
                              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                                Yüklenme:
                              </span>{" "}
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {formatTR(belge.yuklemeTarihiUtc)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openFile(belge.url)}
                          disabled={!belge.url}
                          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        >
                          {image
                            ? "Görseli Yeni Sekmede Aç"
                            : pdf
                            ? "PDF Belgesini Aç"
                            : "Dosyayı Yeni Sekmede Aç"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
      </main>
    </div>
  );
}