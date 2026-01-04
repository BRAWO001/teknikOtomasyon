// src/components/SatinAlmaListItem.jsx
import Link from "next/link";

export default function SatinAlmaListItem({
  item,
  currentPersonelId,
  formatDate,
}) {
  const id = item.id ?? item.Id;
  const seriNo = item.seriNo ?? item.SeriNo;
  const tarih = item.tarih ?? item.Tarih;
  const talepCinsi = item.talepCinsi ?? item.TalepCinsi;
  const aciklama = item.aciklama ?? item.Aciklama;
  const site = item.site ?? item.Site ?? null;
  const malzemeSayisi = item.malzemeSayisi ?? item.MalzemeSayisi ?? 0;
  const ilkOnayDurumu = item.ilkOnayDurumu ?? item.IlkOnayDurumu ?? "–";
  const talepEden = item.talepEden ?? item.TalepEden ?? null;
  const onaylayanlar =
    item.onaylayanPersoneller ?? item.OnaylayanPersoneller ?? [];

  // Bu satırda bu personelin onayı bekliyor mu?
  let benimKaydim = null;
  if (currentPersonelId) {
    benimKaydim = onaylayanlar.find((o) => {
      const pid =
        o.personelId ??
        o.PersonelId ??
        o.personel?.id ??
        o.Personel?.Id;
      const durumKod = o.durumKod ?? o.DurumKod ?? null;
      return pid === currentPersonelId && (durumKod === 0 || durumKod === null);
    });
  }

  const benimOnayimBekleniyor = !!benimKaydim;

  // Tedarikçi Top 3 (backend'den gelen)
  const tedarikciTop3 =
    item.tedarikciTop3 ?? item.TedarikciTop3 ?? [];

  return (
    <Link
      href={`/satinalma/teklifler/${id}`}
      className="block px-3 py-2 text-[12px] hover:bg-zinc-50"
    >
      {/* 1. satır: Talep cinsi + tarih */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold text-zinc-900">
            {talepCinsi}
          </span>
          <span className="text-[10px] text-zinc-500">
            (Sıra No: {id} · Seri: {seriNo})
          </span>
        </div>
        <span className="shrink-0 text-[10px] text-zinc-500">
          {formatDate(tarih)}
        </span>
      </div>

      {/* 2. satır: Site + Talep Eden + Malzeme sayısı + İlk onay durumu */}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-600">
        <span>
          <span className="font-medium text-zinc-700">Site:</span>{" "}
          {site ? site.ad ?? site.Ad : "Yok"}
        </span>

        {talepEden && (
          <span>
            <span className="font-medium text-zinc-700">
              Talep Eden:
            </span>{" "}
            {talepEden.ad ?? talepEden.Ad}{" "}
            {talepEden.soyad ?? talepEden.Soyad}
          </span>
        )}

        <span>
          {malzemeSayisi} kalem malzeme
        </span>

        <span>
          İlk Onay Durumu: {ilkOnayDurumu}
        </span>
      </div>

      {/* 3. satır: Sizin onayınız + Tedarikçi Top 3 */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {benimOnayimBekleniyor && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-medium text-amber-800">
            Sizin onayınız bekleniyor
          </span>
        )}

        {tedarikciTop3.length > 0 && (
          <span className="text-[11px] text-zinc-600">
            <span className="font-medium text-zinc-700">
              Tedarikçi Top 3:
            </span>{" "}
            {tedarikciTop3
              .map((t, idx) => {
                const ad = t.tedarikciAdi ?? t.TedarikciAdi ?? "Tedarikçi";
                const toplam = t.toplamTutar ?? t.ToplamTutar ?? 0;
                const pb = t.paraBirimi ?? t.ParaBirimi ?? "";
                return `${idx + 1}) ${ad}: ${Number(
                  toplam
                ).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} ${pb}`;
              })
              .join(" | ")}
          </span>
        )}
      </div>

      {/* Açıklama (isteğe bağlı, 4. satır gibi) */}
      {aciklama && (
        <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
          {aciklama}
        </p>
      )}
    </Link>
  );
}
