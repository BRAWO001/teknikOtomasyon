import Link from "next/link";

export default function IdariOnaylananGrid({ list, formatDate }) {
  if (!list || list.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((x) => {
          const id = x.id ?? x.Id;
          const seriNo = x.seriNo ?? x.SeriNo;
          const tarih = x.tarih ?? x.Tarih;
          const talepCinsi = x.talepCinsi ?? x.TalepCinsi;
          const aciklama = x.aciklama ?? x.Aciklama;
          const site = x.site ?? x.Site ?? null;
          const talepEden = x.talepEden ?? x.TalepEden ?? null;
          const toplamOnayciSayisi = x.toplamOnayciSayisi ?? x.ToplamOnayciSayisi ?? 0;
          const malzemeSayisi = x.malzemeSayisi ?? x.MalzemeSayisi ?? null;

          return (
            <Link
              key={id}
              href={`/satinalma/teklifler/${id}`}
              className="block rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-emerald-700 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Sıra No: {id}
                </span>

                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {seriNo}
                </span>

                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {formatDate(tarih)}
                </span>
              </div>

              <div className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {talepCinsi}
              </div>

              {site ? (
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">
                    Site:
                  </span>{" "}
                  {site.ad ?? site.Ad}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Site bilgisi yok
                </div>
              )}

              {talepEden && (
                <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">
                    Talep Eden:
                  </span>{" "}
                  {talepEden.ad ?? talepEden.Ad} {talepEden.soyad ?? talepEden.Soyad}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  Tüm {toplamOnayciSayisi} onaycı onayladı
                </span>
                {malzemeSayisi != null && (
                  <span className="rounded-full bg-zinc-100 px-2 py-[2px] dark:bg-zinc-800">
                    {malzemeSayisi} kalem malzeme
                  </span>
                )}
              </div>

              {aciklama && (
                <p className="mt-2 line-clamp-2 text-[12px] text-zinc-600 dark:text-zinc-300">
                  {aciklama}
                </p>
              )}

              <div className="mt-3 flex justify-end">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Detayı Gör →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
