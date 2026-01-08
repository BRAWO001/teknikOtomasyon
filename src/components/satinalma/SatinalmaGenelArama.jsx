import SatinalmaKartGrid from "./SatinalmaKartGrid";

export default function SatinalmaGenelArama({
  genelStartDate,
  setGenelStartDate,
  genelEndDate,
  setGenelEndDate,
  genelSiteId,
  setGenelSiteId,
  sites,
  onApply,
  onReset,
  genelTouched,
  genelLoading,
  genelError,
  genelList,
  formatDate,
}) {
  return (
    <section className="mb-4 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm">
      <div className="mb-3">
        <h2 className="text-[13px] font-extrabold tracking-wide text-sky-800">
          GENEL ARAMA (TARİH + SİTE)
        </h2>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-zinc-700">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={genelStartDate}
              onChange={(e) => setGenelStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-zinc-700">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={genelEndDate}
              onChange={(e) => setGenelEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="w-full md:w-64">
          <label className="mb-1 block text-[11px] font-medium text-zinc-700">
            Site / Proje
          </label>
          <select
            value={genelSiteId}
            onChange={(e) => setGenelSiteId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Tüm Siteler</option>
            {sites.map((s) => {
              const sid = s.id ?? s.Id;
              const ad = s.ad ?? s.Ad;
              return (
                <option key={sid} value={sid}>
                  {ad || `Site #${sid}`}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={genelLoading}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Filtrele
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Temizle
          </button>
        </div>
      </div>

      {genelTouched && genelLoading && (
        <div className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600">
          Yükleniyor...
        </div>
      )}

      {genelTouched && !genelLoading && genelError && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {genelError}
        </div>
      )}

      {genelTouched && !genelLoading && !genelError && genelList.length === 0 && (
        <div className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600">
          Filtrelere uygun kayıt bulunmuyor.
        </div>
      )}

      {genelTouched && !genelLoading && !genelError && genelList.length > 0 && (
        <div className="mt-4">
          <SatinalmaKartGrid
            list={genelList}
            theme="sky"
            formatDate={formatDate}
          />
        </div>
      )}
    </section>
  );
}
