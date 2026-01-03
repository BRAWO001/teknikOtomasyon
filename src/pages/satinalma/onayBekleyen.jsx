// src/pages/satinalma/onayBekleyen.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function SatinAlmaOnayBekleyenPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------------------------------------------------------
  // Personel cookie'sini oku
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // Onay bekleyenleri yükle (personelId ile)
  // ------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      if (!personel) return;
      const personelId = personel.id ?? personel.Id;
      if (!personelId) {
        setError("Personel Id bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // backend: GET /api/satinalma/onayBekleyenler?personelId=XX
        const data = await getDataAsync(
          `satinalma/onayBekleyenler?personelId=${personelId}`
        );
        setItems(data || []);
      } catch (err) {
        console.error("ONAY BEKLEYEN LIST ERROR:", err);
        setError("Onay bekleyen talepler alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [personel]);

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("tr-TR");
    } catch {
      return iso;
    }
  };

  const currentPersonelId = personel
    ? personel.id ?? personel.Id
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Üst başlık */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Onay Bekleyen Satın Alma Taleplerim
            </h1>
            <p className="text-[12px] text-zinc-500">
              Sizin onayınızı bekleyen satın alma taleplerinin listesi
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
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            Şu anda sizin onayınızı bekleyen satın alma talebi bulunmuyor.
          </div>
        )}

        {/* Kartlar */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((x) => {
            const id = x.id ?? x.Id;
            const seriNo = x.seriNo ?? x.SeriNo;
            const tarih = x.tarih ?? x.Tarih;
            const talepCinsi = x.talepCinsi ?? x.TalepCinsi;
            const aciklama = x.aciklama ?? x.Aciklama;
            const site = x.site ?? x.Site ?? null;
            const malzemeSayisi = x.malzemeSayisi ?? x.MalzemeSayisi ?? 0;
            const ilkOnayDurumu =
              x.ilkOnayDurumu ?? x.IlkOnayDurumu ?? "–";

            const talepEden = x.talepEden ?? x.TalepEden ?? null;

            const benimOnayKaydim =
              x.benimOnayKaydim ?? x.BenimOnayKaydim ?? null;

            const sira =
              benimOnayKaydim?.sira ?? benimOnayKaydim?.Sira ?? null;

            const onaylayanlar =
              x.onaylayanPersoneller ?? x.OnaylayanPersoneller ?? [];

            const onayDurumText =
              onaylayanlar.length === 0
                ? "Onaylayan personel atanmamış."
                : onaylayanlar
                    .map((o) => {
                      const p = o.personel ?? o.Personel ?? {};
                      const adSoyad = `${p.ad ?? p.Ad ?? ""} ${
                        p.soyad ?? p.Soyad ?? ""
                      }`.trim();
                      const durumAd = o.durumAd ?? o.DurumAd ?? "";
                      return adSoyad
                        ? `${adSoyad} (${durumAd})`
                        : `(${durumAd})`;
                    })
                    .join(", ");

            return (
              <Link
                key={id}
                href={`/satinalma/teklifler/${id}`}
                className="block rounded-xl border border-amber-300 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                {/* Üst satır: seri + tarih */}
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-amber-700">
                    {seriNo}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formatDate(tarih)}
                  </span>
                </div>

                {/* Talep Cinsi */}
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

                {/* Malzeme sayısı + ilk onay durumu */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px]">
                    {malzemeSayisi} kalem malzeme
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px]">
                    İlk Onay Durumu: {ilkOnayDurumu}
                  </span>
                </div>

                {/* Bu sizin onay kaydınız badge */}
                {benimOnayKaydim && (
                  <div className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-[3px] text-[11px] font-medium text-amber-800">
                    Sizin onayınız bekleniyor
                    {sira ? ` (Sıra: ${sira})` : ""}.
                  </div>
                )}

                {/* Onaylayanlar listesi */}
                <div className="mt-2 rounded-md bg-zinc-50 px-2 py-1">
                  <div className="text-[11px] font-medium text-zinc-700">
                    Onaylayan / Onaylayacak Personeller:
                  </div>
                  <div className="text-[11px] text-zinc-600">
                    {onayDurumText}
                  </div>
                </div>

                {/* Açıklama */}
                {aciklama && (
                  <p className="mt-2 line-clamp-2 text-[12px] text-zinc-600">
                    {aciklama}
                  </p>
                )}

                <div className="mt-3 flex justify-end">
                  <span className="text-[11px] font-medium text-amber-700">
                    Detayı Gör ve Onayla →
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
