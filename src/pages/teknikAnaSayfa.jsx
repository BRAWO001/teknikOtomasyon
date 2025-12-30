import { useEffect, useState } from "react";
import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";
import { getDataAsync } from "@/utils/apiService"; // kendi yoluna göre ayarla

// Backend enum ile birebir eşleşen frontend listesi
const IS_EMRI_DURUMLARI = [
  { value: 10, label: "Beklemede" },
  { value: 20, label: "Onaylandı" },
  { value: 30, label: "İşe Başlandı" },
  { value: 60, label: "İş Bitirildi" },
  { value: 90, label: "İptal Edildi" },
];

export default function TeknikAnaSayfa() {
  const [isEmirleri, setIsEmirleri] = useState([]);
  // 🔹 Sayfa açılınca default durum: 10 (Beklemede)
  const [selectedDurum, setSelectedDurum] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Seçilen duruma göre veriyi çek
  useEffect(() => {
    if (!selectedDurum) return;

    const fetchIsEmirleri = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getDataAsync(`is-emirleri/durum/${selectedDurum}`);
        const list = Array.isArray(data) ? data : [data];
        setIsEmirleri(list);
      } catch (err) {
        console.error("İş emirleri yüklenirken hata:", err);
        setError(err.message || "Bilinmeyen bir hata oluştu.");
        setIsEmirleri([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIsEmirleri();
  }, [selectedDurum]);

  // Manuel yenile butonu (seçili durum varken tekrar çağırır)
  const handleRefresh = async () => {
    if (!selectedDurum) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getDataAsync(`is-emirleri/durum/${selectedDurum}`);
      const list = Array.isArray(data) ? data : [data];
      setIsEmirleri(list);
    } catch (err) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      setIsEmirleri([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-3 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Teknik İş Emirleri
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {IS_EMRI_DURUMLARI.map((d) => {
                const isActive = selectedDurum === d.value;

                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDurum(d.value)}
                    className={[
                      "rounded-md border px-3 py-1 text-sm transition",
                      "dark:border-zinc-700",
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {d.label}
                  </button>
                );
              })}

              {/* Yenile butonu */}
              <button
                onClick={handleRefresh}
                disabled={!selectedDurum || loading}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Yükleniyor durumu */}
        {loading && selectedDurum && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            İş emirleri yükleniyor...
          </p>
        )}

        {/* Hata durumu */}
        {error && !loading && selectedDurum && (
          <p className="text-sm text-red-600">
            İş emirleri yüklenirken hata: {error}
          </p>
        )}

        {/* Veri yoksa */}
        {!loading && !error && selectedDurum && isEmirleri.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Seçilen durumda iş emri bulunamadı.
          </p>
        )}

        {/* Veri varsa kartlar */}
        {!loading && !error && selectedDurum && isEmirleri.length > 0 && (
          <div className="flex flex-col gap-15 overflow-y-auto pb-2">
            {isEmirleri.map((item) => (
              <TeknikIsEmriCard key={item.id} data={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
