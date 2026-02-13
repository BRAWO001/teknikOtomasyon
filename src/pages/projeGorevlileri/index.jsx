




// pages/projeGorevlileri/index.jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getCookie as getClientCookie } from "@/utils/cookieService";

import ProjeGorevlileriSonYorumOzetCard from "@/components/projeGorevlileri/ProjeGorevlileriSonYorumOzetCard";
import ProjeDosyaModals from "@/components/ProjeDosyaModals";

import { getDataAsync } from "@/utils/apiService";

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
  const [selectedSiteId, setSelectedSiteId] = useState(null);

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

  // ✅ SiteId cookie’de var mı? (varsa direkt seç)
  useEffect(() => {
    const directSiteId = personel?.siteId || personel?.SiteId || null;
    if (directSiteId && !selectedSiteId) {
      setSelectedSiteId(directSiteId);
    }
  }, [personel, selectedSiteId]);

  // ✅ SiteId yoksa: personelKodu ile site(ler)i çek
  useEffect(() => {
    const directSiteId = personel?.siteId || personel?.SiteId || null;
    if (directSiteId) return;
    if (!personelKodu) return;

    const loadSites = async () => {
      try {
        setSiteLoading(true);
        setSiteError("");

        const data = await getDataAsync(
          `projeYonetimKurulu/site/personel/${encodeURIComponent(personelKodu)}`
        );

        const arr = Array.isArray(data) ? data : [];
        setSiteList(arr);

        if (arr.length === 1) {
          setSelectedSiteId(arr[0]?.SiteId ?? arr[0]?.siteId ?? null);
        }

        if (arr.length > 1 && !selectedSiteId) {
          const firstId = arr[0]?.SiteId ?? arr[0]?.siteId ?? null;
          if (firstId) setSelectedSiteId(firstId);
        }
      } catch (err) {
        console.error("Site listesi alınırken hata:", err);
        setSiteError(
          err?.response?.data ||
            err?.message ||
            "Site bilgisi alınırken bir hata oluştu."
        );
      } finally {
        setSiteLoading(false);
      }
    };

    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personelKodu]);

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

  const handleYeniKararTalebi = () =>
    router.push("/projeGorevlileri/ProjeSorumlusuYeniKarar");

  const handleProjemIsEmirleri = () =>
    router.push("/projeGorevlileri/projeGorevlileriIsEmirleri");

  const handleTaleplerim = () => router.push("/projeGorevlileri/taleplerim");

  // ✅ yeni sayfalar
  const handleProjemKararlar = () =>
    router.push("/projeGorevlileri/projeGorevlileriKararlar");

  const handleYeniIleti = () =>
    router.push("/projeGorevlileri/projeGorevlileriYeniIleti");

  const handleProjemIletiler = () =>
    router.push("/projeGorevlileri/projeGorevlileriIletiler");

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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto min-h-screen max-w-4xl p-4 flex flex-col gap-3">
        {/* ÜST PANEL */}
        <section className="rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* LOGO + BAŞLIK */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/eos_management_logo.png"
                alt="EOS Management"
                className="h-10 w-auto object-contain rounded-md"
              />

              <div className="flex flex-col gap-1">
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
                    <p className="text-xs font-extralight  text-zinc-900 dark:text-zinc-50">
                      Bu site bir Demo sürümüdür. Bazı modüller henüz aktif
                      değildir.
                    </p>
                  </>
                )}

                {/* küçük durum satırı */}
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {siteLoading ? (
                    <span>Site bilgisi yükleniyor…</span>
                  ) : siteError ? (
                    <span className="text-rose-600 dark:text-rose-300">
                      {siteError}
                    </span>
                  ) : selectedSiteId ? (
                    <span>
                      Aktif SiteId:{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                        {selectedSiteId}
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-200">
                      SiteId bulunamadı.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {personel?.id && (
              <ProjeGorevlileriSonYorumOzetCard personelId={personel.id} />
            )}

            {/* ÇIKIŞ BUTONU */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="rounded-md cursor-pointer bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
              >
                Çıkış
              </button>
            </div>
          </div>
        </section>

        {/* ANA İÇERİK */}
        <main className="flex-1 items-center rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold justify-center text-center text-zinc-900 dark:text-zinc-50">
              Talep Yönetim Paneli
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Bu bölümden <strong>talep</strong> oluşturabilir ve{" "}
              <strong>teknik</strong> isteklerinizi ekibimize iletebilirsiniz.
            </p>
          </div>

          {/* Mevcut iki buton */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleYeniTalep}
              className="rounded-md cursor-pointer bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Yeni Talep Oluştur
            </button>

            <button
              onClick={handleTaleplerim}
              className="rounded-md cursor-pointer bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Taleplerim
            </button>
          </div>

          {/* Pilot modüller */}
          <section className="mt-4 space-y-3 w-full">
            <div>
              <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300">
                Aşağıdaki modüller profesyonel site yönetimi için
                planlanmaktadır. Şu an pilot deneme sürecinde olduğundan sadece
                bilgilendirme amaçlı gösterilmektedir.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* İş Emirleri */}
              <div className="flex flex-col justify-center rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="flex items-center justify-center gap-1 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    🛠️ İş Emirleri
                  </h3>
                  <p className="mt-1 text-[11px] justify-center text-center text-zinc-600 dark:text-zinc-300">
                    Site içindeki tüm arıza ve bakım taleplerinin takibi, iş
                    emirleri ve teknisyen görevlendirmeleri.
                  </p>
                </div>

                <div className="mt-3 flex justify-evenly gap-2 flex-wrap">
                  <button
                    onClick={handleYeniIsEmri}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ➕ İş Emri Oluştur
                  </button>

                  <button
                    onClick={handleProjemIsEmirleri}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📋 Projemin İş Emirleri
                  </button>
                </div>
              </div>

              {/* ✅ Dokümanlar (MODAL) */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold justify-center text-center text-zinc-900 dark:text-zinc-50">
                    📎 Dokümanlar
                  </h3>
                  <p className="mt-1 text-[11px] justify-center text-center text-zinc-600 dark:text-zinc-300">
                    Yönetim duyuruları, karar defterleri, toplantı tutanakları
                    ve önemli dokümanların paylaşımı.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={openDosyaModal}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📎 Dosya Ekle / Gör
                  </button>
                </div>

                {!selectedSiteId && (
                  <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200">
                    Site seçilmeden doküman yüklenemez.
                  </div>
                )}
              </div>

              {/* ✅ Yönetim Kurulu Karar Talebi Oluştur + Projemin Kararları */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 p-3 text-xs shadow-sm dark:border-zinc-800 dark:from-zinc-950/60 dark:to-zinc-900/40">
                <div>
                  <h3 className="text-[13px] text-center font-semibold text-zinc-900 dark:text-zinc-50">
                    🏛️ Yönetim Kurulu Karar Talebi
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300 text-center">
                    Yönetim kuruluna iletilecek karar talebini açıklama ve
                    ekleriyle kayıt altına alın.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleYeniKararTalebi}
                    disabled={!selectedSiteId}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ➕ Yeni Talepte Bulun
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

                {!selectedSiteId && (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
                    ⚠️ Site seçilmeden karar işlemi yapılamaz.
                  </div>
                )}
              </div>

              {/* ✅ İletiler (Yeni kart) */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 text-center">
                    📣 İletiler
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300 text-center">
                    Projeye ait bilgilendirme iletileri, duyurular ve yönetim notları.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
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

                {!selectedSiteId && (
                  <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-200 text-center">
                    Site seçilmeden ileti işlemi yapılamaz.
                  </div>
                )}
              </div>

              {/* Ziyaretçi & Güvenlik */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    Ziyaretçi & Güvenlik Kayıtları
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    Kapı giriş-çıkış, ziyaretçi kayıtları ve güvenlik
                    tutanaklarının merkezi takibi.
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
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
              </div>
            </div>

            {/* Pilot bilgi mesajı */}
            {pilotInfo && (
              <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-100">
                {pilotInfo}
              </div>
            )}
          </section>

          <div className="mt-4 border-t border-zinc-200 pt-3 text-[24px] text-center text-white dark:border-zinc-800 dark:text-zinc-400">
            SAYGILARIMIZLA,{" "}
            <span className="font-semibold">EOS MANAGEMENT</span>
          </div>
        </main>
      </div>

      {/* ✅ MODAL */}
      <ProjeDosyaModals
        isOpen={isDosyaModalOpen}
        onClose={() => setIsDosyaModalOpen(false)}
        siteId={selectedSiteId}
        baslik="Dokümanlar"
      />
    </div>
  );
}
