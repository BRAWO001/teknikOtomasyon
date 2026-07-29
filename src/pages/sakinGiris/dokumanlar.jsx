// src/pages/sakinGiris/kararlar.jsx

import axios from "axios";
import https from "https";
import { useRouter } from "next/router";
import { roleGuard } from "@/utils/roleGuard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pilotapisrc.com/api";

const PUBLIC_WEB_BASE_URL =
  process.env.NEXT_PUBLIC_WEB_BASE_URL ||
  "https://eosyonetim.tr";

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
    // Cookie daha önce decode edilmiş olabilir.
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

function getFirstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );
}

function getSiteId(userInfo) {
  return Number(
    getFirstValue(
      userInfo?.aktifSiteId,
      userInfo?.AktifSiteId,

      userInfo?.siteId,
      userInfo?.SiteId,

      userInfo?.aktifDaire?.siteId,
      userInfo?.aktifDaire?.SiteId,

      userInfo?.daire?.siteId,
      userInfo?.daire?.SiteId,

      userInfo?.mesken?.siteId,
      userInfo?.mesken?.SiteId
    ) || 0
  );
}

function getSiteName(userInfo) {
  return (
    getFirstValue(
      userInfo?.aktifSiteAdi,
      userInfo?.AktifSiteAdi,

      userInfo?.siteAdi,
      userInfo?.SiteAdi,

      userInfo?.siteAd,
      userInfo?.SiteAd,

      userInfo?.aktifDaire?.siteAdi,
      userInfo?.aktifDaire?.SiteAdi,

      userInfo?.aktifDaire?.siteAd,
      userInfo?.aktifDaire?.SiteAd,

      userInfo?.aktifDaire?.siteName,
      userInfo?.aktifDaire?.SiteName
    ) || null
  );
}

