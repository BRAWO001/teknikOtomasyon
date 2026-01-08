import Link from "next/link";

export default function SatinalmaKartGrid({ list, theme = "emerald", formatDate }) {
  const border =
    theme === "sky" ? "border-sky-200 hover:border-sky-400" : "border-emerald-200 hover:border-emerald-400";
  const badgeBg =
    theme === "sky" ? "bg-sky-50 text-sky-800" : "bg-emerald-50 text-emerald-800";
  const headText =
    theme === "sky" ? "text-sky-700" : "text-emerald-700";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((x) => {
        const id = x.id ?? x.Id;
        const seriNo = x.seriNo ?? x.SeriNo;
        const tarih = x.tarih ?? x.Tarih;
        const talepCinsi = x.talepCinsi ?? x.TalepCinsi;
        const aciklama = x.aciklama ?? x.Aciklama;
        const site = x.site ?? x.Site ?? null;
        const talepEden = x.talepEden ?? x.TalepEden ?? null;
        const toplamOnayciSayisi =
          x.toplamOnayciSayisi ?? x.ToplamOnayciSayisi ?? 0;
        const malzemeSayisi = x.malzemeSayisi ?? x.MalzemeSayisi ?? null;

        return (
          <Link
            key={id}
            href={`/satinalma/teklifler/${id}`}
            className={`block rounded-xl border ${border} bg-white p-4 shadow-sm transition hover:shadow-md`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold ${headText}`}>
                Sıra No: {id}
              </span>
              <span className={`text-[11px] font-semibold ${headText}`}>
                {seriNo}
              </span>
              <span className="text-[10px] text-zinc-500">{formatDate(tarih)}</span>
            </div>

            <div className="mb-1 text-sm font-semibold text-zinc-900">
              {talepCinsi}
            </div>

            {site ? (
              <div className="text-[11px] text-zinc-600">
                <span className="font-medium text-zinc-700">Site:</span>{" "}
                {site.ad ?? site.Ad}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500">Site bilgisi yok</div>
            )}

            {talepEden && (
              <div className="mt-1 text-[11px] text-zinc-600">
                <span className="font-medium text-zinc-700">Talep Eden:</span>{" "}
                {talepEden.ad ?? talepEden.Ad} {talepEden.soyad ?? talepEden.Soyad}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
              <span className={`rounded-full px-2 py-[2px] ${badgeBg}`}>
                {toplamOnayciSayisi
                  ? `Tüm ${toplamOnayciSayisi} onaycı onayladı`
                  : "Kayıt"}
              </span>
              {malzemeSayisi != null && (
                <span className="rounded-full bg-zinc-100 px-2 py-[2px]">
                  {malzemeSayisi} kalem malzeme
                </span>
              )}
            </div>

            {aciklama && (
              <p className="mt-2 line-clamp-2 text-[12px] text-zinc-600">
                {aciklama}
              </p>
            )}

            <div className="mt-3 flex justify-end">
              <span className={`text-[11px] font-medium ${headText}`}>
                Detayı Gör →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
