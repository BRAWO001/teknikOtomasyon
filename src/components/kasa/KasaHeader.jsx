export default function KasaHeader({
  totalCount,
  page,
  totalPages,
  ozet,
  loading,
  onCreate,
  onBack,
  onHome,
  onReset,
  onRefresh,
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-zinc-100 p-2 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
          Kasa Kayıtları
        </div>

        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
          {totalCount} kayıt • Sayfa {page}/{totalPages} • Nakit/Kişi:{" "}
          {ozet.nakitKayitSayisi} • IBAN: {ozet.ibanliKayitSayisi}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onCreate}
          className="h-7 rounded-md bg-sky-600 px-3 text-[10px] font-bold text-white hover:bg-sky-700"
        >
          + Yeni Kasa Kaydı
        </button>

        <button
          type="button"
          onClick={onBack}
          className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-[10px] font-semibold text-zinc-700"
        >
          ← Geri
        </button>

        <button
          type="button"
          onClick={onHome}
          className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-[10px] font-semibold text-zinc-700"
        >
          Anasayfa
        </button>

        <button
          type="button"
          onClick={onReset}
          className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-[10px] font-semibold text-zinc-700"
        >
          Sıfırla
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="h-7 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-700 disabled:opacity-50"
        >
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>
    </div>
  );
}
