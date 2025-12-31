




// pages/teknikMudur.jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

// Yüzdesel durum filtreleri (eşit ve üzeri)
const DURUM_PROGRESS_FILTERS = [
  { key: "ALL", min: 0, label: "Tümü", description: "0–100% tüm iş emirleri" },
  { key: "P10", min: 10, label: "%10+", description: "%10 ve üzeri" },
  { key: "P20", min: 20, label: "%20+", description: "%20 ve üzeri" },
  { key: "P30", min: 30, label: "%30+", description: "%30 ve üzeri" },
  { key: "P50", min: 50, label: "%50+", description: "%50 ve üzeri" },
  { key: "P75", min: 75, label: "%75+", description: "%75 ve üzeri" },
  { key: "P90", min: 90, label: "%90+", description: "%90 ve üzeri" },
  { key: "P100", min: 100, label: "%100", description: "Sadece %100" },
];

// Backend path builder
function buildPath(statusFilterKey) {
  const f =
    DURUM_PROGRESS_FILTERS.find((x) => x.key === statusFilterKey) ||
    DURUM_PROGRESS_FILTERS[0];

  const min = f.min ?? 0;
  const max = 100; // hep eşit ve üzeri istediğin için üst sınırı 100 bırakıyoruz
  return `is-emirleri/durum-filtre?minProgress=${min}&maxProgress=${max}`;
}

export default function TeknikMudurPage() {
  const router = useRouter();

  // İş emri state'leri
  const [isEmirleri, setIsEmirleri] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | P10 | P20 | ...

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Üst panel state'leri (cookie)
  const [personel, setPersonel] = useState(null); // 👈 direkt personel objesi

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

  // Üst panel: PersonelUserInfo (cookie)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (personelCookie) {
        const parsed = JSON.parse(personelCookie); // 👈 doğrudan personel objesi
        setPersonel(parsed);
      }
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []); // sadece ilk render'da

  const fetchIsEmirleri = async (filterKey) => {
    try {
      setLoading(true);
      setError(null);

      const path = buildPath(filterKey);
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

  // Filtre değiştiğinde otomatik yükle
  useEffect(() => {
    fetchIsEmirleri(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Manuel yenile
  const handleRefresh = async () => {
    await fetchIsEmirleri(statusFilter);
  };

  const activeFilterObj =
    DURUM_PROGRESS_FILTERS.find((f) => f.key === statusFilter) ||
    DURUM_PROGRESS_FILTERS[0];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto min-h-screen max-w-6xl p-4 flex flex-col gap-3">
        {/* ÜSTTE ÇOK SIKIŞIK PERSONEL PANELİ */}
        <section className="rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Teknik Müdür Paneli
                </p>
                {personel && (
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    {personel.ad} {personel.soyad} – {personel.rol}
                  </span>
                )}
              </div>

              {personel && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600 dark:text-zinc-300">
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
              )}

              {!personel && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  PersonelUserInfo cookie içinde bulunamadı.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNewIsEmri}
                className="rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
              >
                Yeni İş Emri Ekle
              </button>
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </section>

        {/* ALTA GENİŞ TEKNİK İŞ EMİRLERİ */}
        <main className="flex-1 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                Teknik İş Emirleri
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Aktif filtre:{" "}
                <span className="font-semibold">
                  {activeFilterObj.label}
                </span>{" "}
                – {activeFilterObj.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {DURUM_PROGRESS_FILTERS.map((f) => {
                const isActive = statusFilter === f.key;

                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={[
                      "rounded-md border px-3 py-1 text-xs sm:text-sm transition",
                      "dark:border-zinc-700",
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                );
              })}

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Yenile
              </button>
            </div>
          </div>

          {/* Duruma göre içerik */}
          {loading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              İş emirleri yükleniyor...
            </p>
          )}

          {error && !loading && (
            <p className="text-sm text-red-600">
              İş emirleri yüklenirken hata: {error}
            </p>
          )}

          {!loading && !error && isEmirleri.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Bu filtreye uygun iş emri bulunamadı.
            </p>
          )}

          {!loading && !error && isEmirleri.length > 0 && (
            <div className="mt-3 max-h-[70vh] overflow-y-auto ">
              {/* 3 sütunlu geniş grid */}
              <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
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
