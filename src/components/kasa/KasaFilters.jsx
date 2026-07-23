export default function KasaFilters({
  filters,
  onChange,
  onSearch,
}) {
  function update(field, value) {
    onChange(field, value);
  }

  return (
    <div className="border-t border-zinc-100 p-2">
      <div className="grid gap-1.5 md:grid-cols-12">
        <div className="md:col-span-3">
          <label className="mb-0.5 block text-[10px] text-zinc-500">
            Genel Arama
          </label>

          <input
            type="text"
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Başlık, açıklama, personel..."
            className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-0.5 block text-[10px] text-zinc-500">
            Teslim Edilen
          </label>

          <input
            type="text"
            value={filters.personel}
            onChange={(event) => update("personel", event.target.value)}
            placeholder="Kişi veya IBAN"
            className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-0.5 block text-[10px] text-zinc-500">
            İş Emri / İşlem Türü
          </label>

          <input
            type="text"
            value={filters.isEmriKod}
            onChange={(event) => update("isEmriKod", event.target.value)}
            placeholder="EOS veya Temizlik"
            className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-0.5 block text-[10px] text-zinc-500">
            Liste Tipi
          </label>

          <select
            value={filters.odemeTipi}
            onChange={(event) => update("odemeTipi", event.target.value)}
            className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
          >
            <option value="tumu">Tümü</option>
            <option value="nakit">Nakit / Kişiler</option>
            <option value="iban">IBAN / Hesap</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="mb-0.5 block text-[10px] text-zinc-500">
            Başlangıç
          </label>

          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => update("startDate", event.target.value)}
            className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
          />
        </div>

        <div className="md:col-span-1">
          <label className="mb-0.5 block text-[10px] text-zinc-500">
            Bitiş
          </label>

          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => update("endDate", event.target.value)}
            className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
          />
        </div>

        <div className="flex items-end md:col-span-1">
          <button
            type="button"
            onClick={onSearch}
            className="h-7 w-full rounded-md border border-sky-200 bg-sky-50 px-2 text-[10px] font-semibold text-sky-700"
          >
            Ara
          </button>
        </div>
      </div>
    </div>
  );
}
