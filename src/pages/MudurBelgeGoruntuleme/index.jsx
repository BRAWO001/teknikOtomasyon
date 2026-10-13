
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { roleGuard } from "@/utils/roleGuard";
import ProjeDosyaUploadBlock from "@/components/ProjeDosyaUploadBlock";

export const getServerSideProps = (ctx) =>
  roleGuard(ctx, { allow: [90], redirectTo: "/" });

const PAGE_SIZE = 20;
const LIST_URL = "ProjeYonetimDosyaEkle/mudur-belgeler";
const TYPES_URL = "ProjeYonetimDosyaEkle/mudur-belge-turleri";
const SAVE_URL = "ProjeYonetimDosyaEkle";
const UPLOAD_URL = "HttpUpload/upload-ftp";
const SITES_URL = "SiteAptEvControllerSet/sites";

const getSiteId = (site) =>
  site?.id ?? site?.Id ?? site?.siteId ?? site?.SiteId;

const getSiteName = (site) =>
  site?.ad ??
  site?.Ad ??
  site?.siteAdi ??
  site?.SiteAdi ??
  `Site #${getSiteId(site)}`;

const getValue = (obj, camel, pascal) =>
  obj?.[camel] ?? obj?.[pascal];

function getFileKind(url, fileName) {
  const value = String(fileName || url || "")
    .split("?")[0]
    .toLowerCase();

  if (/\.(jpg|jpeg|png|webp|gif|bmp|avif)$/.test(value))
    return "image";

  if (/\.pdf$/.test(value)) return "pdf";

  return "file";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("tr-TR");
}

