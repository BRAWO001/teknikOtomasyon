// pages/satinalma/liste.jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

export default function SatinAlmaListePage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------------------------------------------------------
  // Listeyi yükle
  // ------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // backend: GET /api/satinalma
        const data = await getDataAsync("SatinAlma");
        setItems(data || []);
      } catch (err) {
        console.error("SATINALMA LIST ERROR:", err);
        setError("Satın alma listesi alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
              Satın Alma Talepleri
            </h1>
            <p className="text-[12px] text-zinc-500">
              Açılmış tüm satın alma taleelerinin listesi
            </p>
          </div>

          <button
            onClick={() => router.push("/satinalma/yeni")}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            + Yeni Satın Alma Talebi Oluştur
          </button>
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

        {/* Liste */}
        {!loading && items.length === 0 && (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600">
            Henüz kayıtlı satın alma talebi yok.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((x) => {
            const id = x.id ?? x.Id;

            return (
              <Link
                key={id}
                href={`/satinalma/teklifler/${id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                {/* Seri No + Tarih */}
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-sky-700">
                    {x.seriNo ?? x.SeriNo}
                  </span>

                  <span className="text-[10px] text-zinc-500">
                    {formatDate(x.tarih ?? x.Tarih)}
                  </span>
                </div>

                {/* Talep cinsi */}
                <div className="mb-1 text-sm font-semibold text-zinc-900">
                  {x.talepCinsi ?? x.TalepCinsi}
                </div>

                {/* Site */}
                {x.site ? (
                  <div className="text-[11px] text-zinc-600">
                    <span className="font-medium text-zinc-700">Site:</span>{" "}
                    {x.site.ad}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500">
                    Site bilgisi yok
                  </div>
                )}

                {/* Açıklama */}
                {x.aciklama && (
                  <p className="mt-2 line-clamp-2 text-[12px] text-zinc-600">
                    {x.aciklama}
                  </p>
                )}

                <div className="mt-3 flex justify-end">
                  <span className="text-[11px] font-medium text-sky-700">
                    Detayı Gör →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
