export default function IdariOnaylananFilterBar({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  siteId,
  setSiteId,
  sites,
  loading,
  onApply,
  onReset,
}) {
  return (
    <section className="mb-4 mt-20 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3">
        <h2 className="text-[18px] text-center font-extrabold tracking-wide text-emerald-800 dark:text-emerald-300">
          İDARİ – TÜM ONAYLARI ALMIŞ TALEPLER
        </h2>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        {/* Tarih Aralığı */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
        </div>

        {/* Site filtresi */}
        <div className="w-full md:w-64">
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
            Site / Proje
          </label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Tüm Siteler</option>
            {sites.map((s) => {
              const id = s.id ?? s.Id;
              const ad = s.ad ?? s.Ad;
              return (
                <option key={id} value={id}>
                  {ad || `Site #${id}`}
                </option>
              );
            })}
          </select>
        </div>

        {/* Filtre Butonları */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Filtrele
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Temizle
          </button>
        </div>
      </div>
    </section>
  );
}
