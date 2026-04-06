export default function PeyzajIsEmriDetayPublicKontrol({
  publicAdi,
  publicSoyadi,
  publicTel,
  publicOnayDurumu,
  publicTokenUrl,
}) {
  const fullName = `${publicAdi ?? ""} ${publicSoyadi ?? ""}`.trim();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-2 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
            Kontrolcü Bilgileri
          </div>
          
        </div>

        <div
          className={`inline-flex rounded-full px-1 py-1 text-[10px] font-semibold ring-1 ${
            publicOnayDurumu
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900"
              : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900"
          }`}
        >
          {publicOnayDurumu ? "Yapılan İşi Görüldü" : "Henüz İş Görülmedi"}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 p-1 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800">
          <div className="mb-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Ad Soyad
          </div>
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            {fullName || "-"}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-50 p-1 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800">
          <div className="mb-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Telefon
          </div>
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            {publicTel || "-"}
          </div>
        </div>

        
      </div>
    </div>
  );
}