import {
  formatDateTR,
  getVal,
  moneyTR,
  startsWithEOS,
} from "./helpers";

export default function KasaTable({
  items,
  loading,
  onDetail,
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[1220px] text-[10px]">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-1.5 py-1.5 text-left font-bold text-zinc-600">
              Tarih
            </th>
            <th className="px-1.5 py-1.5 text-left font-bold text-zinc-600">
              İş Emri / İşlem Türü
            </th>
            <th className="px-1.5 py-1.5 text-left font-bold text-zinc-600">
              Teslim Edilen
            </th>
            <th className="px-1.5 py-1.5 text-left font-bold text-zinc-600">
              Başlık / Açıklama
            </th>
            <th className="px-1.5 py-1.5 text-left font-bold text-zinc-600">
              Kaydı Yapan
            </th>
            <th className="px-1.5 py-1.5 text-right font-bold text-emerald-700">
              Alınan
            </th>
            <th className="px-1.5 py-1.5 text-right font-bold text-rose-700">
              Malzeme
            </th>
            <th className="px-1.5 py-1.5 text-right font-bold text-rose-700">
              Düşülen
            </th>
            <th className="px-1.5 py-1.5 text-right font-bold text-sky-700">
              Kasaya Kalan
            </th>
            <th className="px-1.5 py-1.5 text-right font-bold text-indigo-700">
              İşçilik
            </th>
            <th className="px-1.5 py-1.5 text-right font-bold text-zinc-600">
              İşlem
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const id = getVal(item, "id", "Id");

            const not1Value =
              getVal(
                item,
                "not_1",
                "Not_1",
                "isEmriKodu",
                "IsEmriKodu"
              ) ?? "";

            const detailAvailable = startsWithEOS(not1Value);

            const ibanliMi = Boolean(
              getVal(item, "ibanliMi", "IbanliMi") ??
                String(
                  getVal(
                    item,
                    "odemeTipi",
                    "OdemeTipi",
                    "not_2",
                    "Not_2"
                  ) ?? ""
                ).toUpperCase() === "IBAN"
            );

            const alinan =
              getVal(item, "alinanTutar", "AlinanTutar") ?? 0;

            const malzeme =
              getVal(item, "malzemeTutari", "MalzemeTutari") ?? 0;

            const dusulen =
              getVal(item, "dusulenTutar", "DusulenTutar") ?? malzeme;

            const bakiye =
              getVal(item, "bakiye", "Bakiye") ??
              Number(alinan) - Number(dusulen);

            const iscilik =
              getVal(item, "iscilikTutari", "IscilikTutari") ?? 0;

            const displayedType =
              not1Value || getVal(item, "baslik", "Baslik") || "-";

            return (
              <tr
                key={id}
                onDoubleClick={() => {
                  if (detailAvailable) {
                    onDetail(id, not1Value);
                  }
                }}
                className={`border-b border-zinc-100 hover:bg-zinc-50 ${
                  detailAvailable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <td className="whitespace-nowrap px-1.5 py-1.5 text-zinc-700">
                  {formatDateTR(
                    getVal(item, "kayitTarihi", "KayitTarihi")
                  )}
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5">
                  <div
                    className={`font-bold ${
                      detailAvailable ? "text-sky-700" : "text-zinc-800"
                    }`}
                  >
                    {displayedType}
                  </div>

                  {!detailAvailable && (
                    <div className="text-[9px] font-semibold text-amber-600">
                      Manuel kayıt
                    </div>
                  )}
                </td>

                <td className="min-w-[220px] max-w-[280px] px-1.5 py-1.5 text-zinc-700">
                  <div className="truncate font-bold">
                    {getVal(
                      item,
                      "teslimEdilenKisi",
                      "TeslimEdilenKisi",
                      "teslimEdilenPersonel",
                      "TeslimEdilenPersonel"
                    ) ?? "-"}
                  </div>

                  <div
                    className={`truncate text-[9px] font-semibold ${
                      ibanliMi ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {ibanliMi ? "IBAN" : "Nakit"}
                  </div>
                </td>

                <td className="max-w-[240px] px-1.5 py-1.5 text-zinc-700">
                  <div className="truncate font-semibold">
                    {getVal(item, "baslik", "Baslik") ?? "-"}
                  </div>

                  <div className="truncate text-[9px] text-zinc-500">
                    {getVal(item, "aciklama", "Aciklama") ?? ""}
                  </div>
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5 text-zinc-700">
                  {getVal(
                    item,
                    "kaydiYapanPersonel",
                    "KaydiYapanPersonel",
                    "not_3",
                    "Not_3"
                  ) ?? "-"}
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-bold text-emerald-700">
                  {moneyTR(alinan)}
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5 text-right text-rose-700">
                  {moneyTR(malzeme)}
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-bold text-rose-800">
                  - {moneyTR(dusulen)}
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-extrabold text-sky-700">
                  {moneyTR(bakiye)}
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-semibold text-indigo-700">
                  {moneyTR(iscilik)}
                </td>

                <td className="whitespace-nowrap px-1.5 py-1.5 text-right">
                  {detailAvailable ? (
                    <button
                      type="button"
                      onClick={() => onDetail(id, not1Value)}
                      className="h-6 rounded-md border border-sky-200 bg-sky-50 px-2 text-[10px] font-semibold text-sky-700"
                    >
                      Detay
                    </button>
                  ) : (
                    <span className="text-[9px] font-semibold text-zinc-400">
                      Detay yok
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {!items.length && !loading && (
            <tr>
              <td
                colSpan={11}
                className="py-6 text-center text-[11px] text-zinc-500"
              >
                Kasa kaydı bulunamadı.
              </td>
            </tr>
          )}

          {loading && (
            <tr>
              <td
                colSpan={11}
                className="py-6 text-center text-[11px] text-zinc-500"
              >
                Kayıtlar yükleniyor...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
