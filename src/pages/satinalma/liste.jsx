// src/pages/satinalma/liste.jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function SatinAlmaListePage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [tamOnaylananlar, setTamOnaylananlar] = useState([]); // Sadece KontrolSatınAlmaTalepleri
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtre state'leri
  const [startDate, setStartDate] = useState(""); // "yyyy-MM-dd"
  const [endDate, setEndDate] = useState(""); // "yyyy-MM-dd"
  const [siteId, setSiteId] = useState("");

  // Site listesi (dropdown için)
  const [sites, setSites] = useState([]);

  // ------------------------------------------------------
  // Personel cookie'sini oku
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // Site listesini çek (filtre dropdown'u için)
  // ------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        const res = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(res || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
        // Hata olsa bile sayfa çalışmaya devam eder
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------------------------------------------
  // KontrolSatınAlmaTalepleri'ni filtrelerle birlikte yükle
  // ------------------------------------------------------
  const fetchKontrolTalepler = async () => {
    try {
      setLoading(true);
      setError(null);

      const qs = [];
      // .NET DateTime? için "yyyy-MM-dd" formatı yeterli
      if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);
      if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);

      const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";

      const url = `satinalma/KontrolSatınAlmaTalepleri${queryString}`;
      const fullApprovedData = await getDataAsync(url);

      setTamOnaylananlar(fullApprovedData || []);
    } catch (err) {
      console.error("KONTROL SATINALMA LIST ERROR:", err);
      setError(
        "Tamamı onaylanmış satın alma talepleri alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  // İlk açılışta (default backend tarih mantığıyla) yükle
  useEffect(() => {
    fetchKontrolTalepler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterApply = async () => {
    await fetchKontrolTalepler();
  };

  const handleFilterReset = async () => {
    setStartDate("");
    setEndDate("");
    setSiteId("");
    await fetchKontrolTalepler();
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "long", // Ocak, Şubat...
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Üst başlık + butonlar */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            {/* Eski başlık ve açıklama kaldırıldı */}
            <p className="text-[11px] text-emerald-800">
              Toplam kayıt sayısı:{" "}
              <span className="font-bold">{tamOnaylananlar.length}</span>
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {/* AnaSayfaya git */}
            <button
              onClick={() => router.push("/")}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100"
            >
              Ana Sayfa
            </button>

            {/* Onay bekleyenler */}
            <button
              onClick={() => router.push("/satinalma/onayBekleyen")}
              className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
            >
              Onay Bekleyen Taleplerim
            </button>

            {/* Onaylananlar */}
            <button
              onClick={() => router.push("/satinalma/onaylananTalepler")}
              className="rounded-md border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
            >
              Onaylanan Talepler
            </button>

            {/* Reddedilenler */}
            <button
              onClick={() => router.push("/satinalma/reddedilen")}
              className="rounded-md border border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
            >
              Reddedilen Talepler
            </button>

            {/* Yeni satın alma */}
            <button
              onClick={() => router.push("/satinalma/yeni")}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              + Yeni Satın Alma Talebi Oluştur
            </button>
          </div>
        </div>

        {/* BAŞLIK + Filtreler kartı */}
        <section className="mb-4 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm">
          <div className="mb-3">
            <h2 className="text-[13px] font-extrabold tracking-wide text-emerald-800">
              TÜM ONAYLARI ALMIŞ TALEPLER
            </h2>
            <p className="mt-1 text-[11px] text-zinc-600">
              Tüm onaylayıcıları tarafından <strong>Onaylandı</strong> durumuna
              getirilmiş talepler.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            {/* Tarih Aralığı */}
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-zinc-700">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-zinc-700">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Site filtresi */}
            <div className="w-full md:w-64">
              <label className="mb-1 block text-[11px] font-medium text-zinc-700">
                Site / Proje
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Tüm Siteler</option>
                {sites.map((s) => {
                  const id = s.id ?? s.Id;
                  const ad = s.ad ?? s.Ad;
                  return (
                    <option key={id} value={id}>
                      {ad || `Site #${id}`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filtre Butonları */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFilterApply}
                disabled={loading}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Filtrele
              </button>
              <button
                type="button"
                onClick={handleFilterReset}
                disabled={loading}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Temizle
              </button>
            </div>
          </div>
        </section>

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
        {!loading && tamOnaylananlar.length === 0 && !error && (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600">
            Filtrelere uygun, tüm onaylayıcıları tarafından onaylanmış talep
            bulunmuyor.
          </div>
        )}

        {/* Tüm onaylayıcıları onaylamış talepler – kartlar */}
        {!loading && !error && tamOnaylananlar.length > 0 && (
          <section className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tamOnaylananlar.map((x) => {
                const id = x.id ?? x.Id;
                const seriNo = x.seriNo ?? x.SeriNo;
                const tarih = x.tarih ?? x.Tarih;
                const talepCinsi = x.talepCinsi ?? x.TalepCinsi;
                const aciklama = x.aciklama ?? x.Aciklama;
                const site = x.site ?? x.Site ?? null;
                const talepEden = x.talepEden ?? x.TalepEden ?? null;
                const toplamOnayciSayisi =
                  x.toplamOnayciSayisi ?? x.ToplamOnayciSayisi ?? 0;
                const malzemeSayisi =
                  x.malzemeSayisi ?? x.MalzemeSayisi ?? null;

                return (
                  <Link
                    key={id}
                    href={`/satinalma/teklifler/${id}`}
                    className="block rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
                  >
                    {/* Seri No + Tarih */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {seriNo}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {formatDate(tarih)}
                      </span>
                    </div>

                    {/* Talep cinsi */}
                    <div className="mb-1 text-sm font-semibold text-zinc-900">
                      {talepCinsi}
                    </div>

                    {/* Site */}
                    {site ? (
                      <div className="text-[11px] text-zinc-600">
                        <span className="font-medium text-zinc-700">Site:</span>{" "}
                        {site.ad ?? site.Ad}
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500">
                        Site bilgisi yok
                      </div>
                    )}

                    {/* Talep Eden */}
                    {talepEden && (
                      <div className="mt-1 text-[11px] text-zinc-600">
                        <span className="font-medium text-zinc-700">
                          Talep Eden:
                        </span>{" "}
                        {talepEden.ad ?? talepEden.Ad}{" "}
                        {talepEden.soyad ?? talepEden.Soyad}
                      </div>
                    )}

                    {/* Bilgi etiketleri */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                      <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-emerald-800">
                        Tüm {toplamOnayciSayisi} onaycı onayladı
                      </span>
                      {malzemeSayisi != null && (
                        <span className="rounded-full bg-zinc-100 px-2 py-[2px]">
                          {malzemeSayisi} kalem malzeme
                        </span>
                      )}
                    </div>

                    {/* Açıklama */}
                    {aciklama && (
                      <p className="mt-2 line-clamp-2 text-[12px] text-zinc-600">
                        {aciklama}
                      </p>
                    )}

                    <div className="mt-3 flex justify-end">
                      <span className="text-[11px] font-medium text-emerald-700">
                        Detayı Gör →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
