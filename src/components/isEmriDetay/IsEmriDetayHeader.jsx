import { formatTR } from "./IsEmriDetayHelpers";

export default function IsEmriDetayHeader({
  kod,
  kod_2,
  kod_3,
  kisaBaslik,
  durumAd,
  durumKod,
  olusturmaTarihiUtc,
  onayTarihiUtc,
  baslamaTarihiUtc,
  bitisTarihiUtc,
}) {
  // Kod_3 label
  let kod3Label = null;
  let kod3Class = "";
  if (kod_3) {
    if (kod_3 === "ACIL") {
      kod3Label = "ACİL";
      kod3Class =
        "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900";
    } else {
      kod3Label = "DIŞ İŞ";
      kod3Class =
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900";
    }
  }

  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-[0.08em] text-zinc-900 dark:text-zinc-50">
            {kod}
          </span>

          {kod_2 && (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900">
              {kod_2}
            </span>
          )}

          {kod3Label && (
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${kod3Class}`}
            >
              {kod3Label}
            </span>
          )}
        </div>

        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {kisaBaslik}
        </div>

        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Durum:{" "}
          <span className="font-semibold">
            {durumAd} ({durumKod})
          </span>
        </div>
      </div>

      {/* TARİHLER BLOĞU */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
        <div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Oluşturma
          </div>
          <div className="font-medium">{formatTR(olusturmaTarihiUtc)}</div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Onay
          </div>
          <div className="font-medium">{onayTarihiUtc ? formatTR(onayTarihiUtc) : "-"}</div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Başlangıç
          </div>
          <div className="font-medium">{baslamaTarihiUtc ? formatTR(baslamaTarihiUtc) : "-"}</div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Bitiş
          </div>
          <div className="font-medium">{bitisTarihiUtc ? formatTR(bitisTarihiUtc) : "-"}</div>
        </div>
      </div>
    </header>
  );
}
