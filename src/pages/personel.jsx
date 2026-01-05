// pages/personel.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";

function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

// Filtre tipleri – eşit ve büyük mantığı
const STATUS_FILTERS = [
  { key: "ALL", label: "Tümü", description: "Tüm iş emirleri (0–100%)" },

  {
    key: "S10",
    value: 10,
    label: "Beklemede",
    description: "Durum kodu 10 ve üzeri",
  },
  {
    key: "S20",
    value: 20,
    label: "Onaylandı",
    description: "Durum kodu 20 ve üzeri",
  },
  {
    key: "S30",
    value: 30,
    label: "%30",
    description: "Durum kodu 30 ve üzeri",
  },
  {
    key: "S50",
    value: 50,
    label: "%50",
    description: "Durum kodu 50 ve üzeri",
  },
  {
    key: "S75",
    value: 75,
    label: "%75",
    description: "Durum kodu 75 ve üzeri",
  },
  {
    key: "S90",
    value: 90,
    label: "%90",
    description: "Durum kodu 90 ve üzeri",
  },
  {
    key: "S100",
    value: 100,
    label: "%100",
    description: "Sadece tamamlanmışlar (100)",
  },
];

// Seçilen filtreye göre backend endpoint path'ini oluştur
function buildPath(personelId, statusFilter) {
  let min = 0;
  let max = 100;

  if (statusFilter !== "ALL") {
    const f = STATUS_FILTERS.find((x) => x.key === statusFilter);
    const code = f?.value;
    if (code != null) {
      // Eşit ve büyük: min = code, max = 100
      min = code;
      max = 100;
    }
  }

  // Backend: [HttpGet("{personelId:int}/is-emirleriDurumu")]
  // → /api/Personeller/{personelId}/is-emirleriDurumu?minProgress=&maxProgress=
  return `personeller/${personelId}/is-emirleriDurumu?minProgress=${min}&maxProgress=${max}`;
}

