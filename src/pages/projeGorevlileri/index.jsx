// pages/projeGorevlileri/index.jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function ProjeGorevlileriPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600 dark:text-zinc-300">
                    <span>
                      <span className="font-semibold">Kod:</span>{" "}
                      {personel.personelKodu}
                    </span>
                    {personel.kullaniciAdi && (
                      <span>
                        <span className="font-semibold">Kullanıcı:</span>{" "}
                        {personel.kullaniciAdi}
                      </span>
                    )}
                    {personel.telefon && (
                      <span>
                        <span className="font-semibold">Tel:</span>{" "}
                        {personel.telefon}
                      </span>
                    )}
                    {personel.eposta && (
                      <span>
                        <span className="font-semibold">E-posta:</span>{" "}
                        {personel.eposta}
                      </span>
                    )}
                  </div>
                </>
              )}

              {!personel && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  PersonelUserInfo cookie içinde bulunamadı.
                </p>
              )}
            </div>

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

          <div className="mt-4 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            SAYGILARIMIZLA,{" "}
            <span className="font-semibold">EOS MANAGEMENT</span>
          </div>
        </main>
      </div>
    </div>
  );
}
