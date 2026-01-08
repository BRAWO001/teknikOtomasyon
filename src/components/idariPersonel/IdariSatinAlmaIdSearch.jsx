import Link from "next/link";

export default function IdariSatinAlmaIdSearch({
  idSearch,
  setIdSearch,
  idLoading,
  idError,
  idResult,
  onSearch,
  onReset,
  formatDate,
  pick,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch?.();
    }
  };

  return (
    <section className="mb-4 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2">
        <h2 className="text-[13px] font-extrabold tracking-wide text-zinc-800 dark:text-zinc-100">
          SIRA NO (ID) İLE HIZLI ARAMA
        </h2>
        
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
            Sıra No (Id)
          </label>

          <input
            value={idSearch}
            onChange={(e) => setIdSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            inputMode="numeric"
            placeholder="Örn: 24"
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[13px] text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSearch}
            disabled={idLoading}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {idLoading ? "Aranıyor..." : "Ara"}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Temizle
          </button>
        </div>
      </div>

      {idError && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
          {idError}
        </div>
      )}

      {idResult && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-900/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[12px] font-bold text-emerald-800 dark:text-emerald-200">
              Bulundu: Sıra No {pick(idResult, "id", "Id")} —{" "}
              {pick(idResult, "seriNo", "SeriNo")}
            </div>

            <Link
              href={`/satinalma/teklifler/${pick(idResult, "id", "Id")}`}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-800"
            >
              Detaya Git →
            </Link>
          </div>

          <div className="mt-2 text-[12px] text-zinc-700 dark:text-zinc-200">
            <div>
              <span className="font-semibold">Talep Cinsi:</span>{" "}
              {pick(idResult, "talepCinsi", "TalepCinsi") || "-"}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Tarih:</span>{" "}
              {formatDate(pick(idResult, "tarih", "Tarih"))}
            </div>
            {pick(idResult, "aciklama", "Aciklama") && (
              <div className="mt-1">
                <span className="font-semibold">Açıklama:</span>{" "}
                {pick(idResult, "aciklama", "Aciklama")}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