function formatDateTR(value) {
  if (!value) {
    return {
      day: "--",
      month: "---",
      year: "",
      full: "Tarih belirtilmemiş",
    };
  }

  const date = new Date(value);

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

function normalizeKarar(item) {
  return {
    id: getFirstValue(item?.id, item?.Id),

    siteId: getFirstValue(
      item?.siteId,
      item?.SiteId
    ),

    siteBazliNo: getFirstValue(
      item?.siteBazliNo,
      item?.SiteBazliNo
    ),

    tarih: getFirstValue(
      item?.tarih,
      item?.Tarih
    ),

    kararKonusu:
      getFirstValue(
        item?.kararKonusu,
        item?.KararKonusu
      ) || "Karar konusu belirtilmemiş",

    nihaiSonuc:
      getFirstValue(
        item?.nihaiSonuc,
        item?.NihaiSonuc
      ) || "Beklemede",

    publicToken: getFirstValue(
      item?.publicToken,
      item?.PublicToken
    ),

    sistemUretilmisLink: getFirstValue(
      item?.sistemUretilmisLink,
      item?.SistemUretilmisLink
    ),

    detayLink: getFirstValue(
      item?.detayLink,
      item?.DetayLink
    ),

    site: getFirstValue(
      item?.site,
      item?.Site
    ),
  };
}

export async function getServerSideProps(ctx) {
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

  const token =
    ctx.req.cookies?.AuthToken_01 ||
    null;

  const userInfo = safeParseCookie(sakinCookie);

  if (!userInfo || !token) {
    return {
      redirect: {
        destination: "/sakinGiris",
        permanent: false,
      },
    };
  }

  const siteId = getSiteId(userInfo);
  const siteName = getSiteName(userInfo);

  if (!siteId || siteId <= 0) {
    return {
      props: {
        initialKararlar: [],
        siteId: null,
        siteName,
        initialError:
          "Kararların görüntülenebilmesi için aktif bir site kaydı bulunmalıdır.",
        ...(guardResult?.props || {}),
      },
    };
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/AppProjeKararlar/site/${siteId}`,
      {
        httpsAgent,
        timeout: 15000,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const responseData = response?.data || {};

    const rawItems = Array.isArray(responseData?.items)
      ? responseData.items
      : Array.isArray(responseData?.Items)
        ? responseData.Items
        : Array.isArray(responseData)
          ? responseData
          : [];

    const kararlar = rawItems.map(normalizeKarar);

    const responseSiteName = getFirstValue(
      kararlar?.[0]?.site?.ad,
      kararlar?.[0]?.site?.Ad,
      siteName
    );

    return {
      props: {
        initialKararlar: kararlar,
        siteId,
        siteName: responseSiteName || null,
        initialError: null,
        ...(guardResult?.props || {}),
      },
    };
  } catch (error) {
    console.error(
      "Proje kararları alınamadı:",
      error?.response?.data || error?.message
    );

    const status = error?.response?.status;
    const responseData = error?.response?.data;

    let errorMessage =
      "Kararlar alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.";

    if (status === 401) {
      errorMessage =
        "Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapınız.";
    } else if (status === 403) {
      errorMessage =
        "Bu kararları görüntüleme yetkiniz bulunmuyor.";
    } else if (status === 404) {
      errorMessage =
        "Karar servisine ulaşılamadı.";
    } else if (error?.code === "ECONNABORTED") {
      errorMessage =
        "Sunucu zamanında yanıt vermedi. Lütfen tekrar deneyiniz.";
    } else if (
      typeof responseData === "string" &&
      responseData.trim()
    ) {
      errorMessage = responseData;
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    } else if (responseData?.Message) {
      errorMessage = responseData.Message;
    }

    return {
      props: {
        initialKararlar: [],
        siteId,
        siteName,
        initialError: errorMessage,
        ...(guardResult?.props || {}),
      },
    };
  }
}

function Icon({
  name,
  className = "h-6 w-6",
}) {
  const props = {
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
      <svg {...props}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...props}>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
      </svg>
    );
  }

  if (name === "building") {
    return (
      <svg {...props}>
        <path d="M4 21V4h11v17" />
        <path d="M15 9h5v12" />
        <path d="M8 8h3" />
        <path d="M8 12h3" />
        <path d="M8 16h3" />
        <path d="M7 21h5" />
      </svg>
    );
  }

  if (name === "decision") {
    return (
      <svg {...props}>
        <path d="M9 3h6" />
        <path d="M10 2h4a2 2 0 0 1 2 2v1H8V4a2 2 0 0 1 2-2Z" />
        <path d="M7 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="m8 14 2.5 2.5L16 11" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...props}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  if (name === "warning") {
    return (
      <svg {...props}>
        <path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === "empty") {
    return (
      <svg {...props}>
        <path d="M6 2h9l4 4v16H6z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    );
  }

  return null;
}

function getSonucStyle(nihaiSonuc) {
  const value = String(
    nihaiSonuc || ""
  ).toLocaleLowerCase("tr-TR");

  if (
    value.includes("onay") ||
    value.includes("kabul") ||
    value.includes("olumlu")
  ) {
    return {
      labelClass:
        "bg-emerald-50 text-emerald-700 ring-emerald-100",
      dotClass: "bg-emerald-500",
    };
  }

  if (
    value.includes("ret") ||
    value.includes("redded") ||
    value.includes("olumsuz")
  ) {
    return {
      labelClass:
        "bg-red-50 text-red-700 ring-red-100",
      dotClass: "bg-red-500",
    };
  }

  return {
    labelClass:
      "bg-amber-50 text-amber-700 ring-amber-100",
    dotClass: "bg-amber-500",
  };
}

function KararCard({
  karar,
  onClick,
}) {
  const tarih = formatDateTR(karar?.tarih);

  const kararNo = karar?.siteBazliNo
    ? `Karar No: ${karar.siteBazliNo}`
    : "Yönetim kararı";

  const sonuc = getSonucStyle(
    karar?.nihaiSonuc
  );

  const canOpen = Boolean(
    karar?.publicToken
  );

  return (
    <button
      type="button"
      onClick={() => onClick(karar)}
      disabled={!canOpen}
      className="group flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 active:scale-[0.99] disabled:cursor-default disabled:hover:translate-y-0"
    >
      <div className="flex h-[74px] w-[64px] flex-none flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-100">
        <span className="text-xl font-black leading-none">
          {tarih.day}
        </span>

        <span className="mt-1 text-[10px] font-bold tracking-wide">
          {tarih.month}
        </span>

        <span className="mt-0.5 text-[9px] font-medium text-indigo-100">
          {tarih.year}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
            {kararNo}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${sonuc.labelClass}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${sonuc.dotClass}`}
            />

            {karar?.nihaiSonuc ||
              "Beklemede"}
          </span>
        </div>

        <h2 className="mt-2 line-clamp-2 text-[15px] font-bold leading-5 text-slate-900">
          {karar?.kararKonusu}
        </h2>

        <p className="mt-1 truncate text-xs text-slate-400">
          {tarih.full}
        </p>
      </div>

      {canOpen && (
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
          <Icon
            name="chevron"
            className="h-5 w-5"
          />
        </div>
      )}
    </button>
  );
}

