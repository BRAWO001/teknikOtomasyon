// ===============================
// src/components/SatinAlmaOnayBekleyenItem.jsx
// ===============================
import Link from "next/link";

export default function SatinAlmaOnayBekleyenItem({
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

  // Bu personelin kaydı (beklemede mi?)
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

  // ⭐ En düşük teklifler (API'den geliyorsa)
  const enDusukTeklifler =
    item.enDusukTeklifler ?? item.EnDusukTeklifler ?? [];

  const teklifOzetText =
    enDusukTeklifler.length === 0
      ? "Teklif girilmemiş"
      : enDusukTeklifler
          .map((t) => {
            const ad = t.tedarikciAdi ?? t.TedarikciAdi ?? "Tedarikçi";
            const pb = t.paraBirimi ?? t.ParaBirimi ?? "TRY";
            const tutar = Number(t.toplamTutar ?? t.ToplamTutar ?? 0);
            return `${ad} ${tutar.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${pb}`;
          })
          .join(" | ");

  return (
    <Link
      href={`/satinalma/teklifler/${id}`}
      className="block border-b border-zinc-200 px-2 py-2 text-[12px] hover:bg-zinc-50"
    >
      {/* 1. SATIR: Sıra No + Seri No + Tarih */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-amber-50 px-2 py-[2px] text-[11px] font-semibold text-amber-700">
            Sıra No: {id}
          </span>
          <span className="text-[11px] font-medium text-zinc-800">
            Seri: {seriNo}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">
          {formatDate(tarih)}
        </span>
      </div>

      {/* 2. SATIR: Talep Cinsi + Site + Talep Eden + Sizin badge */}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-zinc-900">{talepCinsi}</span>

        {site ? (
          <span className="text-zinc-600">
            <span className="font-medium text-zinc-700">Site:</span>{" "}
            {site.ad ?? site.Ad}
          </span>
        ) : (
          <span className="text-zinc-500">Site bilgisi yok</span>
        )}

        {talepEden && (
          <span className="text-zinc-600">
            <span className="font-medium text-zinc-700">Talep Eden:</span>{" "}
            {talepEden.ad ?? talepEden.Ad}{" "}
            {talepEden.soyad ?? talepEden.Soyad}
          </span>
        )}

        {benimOnayimBekleniyor && (
          <span className="rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-medium text-amber-800">
            Sizin onayınız bekleniyor
          </span>
        )}
      </div>

      {/* 3. SATIR: Malzeme, İlk Durum, En düşük teklifler, Not */}
      <div className="mt-1 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-x-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-zinc-600">
            <span className="font-medium">Malzeme:</span> {malzemeSayisi} kalem
          </span>
         
        </div>

        <div className="text-zinc-600">
          <span className="font-medium">En Düşük Teklifler:</span>{" "}
          {teklifOzetText}
        </div>

        {aciklama && (
          <div className="text-zinc-500 line-clamp-1">
            <span className="font-medium">Not:</span> {aciklama}
          </div>
        )}
      </div>
    </Link>
  );
}