function FileThumbnail({ url, fileName, title }) {
  const kind = getFileKind(url, fileName);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [url]);

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {kind === "image" && url && !imageError ? (
        <img
          src={url}
          alt={title || "Belge"}
          loading="lazy"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`flex flex-col items-center gap-1 ${
            kind === "pdf"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-500"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-8 w-8"
          >
            <path d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
            <path d="M14 2v6h5M9 13h6M9 17h6" />
          </svg>
          <span className="text-[10px] font-bold">
            {kind === "pdf" ? "PDF" : "DOSYA"}
          </span>
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalCount,
  loading,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-y border-zinc-200 py-2 dark:border-zinc-800">
      <span className="text-[11px] text-zinc-500">
        {(page - 1) * PAGE_SIZE + 1} –{" "}
        {Math.min(page * PAGE_SIZE, totalCount)} / {totalCount}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← Önceki
        </button>

        <span className="text-xs font-semibold">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Sonraki →
        </button>
      </div>
    </div>
  );
}

function DocumentCard({ file, onOpen }) {
  const title =
    getValue(file, "belgeBasligi", "BelgeBasligi") ||
    getValue(file, "dosyaAdi", "DosyaAdi") ||
    "Belge";

  const description = getValue(
    file,
    "belgeAciklamasi",
    "BelgeAciklamasi"
  );

  const fileName = getValue(file, "dosyaAdi", "DosyaAdi");
  const type = getValue(file, "tur", "Tur");
  const url = getValue(file, "url", "Url");
  const uploadDate = getValue(
    file,
    "yuklemeTarihiUtc",
    "YuklemeTarihiUtc"
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      className="group flex w-full min-w-0 gap-2 rounded-lg border border-zinc-200 bg-zinc-50/70 p-2 text-left transition hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-emerald-950/20"
    >
      <FileThumbnail url={url} fileName={fileName} title={title} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="max-w-full break-words rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {file.projeAdi}
          </span>

          <span className="text-[10px] text-zinc-500">
            {formatDate(uploadDate)}
          </span>
        </div>

        <h3 className="line-clamp-2 break-words text-xs font-bold leading-4">
          {title}
        </h3>

        {description && (
          <p className="line-clamp-2 whitespace-pre-wrap break-words text-[11px] leading-4 text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}

        <div className="mt-auto flex min-w-0 flex-wrap items-end justify-between gap-1 pt-1">
          <span className="min-w-0 max-w-full truncate text-[10px] text-zinc-500">
            {type ? `${type} · ` : ""}
            {fileName || "Dosya"}
          </span>

          <span className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white group-hover:bg-emerald-700">
            Görüntüle →
          </span>
        </div>
      </div>
    </button>
  );
}

function DocumentDrawer({ file, onClose }) {
  useEffect(() => {
    if (!file) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [file, onClose]);

  if (!file) return null;

  const title =
    getValue(file, "belgeBasligi", "BelgeBasligi") ||
    getValue(file, "dosyaAdi", "DosyaAdi") ||
    "Belge";

  const description = getValue(
    file,
    "belgeAciklamasi",
    "BelgeAciklamasi"
  );

  const fileName = getValue(file, "dosyaAdi", "DosyaAdi");
  const type = getValue(file, "tur", "Tur");
  const url = getValue(file, "url", "Url");
  const uploadDate = getValue(
    file,
    "yuklemeTarihiUtc",
    "YuklemeTarihiUtc"
  );
  const kind = getFileKind(url, fileName);

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-[850px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
              Belge Görüntüleme
            </p>

            <h2 className="break-words text-base font-extrabold sm:text-lg">
              {title}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {file.projeAdi}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Paneli kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-xl hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mb-3 grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
            <div>
              <span className="text-zinc-500">Proje</span>
              <p className="mt-0.5 font-bold text-emerald-700 dark:text-emerald-300">
                {file.projeAdi}
              </p>
            </div>

            <div>
              <span className="text-zinc-500">Yükleme Tarihi</span>
              <p className="mt-0.5 font-semibold">
                {formatDate(uploadDate)}
              </p>
            </div>

            <div>
              <span className="text-zinc-500">Belge Türü</span>
              <p className="mt-0.5 font-semibold">{type || "-"}</p>
            </div>

            <div className="min-w-0">
              <span className="text-zinc-500">Dosya Adı</span>
              <p className="mt-0.5 break-all font-semibold">
                {fileName || "-"}
              </p>
            </div>

            {description && (
              <div className="sm:col-span-2">
                <span className="text-zinc-500">Belge Açıklaması</span>
                <p className="mt-1 whitespace-pre-wrap break-words leading-5">
                  {description}
                </p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
            {!url ? (
              <div className="flex min-h-[300px] items-center justify-center p-4 text-sm text-zinc-500">
                Dosya bağlantısı bulunamadı.
              </div>
            ) : kind === "image" ? (
              <div className="flex min-h-[300px] items-center justify-center p-2">
                <img
                  src={url}
                  alt={title}
                  className="max-h-[75vh] max-w-full object-contain"
                />
              </div>
            ) : kind === "pdf" ? (
              <iframe
                src={url}
                title={title}
                className="h-[70vh] min-h-[400px] w-full border-0"
              />
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-5 text-center">
                <FileThumbnail
                  url={url}
                  fileName={fileName}
                  title={title}
                />
                <p className="text-sm font-semibold">
                  Bu dosya türü doğrudan önizlenemiyor.
                </p>
                <p className="text-xs text-zinc-500">
                  Dosyayı açmak için aşağıdaki bağlantıyı kullanın.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Dosyayı Aç ↗
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function MudurBelgeGoruntulemePage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");

  const [filterSiteId, setFilterSiteId] = useState("");
  const [uploadSiteId, setUploadSiteId] = useState("");
  const [filterType, setFilterType] = useState("");

  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState("");

  const [fileSearch, setFileSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [uploadSuccess, setUploadSuccess] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  const closeDrawer = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  // =========================
  // OTURUM KONTROLÜ
  // =========================
  useEffect(() => {
    if (!router.isReady) return;

    try {
      const cookie = getClientCookie("PersonelUserInfo");

      if (!cookie) {
        router.replace("/");
        return;
      }

      JSON.parse(cookie);
      setAuthorized(true);
    } catch (err) {
      console.error("PersonelUserInfo okunamadı:", err);
      router.replace("/");
    }
  }, [router.isReady, router]);

  // =========================
  // PROJELER
  // =========================
  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError("");

        const data = await getDataAsync(SITES_URL);

        if (cancelled) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        setSites(
          list.filter((site) => getSiteId(site) != null)
        );
      } catch (err) {
        if (!cancelled) {
          setSites([]);
          setSitesError(
            err?.message || "Projeler alınamadı."
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
  }, [authorized]);

  // =========================
  // TÜR LİSTESİ
  // =========================
  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    const loadTypes = async () => {
      try {
        setTypesLoading(true);
        setTypesError("");

        const data = await getDataAsync(TYPES_URL);

        if (cancelled) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.turler)
              ? data.turler
              : [];

        const normalized = list
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.tur ?? item?.Tur ?? ""
          )
          .map((item) => String(item).trim())
          .filter(Boolean);

        setTypes(
          [...new Set(normalized)].sort((a, b) =>
            a.localeCompare(b, "tr", {
              sensitivity: "base",
            })
          )
        );
      } catch (err) {
        if (!cancelled) {
          setTypes([]);
          setTypesError(
            "Belge türleri alınamadı. Tür filtresi için API endpoint'ini kontrol edin."
          );
        }
      } finally {
        if (!cancelled) setTypesLoading(false);
      }
    };

    loadTypes();

    return () => {
      cancelled = true;
    };
  }, [authorized, refreshKey]);

  const sortedSites = useMemo(
    () =>
      [...sites].sort((a, b) =>
        String(getSiteName(a)).localeCompare(
          String(getSiteName(b)),
          "tr",
          { sensitivity: "base" }
        )
      ),
    [sites]
  );

  const siteNameMap = useMemo(
    () =>
      new Map(
        sites.map((site) => [
          String(getSiteId(site)),
          getSiteName(site),
        ])
      ),
    [sites]
  );

  const selectedFilterSite = useMemo(
    () =>
      sites.find(
        (site) =>
          String(getSiteId(site)) === filterSiteId
      ) || null,
    [sites, filterSiteId]
  );

  const selectedUploadSite = useMemo(
    () =>
      sites.find(
        (site) =>
          String(getSiteId(site)) === uploadSiteId
      ) || null,
    [sites, uploadSiteId]
  );

  // =========================
  // ARAMA
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(fileSearch.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [fileSearch]);

  // =========================
  // BELGE LİSTESİ
  // =========================
  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    const loadFiles = async () => {
      try {
        setLoadingFiles(true);
        setFilesError("");

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (filterSiteId) {
          params.set("siteId", filterSiteId);
        }

        if (filterType) {
          params.set("tur", filterType);
        }

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const data = await getDataAsync(
          `${LIST_URL}?${params.toString()}`
        );

        if (cancelled) return;

        setFiles(
          Array.isArray(data?.items) ? data.items : []
        );

        setTotalCount(Number(data?.totalCount) || 0);
        setTotalPages(Number(data?.totalPages) || 0);

        const responsePage = Number(data?.page);

        if (responsePage > 0 && responsePage !== page) {
          setPage(responsePage);
        }
      } catch (err) {
        if (!cancelled) {
          setFiles([]);
          setTotalCount(0);
          setTotalPages(0);
          setFilesError(
            err?.message || "Belgeler alınamadı."
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
  }, [
    authorized,
    filterSiteId,
    filterType,
    debouncedSearch,
    page,
    refreshKey,
  ]);

  const filesWithSite = useMemo(
    () =>
      files.map((file) => {
        const fileSiteId = getValue(
          file,
          "siteId",
          "SiteId"
        );

        return {
          ...file,
          projeAdi:
            siteNameMap.get(String(fileSiteId)) ||
            (fileSiteId != null
              ? `Site #${fileSiteId}`
              : "Proje belirtilmemiş"),
        };
      }),
    [files, siteNameMap]
  );

  // =========================
  // BELGE YÜKLEME
  // =========================
  const uploadAndAttach = async (file, meta) => {
    if (!file) {
      throw new Error("Yüklenecek dosya seçilmedi.");
    }

    if (!uploadSiteId || !selectedUploadSite) {
      throw new Error(
        "Belge yüklemek için önce bir proje seçmelisiniz."
      );
    }

    const currentSiteId = uploadSiteId;
    const tur = String(meta?.tur || "Genel").trim();
    const belgeBasligi = String(
      meta?.belgeBasligi || ""
    ).trim();
    const belgeAciklamasi = String(
      meta?.belgeAciklamasi || ""
    ).trim();

    if (!belgeBasligi) {
      throw new Error("Belge Başlığı zorunludur.");
    }

    if (!belgeAciklamasi) {
      throw new Error("Belge Açıklaması zorunludur.");
    }

    setUploadSuccess("");

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
        "Dosya yüklendi ancak sunucudan URL alınamadı."
      );
    }

    await postDataAsync(
      `${SAVE_URL}/${currentSiteId}`,
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

    setUploadSuccess(
      `"${file.name}" belgesi ${getSiteName(
        selectedUploadSite
      )} projesine kaydedildi.`
    );

    setFilterSiteId(currentSiteId);
    setFilterType("");
    setFileSearch("");
    setDebouncedSearch("");
    setPage(1);
    setRefreshKey((prev) => prev + 1);

    return url;
  };

  const resetFilters = () => {
    setFilterSiteId("");
    setFilterType("");
    setFileSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-950">
        Yetki ve oturum kontrol ediliyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* ÜST BAŞLIK */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-2 px-3 py-2">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-emerald-600">
              Proje Belge Yönetimi
            </h1>
            <p className="text-[11px] text-zinc-500">
              Tüm projelerin belgeleri ve yeni belge yükleme
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
      </header>

      <main className="mx-auto max-w-[1800px] space-y-2 px-2 py-2 sm:px-3">
        {/* ÖZET */}
        <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Belge Arşivi
            </p>
            <h2 className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">
              {selectedFilterSite
                ? getSiteName(selectedFilterSite)
                : "Tüm Projeler"}
            </h2>
          </div>

          <div className="flex gap-2">
            <div className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-center dark:border-emerald-900 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-500">
                Projeler
              </p>
              <p className="text-base font-extrabold">
                {sites.length}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-center dark:border-emerald-900 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-500">
                Belgeler
              </p>
              <p className="text-base font-extrabold">
                {totalCount}
              </p>
            </div>
          </div>
        </section>

        {sitesError && (
          <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30">
            {sitesError}
          </p>
        )}

        <div className="grid items-start gap-2 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          {/* BELGE YÜKLEME */}
          <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M12 16V3m0 0L7 8m5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold">
                  Yeni Belge Yükle
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Proje seçin ve belgenizi kaydedin
                </p>
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold">
                Belgenin Yükleneceği Proje
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                value={uploadSiteId}
                onChange={(e) => {
                  setUploadSiteId(e.target.value);
                  setUploadSuccess("");
                }}
                disabled={sitesLoading}
                className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-2.5 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-emerald-800 dark:bg-zinc-950"
              >
                <option value="">
                  {sitesLoading
                    ? "Projeler yükleniyor..."
                    : "Belge yüklenecek projeyi seçin"}
                </option>
                {sortedSites.map((site) => (
                  <option
                    key={getSiteId(site)}
                    value={String(getSiteId(site))}
                  >
                    {getSiteName(site)}
                  </option>
                ))}
              </select>
            </div>

            {selectedUploadSite ? (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                  Belge Kaydedilecek Proje
                </p>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                  {getSiteName(selectedUploadSite)}
                </p>
              </div>
            ) : (
              <div className="mb-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                Yükleme formunu açmak için proje seçin.
              </div>
            )}

            {uploadSuccess && (
              <div
                role="status"
                className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                ✓ {uploadSuccess}
              </div>
            )}

            {selectedUploadSite && (
              <ProjeDosyaUploadBlock
                key={uploadSiteId}
                uploadAndAttach={uploadAndAttach}
              />
            )}
          </section>

          {/* BELGE LİSTESİ */}
          <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">
                  Yüklenen Belgeler
                </h2>
                <p className="text-[11px] text-zinc-500">
                  {loadingFiles
                    ? "Belgeler yükleniyor..."
                    : `${totalCount} belge · En son yüklenenler`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRefreshKey((prev) => prev + 1)
                }
                disabled={loadingFiles}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                ↻ Yenile
              </button>
            </div>

            {/* PROJE + TÜR + ARAMA FİLTRELERİ */}
            <div className="mb-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
              <select
                value={filterSiteId}
                onChange={(e) => {
                  setFilterSiteId(e.target.value);
                  setPage(1);
                }}
                disabled={sitesLoading}
                aria-label="Belgeleri projeye göre filtrele"
                className="h-9 min-w-0 rounded-lg border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Tüm Projeler</option>
                {sortedSites.map((site) => (
                  <option
                    key={getSiteId(site)}
                    value={String(getSiteId(site))}
                  >
                    {getSiteName(site)}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                disabled={typesLoading || Boolean(typesError)}
                aria-label="Belgeleri türe göre filtrele"
                className="h-9 min-w-0 rounded-lg border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">
                  {typesLoading
                    ? "Türler yükleniyor..."
                    : "Tüm Türler"}
                </option>

                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                type="search"
                value={fileSearch}
                onChange={(e) => {
                  setFileSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Belge ara..."
                aria-label="Belge ara"
                className="h-9 min-w-0 rounded-lg border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
              />

              <button
                type="button"
                onClick={resetFilters}
                className="h-9 rounded-lg border border-zinc-300 px-2.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Temizle
              </button>
            </div>

            {typesError && (
              <p className="mb-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                {typesError}
              </p>
            )}

            <div className="mb-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                loading={loadingFiles}
                onPageChange={setPage}
              />
            </div>

            {loadingFiles && (
              <div className="grid gap-2 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            )}

            {!loadingFiles && filesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {filesError}
              </div>
            )}

            {!loadingFiles &&
              !filesError &&
              filesWithSite.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-8 text-center text-xs text-zinc-500 dark:border-zinc-700">
                  Seçilen filtrelere uygun belge bulunamadı.
                </div>
              )}

            {!loadingFiles &&
              !filesError &&
              filesWithSite.length > 0 && (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {filesWithSite.map((file, index) => (
                    <DocumentCard
                      key={
                        getValue(file, "id", "Id") ??
                        `${page}-${index}`
                      }
                      file={file}
                      onOpen={setSelectedDocument}
                    />
                  ))}
                </div>
              )}

            <div className="mt-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                loading={loadingFiles}
                onPageChange={setPage}
              />
            </div>
          </section>
        </div>
      </main>

      {selectedDocument && (
        <DocumentDrawer
          file={selectedDocument}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
