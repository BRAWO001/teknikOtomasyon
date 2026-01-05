// src/pages/idariPersonel/onayiBekleyenler.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function IdariPersonelOnayiBekleyenlerPage() {
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

  // Personel cookie (üst bilgi)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      const parsed = JSON.parse(cookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

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

  // İDARİ – Onayı bekleyenler
  // GET: /api/satinalma/idariPersonelSatinAlmaGetir/onayiBekleyenler
  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      if (filterSiteId) params.append("siteId", filterSiteId);

      const data = await getDataAsync(
        `satinalma/idariPersonelSatinAlmaGetir/onayiBekleyenler?${params.toString()}`
      );

      setItems(data || []);
    } catch (err) {
      console.error("IDARI ONAYI BEKLEYEN LIST ERROR:", err);
      setError("Onayı bekleyen idari talepler alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterApply = async () => {
    await loadItems();
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("tr-TR");
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Üst başlık */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              İdari – Onayı Bekleyen Satın Alma Talepleri
            </h1>
            <p className="text-[12px] text-zinc-500">
              En az bir onay kaydı <b>Beklemede</b> ve hiçbir onaycı{" "}
              <b>Reddedildi</b> değil. Yani hâlâ süreçte olan idari talepler.
            </p>
            {personel && (
              <p className="mt-1 text-[11px] text-zinc-600">
                İdari Personel:{" "}
                <span className="font-medium">
                  {personel.ad} {personel.soyad}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <button
              onClick={() => router.push("/idariPersonel")}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              ← Onaylanmış İdari Talepler
            </button>

            <button
              onClick={() => router.push("/idariPersonel/reddedilenler")}
              className="rounded-md border border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
            >
              Reddedilen İdari Talepler →
            </button>
          </div>
        </div>

        {/* Filtre Alanı */}
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
                onClick={handleFilterApply}
                className="rounded-md bg-amber-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-amber-700"
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

        {/* Liste boşsa */}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            Seçilen tarih ve site filtresine göre onayı bekleyen idari talep
            bulunmuyor.
          </div>
        )}

        {/* LİSTE */}
        {!loading && !error && items.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-white divide-y divide-amber-50">
            {items.map((x) => {
              const id = x.id ?? x.Id;
              const seriNo = x.seriNo ?? x.SeriNo;
              const tarih = x.tarih ?? x.Tarih;
              const talepCinsi = x.talepCinsi ?? x.TalepCinsi;
              const aciklama = x.aciklama ?? x.Aciklama;
              const talepEden = x.talepEden ?? x.TalepEden;
              const site = x.site ?? x.Site;
              const malzemeSayisi = x.malzemeSayisi ?? x.MalzemeSayisi;

              return (
                <div
                  key={id}
                  className="px-3 py-2 flex flex-col gap-1 hover:bg-amber-50/60"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-zinc-500">
                        #{id} • {seriNo}
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {talepCinsi}
                      </div>
                      {aciklama && (
                        <div className="text-[12px] text-zinc-600">
                          {aciklama}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-zinc-500">
                      <div>{formatDate(tarih)}</div>
                      {site && (
                        <div>
                          Site:{" "}
                          <span className="font-medium">
                            {site.ad ?? site.Ad}
                          </span>
                        </div>
                      )}
                      <div>Malzeme sayısı: {malzemeSayisi}</div>
                    </div>
                  </div>

                  {talepEden && (
                    <div className="mt-1 text-[11px] text-zinc-600">
                      Talep Eden:{" "}
                      <span className="font-medium">
                        {talepEden.ad ?? talepEden.Ad}{" "}
                        {talepEden.soyad ?? talepEden.Soyad}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
