




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
  const handleAnketListesi = () => {
    router.push("/anket");
  };


  const handleNewRapor = () => {
    router.push("/gunlukRapor/yeni");
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
  const handlePersonelTakvim = () => {
    router.push("/personelTakvim");
  };

  // Talep raporu
  const handleTalepRaporu = () => {
    router.push("/detayliTaleplerRaporu");
  };

  // Destek Talepleri raporu
  const handleDestekTalepleriRaporu = () => {
    router.push("/YonetimKuruluYoneticiRaporu/DestekTalepler");
  };
  // Günlük Raporlar
  const handleGünlükRaporlar = () => {
    router.push("/gunlukRapor");
  };
  // Günlük Rapor Gonderim Listesi
  const handleGünlükRaporGonderimListesi = () => {
    router.push("/gunlukRapor/gunlukRaporGonderimListesi");
  };

  // Yönetim Kurulu Yönetici Raporu
  const handleYonetimKurulu = () => {
    router.push("/YonetimKuruluYoneticiRaporu");
  };

  const handleYonetimKuruluKararlar = () => {
    router.push("/YonetimKuruluYoneticiRaporu/kararlar");
  };
  const handleIdariRaporlar = () => {
    router.push("/idariRaporlar");
  };
  const handleIdariRaporlarGir = () => {
    router.push("/idariRaporGir");
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
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/60 to-cyan-50/60 p-2 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="flex flex-col gap-2">
            {/* Üst bilgi satırı */}
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/85 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 xl:flex-row xl:items-center xl:justify-between">
              {/* SOL: Kimlik + Bilgi */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-extrabold tracking-wide text-cyan-800 shadow-sm dark:border-cyan-900/60 dark:bg-cyan-950/35 dark:text-cyan-200">
                    <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-sm" />
                    {personel?.kullaniciAdi ??
                      personel?.KullaniciAdi ??
                      "TEKNİK MÜDÜR PANELİ"}
                  </span>

                  {personel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {personel.ad} {personel.soyad}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 shadow-sm dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                      PersonelUserInfo bulunamadı
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SAĞ: Aksiyonlar */}
            <div className="flex w-full flex-col gap-2">
              {/* ===== YÖNETİM GRUBU ===== */}
              <div className="rounded-xl border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                <div className="grid w-full grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7">


                  {(personel?.id === 4 || personel?.id === 20) && (
                    <>

                    <button
                        onClick={handleIdariRaporlar}
                        className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 shadow-sm hover:from-amber-100 hover:to-yellow-100 dark:border-amber-900/60 dark:from-amber-950/35 dark:to-yellow-950/35 dark:text-amber-200`}
                      >
                        <svg
                          className={`${ui.icon} text-amber-600 dark:text-amber-300`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 5h6M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                          <path d="M8 9h8M8 13h8M8 17h5" />
                        </svg>
                        İdari Müdür Raporları
                      </button>


                      <button
                        onClick={handleYonetimKuruluKararlar}
                        className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 shadow-sm hover:from-emerald-100 hover:to-teal-100 dark:border-emerald-900/60 dark:from-emerald-950/35 dark:to-teal-950/35 dark:text-emerald-200`}
                      >
                        <svg
                          className={`${ui.icon} text-emerald-600 dark:text-emerald-300`}
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
                        className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-800 shadow-sm hover:from-cyan-100 hover:to-sky-100 dark:border-cyan-900/60 dark:from-cyan-950/35 dark:to-sky-950/35 dark:text-cyan-200`}
                      >
                        <svg
                          className={`${ui.icon} text-cyan-600 dark:text-cyan-300`}
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

                      <button
                        onClick={handleGünlükRaporlar}
                        className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-800 shadow-sm hover:from-indigo-100 hover:to-blue-100 dark:border-indigo-900/60 dark:from-indigo-950/35 dark:to-blue-950/35 dark:text-indigo-200`}
                      >
                        <svg
                          className={`${ui.icon} text-indigo-600 dark:text-indigo-300`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 17v-5M12 17v-8M15 17v-3M4 4h16v16H4z" />
                        </svg>
                        Günlük Raporlar
                      </button>
                    </>
                  )}


                  {/* // ===== TEKNİK MÜDÜR RAPORLAR GRUBU  */}

                  
                  {(personel?.id === 6 || personel?.id === 99) && (
                    <>

                    <button
                        onClick={handleIdariRaporlarGir}
                        className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 shadow-sm hover:from-amber-100 hover:to-yellow-100 dark:border-amber-900/60 dark:from-amber-950/35 dark:to-yellow-950/35 dark:text-amber-200`}
                      >
                        <svg
                          className={`${ui.icon} text-amber-600 dark:text-amber-300`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 5h6M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                          <path d="M8 9h8M8 13h8M8 17h5" />
                        </svg>
                        İdari Müdür Raporu Gir
                      </button>



                      

                      
                    </>
                  )}





                  <button
                    onClick={handleYoneticiRaporu}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-800 shadow-sm hover:from-blue-100 hover:to-sky-100 dark:border-blue-900/60 dark:from-blue-950/35 dark:to-sky-950/35 dark:text-blue-200`}
                  >
                    <svg
                      className={`${ui.icon} text-blue-600 dark:text-blue-300`}
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
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-800 shadow-sm hover:from-violet-100 hover:to-purple-100 dark:border-violet-900/60 dark:from-violet-950/35 dark:to-purple-950/35 dark:text-violet-200`}
                  >
                    <svg
                      className={`${ui.icon} text-violet-600 dark:text-violet-300`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3C8 8 6 11 6 14a6 6 0 0 0 12 0c0-3-2-6-6-11Z" />
                    </svg>
                    Havuz İşleri
                  </button>

                  <button
                    onClick={handleYoneticiRaporuPeyzaj}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 shadow-sm hover:from-emerald-100 hover:to-green-100 dark:border-emerald-900/60 dark:from-emerald-950/35 dark:to-green-950/35 dark:text-emerald-200`}
                  >
                    <svg
                      className={`${ui.icon} text-emerald-600 dark:text-emerald-300`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21C7 18 5 14 5 10a7 7 0 1 1 14 0c0 4-2 8-7 11Z" />
                    </svg>
                    Peyzaj İşleri
                  </button>

                  <button
                    onClick={handlePersonelTakvim}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-800 shadow-sm hover:from-cyan-100 hover:to-blue-100 dark:border-cyan-900/60 dark:from-cyan-950/35 dark:to-blue-950/35 dark:text-cyan-200`}
                  >
                    <svg
                      className={`${ui.icon} text-cyan-600 dark:text-cyan-300`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                    </svg>
                    Personel Takvimi
                  </button>

                  <button
                    onClick={handleTalepRaporu}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 shadow-sm hover:from-amber-100 hover:to-orange-100 dark:border-amber-900/60 dark:from-amber-950/35 dark:to-orange-950/35 dark:text-amber-200`}
                  >
                    <svg
                      className={`${ui.icon} text-amber-600 dark:text-amber-300`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 12h6M9 16h6M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                    </svg>
                    Talepler
                  </button>

                  <button
                    onClick={handleDestekTalepleriRaporu}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 text-rose-800 shadow-sm hover:from-rose-100 hover:to-red-100 dark:border-rose-900/60 dark:from-rose-950/35 dark:to-red-950/35 dark:text-rose-200`}
                  >
                    <svg
                      className={`${ui.icon} text-rose-600 dark:text-rose-300`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 10h8M8 14h5M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-5 3V6a2 2 0 0 1 2-2Z" />
                    </svg>
                    Destek (Ticket)
                  </button>

                  {(personel?.id === 4 || personel?.id === 20) && (
                    <button
                      onClick={handleDuyurular}
                      className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-pink-50 text-fuchsia-800 shadow-sm hover:from-fuchsia-100 hover:to-pink-100 dark:border-fuchsia-900/60 dark:from-fuchsia-950/35 dark:to-pink-950/35 dark:text-fuchsia-200`}
                    >
                      <svg
                        className={`${ui.icon} text-fuchsia-600 dark:text-fuchsia-300`}
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
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-blue-300 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-900 shadow-sm hover:from-blue-200 hover:to-sky-200 dark:border-blue-800 dark:from-blue-900/40 dark:to-sky-900/40 dark:text-blue-100`}
                  >
                    <svg
                      className={`${ui.icon} text-blue-700 dark:text-blue-200`}
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
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-emerald-300 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-900 shadow-sm hover:from-emerald-200 hover:to-green-200 dark:border-emerald-800 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-100`}
                  >
                    <svg
                      className={`${ui.icon} text-emerald-700 transition group-hover:rotate-90 dark:text-emerald-200`}
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
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-sky-300 bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-900 shadow-sm hover:from-sky-200 hover:to-cyan-200 dark:border-sky-800 dark:from-sky-900/40 dark:to-cyan-900/40 dark:text-sky-100`}
                  >
                    <svg
                      className={`${ui.icon} text-sky-700 dark:text-sky-200`}
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
                    onClick={handleAnketListesi}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-cyan-300 bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-900 shadow-sm hover:from-cyan-200 hover:to-teal-200 dark:border-cyan-800 dark:from-cyan-900/40 dark:to-teal-900/40 dark:text-cyan-100`}
                  >
                    <svg
                      className={`${ui.icon} text-cyan-700 dark:text-cyan-200`}
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
                    Anket Listesi
                  </button>

                  <button
                    onClick={handleNewRapor}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 shadow-sm hover:from-orange-200 hover:to-amber-200 dark:border-orange-800 dark:from-orange-900/40 dark:to-amber-900/40 dark:text-orange-100`}
                  >
                    Günlük Rapor Gir
                  </button>

                  {personel?.id === 118 && (
                    <button
                      onClick={handleGünlükRaporGonderimListesi}
                      className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-900 shadow-sm hover:from-yellow-200 hover:to-amber-200 dark:border-yellow-800 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-100`}
                    >
                      Rapor Gönderim Listesi
                    </button>
                  )}

                  <button
                    onClick={handleSatinalma}
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 shadow-sm hover:from-amber-200 hover:to-yellow-200 dark:border-amber-800 dark:from-amber-900/40 dark:to-yellow-900/40 dark:text-amber-100`}
                  >
                    <svg
                      className={`${ui.icon} text-amber-700 dark:text-amber-200`}
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
                    className={`group w-full justify-center cursor-pointer ${ui.btnBase} ${ui.btnSm} border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 text-rose-800 shadow-sm hover:from-rose-100 hover:to-red-100 dark:border-rose-900/60 dark:from-rose-950/35 dark:to-red-950/35 dark:text-rose-200`}
                  >
                    <svg
                      className={`${ui.icon} text-rose-600 dark:text-rose-300`}
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