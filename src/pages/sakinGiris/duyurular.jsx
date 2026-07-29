// src/pages/sakinGiris/duyurular.jsx

import axios from "axios";
import https from "https";
import { useRouter } from "next/router";
import { roleGuard } from "@/utils/roleGuard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pilotapisrc.com/api";

const PUBLIC_DUYURU_BASE_URL =
  process.env.NEXT_PUBLIC_DUYURU_BASE_URL ||
  "https://eosyonetim.tr";

/*
 * Localhost geliştirme ortamında self-signed SSL
 * sertifikası kullanılıyorsa bağlantıya izin verir.
 */
const httpsAgent = API_BASE_URL.includes("localhost")
  ? new https.Agent({
      rejectUnauthorized: false,
    })
  : undefined;

function safeParseCookie(value) {
  if (!value) return null;

  const candidates = [value];

  try {
    candidates.push(decodeURIComponent(value));
  } catch {
    // Cookie zaten decode edilmiş olabilir.
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Sonraki değer denenir.
    }
  }

  return null;
}

function formatDateTR(dateValue) {
  if (!dateValue) {
    return {
      day: "--",
      month: "---",
      year: "",
      full: "Tarih belirtilmemiş",
    };
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "---",
      year: "",
      full: "Geçersiz tarih",
    };
  }

  return {
    day: new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(date),

    month: new Intl.DateTimeFormat("tr-TR", {
      month: "short",
      timeZone: "Europe/Istanbul",
    })
      .format(date)
      .replace(".", "")
      .toLocaleUpperCase("tr-TR"),

    year: new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      timeZone: "Europe/Istanbul",
    }).format(date),

    full: new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(date),
  };
}

function getSiteName(userInfo) {
  const aktifDaire = userInfo?.aktifDaire || {};

  return (
    aktifDaire.siteAdi ||
    aktifDaire.siteAd ||
    aktifDaire.siteName ||
    userInfo?.aktifSiteAdi ||
    userInfo?.siteAdi ||
    userInfo?.siteAd ||
    null
  );
}