export default function KararlarPage({
  initialKararlar = [],
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

  const handleKararClick = (karar) => {
    const token = karar?.publicToken;

    if (!token) {
      console.error(
        "Karar PublicToken bulunamadı:",
        karar
      );
      return;
    }

    const targetUrl =
      `${PUBLIC_WEB_BASE_URL}` +
      `/YonetimKurulu/karar/` +
      `${token}`;

    window.location.assign(targetUrl);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 shadow-2xl">
        <header className="sticky top-0 z-40 border-b border-indigo-500/20 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-500 px-4 pb-5 pt-[max(16px,env(safe-area-inset-top))] text-white shadow-lg shadow-indigo-100">
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
                Yönetim Kararları
              </h1>

              <p className="mt-0.5 truncate text-xs text-indigo-100">
                Site yönetim kurulu kararları
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Kararları yenile"
              className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              <Icon
                name="refresh"
                className="h-5 w-5"
              />
            </button>
          </div>
        </header>

        <main className="px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-5">
          <section className="flex items-center gap-3 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Icon
                name="building"
                className="h-6 w-6"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                Aktif proje
              </p>

              <h2 className="truncate text-base font-bold text-slate-900">
                {siteName ||
                  (siteId
                    ? `Site No: ${siteId}`
                    : "Site bulunamadı")}
              </h2>
            </div>

            {!initialError && (
              <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                {initialKararlar.length}
              </div>
            )}
          </section>

          {initialError && (
            <section className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <Icon
                  name="warning"
                  className="h-7 w-7"
                />
              </div>

              <h2 className="mt-4 text-base font-bold text-red-800">
                Kararlar alınamadı
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

          {!initialError &&
            initialKararlar.length === 0 && (
              <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                  <Icon
                    name="empty"
                    className="h-8 w-8"
                  />
                </div>

                <h2 className="mt-4 text-base font-bold text-slate-800">
                  Henüz karar bulunmuyor
                </h2>

                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Site yönetim kurulu tarafından
                  yayınlanan kararlar burada
                  görüntülenecektir.
                </p>
              </section>
            )}

          {!initialError &&
            initialKararlar.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      En yeni kararlar
                    </p>

                    <h2 className="text-lg font-bold text-slate-900">
                      Karar Listesi
                    </h2>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    {initialKararlar.length} kayıt
                  </span>
                </div>

                <div className="space-y-3">
                  {initialKararlar.map(
                    (karar, index) => (
                      <KararCard
                        key={
                          karar?.id ||
                          `karar-${index}`
                        }
                        karar={karar}
                        onClick={
                          handleKararClick
                        }
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