




// pages/teknikMudur.jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { roleGuard } from "@/utils/roleGuard";

export const getServerSideProps = (ctx) =>
  roleGuard(ctx, { allow: [90], redirectTo: "/" });

// Basit durum filtreleri: Tüm / Devam / Biten
const STATUS_FILTERS = [
  { key: "ALL", label: "Tüm İşler", description: "0–100 tüm iş emirleri" },
  {
    key: "DEVAM",
    label: "Devam Edenler",
    description: "%100 olmayan tüm işler",
  },
  {
    key: "BITEN",
    label: "Biten İşler",
    description: "Sadece %100 (tamamlanmış) işler",
  },
];

// Backend path builder
function buildPath({ statusFilter, startDate, endDate, siteId, personelId }) {
  const qs = [];

  if (personelId) qs.push(`personelId=${encodeURIComponent(personelId)}`);
  if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);
  if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);

  const statusKey = statusFilter || "ALL";
  qs.push(`status=${encodeURIComponent(statusKey)}`);

  const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";

  // 🔥 API: GET /api/Personeller/teknikMudurFilterGet
  // getDataAsync içinde base + "personeller/..." şeklinde gidiyor
  return `personeller/teknikMudurFilterGet${queryString}`;
}

export default function TeknikMudurPage() {
  const router = useRouter();

  // İş emri state'leri
  const [isEmirleri, setIsEmirleri] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | DEVAM | BITEN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Üst panel state'leri (cookie)
  const [personel, setPersonel] = useState(null); // teknik müdür kendi bilgisi

  // Filtre state'leri
  const [filterPersonelId, setFilterPersonelId] = useState(""); // personel filtresi
  const [filterSiteId, setFilterSiteId] = useState(""); // site filtresi
  const [startDate, setStartDate] = useState(""); // yyyy-MM-dd
  const [endDate, setEndDate] = useState(""); // yyyy-MM-dd

  // Dropdown verileri
  const [personelList, setPersonelList] = useState([]);
  const [siteList, setSiteList] = useState([]);

  const ui = {
    pageWrap:
      "mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-3 px-2 py-2 sm:px-3 lg:px-4 xl:px-4",
    panel:
      "rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
    softPanel:
      "rounded-xl border border-zinc-200 bg-zinc-50/80 p-1.5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/50",
    main:
      "flex-1 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
    filterBox:
      "mb-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2.5 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40",

    btnBase:
      "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[10px] font-semibold shadow-sm transition active:scale-[0.98]",
    btnSm: "h-8 px-2.5",
    btnMd: "h-9 px-2.5",

    btnGhost:
      "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
    btnPrimary: "bg-emerald-600 text-white hover:bg-emerald-700",
    btnWarning: "bg-amber-500 text-white hover:bg-amber-600",
    btnDanger:
      "border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50 dark:border-red-900/40 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/20",

    icon: "h-3.5 w-3.5",
    helper: "text-[10px] text-zinc-500 dark:text-zinc-400",
    label:
      "mb-1 block text-[10px] font-medium text-zinc-700 dark:text-zinc-200",
    input:
      "h-9 w-full rounded-lg border border-zinc-300 px-2.5 text-[11px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
    filterChip:
      "inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 text-[10px] font-semibold shadow-sm transition active:scale-[0.99]",
  };

  // Çıkış
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
    }
  };

  // Yeni iş emri ekle
  const handleNewIsEmri = () => {
    router.push("/teknikIsEmriEkle");
  };
  const handleNewAnket = () => {
    router.push("/anket/yeni");
  };

  // Yeni iş emri ekle Peyzaj
  const handleNewIsEmriPeyzaj = () => {
    router.push("/peyzajIsEmriEkle");
  };

  const handleDuyurular = () => {
    router.push("/Duyurular");
  };

  // Yonetici raporu
  const handleYoneticiRaporu = () => {
    router.push("/yoneticiRaporu");
  };

  const handleYoneticiRaporuHavuz = () => {
    router.push("/havuzYoneticiRaporu");
  };

  const handleYoneticiRaporuPeyzaj = () => {
    router.push("/peyzajYoneticiRaporu");
  };

  // Talep raporu
  const handleTalepRaporu = () => {
    router.push("/detayliTaleplerRaporu");
  };

  // Destek Talepleri raporu
  const handleDestekTalepleriRaporu = () => {
    router.push("/YonetimKuruluYoneticiRaporu/DestekTalepler");
  };
  // Günlük RAporlar
  const handleGünlükRaporlar = () => {
    router.push("/gunlukRapor");
  };

  // Yönetim Kurulu Yönetici Raporu
  const handleYonetimKurulu = () => {
    router.push("/YonetimKuruluYoneticiRaporu");
  };

  const handleYonetimKuruluKararlar = () => {
    router.push("/YonetimKuruluYoneticiRaporu/kararlar");
  };

  const handleYonetimKuruluIletiler = () => {
    router.push("/YonetimKuruluYoneticiRaporu/iletiler");
  };

  // Satın alma sayfası
  const handleSatinalma = () => {
    router.push("/satinalma/liste");
  };

  // Üst panel: PersonelUserInfo (cookie)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");

      // Cookie yoksa → anasayfaya
      if (!personelCookie) {
        router.replace("/");
        return;
      }

      const parsed = JSON.parse(personelCookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      router.replace("/");
    }
  }, [router]);

  // Personel listesi (dropdown)
  useEffect(() => {
    let cancelled = false;

    const loadPersonelList = async () => {
      try {
        const res = await getDataAsync(
          "Personeller/ByDurum?rolKod=30&aktifMi=true"
        );

        if (cancelled) return;
        setPersonelList(res || []);
      } catch (err) {
        console.error("PERSONELLER FETCH ERROR:", err);
      }
    };

    loadPersonelList();

    return () => {
      cancelled = true;
    };
  }, []);

  // Site listesi (dropdown)
  useEffect(() => {
    let cancelled = false;

    const loadSiteList = async () => {
      try {
        const res = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSiteList(res || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    };

    loadSiteList();

    return () => {
      cancelled = true;
    };
  }, []);

  // İş emirlerini backend'den çek
  const fetchIsEmirleri = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const path = buildPath({
        statusFilter: options.statusFilter ?? statusFilter,
        startDate: options.startDate ?? startDate,
        endDate: options.endDate ?? endDate,
        siteId: options.siteId ?? filterSiteId,
        personelId: options.personelId ?? filterPersonelId,
      });

      const data = await getDataAsync(path);
      const list = Array.isArray(data) ? data : data ? [data] : [];

      setIsEmirleri(list);
    } catch (err) {
      console.error("İş emirleri yüklenirken hata:", err);
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      setIsEmirleri([]);
    } finally {
      setLoading(false);
    }
  };

  // Durum filtresi değiştiğinde otomatik yükle
  useEffect(() => {
    fetchIsEmirleri({ statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Sayfa ilk açılışında (backend default: son 30 gün)
  useEffect(() => {
    fetchIsEmirleri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    await fetchIsEmirleri();
  };

  const handleFilterApply = async () => {
    await fetchIsEmirleri();
  };

  const handleFilterReset = async () => {
    setFilterPersonelId("");
    setFilterSiteId("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("ALL");
    // statusFilter değişimi zaten fetch tetikliyor
  };

  const activeFilterObj =
    STATUS_FILTERS.find((f) => f.key === statusFilter) || STATUS_FILTERS[0];

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className={ui.pageWrap}>
        {/* ÜSTTE TEKNİK MÜDÜR PANELİ */}
        <section className={ui.panel}>
          <div className="flex flex-col gap-2.5">
            {/* Üst bilgi satırı */}
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              {/* SOL: Kimlik + Bilgi */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    TEKNİK MÜDÜR PANELİ
                  </span>

                  {personel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {personel.ad} {personel.soyad}
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-600 dark:text-zinc-300">
                        Rol: {personel.rol}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                      PersonelUserInfo bulunamadı
                    </span>
                  )}
                </div>
              </div>

              <div className={ui.helper}>
                Teknik müdür işlemleri ve iş emri yönetimi
              </div>
            </div>

            {/* SAĞ: Aksiyonlar */}
            <div className="flex  flex-col gap-2 2xl:grid 2xl:grid-cols-[1.5fr_1fr_auto]">
              {/* ===== YÖNETİM GRUBU ===== */}
              <div className={ui.softPanel}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(personel?.id === 4 || personel?.id === 20) && (
                    <div className="flex flex-wrap justify-evenly items-center gap-1.5">
                      <button
                        onClick={handleYonetimKuruluKararlar}
                        className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 dark:hover:border-emerald-700/50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300`}
                      >
                        <svg
                          className={`${ui.icon} text-zinc-500 group-hover:text-emerald-600`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 5h6M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                          <path d="M8 9h8M8 13h8M8 17h5" />
                        </svg>
                        YK.Kararlar
                      </button>

                      <button
                        onClick={handleYonetimKuruluIletiler}
                        className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 dark:hover:border-sky-700/50 dark:hover:bg-sky-900/20 dark:hover:text-sky-300`}
                      >
                        <svg
                          className={`${ui.icon} text-zinc-500 group-hover:text-sky-600`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M4 6h16v12H4z" />
                          <path d="m4 7 8 6 8-6" />
                        </svg>
                        YK.İletiler
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleYoneticiRaporu}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 dark:hover:border-sky-700/50 dark:hover:bg-sky-900/20 dark:hover:text-sky-300`}
                  >
                    <svg
                      className={`${ui.icon} text-zinc-500 group-hover:text-sky-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
                    </svg>
                    İş Emirleri
                  </button>

                  <button
                    onClick={handleYoneticiRaporuHavuz}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 dark:hover:border-sky-700/50 dark:hover:bg-sky-900/20 dark:hover:text-sky-300`}
                  >
                    <svg
                      className={`${ui.icon} text-zinc-500 group-hover:text-sky-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
                    </svg>
                    Havuz İşleri
                  </button>

                  <button
                    onClick={handleYoneticiRaporuPeyzaj}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 dark:hover:border-sky-700/50 dark:hover:bg-sky-900/20 dark:hover:text-sky-300`}
                  >
                    <svg
                      className={`${ui.icon} text-zinc-500 group-hover:text-sky-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
                    </svg>
                    Peyzaj İşleri
                  </button>

                  <button
                    onClick={handleTalepRaporu}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 dark:hover:border-sky-700/50 dark:hover:bg-sky-900/20 dark:hover:text-sky-300`}
                  >
                    <svg
                      className={`${ui.icon} text-zinc-500 group-hover:text-sky-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
                    </svg>
                    Talepler
                  </button>

                  <button
                    onClick={handleDestekTalepleriRaporu}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 dark:hover:border-sky-700/50 dark:hover:bg-sky-900/20 dark:hover:text-sky-300`}
                  >
                    <svg
                      className={`${ui.icon} text-zinc-500 group-hover:text-sky-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
                    </svg>
                    Destek (Ticket)
                  </button>
                  <button
                    onClick={handleGünlükRaporlar}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 dark:hover:border-sky-700/50 dark:hover:bg-sky-900/20 dark:hover:text-sky-300`}
                  >
                    <svg
                      className={`${ui.icon} text-zinc-500 group-hover:text-sky-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
                    </svg>
                    Günlük Raporlar
                  </button>

                  {(personel?.id === 4 || personel?.id === 20) && (
                    <button
                      onClick={handleDuyurular}
                      className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnGhost} hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-fuchsia-900 dark:hover:border-fuchsia-700/50 dark:hover:bg-fuchsia-900/20 dark:hover:text-fuchsia-300`}
                    >
                      <svg
                        className={`${ui.icon} text-zinc-500 group-hover:text-fuchsia-600`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 11v2l14 4V7L3 11z" />
                        <path d="M17 7v10" />
                        <path d="M7 13v4a2 2 0 0 0 2 2h1" />
                      </svg>
                      Duyurular
                    </button>
                  )}

                  <button
                    onClick={handleNewIsEmri}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnPrimary}`}
                  >
                    <svg
                      className={`${ui.icon} text-white/90`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Yeni İş
                  </button>

                  <button
                    onClick={handleNewIsEmriPeyzaj}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnPrimary}`}
                  >
                    <svg
                      className={`${ui.icon} text-white/90 transition group-hover:rotate-90`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>

                    <span className="tracking-tight">Peyzaj / Havuz Görev</span>
                  </button>

                  <button
                    onClick={handleNewAnket}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-blue-200 bg-blue-400 text-white hover:bg-blue-500 hover:border-blue-200 shadow-sm`}
                  >
                    <svg
                      className={`${ui.icon} text-white/90`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm5 4v6m-3-3h6"
                      />
                    </svg>
                    Anket Oluştur
                  </button>

                  <button
                    onClick={handleSatinalma}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnWarning}`}
                  >
                    <svg
                      className={`${ui.icon} text-white`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                    Taleplerim
                  </button>

                  <button
                    onClick={handleLogout}
                    className={`group cursor-pointer ${ui.btnBase} ${ui.btnSm} ${ui.btnDanger}`}
                  >
                    <svg
                      className={`${ui.icon} text-red-500 group-hover:text-red-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 3h4v18h-4M10 17l5-5-5-5M15 12H3" />
                    </svg>
                    Çıkış
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ALTA GENİŞ TEKNİK İŞ EMİRLERİ */}
        <main className={ui.main}>
          {/* Başlık + durum filtresi + yenile */}
          <div className="mb-2.5 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold sm:text-xl">
                Teknik İş Emirleri
              </h1>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Aktif filtre:{" "}
                <span className="font-semibold">{activeFilterObj.label}</span> –{" "}
                {activeFilterObj.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((f) => {
                const isActive = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={[
                      ui.filterChip,
                      isActive
                        ? "border-zinc-700 bg-zinc-800 text-white dark:border-zinc-300 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                );
              })}

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-zinc-300 px-2.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Yenile
              </button>
            </div>
          </div>

          {/* Filtre bar – personel + site + tarih */}
          <section className={ui.filterBox}>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-[220px_220px_1fr_auto] xl:items-end">
              {/* Personel filtresi */}
              <div className="w-full min-w-0">
                <label className={ui.label}>Personel (Atanan)</label>
                <select
                  value={filterPersonelId}
                  onChange={(e) => setFilterPersonelId(e.target.value)}
                  className={ui.input}
                >
                  <option value="">Tüm Personeller</option>
                  {personelList.map((p) => {
                    const id = p.id ?? p.Id;
                    const ad = p.ad ?? p.Ad;
                    const soyad = p.soyad ?? p.Soyad;
                    return (
                      <option key={id} value={id}>
                        {ad} {soyad}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Site filtresi */}
              <div className="w-full min-w-0">
                <label className={ui.label}>Site / Proje</label>
                <select
                  value={filterSiteId}
                  onChange={(e) => setFilterSiteId(e.target.value)}
                  className={ui.input}
                >
                  <option value="">Tüm Siteler</option>
                  {siteList.map((s) => {
                    const id = s.id ?? s.Id;
                    const ad = s.ad ?? s.Ad;
                    return (
                      <option key={id} value={id}>
                        {ad || `Site #${id}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Tarih aralığı */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={ui.label}>Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={ui.input}
                  />
                </div>
                <div className="min-w-0">
                  <label className={ui.label}>Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={ui.input}
                  />
                </div>
              </div>

              {/* Filtre butonları */}
              <div className="flex flex-wrap gap-1.5 xl:justify-end">
                <button
                  type="button"
                  onClick={handleFilterApply}
                  disabled={loading}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-600 px-2.5 text-[10px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Filtrele
                </button>
                <button
                  type="button"
                  onClick={handleFilterReset}
                  disabled={loading}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-2.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  Temizle
                </button>
              </div>
            </div>
          </section>

          {/* İçerik */}
          {loading && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              İş emirleri yükleniyor...
            </p>
          )}

          {error && !loading && (
            <p className="text-[11px] text-red-600">
              İş emirleri yüklenirken hata: {error}
            </p>
          )}

          {!loading && !error && isEmirleri.length === 0 && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Bu filtrelere uygun iş emri bulunamadı.
            </p>
          )}

          {!loading && !error && isEmirleri.length > 0 && (
            <div className="mt-2.5 max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {isEmirleri.map((item) => (
                  <TeknikIsEmriCard key={item.id} data={item} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}