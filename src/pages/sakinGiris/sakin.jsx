// src/pages/sakinGiris/sakin.jsx

import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { roleGuard } from "@/utils/roleGuard";

/*
 * Menü adreslerini projenizdeki gerçek sayfa yollarına göre
 * yalnızca buradan değiştirebilirsiniz.
 */
const MENU_ITEMS = [
  // {
  //   id: "bildirimler",
  //   title: "Bildirimler",
  //   description: "Size gönderilen yeni bildirimleri görüntüleyin.",
  //   href: "/sakinGiris/bildirimler",
  //   color: "blue",
  //   icon: "bell",
  // },
  {
    id: "duyurular",
    title: "Duyurular",
    description: "Site ve yönetim duyurularını takip edin.",
    href: "/sakinGiris/duyurular",
    color: "emerald",
    icon: "announcement",
  },
  {
    id: "dokumanlar",
    title: "Dokümanlar",
    description: "Yönetim tarafından paylaşılan dosyalara ulaşın.",
    href: "/sakinGiris/duyurular",
    color: "violet",
    icon: "document",
  },
  {
    id: "destek",
    title: "Talep Oluştur",
    description: "Yeni destek talebi oluşturun",
    href: "/sakinGiris/destek-talep",
    color: "orange",
    icon: "support",
  },
  {
    id: "destekTaleplerim",
    title: "Destek Taleplerim",
    description: "Oluşturduğum Talepler",
    href: "/sakinGiris/actigim-destek-talepleri",
    color: "blue",
    icon: "support",
  },
  {
    id: "siteFaliyetleri",
    title: "Site / Proje Faaliyetleri",
    description: "Faaliyetleri takip edin.",
    href: "/sakinGiris/faaliyetler",
    color: "emerald",
    icon: "document",
  },
  {
    id: "hesaplar",
    title: "Hesaplar",
    description: "Hesap bilgilerinizi kontrol edin.",
    href: "/sakinGiris/hesaplar",
    color: "orange",
    icon: "document",
  },
];

const COLOR_CLASSES = {
  blue: {
    container:
      "border-blue-100 bg-gradient-to-br from-blue-50 to-white active:bg-blue-100",
    icon: "bg-blue-600 text-white shadow-blue-200",
    arrow: "text-blue-600",
  },
  emerald: {
    container:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white active:bg-emerald-100",
    icon: "bg-emerald-600 text-white shadow-emerald-200",
    arrow: "text-emerald-600",
  },
  violet: {
    container:
      "border-violet-100 bg-gradient-to-br from-violet-50 to-white active:bg-violet-100",
    icon: "bg-violet-600 text-white shadow-violet-200",
    arrow: "text-violet-600",
  },
  orange: {
    container:
      "border-orange-100 bg-gradient-to-br from-orange-50 to-white active:bg-orange-100",
    icon: "bg-orange-500 text-white shadow-orange-200",
    arrow: "text-orange-600",
  },
};

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
      // Diğer form denenir.
    }
  }

  return null;
}

