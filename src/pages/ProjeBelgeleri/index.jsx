
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import ProjeDosyaUploadBlock from "@/components/ProjeDosyaUploadBlock";
import ProjeUploadedFilesSection from "@/components/ProjeUploadedFilesSection";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "ProjeYonetimDosyaEkle";
const PAGE_SIZE = 20;

function getSiteId(site) {
  return site?.SiteId ?? site?.siteId;
}

function getSiteName(site) {
  return (
    site?.SiteAdi ?? site?.siteAdi ?? site?.Ad ?? site?.ad ??
    site?.Site?.Ad ?? site?.Site?.ad ?? `Site #${getSiteId(site)}`
  );
}

export default function ProjeBelgeleriPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");
  const [siteId, setSiteId] = useState("");

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // =========================
  // PERSONELİN BAĞLI PROJELERİ
  // =========================
  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError("");
        setSites([]);
        setSiteId("");

        const personelCookie = getClientCookie("PersonelUserInfo");

        if (!personelCookie) {
          router.replace("/");
          return;
        }

        const personel = JSON.parse(personelCookie);

        const personelKodu =
          personel?.personelKodu ||
          personel?.PersonelKodu ||
          personel?.kodu ||
          personel?.Kodu;

        if (!personelKodu) {
          throw new Error("Personel kodu bulunamadı.");
        }

        const data = await getDataAsync(
          `ProjeYoneticileri/site/personel/${encodeURIComponent(personelKodu)}`
        );

        if (cancelled) return;

        const list = (Array.isArray(data) ? data : []).filter(
          (site) => getSiteId(site) != null
        );

        setSites(list);

        const directSiteId =
          personel?.siteId ||
          personel?.SiteId ||
          personel?.siteID ||
          personel?.SiteID;

        const preferredSite = list.find(
          (site) =>
            String(getSiteId(site)) === String(directSiteId)
        );

        const initialSite = preferredSite || list[0];

        setSiteId(
          initialSite ? String(getSiteId(initialSite)) : ""
        );
      } catch (err) {
        console.error("Bağlı projeler alınırken hata:", err);

        if (!cancelled) {
          setSites([]);
          setSiteId("");
          setSitesError(
            err?.message || "Bağlı projeler alınamadı."
          );
        }
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, [router.isReady]);

  const selectedSite = useMemo(
    () =>
      sites.find(
        (site) => String(getSiteId(site)) === String(siteId)
      ) || null,
    [sites, siteId]
  );

  // =========================
  // ARAMA GECİKMESİ
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(fileSearch.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [fileSearch]);

  // =========================
  // SAYFALI BELGE LİSTESİ
  // =========================
  useEffect(() => {
    let cancelled = false;

    if (!siteId || !selectedSite) {
      setFiles([]);
      setTotalCount(0);
      setTotalPages(0);
      setLoadingFiles(false);
      return;
    }

    const loadFiles = async () => {
      try {
        setLoadingFiles(true);
        setFilesError("");
        setFiles([]);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const data = await getDataAsync(
          `${SAVE_URL_BASE}/${siteId}?${params.toString()}`
        );

        if (cancelled) return;

        setFiles(
          Array.isArray(data?.items) ? data.items : []
        );

        setTotalCount(Number(data?.totalCount) || 0);
        setTotalPages(Number(data?.totalPages) || 0);

        if (
          Number(data?.page) > 0 &&
          Number(data.page) !== page
        ) {
          setPage(Number(data.page));
        }
      } catch (err) {
        console.error("Dosyalar alınırken hata:", err);

        if (!cancelled) {
          setFiles([]);
          setTotalCount(0);
          setTotalPages(0);
          setFilesError(
            err?.message ||
            "Dosyalar alınırken bir hata oluştu."
          );
        }
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    };

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, [siteId, selectedSite, page, debouncedSearch, refreshKey]);

  const handleSiteChange = (e) => {
    const nextId = e.target.value;

    if (
      !sites.some(
        (site) => String(getSiteId(site)) === nextId
      )
    ) {
      return;
    }

    setSiteId(nextId);
    setFileSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  // =========================
  // BELGE YÜKLE VE KAYDET
  // =========================
  const uploadAndAttach = async (file, meta) => {
    if (!file) return;

    if (!siteId || !selectedSite) {
      throw new Error(
        "Önce geçerli bir proje seçmelisiniz."
      );
    }

    const tur = (meta?.tur || "Genel").trim();
    const belgeBasligi = (meta?.belgeBasligi || "").trim();
    const belgeAciklamasi = (
      meta?.belgeAciklamasi || ""
    ).trim();

    if (!belgeBasligi) {
      throw new Error("Belge Başlığı zorunlu.");
    }

    if (!belgeAciklamasi) {
      throw new Error("Belge Açıklaması zorunlu.");
    }

    const currentSiteId = siteId;

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await postDataAsync(
      UPLOAD_URL,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const url = uploadRes?.Url || uploadRes?.url;

    if (!url) {
      throw new Error(
        "Upload cevabında Url alanı bulunamadı."
      );
    }

    await postDataAsync(
      `${SAVE_URL_BASE}/${currentSiteId}`,
      [
        {
          url,
          dosyaAdi: file.name,
          tur,
          belgeBasligi,
          belgeAciklamasi,
        },
      ],
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    setPage(1);
    setRefreshKey((prev) => prev + 1);

    return url;
  };

  // =========================
  // SAYFA
  // =========================
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">

      {/* ÜST BAŞLIK */}
      <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-3 py-2.5">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-emerald-600 sm:text-xl">
              Proje Belgeleri
            </h1>
            <p className="text-[11px] text-zinc-500">
              Belge yükleme ve proje belgelerini görüntüleme
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ← Geri
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-[1800px] space-y-3 px-3 py-3">

        {/* SEÇİLİ PROJE */}
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Seçili Proje
              </p>

              <h2 className="break-words text-xl font-extrabold text-emerald-900 dark:text-emerald-100 sm:text-2xl">
                {selectedSite
                  ? getSiteName(selectedSite)
                  : sitesLoading
                    ? "Projeler yükleniyor..."
                    : "Bağlı proje bulunamadı"}
              </h2>
            </div>

            {/* BİRDEN FAZLA PROJE VARSA SEÇİM */}
            {sites.length > 1 && (
              <select
                value={siteId}
                onChange={handleSiteChange}
                disabled={sitesLoading}
                aria-label="Proje değiştir"
                className="h-9 w-full rounded-lg border border-emerald-300 bg-white px-2 text-xs font-semibold text-zinc-800 outline-none sm:w-64 dark:border-emerald-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {sites.map((site) => (
                  <option
                    key={getSiteId(site)}
                    value={String(getSiteId(site))}
                  >
                    {getSiteName(site)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {sitesError && (
            <p className="mt-2 text-xs text-red-600">
              {sitesError}
            </p>
          )}
        </section>

        {/* BELGE İŞLEMLERİ */}
        {siteId && selectedSite ? (
          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">

            {/* SOL: YENİ BELGE YÜKLE */}
            <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-base font-bold">
                Yeni Belge Yükle
              </h2>

              <ProjeDosyaUploadBlock
                key={siteId}
                uploadAndAttach={uploadAndAttach}
              />
            </section>

            {/* SAĞ: YÜKLENEN BELGELER */}

{/* SAĞ: YÜKLENEN BELGELER */}
<section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

  {/* BAŞLIK VE ARAMA */}
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

    <div>
      <h2 className="text-base font-bold">
        Yüklenen Belgeler
      </h2>

      <p className="text-[11px] text-zinc-500">
        {loadingFiles
          ? "Yükleniyor..."
          : `Toplam ${totalCount} belge · Sayfa ${page}${totalPages ? ` / ${totalPages}` : ""}`}
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-1.5">

      {/* API ÜZERİNDEN BELGE ARAMA */}
      <input
        type="search"
        value={fileSearch}
        onChange={(e) => {
          setFileSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Belge adı, başlık, açıklama, tür..."
        className="h-9 w-48 max-w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 sm:w-60"
      />

      <button
        type="button"
        onClick={() =>
          setRefreshKey((prev) => prev + 1)
        }
        disabled={loadingFiles}
        className="h-9 rounded-lg border border-zinc-300 px-2.5 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Yenile
      </button>
    </div>
  </div>

  {/* ÜST SAYFALAMA */}
  {totalPages > 1 && (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-y border-zinc-200 py-2 dark:border-zinc-800">

      <span className="text-[11px] text-zinc-500">
        {totalCount
          ? (page - 1) * PAGE_SIZE + 1
          : 0}
        {" – "}
        {Math.min(page * PAGE_SIZE, totalCount)}
        {" / "}
        {totalCount}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loadingFiles || page <= 1}
          onClick={() =>
            setPage((prev) => Math.max(1, prev - 1))
          }
          className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← Önceki
        </button>

        <span className="text-xs font-semibold">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={loadingFiles || page >= totalPages}
          onClick={() =>
            setPage((prev) =>
              Math.min(totalPages, prev + 1)
            )
          }
          className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Sonraki →
        </button>
      </div>
    </div>
  )}

  {/* YÜKLENEN BELGE LİSTESİ */}
  <ProjeUploadedFilesSection
    files={files}
    loadingFiles={loadingFiles}
    filesError={filesError}
  />

  {/* ALT SAYFALAMA */}
  {totalPages > 1 && (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">

      <span className="text-[11px] text-zinc-500">
        {totalCount
          ? (page - 1) * PAGE_SIZE + 1
          : 0}
        {" – "}
        {Math.min(page * PAGE_SIZE, totalCount)}
        {" / "}
        {totalCount}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loadingFiles || page <= 1}
          onClick={() =>
            setPage((prev) => Math.max(1, prev - 1))
          }
          className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← Önceki
        </button>

        <span className="text-xs font-semibold">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={loadingFiles || page >= totalPages}
          onClick={() =>
            setPage((prev) =>
              Math.min(totalPages, prev + 1)
            )
          }
          className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Sonraki →
        </button>
      </div>
    </div>
  )}

</section>


          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            {sitesLoading
              ? "Bağlı projeler yükleniyor..."
              : "Personelinize bağlı proje bulunamadı."}
          </div>
        )}
      </main>
    </div>
  );
}
