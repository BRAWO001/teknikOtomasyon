// pages/projeGorevlileri/index.jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function ProjeGorevlileriPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  // Pilot modüller için uyarı mesajı
  const [pilotInfo, setPilotInfo] = useState("");

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

  // Yeni satın alma talebi → satinalma/yeni.jsx
  const handleYeniTalep = () => {
    router.push("/satinalma/yeni");
  };

  // Taleplerim → aynı klasör altındaki sayfa
  const handleTaleplerim = () => {
    router.push("/projeGorevlileri/taleplerim");
  };

  // Pilot modüller: sadece bilgilendirme gösterecek
  const handlePilotFeatureClick = (featureName) => {
    setPilotInfo(
      `Şimdilik pilot deneme süreci olduğu için "${featureName}" modülü buradan hizmet verememektedir.`
    );
  };

  // PersonelUserInfo cookie kontrolü
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto min-h-screen max-w-4xl p-4 flex flex-col gap-3">
        {/* ÜST PANEL */}

        <section className="rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* LOGO + BAŞLIK */}
            <div className="flex items-center gap-3">
              <img
                src="/eos_management_logo.png"
                alt="EOS Management"
                className="h-10 w-auto object-contain"
              />

              <div className="flex flex-col gap-1">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Proje Görevlileri Paneli
                </p>

                {personel && (
                  <>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Merhaba değerli personelimiz{" "}
                      <span className="font-bold">
                        {personel.ad} {personel.soyad}
                      </span>
                      ,
                    </p>
                    <p className="text-[12px] text-zinc-600 dark:text-zinc-300">
                      Bu sayfada şimdilik sadece{" "}
                      <strong>satın alma talepleri</strong> oluşturabilir ve
                      oluşturduğunuz talepleri <strong>Taleplerim</strong>{" "}
                      ekranından kontrol edebilirsiniz.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ÇIKIŞ BUTONU */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </section>

        {/* ANA İÇERİK */}
        <main className="flex-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Satın Alma Talepleri
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Bu bölümden yeni satın alma talebi oluşturabilir ve daha önce
              oluşturduğunuz talepleri görebilirsiniz.
            </p>
          </div>

          {/* Mevcut iki buton */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleYeniTalep}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Yeni Satın Alma Talebi Oluştur
            </button>

            <button
              onClick={handleTaleplerim}
              className="rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Taleplerim
            </button>
          </div>

          {/* Profesyonel site yönetimi için diğer modüller (pilot) */}
          <section className="mt-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Diğer Site Yönetimi Modülleri
              </h2>
              <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300">
                Aşağıdaki modüller profesyonel site yönetimi için
                planlanmaktadır. Şu an pilot deneme sürecinde olduğundan sadece
                bilgilendirme amaçlı gösterilmektedir.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Arıza & İş Emirleri */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    Arıza & İş Emirleri
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    Site içindeki tüm arıza ve bakım taleplerinin takibi, iş
                    emirleri ve teknisyen görevlendirmeleri.
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      handlePilotFeatureClick("Arıza & İş Emirleri")
                    }
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Modülü Görüntüle
                  </button>
                </div>
              </div>

              {/* Duyurular & Dokümanlar */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    Duyurular & Dokümanlar
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    Yönetim duyuruları, karar defterleri, toplantı tutanakları
                    ve önemli dokümanların paylaşımı.
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      handlePilotFeatureClick("Duyurular & Dokümanlar")
                    }
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Modülü Görüntüle
                  </button>
                </div>
              </div>

              {/* Gelir Gider & Faturalar */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    Gelir Gider & Faturalar
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    Aidat, tahsilat, gider kalemleri ve fatura hareketlerinin
                    detaylı takibi.
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      handlePilotFeatureClick("Gelir Gider & Faturalar")
                    }
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Modülü Görüntüle
                  </button>
                </div>
              </div>

              {/* Ziyaretçi & Güvenlik Kayıtları */}
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
    </div>
  );
}
