import TeknikIsEmriCard from "@/components/TeknikIsEmriCard";

// Teknik iş emirleri – durum filtreleri
const TEKNIK_STATUS_FILTERS = [
  { key: "ALL", label: "Tüm İşler", description: "0–100 tüm iş emirleri" },
  { key: "DEVAM", label: "Devam Edenler", description: "%100 olmayan tüm işler" },
  { key: "BITEN", label: "Biten İşler", description: "Sadece %100 işler" },
];

export default function TeknikIsEmirleriSection({
  sites,
  teknikPersonelList,

  teknikIsEmirleri,
  teknikStatusFilter,
  setTeknikStatusFilter,

  teknikLoading,
  teknikError,

  teknikFilterPersonelId,
  setTeknikFilterPersonelId,
  teknikFilterSiteId,
  setTeknikFilterSiteId,
  teknikStartDate,
  setTeknikStartDate,
  teknikEndDate,
  setTeknikEndDate,

  onRefresh,
  onApply,
  onReset,
}) {
  const activeFilter =
    TEKNIK_STATUS_FILTERS.find((f) => f.key === teknikStatusFilter) ||
    TEKNIK_STATUS_FILTERS[0];

  return (
    <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Başlık + durum filtresi + yenile */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Teknik İş Emirleri</h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Filtre: <span className="font-semibold">{activeFilter.label}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TEKNIK_STATUS_FILTERS.map((f) => {
            const isActive = teknikStatusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setTeknikStatusFilter(f.key)}
                className={[
                  "rounded-md border px-3 py-1 text-xs sm:text-sm transition",
                  "dark:border-zinc-700",
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                ].join(" ")}
                title={f.description}
              >
                {f.label}
              </button>
            );
          })}

          <button
            onClick={onRefresh}
            disabled={teknikLoading}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Filtre bar – personel + site + tarih */}
      <section className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
          {/* Personel filtresi */}
          <div className="w-full md:w-64">
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
              Personel (Atanan)
            </label>
            <select
              value={teknikFilterPersonelId}
              onChange={(e) => setTeknikFilterPersonelId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="">Tüm Personeller</option>
              {teknikPersonelList.map((p) => {
                const id = p.id ?? p.Id;
                const ad = p.ad ?? p.Ad;
                const soyad = p.soyad ?? p.Soyad;
                return (
                  <option key={id} value={id}>
                    {ad} {soyad}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Site filtresi */}
          <div className="w-full md:w-64">
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
              Site / Proje
            </label>
            <select
              value={teknikFilterSiteId}
              onChange={(e) => setTeknikFilterSiteId(e.target.value)}
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

          {/* Tarih aralığı */}
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={teknikStartDate}
                onChange={(e) => setTeknikStartDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={teknikEndDate}
                onChange={(e) => setTeknikEndDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          {/* Filtre butonları */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApply}
              disabled={teknikLoading}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Filtrele
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={teknikLoading}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Temizle
            </button>
          </div>
        </div>
      </section>

      {/* İçerik */}
      {teknikLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          İş emirleri yükleniyor...
        </p>
      )}

      {teknikError && !teknikLoading && (
        <p className="text-sm text-red-600">
          İş emirleri yüklenirken hata: {teknikError}
        </p>
      )}

      {!teknikLoading && !teknikError && teknikIsEmirleri.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Bu filtrelere uygun iş emri bulunamadı.
        </p>
      )}

      {!teknikLoading && !teknikError && teknikIsEmirleri.length > 0 && (
        <div className="mt-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {teknikIsEmirleri.map((item) => (
              <TeknikIsEmriCard key={item.id ?? item.Id} data={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
