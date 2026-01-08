import { formatKaynak } from "./IsEmriDetayHelpers";

export default function IsEmriDetayMalzemeler({
  malzemeler = [],
  kdvIncluded,
  onToggleKdv,
  onAddMalzeme,
}) {
  const toplamNetTutar = malzemeler.reduce((acc, m) => {
    const birim = Number(m.birimFiyat ?? 0);
    const adet = Number(m.adet ?? 0);
    return acc + birim * adet;
  }, 0);

  const toplamTutarGosterilen = kdvIncluded ? toplamNetTutar * 1.2 : toplamNetTutar;

  const toplamMalzemeAdet = malzemeler.length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
            Malzeme / İşçilik
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Genel Tutar:{" "}
            <span className="font-semibold">₺ {toplamTutarGosterilen.toFixed(2)}</span>{" "}
            <span className="text-[10px]">
              ({kdvIncluded ? "KDV %20 dahil" : "KDV hariç"})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 print:hidden">
          <button
            type="button"
            onClick={onToggleKdv}
            className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {kdvIncluded ? "KDV hariç göster" : "KDV dahil göster"}
          </button>

          <button
            type="button"
            onClick={onAddMalzeme}
            className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Malzeme ekle
          </button>
        </div>
      </div>

      {malzemeler.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Malzeme eklenmemiş.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="pb-1 pr-2 text-left">Malzeme</th>
                <th className="pb-1 px-2 text-left">Kaynak</th>
                <th className="pb-1 px-2 text-right">Adet</th>
                <th className="pb-1 px-2 text-right">Birim Fiyat</th>
                <th className="pb-1 px-2 text-right">Tutar (net)</th>
                <th className="pb-1 pl-2 text-right">Tutar (KDV)</th>
              </tr>
            </thead>

            <tbody>
              {malzemeler.map((m) => {
                const net = Number(m.birimFiyat ?? 0);
                const adet = Number(m.adet ?? 0);
                const netTutar = net * adet;
                const kdvTutar = netTutar * 1.2;

                const kaynakKod = m.kaynakKod ?? m.KaynakKod;
                const kaynakAd = m.kaynakAd ?? m.KaynakAd;

                return (
                  <tr
                    key={m.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="py-1 pr-2 text-left">
                      <div className="max-w-[160px] truncate font-medium">
                        {m.malzemeAdi}
                      </div>
                    </td>

                    <td className="py-1 px-2 text-left">
                      {formatKaynak(kaynakKod, kaynakAd)}
                    </td>

                    <td className="py-1 px-2 text-right">{adet}</td>
                    <td className="py-1 px-2 text-right">₺ {net.toFixed(2)}</td>
                    <td className="py-1 px-2 text-right">₺ {netTutar.toFixed(2)}</td>
                    <td className="py-1 pl-2 text-right">₺ {kdvTutar.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
        Toplam kalem: <span className="font-semibold">{toplamMalzemeAdet}</span>
      </div>
    </div>
  );
}
