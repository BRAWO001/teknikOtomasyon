import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function IletisimPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [infoText, setInfoText] = useState("");

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

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
    }
  };

  // Sadece yeni duyuru aktif
  const handleYeniDuyuru = () => router.push("/iletisimGorevli/YeniDuyuru");

  // Diğer tüm modüller demo / geliştirme aşamasında
  const handleDevelopmentInfo = (featureName) => {
    setInfoText(
      `"${featureName}" modülü şu anda demo sürümde yalnızca görünüm amaçlıdır. Geliştirme aşamasındadır ve yakında aktif edilecektir.`
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto min-h-screen max-w-4xl p-4 flex flex-col gap-3">
        {/* ÜST PANEL */}
        <section className="rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/eos_management_logo.png"
                alt="EOS Management"
                className="h-10 w-auto object-contain rounded-md"
              />

              <div className="flex flex-col gap-1">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  İletişim Paneli
                </p>

                {personel && (
                  <>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Merhaba{" "}
                      <span className="font-bold">
                        {personel?.ad || personel?.Ad}{" "}
                        {personel?.soyad || personel?.Soyad}
                      </span>
                    </p>
                    <p className="text-xs font-extralight text-zinc-900 dark:text-zinc-50">
                      Bu alandan duyuru ve iletişim ekranlarına geçiş
                      yapabilirsiniz.
                    </p>
                  </>
                )}

                <div className="mt-1 inline-flex w-fit rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
                  DEMO SAYFA · GELİŞTİRME AŞAMASINDA
                </div>
              </div>
            </div>

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
              Duyuru ve İletişim Yönetim Paneli
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 text-center">
              Bu bölümden <strong>duyuru</strong>, <strong>doküman</strong> ve{" "}
              <strong>iletişim</strong> işlemlerine ait sayfalara
              geçebilirsiniz.
            </p>

           
          </div>

          {/* HIZLI İŞLEMLER */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleYeniDuyuru}
              className="rounded-md cursor-pointer bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              ➕ Yeni Duyuru Oluştur
            </button>

            <button
              onClick={() => handleDevelopmentInfo("Duyuruları Görüntüle")}
              className="rounded-md cursor-pointer bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              📄 Duyuruları Görüntüle
            </button>
          </div>

          {/* MODÜLLER */}
          <section className="mt-4 space-y-3 w-full">
            <div>
              <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300 text-center">
                Aşağıdaki kartlar üzerinden ilgili iletişim modüllerine
                geçebilirsiniz. Demo sürümde aktif olmayan alanlara tıklandığında
                geliştirme aşaması bilgisi gösterilir.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Duyuru Yönetimi */}
              <div className="flex flex-col justify-center rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="flex items-center justify-center gap-1 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    📢 Duyuru Yönetimi
                  </h3>
                  <p className="mt-1 justify-center text-center text-[11px] text-zinc-600 dark:text-zinc-300">
                    Yeni duyuru oluşturma ve mevcut duyuruları görüntüleme
                    ekranlarına buradan geçebilirsiniz.
                  </p>
                </div>

                <div className="mt-3 flex justify-evenly gap-2 flex-wrap">
                  <button
                    onClick={handleYeniDuyuru}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                  >
                    ➕ Yeni Duyuru
                  </button>

                  <button
                    onClick={() => handleDevelopmentInfo("Duyurular")}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📋 Duyurular
                  </button>
                </div>
              </div>

              {/* Dokümanlar */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold justify-center text-center text-zinc-900 dark:text-zinc-50">
                    📎 Dokümanlar
                  </h3>
                  <p className="mt-1 justify-center text-center text-[11px] text-zinc-600 dark:text-zinc-300">
                    Duyurularda kullanılacak belgeler, ekler ve ortak dosya
                    alanları.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDevelopmentInfo("Dokümanlar")}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📎 Dokümanları Aç
                  </button>
                </div>
              </div>

              {/* Taslaklar */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 p-3 text-xs shadow-sm dark:border-zinc-800 dark:from-zinc-950/60 dark:to-zinc-900/40">
                <div>
                  <h3 className="text-[13px] text-center font-semibold text-zinc-900 dark:text-zinc-50">
                    📝 Taslak Duyurular
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300 text-center">
                    Henüz tamamlanmamış veya daha sonra yayınlanacak taslak
                    duyuruların olduğu ekran.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDevelopmentInfo("Taslak Duyurular")}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📝 Taslakları Gör
                  </button>
                </div>
              </div>

              {/* Planlı Yayınlar */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 text-center">
                    ⏰ Planlı Yayınlar
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300 text-center">
                    Tarih verilerek ileri zamana planlanan yayınlar için geçiş
                    alanı.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDevelopmentInfo("Planlı Yayınlar")}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    📅 Planlı Yayınlar
                  </button>
                </div>
              </div>

              {/* Arşiv */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 text-center">
                    🗂️ Duyuru Arşivi
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300 text-center">
                    Eski, pasif ya da yayını sona ermiş duyuruların arşiv ekranı.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDevelopmentInfo("Duyuru Arşivi")}
                    className="flex items-center cursor-pointer gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    🗂️ Arşivi Gör
                  </button>
                </div>
              </div>

              {/* Hedef Kitle */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    👥 Hedef Kitle / Yayın Grupları
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    Duyuruların gösterileceği kullanıcı grupları ve hedefleme
                    ekranları için geçiş alanı.
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      handleDevelopmentInfo("Hedef Kitle / Yayın Grupları")
                    }
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Kitleleri Görüntüle
                  </button>
                </div>
              </div>

              {/* Raporlar */}
              <div className="flex flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    📊 İletişim Raporları
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    Yayın sayıları, duyuru istatistikleri ve raporlama ekranları
                    için ayrılmış alan.
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDevelopmentInfo("İletişim Raporları")}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Modülü Görüntüle
                  </button>
                </div>
              </div>
            </div>

            {infoText && (
              <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-100">
                {infoText}
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