export async function getServerSideProps(ctx) {
  const guardResult = await roleGuard(ctx, {
    allow: [77],
    redirectTo: "/sakinGiris",
  });

  if (guardResult?.redirect || guardResult?.notFound) {
    return guardResult;
  }

  const cookieValue =
    ctx.req.cookies?.SakinUserInfo ||
    ctx.req.cookies?.PersonelUserInfo ||
    null;

  const sakinUserInfo = safeParseCookie(cookieValue);

  if (!sakinUserInfo) {
    return {
      redirect: {
        destination: "/sakinGiris",
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialUserInfo: sakinUserInfo,
      ...(guardResult?.props || {}),
    },
  };
}

function getFirstValue(object, fields, fallback = null) {
  if (!object) return fallback;

  for (const field of fields) {
    const value = object[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function normalizeText(value, fallback = "Belirtilmemiş") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function getInitials(name) {
  if (!name) return "SK";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "SK";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
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

  if (name === "bell") {
    return (
      <svg {...commonProps}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
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

  if (name === "document") {
    return (
      <svg {...commonProps}>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
        <path d="M9 9h1" />
      </svg>
    );
  }

  if (name === "support") {
    return (
      <svg {...commonProps}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10" />
        <path d="M9 21v-7h6v7" />
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

  if (name === "user") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...commonProps}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
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

  if (name === "phone") {
    return (
      <svg {...commonProps}>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9z" />
      </svg>
    );
  }

  return null;
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-100">
        <Icon name={icon} className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="truncate text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function MenuCard({ item, onClick }) {
  const colors = COLOR_CLASSES[item.color] || COLOR_CLASSES.blue;

  return (
    <button
      type="button"
      onClick={() => onClick(item.href)}
      className={`group flex min-h-[142px] w-full flex-col rounded-3xl border p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 ${colors.container}`}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${colors.icon}`}
        >
          <Icon name={item.icon} className="h-6 w-6" />
        </div>

        <Icon
          name="chevron"
          className={`h-5 w-5 transition-transform group-hover:translate-x-0.5 ${colors.arrow}`}
        />
      </div>

      <div className="mt-4">
        <h2 className="text-[15px] font-bold text-slate-900">
          {item.title}
        </h2>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
          {item.description}
        </p>
      </div>
    </button>
  );
}

export default function SakinPage({ initialUserInfo }) {
  const router = useRouter();

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(null);

  const userData = useMemo(() => {
    const user = initialUserInfo || {};
    const aktifDaire = user.aktifDaire || {};

    const ad = getFirstValue(user, [
      "ad",
      "adi",
      "isim",
      "name",
      "kullaniciAdi",
    ]);

    const soyad = getFirstValue(user, [
      "soyad",
      "soyadi",
      "surname",
    ]);

    const fullName =
      getFirstValue(user, [
        "adSoyad",
        "adiSoyadi",
        "tamAd",
        "fullName",
      ]) ||
      [ad, soyad].filter(Boolean).join(" ") ||
      "Değerli Sakinimiz";

    const telefon = getFirstValue(user, [
      "telefon",
      "tel",
      "telefonNo",
      "cepTelefonu",
    ]);

    const siteName =
      getFirstValue(aktifDaire, [
        "siteAdi",
        "siteAd",
        "siteName",
      ]) ||
      getFirstValue(user, [
        "aktifSiteAdi",
        "siteAdi",
        "siteAd",
      ]) ||
      (user.aktifSiteId ? `Site No: ${user.aktifSiteId}` : null);

    const apartmentName =
      getFirstValue(aktifDaire, [
        "aptAdi",
        "apartmanAdi",
        "blokAdi",
        "aptAd",
      ]) ||
      getFirstValue(user, [
        "aktifAptAdi",
        "aptAdi",
        "apartmanAdi",
      ]) ||
      (user.aktifAptId ? `Apartman No: ${user.aktifAptId}` : null);

    const residenceName =
      getFirstValue(aktifDaire, [
        "daireNo",
        "daireAdi",
        "meskenAdi",
        "bagimsizBolumNo",
        "bolumAdi",
      ]) ||
      getFirstValue(user, [
        "aktifDaireNo",
        "daireNo",
        "meskenAdi",
      ]) ;

    const relationName = getFirstValue(aktifDaire, [
      "iliskiTipi",
      "kullaniciTipi",
      "rolTipAd",
      "oturumTipi",
    ]);

    return {
      fullName,
      telefon,
      siteName,
      apartmentName,
      residenceName,
      relationName,
      initials: getInitials(fullName),
      relationCount: Array.isArray(user.daireIliskileri)
        ? user.daireIliskileri.length
        : 0,
    };
  }, [initialUserInfo]);

  const handleNavigate = async (href) => {
    if (!href || navigationLoading) return;

    setNavigationLoading(href);

    try {
      await router.push(href);
    } catch (error) {
      console.error("Sayfa yönlendirme hatası:", error);
      alert("Sayfa açılırken bir hata oluştu.");
      setNavigationLoading(null);
    }
  };

  const handleLogout = async () => {
    if (logoutLoading) return;

    setLogoutLoading(true);

    try {
      const response = await fetch("/api/sakinLogout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Çıkış isteği başarısız.");
      }

      await router.replace("/sakinGiris");
    } catch (error) {
      console.error("Çıkış hatası:", error);
      alert("Çıkış yapılırken bir hata oluştu.");
      setLogoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 shadow-2xl">
        {/* Üst alan */}
        <header className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-5 pb-20 pt-5 text-white">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-sky-300/20" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              

              <h1 className="mt-0.5 text-lg font-bold">
                Sakin Paneli
              </h1>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              aria-label="Çıkış yap"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {logoutLoading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Icon name="logout" className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative z-10 mt-7 flex items-center gap-4">
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-3xl border border-white/30 bg-white/15 text-xl font-black shadow-lg backdrop-blur">
              {userData.initials}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-100">
                Hoş geldiniz
              </p>

              <h2 className="truncate text-xl font-bold">
                {userData.fullName}
              </h2>

              {userData.relationName && (
                <span className="mt-1.5 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {userData.relationName}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-20 -mt-14 px-4 pb-28">
          {/* Aktif daire kartı */}
          <section className="rounded-[28px] border border-white bg-white p-4 shadow-xl shadow-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
                  Aktif yaşam alanı
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon name="home" className="h-6 w-6" />
              </div>
            </div>

            
          </section>

          {/* İşlemler */}
          <section className="mt-6">
            

            <div className="grid grid-cols-2 gap-3">
              {MENU_ITEMS.map((item) => (
                <div key={item.id} className="relative">
                  <MenuCard
                    item={item}
                    onClick={handleNavigate}
                  />

                  {navigationLoading === item.href && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    </div>
                  )}

                </div>
              ))}
            </div>
          </section>

          {/* Bilgilendirme */}
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon name="bell" className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Yönetim bilgilendirmeleri
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Yeni duyuru, doküman ve destek talebi güncellemeleri
                  paneliniz üzerinden yayınlanacaktır.
                </p>
              </div>
            </div>
          </section>
        </main>


      </div>
    </div>
  );
}