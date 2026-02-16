// ======================================
// src/components/personel/PersonelFilterCard.jsx
// ======================================
export default function PersonelFilterCard({
  startDate,
  endDate,
  siteId,
  sites,
  loading,
  currentPersonelId,
  selectedQuick,
  setSelectedQuick,
  setStartDate,
  setEndDate,
  setSiteId,
  applyQuickRange,
  handleFilterApply,
  handleFilterReset,
}) {
  const quickBtnClass = (key) => {
    const selected = selectedQuick === key;
    return selected
      ? "rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
      : "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-bold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-800";
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[13px] font-extrabold text-zinc-900 dark:text-zinc-100">
            İş Emirleri • Filtreler
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Tarih ve site seçimine göre liste + istatistikler güncellenir.
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div>
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
            Başlangıç
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setSelectedQuick(null);
              setStartDate(e.target.value);
            }}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 shadow-sm
                       focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100
                       dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
            Bitiş
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setSelectedQuick(null);
              setEndDate(e.target.value);
            }}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 shadow-sm
                       focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100
                       dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
            Site
          </label>
          <select
            value={siteId}
            onChange={(e) => {
              setSelectedQuick(null);
              setSiteId(e.target.value);
            }}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-[13px] text-zinc-900 shadow-sm
                       focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100
                       dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <button
          type="button"
          onClick={() => applyQuickRange(7)}
          disabled={loading || !currentPersonelId}
          className={quickBtnClass(7)}
        >
          Son 7 gün
        </button>
        <button
          type="button"
          onClick={() => applyQuickRange(2)}
          disabled={loading || !currentPersonelId}
          className={quickBtnClass(2)}
        >
          Son 2 gün
        </button>
        <button
          type="button"
          onClick={() => applyQuickRange(1)}
          disabled={loading || !currentPersonelId}
          className={quickBtnClass(1)}
        >
          Dün
        </button>
        <button
          type="button"
          onClick={() => applyQuickRange(0)}
          disabled={loading || !currentPersonelId}
          className={quickBtnClass(0)}
        >
          Bugün
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleFilterApply}
          disabled={loading || !currentPersonelId}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          Filtrele
        </button>

        <button
          type="button"
          onClick={handleFilterReset}
          disabled={loading || !currentPersonelId}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[12px] font-extrabold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Temizle
        </button>
      </div>
    </section>
  );
}