export default function PersonelPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [authToken, setAuthToken] = useState("");

  const [isEmirleri, setIsEmirleri] = useState([]); // backend filtreli liste
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | S10 | S20 | ...

  // Cookie'den personel + token
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const personelCookie = getClientCookie("PersonelUserInfo");
      if (personelCookie) {
        const parsed = JSON.parse(personelCookie); // doğrudan personel objesi
        setPersonel(parsed);
      }
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }

    try {
      const tokenCookie = getClientCookie("AuthToken_01");
      if (tokenCookie) {
        setAuthToken(tokenCookie);
      }
    } catch (err) {
      console.error("AuthToken_01 read error:", err);
    }
  }, []);

  // Personel + filtre değiştiğinde → backend'den o filtreye göre iş emirlerini çek
  useEffect(() => {
    if (!personel?.id) return;

    const fetchIsEmirleri = async () => {
      try {
        setLoading(true);
        setError(null);

        const path = buildPath(personel.id, statusFilter);
        const data = await getDataAsync(path);
        const list = Array.isArray(data) ? data : data ? [data] : [];

        // Tarihe göre sıralama (en yeni en üstte)
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a.olusturmaTarihiUtc || a.OlusturmaTarihiUtc || 0);
          const db = new Date(b.olusturmaTarihiUtc || b.OlusturmaTarihiUtc || 0);
          return db - da;
        });

        setIsEmirleri(sorted);
      } catch (err) {
        console.error("Personel iş emirleri yüklenirken hata:", err);
        setError(err.message || "Bilinmeyen bir hata oluştu.");
        setIsEmirleri([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIsEmirleri();
  }, [personel?.id, statusFilter]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
    }
  };

  const handleRefresh = async () => {
    if (!personel?.id) return;

    try {
      setLoading(true);
      setError(null);

      const path = buildPath(personel.id, statusFilter);
      const data = await getDataAsync(path);
      const list = Array.isArray(data) ? data : data ? [data] : [];

      const sorted = [...list].sort((a, b) => {
        const da = new Date(a.olusturmaTarihiUtc || a.OlusturmaTarihiUtc || 0);
        const db = new Date(b.olusturmaTarihiUtc || b.OlusturmaTarihiUtc || 0);
        return db - da;
      });

      setIsEmirleri(sorted);
    } catch (err) {
      console.error("Personel iş emirleri yenilenirken hata:", err);
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      setIsEmirleri([]);
    } finally {
      setLoading(false);
    }
  };

  const activeFilterObj =
    STATUS_FILTERS.find((f) => f.key === statusFilter) || STATUS_FILTERS[0];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto min-h-screen max-w-6xl p-4 flex flex-col gap-4">
        {/* ÜST PANEL – PERSONEL BİLGİ + ÇIKIŞ */}
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Personel Paneli
              </p>
              <p className="text-sm font-medium">
                {personel
                  ? `${personel.ad} ${personel.soyad}`
                  : "Personel Bilgisi"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="self-start rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 sm:self-auto"
            >
              Çıkış Yap
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Personel bilgileri */}
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-zinc-700 dark:text-zinc-100">
                PersonelUserInfo
              </p>
              {personel ? (
                <div className="space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <p>
                    <span className="font-medium">ID:</span> {personel.id}
                  </p>
                  <p>
                    <span className="font-medium">Kod:</span>{" "}
                    {personel.personelKodu}
                  </p>
                  <p>
                    <span className="font-medium">Ad Soyad:</span>{" "}
                    {personel.ad} {personel.soyad}
                  </p>
                  <p>
                    <span className="font-medium">E-posta:</span>{" "}
                    {personel.eposta}
                  </p>
                  <p>
                    <span className="font-medium">Telefon:</span>{" "}
                    {personel.telefon}
                  </p>
                  <p>
                    <span className="font-medium">Kullanıcı Adı:</span>{" "}
                    {personel.kullaniciAdi}
                  </p>
                  <p>
                    <span className="font-medium">Rol:</span> {personel.rol}
                  </p>
                  <p>
                    <span className="font-medium">Aktif mi?:</span>{" "}
                    {personel.aktifMi ? "Evet" : "Hayır"}
                  </p>
                  {personel.olusturmaTarihiUtc && (
                    <p>
                      <span className="font-medium">Oluşturma Tarihi:</span>{" "}
                      {formatTR(personel.olusturmaTarihiUtc)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  PersonelUserInfo cookie içinde bulunamadı.
                </p>
              )}
            </div>

            {/* Sağ blok (şimdilik boş) */}
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-zinc-700 dark:text-zinc-100">
                {/* İstersen buraya toplam iş sayısı vb. koyabilirsin */}
              </p>
            </div>
          </div>
        </section>

        {/* PERSONELE ATANMIŞ İŞ EMİRLERİ */}
        <main className="flex-1 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Filtre bar – % butonları */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                Atandığım İş Emirleri
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Aktif filtre:{" "}
                <span className="font-semibold">{activeFilterObj.label}</span>{" "}
                – {activeFilterObj.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((f) => {
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
                disabled={loading || !personel?.id}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Yenile
              </button>
            </div>
          </div>

          {/* İçerik durumları */}
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
            <div className="mt-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                {isEmirleri.map((item) => (
                  <TeknikIsEmriCard
                    key={item.isEmriId || item.id}
                    data={{
                      // endpointten gelen property'leri kartın beklediği isimlere mapliyoruz
                      id: item.isEmriId || item.id,
                      kod: item.isEmriKod || item.kod,
                      kisaBaslik: item.kisaBaslik,
                      aciklama: item.aciklama,
                      olusturmaTarihiUtc:
                        item.olusturmaTarihiUtc || item.OlusturmaTarihiUtc,
                      konum: item.konum,
                      site: item.site,
                      apt: item.apt,
                      ev: item.ev,
                      // bu alanlar backend listesinde yoksa boş geçilecek
                      dosyalar: item.dosyalar || [],
                      personeller: item.personeller || [],
                      notlar: item.notlar || [],
                      malzemeler: item.malzemeler || [],
                      // durum kodu (progress bar için)
                      DurumKod: item.durumKod ?? item.DurumKod,
                    }}
                    currentPersonelId={personel?.id}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