export async function getServerSideProps(ctx) {
  /*
   * Önce kullanıcının sakin rolüne sahip olup olmadığını
   * kontrol ediyoruz.
   */
  const guardResult = await roleGuard(ctx, {
    allow: [77],
    redirectTo: "/sakinGiris",
  });

  if (guardResult?.redirect || guardResult?.notFound) {
    return guardResult;
  }

  const sakinCookie =
    ctx.req.cookies?.SakinUserInfo ||
    ctx.req.cookies?.PersonelUserInfo ||
    null;

  const token = ctx.req.cookies?.AuthToken_01 || null;
  const userInfo = safeParseCookie(sakinCookie);

  if (!userInfo || !token) {
    return {
      redirect: {
        destination: "/sakinGiris",
        permanent: false,
      },
    };
  }

  const siteId = Number(
    userInfo.aktifSiteId ||
      userInfo.aktifDaire?.siteId ||
      userInfo.aktifDaire?.SiteId ||
      0
  );

  /*
   * Kullanıcıya bağlı aktif bir site bulunmuyorsa sayfayı
   * yine açıyoruz ancak boş durum mesajı gösteriyoruz.
   */
  if (!siteId || siteId <= 0) {
    return {
      props: {
        initialDuyurular: [],
        siteId: null,
        siteName: getSiteName(userInfo),
        initialError:
          "Duyuruların görüntülenebilmesi için aktif bir site kaydı bulunmalıdır.",
        ...(guardResult?.props || {}),
      },
    };
  }

  try {
    const apiResponse = await axios.get(
      `${API_BASE_URL}/AppProjeDuyurular/site/${siteId}`,
      {
        httpsAgent,
        timeout: 15000,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    /*
     * Controller cevabı:
     *
     * {
     *   success: true,
     *   siteId: 44,
     *   totalCount: 2,
     *   items: [...]
     * }
     */
    const responseData = apiResponse.data || {};

    const items = Array.isArray(responseData.items)
      ? responseData.items
      : Array.isArray(responseData.Items)
        ? responseData.Items
        : Array.isArray(responseData)
          ? responseData
          : [];

    return {
      props: {
        initialDuyurular: items,
        siteId,
        siteName: getSiteName(userInfo),
        initialError: null,
        ...(guardResult?.props || {}),
      },
    };
  } catch (error) {
    const status = error?.response?.status;
    const apiData = error?.response?.data;

    console.error(
      "Proje duyuruları alınamadı:",
      apiData || error.message
    );

    let errorMessage =
      "Duyurular alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.";

    if (status === 401) {
      errorMessage =
        "Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapınız.";
    } else if (status === 403) {
      errorMessage =
        "Bu duyuruları görüntüleme yetkiniz bulunmuyor.";
    } else if (status === 404) {
      errorMessage =
        "Duyuru servisine ulaşılamadı.";
    } else if (error.code === "ECONNABORTED") {
      errorMessage =
        "Sunucu zamanında yanıt vermedi. Lütfen tekrar deneyiniz.";
    } else if (apiData?.message) {
      errorMessage = apiData.message;
    }

    return {
      props: {
        initialDuyurular: [],
        siteId,
        siteName: getSiteName(userInfo),
        initialError: errorMessage,
        ...(guardResult?.props || {}),
      },
    };
  }
}

function Icon({ name, className = "h-6 w-6" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "arrow-left") {
    return (
      <svg {...commonProps}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    );
  }

  if (name === "announcement") {
    return (
      <svg {...commonProps}>
        <path d="M3 11v2" />
        <path d="M6 9v6" />
        <path d="m6 9 13-4v14L6 15" />
        <path d="m9 15 1.5 5h3L12 14" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...commonProps}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  if (name === "building") {
    return (
      <svg {...commonProps}>
        <path d="M4 21V4h11v17" />
        <path d="M15 9h5v12" />
        <path d="M8 8h3" />
        <path d="M8 12h3" />
        <path d="M8 16h3" />
        <path d="M7 21h5" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...commonProps}>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
      </svg>
    );
  }

  if (name === "empty") {
    return (
      <svg {...commonProps}>
        <path d="M6 2h9l4 4v16H6z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    );
  }

  if (name === "warning") {
    return (
      <svg {...commonProps}>
        <path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  return null;
}

function DuyuruCard({ duyuru, onClick }) {
  const tarih = formatDateTR(
    duyuru.tarihUtc || duyuru.TarihUtc
  );

  const id = duyuru.id || duyuru.Id;

  const baslik =
    duyuru.duyuruBaslik ||
    duyuru.DuyuruBaslik ||
    "Başlıksız duyuru";

  const publicToken =
    duyuru.publicToken ||
    duyuru.PublicToken ||
    null;

  const sistemLink =
    duyuru.detayLink ||
    duyuru.DetayLink ||
    duyuru.sistemUretilmisLink ||
    duyuru.SistemUretilmisLink ||
    null;

  const canOpen = Boolean(publicToken || sistemLink);

  return (
    <button
      type="button"
      onClick={() =>
        onClick({
          id,
          publicToken,
          sistemLink,
        })
      }
      disabled={!canOpen}
      className="group flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 active:scale-[0.99] disabled:cursor-default disabled:hover:translate-y-0"
    >
      {/* Tarih kutusu */}
      <div className="flex h-[72px] w-[64px] flex-none flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-100">
        <span className="text-xl font-black leading-none">
          {tarih.day}
        </span>

        <span className="mt-1 text-[10px] font-bold tracking-wide">
          {tarih.month}
        </span>

        <span className="mt-0.5 text-[9px] font-medium text-blue-100">
          {tarih.year}
        </span>
      </div>

      {/* Duyuru bilgisi */}
      <div className="min-w-0 flex-1">
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
          Proje duyurusu
        </span>

        <h2 className="mt-2 line-clamp-2 text-[15px] font-bold leading-5 text-slate-900">
          {baslik}
        </h2>

        <p className="mt-1 truncate text-xs text-slate-400">
          {tarih.full}
        </p>
      </div>

      {canOpen && (
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
          <Icon name="chevron" className="h-5 w-5" />
        </div>
      )}
    </button>
  );
}

export default function DuyurularPage({
  initialDuyurular = [],
  siteId,
  siteName,
  initialError,
}) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/sakinGiris/sakin");
  };

  const handleRefresh = () => {
    router.replace(router.asPath);
  };

  const handleDuyuruClick = ({
    publicToken,
    sistemLink,
  }) => {
    let targetUrl = null;

    /*
     * Önce controller tarafından gönderilen detay linkini
     * kullanıyoruz.
     */
    if (sistemLink) {
      if (
        sistemLink.startsWith("http://") ||
        sistemLink.startsWith("https://")
      ) {
        targetUrl = sistemLink;
      } else {
        targetUrl = `${PUBLIC_DUYURU_BASE_URL}${sistemLink.startsWith("/") ? "" : "/"}${sistemLink}`;
      }
    }

    /*
     * SistemUretilmisLink gelmezse PublicToken üzerinden
     * public duyuru adresini oluşturuyoruz.
     */
    if (!targetUrl && publicToken) {
      targetUrl = `${PUBLIC_DUYURU_BASE_URL}/Duyuru/${publicToken}`;
    }

    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 shadow-2xl">
        {/* Üst başlık */}
        <header className="sticky top-0 z-40 border-b border-blue-500/20 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-4 pb-5 pt-[max(16px,env(safe-area-inset-top))] text-white shadow-lg shadow-blue-100">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Sakin paneline dön"
              className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              <Icon
                name="arrow-left"
                className="h-6 w-6"
              />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <h1 className="truncate text-lg font-bold">
                Duyurular
              </h1>

              <p className="mt-0.5 truncate text-xs text-blue-100">
                Proje ve yönetim bilgilendirmeleri
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Duyuruları yenile"
              className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              <Icon name="refresh" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-5">
         

          {/* Hata durumu */}
          {initialError && (
            <section className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <Icon
                  name="warning"
                  className="h-7 w-7"
                />
              </div>

              <h2 className="mt-4 text-base font-bold text-red-800">
                Duyurular alınamadı
              </h2>

              <p className="mt-2 text-sm leading-6 text-red-600">
                {initialError}
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-5 h-11 rounded-2xl bg-red-600 px-6 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 active:scale-[0.98]"
              >
                Tekrar dene
              </button>
            </section>
          )}

          {/* Boş liste */}
          {!initialError &&
            initialDuyurular.length === 0 && (
              <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                  <Icon
                    name="empty"
                    className="h-8 w-8"
                  />
                </div>

                <h2 className="mt-4 text-base font-bold text-slate-800">
                  Henüz duyuru bulunmuyor
                </h2>

                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Yönetim tarafından yayınlanan proje
                  duyuruları burada görüntülenecektir.
                </p>
              </section>
            )}

          {/* Duyuru listesi */}
          {!initialError &&
            initialDuyurular.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                

                    <h2 className="text-lg font-bold text-slate-900">
                      Proje Duyuruları
                    </h2>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    {initialDuyurular.length} kayıt
                  </span>
                </div>

                <div className="space-y-3">
                  {initialDuyurular.map(
                    (duyuru, index) => (
                      <DuyuruCard
                        key={
                          duyuru.id ||
                          duyuru.Id ||
                          `duyuru-${index}`
                        }
                        duyuru={duyuru}
                        onClick={handleDuyuruClick}
                      />
                    )
                  )}
                </div>
              </section>
            )}
        </main>
      </div>
    </div>
  );
}