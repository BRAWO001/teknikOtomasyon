import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getCookie as getClientCookie } from "@/utils/cookieService";

import ProjeGorevlileriSonYorumOzetCard from "@/components/projeGorevlileri/ProjeGorevlileriSonYorumOzetCard";
import ProjeDosyaModals from "@/components/ProjeDosyaModals";

import { getDataAsync } from "@/utils/apiService";
import YoneticiAnketListesiPage from "./yoneticiAnketListesi";

export default function ProjeGorevlileriPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  // Pilot modüller için uyarı mesajı
  const [pilotInfo, setPilotInfo] = useState("");

  // ✅ Doküman modal state
  const [isDosyaModalOpen, setIsDosyaModalOpen] = useState(false);

  // ✅ Personelin bağlı olduğu site(ler)
  const [siteList, setSiteList] = useState([]);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError, setSiteError] = useState("");

  // ✅ Seçilen site
  const [selectedSiteId, setSelectedSiteId] = useState("");

  // ✅ Açılır-kapanır kartlar
  const [openSections, setOpenSections] = useState({
    isEmirleri: true,
    dokumanlar: true,
    kararlar: true,
    duyurular: true,
    iletiler: true,
    destekTalepler: true,
    anketler: true,
    gunlukRapor: true,
    ziyaretci: true,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Cookie’den personel al
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
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

  // ✅ personelKodu bul
  const personelKodu = useMemo(() => {
    return (
      personel?.personelKodu ||
      personel?.PersonelKodu ||
      personel?.kodu ||
      personel?.Kodu ||
      null
    );
  }, [personel]);

  // ✅ Çoklu site yükleme: her zaman personelKodu ile getir
  useEffect(() => {
    if (!personelKodu) return;

    const loadSites = async () => {
      try {
        setSiteLoading(true);
        setSiteError("");

        const data = await getDataAsync(
          `ProjeYoneticileri/site/personel/${encodeURIComponent(personelKodu)}`
        );

        const arr = Array.isArray(data) ? data : [];
        setSiteList(arr);

        if (!arr.length) {
          setSelectedSiteId("");
          return;
        }

        // cookie/site içinden gelen mevcut site varsa onu öncelikli seç
        const directSiteId =
          personel?.siteId ||
          personel?.SiteId ||
          personel?.siteID ||
          personel?.SiteID ||
          null;

        if (directSiteId) {
          const matched = arr.find(
            (x) => Number(x?.SiteId ?? x?.siteId) === Number(directSiteId)
          );

          if (matched) {
            setSelectedSiteId(String(matched?.SiteId ?? matched?.siteId));
            return;
          }
        }

        // daha önce seçim yapılmışsa koru
        if (selectedSiteId) {
          const stillExists = arr.some(
            (x) => Number(x?.SiteId ?? x?.siteId) === Number(selectedSiteId)
          );
          if (stillExists) return;
        }

        // yoksa ilk site seçilsin
        const firstId = arr[0]?.SiteId ?? arr[0]?.siteId ?? "";
        setSelectedSiteId(firstId ? String(firstId) : "");
      } catch (err) {
        console.error("Site listesi alınırken hata:", err);
        setSiteError(
          err?.response?.data ||
            err?.message ||
            "Site bilgisi alınırken bir hata oluştu."
        );
        setSiteList([]);
        setSelectedSiteId("");
      } finally {
        setSiteLoading(false);
      }
    };

    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personelKodu]);

  const selectedSite = useMemo(() => {
    if (!selectedSiteId) return null;

    return (
      siteList.find(
        (s) => Number(s?.SiteId ?? s?.siteId) === Number(selectedSiteId)
      ) || null
    );
  }, [siteList, selectedSiteId]);

  const selectedSiteName = useMemo(() => {
    if (!selectedSite) return null;

    return (
      selectedSite?.SiteAdi ||
      selectedSite?.siteAdi ||
      selectedSite?.Ad ||
      selectedSite?.ad ||
      selectedSite?.Site?.Ad ||
      selectedSite?.Site?.ad ||
      "Site adı yok"
    );
  }, [selectedSite]);

  const hasMultipleSites = siteList.length > 1;

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

  // Yeni satın alma talebi
  const handleYeniTalep = () => router.push("/projeGorevlileri/yeni");

  const handleYeniIsEmri = () =>
    router.push("/projeGorevlileri/projeSorumlusuISemriOlustur");
  const handleYeniHavuzPeyzajIsEmri = () => router.push("/peyzajIsEmriEkle");

  const handleYeniKararTalebi = () =>
    router.push("/projeGorevlileri/ProjeSorumlusuYeniKarar");

  const handleProjemIsEmirleri = () =>
    router.push("/projeGorevlileri/projeGorevlileriIsEmirleri");
  const handleProjemHavuzIsEmirleri = () =>
    router.push("/projeGorevlileri/projeGorevlileriHavuzIsEmirleri");
  const handleProjemPeyzajIsEmirleri = () =>
    router.push("/projeGorevlileri/projeGorevlileriPeyzajIsEmirleri");

  const handleTaleplerim = () => router.push("/projeGorevlileri/taleplerim");

  const handleProjemTalepler = () =>
    router.push("/projeGorevlileri/projeminTalepleri");

  // Sadece yeni duyuru aktif
  const handleYeniDuyuru = () => router.push("/iletisimGorevli/YeniDuyuru");
  const handleProjemDuyurular = () =>
    router.push("/projeGorevlileri/projeGorevlileriDuyurular");

  const handleProjemKararlar = () =>
    router.push("/projeGorevlileri/projeGorevlileriKararlar");

  const handleYeniIleti = () =>
    router.push("/projeGorevlileri/projeGorevlileriYeniIleti");

  const handleProjemIletiler = () =>
    router.push("/projeGorevlileri/projeGorevlileriIletiler");
  const handleProjemDestekTalepler = () =>
    router.push("/projeGorevlileri/DestekTalepler");
  const handleProjemAnketler = () =>
    router.push("/projeGorevlileri/yoneticiAnketListesi");
  const handleProjemRapor = () => router.push("/gunlukRapor/yeni");

  const handlePilotFeatureClick = (featureName) => {
    setPilotInfo(
      `Şimdilik pilot deneme süreci olduğu için "${featureName}" modülü buradan hizmet verememektedir.`
    );
  };

  // ✅ Modal açmadan önce site seçili mi kontrol
  const openDosyaModal = () => {
    if (!selectedSiteId) {
      setPilotInfo("Önce bir site seçmelisiniz (SiteId bulunamadı).");
      return;
    }
    setIsDosyaModalOpen(true);
  };

  const SectionCard = ({
    sectionKey,
    title,
    description,
    children,
    warning,
    accent = "zinc",
  }) => {
    const isOpen = openSections[sectionKey];

    const accentMap = {
      zinc: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40",
      emerald:
        "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20",
      sky: "border-sky-200 bg-sky-50/60 dark:border-sky-900/60 dark:bg-sky-950/20",
      amber:
        "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20",
      indigo:
        "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/20",
    };

    return (
      <div
        className={`rounded-xl border p-3 text-xs shadow-sm transition-all ${
          accentMap[accent] || accentMap.zinc
        }`}
      >
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            <p className="mt-1 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
              {description}
            </p>
          </div>

          <span
            className={`mt-0.5 shrink-0 rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${
              isOpen ? "rotate-0" : ""
            }`}
          >
            {isOpen ? "▲ Kapat" : "▼ Aç"}
          </span>
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen
              ? "grid-rows-[1fr] opacity-100 mt-3"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            {children}
            {warning}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto min-h-screen w-full max-w-[1800px] px-3 py-4 md:px-5 xl:px-6 flex flex-col gap-4">
        {/* ÜST PANEL */}
        <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              {/* LOGO + BAŞLIK */}
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/eos_management_logo.png"
                  alt="EOS Management"
                  className="h-11 w-auto object-contain rounded-md"
                />

                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Proje Görevlileri Paneli
                  </p>

                  {personel && (
                    <>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Merhaba{" "}
                        <span className="font-bold">
                          {personel.ad} {personel.soyad}
                        </span>
                      </p>
                      <p className="text-xs font-extralight text-zinc-900 dark:text-zinc-50">
                        Bu site bir Demo sürümüdür. Bazı modüller henüz aktif
                        değildir.
                      </p>
                    </>
                  )}

                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {siteLoading ? (
                      <span>Site bilgileri yükleniyor…</span>
                    ) : siteError ? (
                      <span className="text-rose-600 dark:text-rose-300">
                        {siteError}
                      </span>
                    ) : selectedSiteName ? (
                      <span>
                        Aktif Site:{" "}
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                          {selectedSiteName}
                        </span>
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-200">
                        Size tanımlı aktif site bulunamadı.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between xl:items-center xl:gap-4">
                {personel?.id && (
                  <div className="w-full xl:w-auto">
                    <ProjeGorevlileriSonYorumOzetCard personelId={personel.id} />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogout}
                    className="rounded-md cursor-pointer bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
                  >
                    Çıkış
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ EN ÜSTTE SİTE SEÇİMİ */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr] md:items-end">
                <div>
                  

                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    disabled={siteLoading || !siteList.length}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {!siteList.length ? (
                      <option value="">
                        {siteLoading ? "Yükleniyor..." : "Site bulunamadı"}
                      </option>
                    ) : (
                      siteList.map((s) => {
                        const id = s?.SiteId ?? s?.siteId;
                        const ad =
                          s?.SiteAdi ||
                          s?.siteAdi ||
                          s?.Ad ||
                          s?.ad ||
                          s?.Site?.Ad ||
                          s?.Site?.ad ||
                          "Site adı yok";

                        return (
                          <option key={id} value={String(id)}>
                            {ad}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {selectedSiteName ? (
                    <>
                      Şu anda işlemler bu site üzerinden yürütülür:{" "}
                      <span className="font-semibold">{selectedSiteName}</span>
                    </>
                  ) : (
                    <>İşlem yapmak için önce site seçiniz.</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ANA İÇERİK */}
        <main className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col gap-5 xl:p-5">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Talep Yönetim Paneli
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Bu bölümden <strong>talep</strong> oluşturabilir ve{" "}
              <strong>teknik</strong> isteklerinizi ekibimize iletebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleYeniTalep}
              className="flex items-center gap-1 rounded-md cursor-pointer bg-emerald-400 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Yeni Talep Oluştur
            </button>

            <button
              onClick={handleTaleplerim}
              className="flex items-center gap-1 rounded-md cursor-pointer bg-sky-400 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
            >
              <svg
                className="w-4 h-4"
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
              onClick={handleProjemTalepler}
              className="flex items-center gap-1 rounded-md cursor-pointer bg-indigo-400 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" />
              </svg>
              Projemin Talepleri
            </button>
          </div>

          <section className="space-y-4 w-full">
            <div className="text-center">
              <p className="text-[12px] text-zinc-600 dark:text-zinc-300">
                Aşağıdaki modüller profesyonel site yönetimi için planlanmaktadır.
                Şu an pilot deneme sürecindedir.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              <SectionCard
                sectionKey="isEmirleri"
                accent="emerald"
                title="🛠️ İş Emirleri"
                description="Site içindeki tüm arıza ve bakım taleplerinin takibi, iş emirleri ve teknisyen görevlendirmeleri."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  <button
                    onClick={handleYeniIsEmri}
                    disabled={!selectedSiteId}
                    className="flex h-10 items-center justify-center cursor-pointer gap-1 rounded-md border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
                  >
                    ➕ İş Emri Oluştur
                  </button>

                  <button
                    onClick={handleYeniHavuzPeyzajIsEmri}
                    disabled={!selectedSiteId}
                    className="flex h-10 items-center justify-center cursor-pointer gap-1 rounded-md border border-sky-300 bg-sky-50 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/50"
                  >
                    🌿🌊 Havuz / Peyzaj İş Emri Oluştur
                  </button>

                  <button
                    onClick={handleProjemIsEmirleri}
                    disabled={!selectedSiteId}
                    className="flex h-10 items-center justify-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📋 Projemin İş Emirleri
                  </button>

                  <button
                    onClick={handleProjemPeyzajIsEmirleri}
                    disabled={!selectedSiteId}
                    className="flex h-10 items-center justify-center cursor-pointer gap-1 rounded-md border border-lime-300 bg-lime-50 text-xs font-semibold text-lime-800 hover:bg-lime-100 disabled:opacity-60 dark:border-lime-800 dark:bg-lime-950/40 dark:text-lime-100 dark:hover:bg-lime-900/50"
                  >
                    🌿 Projemin Peyzaj Emirleri
                  </button>

                  <button
                    onClick={handleProjemHavuzIsEmirleri}
                    disabled={!selectedSiteId}
                    className="flex h-10 items-center justify-center cursor-pointer gap-1 rounded-md border border-cyan-300 bg-cyan-50 text-xs font-semibold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100 dark:hover:bg-cyan-900/50"
                  >
                    🌊 Projemin Havuz Emirleri
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="dokumanlar"
                accent="sky"
                title="📎 Dokümanlar"
                description="Yönetim duyuruları, karar defterleri, toplantı tutanakları ve önemli dokümanların paylaşımı."
                warning={
                  !selectedSiteId && (
                    <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200">
                      Site seçilmeden doküman yüklenemez.
                    </div>
                  )
                }
              >
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={openDosyaModal}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📎 Dosya Ekle / Gör
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="kararlar"
                accent="amber"
                title="🏛️ Yönetim Kurulu Karar Talebi"
                description="Yönetim kuruluna iletilecek karar talebini açıklama ve ekleriyle kayıt altına alın."
                warning={
                  !selectedSiteId && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
                      ⚠️ Site seçilmeden karar işlemi yapılamaz.
                    </div>
                  )
                }
              >
                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleYeniKararTalebi}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ➕ Yeni Karar Oluştur
                  </button>

                  <button
                    type="button"
                    onClick={handleProjemKararlar}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📚 Projemin Kararları
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="duyurular"
                accent="indigo"
                title="📢 Duyuru Yönetimi"
                description="Yeni duyuru oluşturma ve mevcut duyuruları görüntüleme ekranlarına buradan geçebilirsiniz."
                warning={
                  !selectedSiteId && (
                    <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200 text-center">
                      Site seçilmeden duyuru işlemi yapılamaz.
                    </div>
                  )
                }
              >
                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={handleYeniDuyuru}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ➕ Yeni Duyuru
                  </button>
                  <button
                    onClick={handleProjemDuyurular}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📄 Projemin Duyuruları
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="iletiler"
                title="📋 İletiler"
                description="Projeye ait bilgilendirme iletileri, duyurular ve yönetim notları."
                warning={
                  !selectedSiteId && (
                    <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200 text-center">
                      Site seçilmeden ileti işlemi yapılamaz.
                    </div>
                  )
                }
              >
                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleYeniIleti}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ➕ Yeni İleti Oluştur
                  </button>

                  <button
                    type="button"
                    onClick={handleProjemIletiler}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📄 İletileri Görüntüle
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="destekTalepler"
                title="📣 Destek Talepler"
                description="Projeye ait kat maliklerinin destek talepleri."
                warning={
                  !selectedSiteId && (
                    <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200 text-center">
                      Site seçilmeden destek talebi işlemi yapılamaz.
                    </div>
                  )
                }
              >
                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleProjemDestekTalepler}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📄 Destek Talepleri Görüntüle
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="anketler"
                title="📊 Anketler"
                description="Projeye ait düzenlenmiş anketler ve kat maliklerinin katılım durumları."
                warning={
                  !selectedSiteId && (
                    <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200 text-center">
                      Site seçilmeden anket işlemi yapılamaz.
                    </div>
                  )
                }
              >
                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleProjemAnketler}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📄 Anketleri Görüntüle
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="gunlukRapor"
                title="🕒 Günlük Rapor"
                description="Proje Sorumlusunun günlük olarak gireceği raporlar ve yönetimin geri bildirimleri."
                warning={
                  !selectedSiteId && (
                    <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200 text-center">
                      Site seçilmeden günlük rapor işlemi yapılamaz.
                    </div>
                  )
                }
              >
                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleProjemRapor}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    🕒📋 Günlük Rapor Gir
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                sectionKey="ziyaretci"
                title="Ziyaretçi & Güvenlik Kayıtları"
                description="Kapı giriş-çıkış, ziyaretçi kayıtları ve güvenlik tutanaklarının merkezi takibi."
              >
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      handlePilotFeatureClick("Ziyaretçi & Güvenlik Kayıtları")
                    }
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Modülü Görüntüle
                  </button>
                </div>
              </SectionCard>
            </div>

            {pilotInfo && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-100">
                {pilotInfo}
              </div>
            )}
          </section>

          <div className="mt-2 border-t border-zinc-200 pt-4 text-[24px] text-center text-white dark:border-zinc-800 dark:text-zinc-400">
            SAYGILARIMIZLA,{" "}
            <span className="font-semibold">EOS MANAGEMENT</span>
          </div>
        </main>
      </div>

      <ProjeDosyaModals
        isOpen={isDosyaModalOpen}
        onClose={() => setIsDosyaModalOpen(false)}
        siteId={selectedSiteId}
        baslik="Dokümanlar"
      />
    </div>
  );
}