// src/pages/satinalma/reddedilen.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import SatinAlmaReddedilenItem from "@/components/SatinAlmaReddedilenItem";

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function SatinAlmaReddedilenPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterSiteId, setFilterSiteId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return toDateInputValue(d);
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const d = new Date();
    return toDateInputValue(d);
  });

  // Personel cookie
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) {
        setError("Personel bilgisi bulunamadı. Tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(cookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      setError("Personel bilgisi okunurken hata oluştu.");
      setLoading(false);
    }
  }, []);

  const currentPersonelId = personel ? personel.id ?? personel.Id : null;

  // Siteler
  useEffect(() => {
    const loadSites = async () => {
      try {
        const data = await getDataAsync("SiteAptEvControllerSet/sites");
        setSites(data || []);
      } catch (err) {
        console.error("SITES LOAD ERROR:", err);
      }
    };

    loadSites();
  }, []);

  // Reddedilenler
  const loadItems = async () => {
    if (!currentPersonelId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("personelId", currentPersonelId);

      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      if (filterSiteId) params.append("siteId", filterSiteId);

      const data = await getDataAsync(
        `satinalma/reddedilenler?${params.toString()}`
      );

      setItems(data || []);
    } catch (err) {
      console.error("REDDEDILEN LIST ERROR:", err);
      setError("Reddettiğiniz talepler alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentPersonelId) return;
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersonelId]);

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("tr-TR");
    } catch {
      return iso;
    }
  };

  const formatDateOnly = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("tr-TR");
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Başlık */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Reddettiğim Talepler
            </h1>
            <p className="text-[12px] text-zinc-500">
              Son 14 gün için otomatik filtre uygulanır, isterseniz tarih ve
              site filtresini değiştirebilirsiniz.
            </p>
            {personel && (
              <p className="mt-1 text-[11px] text-zinc-600">
                Personel:{" "}
                <span className="font-medium">
                  {personel.ad} {personel.soyad}
                </span>{" "}
                (ID: {currentPersonelId})
              </p>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <button
              onClick={() => router.push("/satinalma/liste")}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              ← Tüm Satın Alma Talepleri
            </button>
          </div>
        </div>

        {/* Filtre alanı */}
        <div className="mb-4 rounded-md border border-zinc-200 bg-white p-3 text-[12px]">
          <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col">
                <label className="mb-1 text-[11px] font-medium text-zinc-600">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  className="rounded-md border border-zinc-300 px-2 py-1 text-[12px]"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-[11px] font-medium text-zinc-600">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  className="rounded-md border border-zinc-300 px-2 py-1 text-[12px]"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-[11px] font-medium text-zinc-600">
                  Site
                </label>
                <select
                  className="rounded-md border border-zinc-300 px-2 py-1 text-[12px]"
                  value={filterSiteId}
                  onChange={(e) => setFilterSiteId(e.target.value)}
                >
                  <option value="">Tüm Siteler</option>
                  {sites.map((s) => {
                    const id = s.id ?? s.Id;
                    const ad = s.ad ?? s.Ad;
                    return (
                      <option key={id} value={id}>
                        {ad}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex flex-row justify-end gap-2">
              <button
                onClick={loadItems}
                className="rounded-md bg-red-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-red-700"
              >
                Filtrele
              </button>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500">
            Not: Tarih filtresi belge tarihine (Tarih alanı) göre uygulanır.
            Bitiş tarihi dahil olacak şekilde sunucu tarafında filtrelenir.
          </div>
        </div>

        {/* Hata */}
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Yükleniyor */}
        {loading && (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600">
            Yükleniyor...
          </div>
        )}

        {/* Boş liste */}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
            Seçilen tarih ve site filtresine göre reddettiğiniz talep
            bulunamadı.
          </div>
        )}

        {/* Liste */}
        <div className="mt-4 grid gap-4 ">
          {items.map((x) => (
            <SatinAlmaReddedilenItem
              key={x.id ?? x.Id}
              item={x}
              formatDateTime={formatDateTime}
              formatDateOnly={formatDateOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
