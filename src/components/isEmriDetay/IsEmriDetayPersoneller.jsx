



import { initials } from "./IsEmriDetayHelpers";

export default function IsEmriDetayPersoneller({ personeller = [], onEdit }) {
  const canEdit = typeof onEdit === "function";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Paylaşım / Personeller
        </div>

        {/* ✅ sadece onEdit varsa göster */}
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
          >
            Personel düzenle
          </button>
        )}
      </div>

      {personeller.length === 0 ? (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Personel atanmadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {personeller.map((p) => {
            const fullName = `${p?.personel?.ad ?? ""} ${p?.personel?.soyad ?? ""}`.trim();
            return (
              <div
                key={p.id}
                className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-2 py-1 text-[11px] ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                    {initials(fullName || `P${p.id}`)}
                  </span>
                  <span className="truncate font-medium">
                    {fullName || `Personel #${p.personelId}`}
                  </span>
                </div>

                <div className="flex flex-col text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>{p.rolAd}</span>
                  {p.not && <span className="max-w-full truncate">{p.not}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}