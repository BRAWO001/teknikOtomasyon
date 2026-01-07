// ===============================
// src/components/SatinAlmaOnaylananItem.jsx
// ===============================
import Link from "next/link";

export default function SatinAlmaOnaylananItem({
  item,
  formatDateTime,
  formatDateOnly,
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

  const benimOnayKaydim =
    item.benimOnayKaydim ?? item.BenimOnayKaydim ?? null;

  const benimDurumAd =
    benimOnayKaydim?.durumAd ?? benimOnayKaydim?.DurumAd ?? "";
  const onayTarihiUtc =
    benimOnayKaydim?.onayTarihiUtc ??
    benimOnayKaydim?.OnayTarihiUtc ??
    null;

  // ⭐ En düşük teklifler (API'den gelen)
  const enDusukTeklifler =
    item.enDusukTeklifler ?? item.EnDusukTeklifler ?? [];

  return (
    <Link
      href={`/satinalma/teklifler/${id}`}
      className="block border-b border-emerald-200 px-2 py-2 text-[12px] hover:bg-emerald-50"
    >
      {/* 1. SATIR: Sıra No + Seri No + Tarih */}
      <div className="flex flex-wrap items-center justify-between  gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-emerald-50 px-2 py-[2px] text-[11px] font-semibold text-emerald-700">
            Sıra No: {id}
          </span>
          <span className="text-[11px] font-medium text-zinc-800">
            Seri: {seriNo}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">
          {formatDateTime(tarih)}
        </span>
      </div>

      {/* 2. SATIR: Talep Cinsi + Site + Talep Eden + Sizin sonucunuz */}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-zinc-900">{talepCinsi}</span>

        {site ? (
          <span className="text-zinc-600">
            <span className="font-medium text-zinc-700">Site:</span>{" "}
            <span className="font-semibold">
              {site.ad ?? site.Ad}
            </span>
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

        {benimOnayKaydim && (
          <span className="rounded-full bg-emerald-100 px-2 py-[2px] text-[11px] font-medium text-emerald-800">
            Sizin sonucunuz: {benimDurumAd}{" "}
            {onayTarihiUtc && (
              <span className="text-[10px] text-emerald-700">
                ({formatDateOnly(onayTarihiUtc)})
              </span>
            )}
          </span>
        )}
      </div>

      {/* 3. SATIR: Malzeme, En düşük teklifler, Not */}
      <div className="mt-1 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-x-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-zinc-600">
            <span className="font-medium">Malzeme:</span> {malzemeSayisi} kalem
          </span>
        </div>

        {/* En düşük teklifler – satır satır ve kalın */}
        <div className="text-zinc-600">
          <span className="font-medium block">En Düşük Teklifler:</span>
          {enDusukTeklifler.length === 0 ? (
            <span>Teklif girilmemiş</span>
          ) : (
            <div className="mt-0.5 flex flex-col">
              {enDusukTeklifler.map((t, idx) => {
                const ad = t.tedarikciAdi ?? t.TedarikciAdi ?? "Tedarikçi";
                const pb = t.paraBirimi ?? t.ParaBirimi ?? "TRY";
                const tutar = Number(t.toplamTutar ?? t.ToplamTutar ?? 0);

                return (
                  <span key={idx} className="font-semibold">
                    {ad}{" "}
                    {tutar.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {pb}
                  </span>
                );
              })}
            </div>
          )}
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
