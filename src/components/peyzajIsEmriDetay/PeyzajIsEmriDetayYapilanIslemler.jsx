export default function PeyzajIsEmriDetayYapilanIslemler({
  yapilanIslemler = [],
  onEdit,
}) {
  const canEdit = typeof onEdit === "function";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Yapılan İşlemler
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
          >
            İşlem düzenle
          </button>
        )}
      </div>

      {yapilanIslemler.length === 0 ? (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Henüz işlem seçilmedi.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {yapilanIslemler.map((item) => {
            const islem = item?.islem || item?.Islem || null;
            const islemAdi = islem?.isinAdi || islem?.IsinAdi || `İşlem #${item?.peyzajIslemId || item?.PeyzajIslemId}`;
            const isAktif =
              islem?.isAktifligi ??
              islem?.IsAktifligi ??
              false;
            const yapilmaDurumu =
              islem?.yapilmaDurumu ??
              islem?.YapilmaDurumu ??
              false;

            return (
              <div
                key={item?.id || `${item?.peyzajIslemId}-${islemAdi}`}
                className="rounded-lg bg-zinc-50 px-2 py-2 text-[11px] ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
              >
                <div className="mb-1 font-medium text-zinc-800 dark:text-zinc-100">
                  {islemAdi}
                </div>

                <div className="flex flex-wrap gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                      isAktif
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900"
                        : "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700"
                    }`}
                  >
                    {isAktif ? "Seçildi" : "Seçilmedi"}
                  </span>

                  
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}