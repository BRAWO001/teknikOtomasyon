import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";

import { roleGuard } from "@/utils/roleGuard";

export const getServerSideProps = (ctx) =>
  roleGuard(ctx, { allow: [40,90,30,33,34], redirectTo: "/" });



function formatDateTR(iso) {
  if (!iso) return "-";

  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function moneyTR(val) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return "-";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(val));
}

function toDateInputValue(d) {
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getDefaultRange() {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 6);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

function getVal(obj, ...keys) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }

  return null;
}

export default function KasaKayitlariPage() {
  const router = useRouter();
  const defaults = getDefaultRange();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [ozet, setOzet] = useState({
    toplamAlinanTutar: 0,
    toplamMalzemeTutari: 0,
    toplamDusulenTutar: 0,
    toplamIscilikTutari: 0,
    genelBakiye: 0,
    ibanliKayitSayisi: 0,
    nakitKayitSayisi: 0,
    nakit: {
      kayitSayisi: 0,
      toplamAlinan: 0,
      toplamMalzeme: 0,
      kasayaKalan: 0,
    },
    iban: {
      kayitSayisi: 0,
      toplamAlinan: 0,
      toplamMalzeme: 0,
      kasayaKalan: 0,
    },
  });

  const [search, setSearch] = useState("");
  const [personel, setPersonel] = useState("");
  const [isEmriKod, setIsEmriKod] = useState("");
  const [odemeTipi, setOdemeTipi] = useState("tumu");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    if (search.trim()) qs.set("search", search.trim());
    if (personel.trim()) qs.set("personel", personel.trim());
    if (isEmriKod.trim()) qs.set("isEmriKod", isEmriKod.trim());

    if (odemeTipi !== "tumu") qs.set("odemeTipi", odemeTipi);

    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);

    return `kasa-kayit?${qs.toString()}`;
  }, [page, pageSize, search, personel, isEmriKod, odemeTipi, startDate, endDate]);

  async function loadKasaKayitlari() {
    setLoading(true);

    try {
      const res = await getDataAsync(endpoint);

      setItems(res?.items || []);
      setTotalPages(res?.totalPages || 1);
      setTotalCount(res?.totalCount || 0);

      setOzet({
        toplamAlinanTutar: res?.ozet?.toplamAlinanTutar ?? 0,
        toplamMalzemeTutari: res?.ozet?.toplamMalzemeTutari ?? 0,
        toplamDusulenTutar: res?.ozet?.toplamDusulenTutar ?? 0,
        toplamIscilikTutari: res?.ozet?.toplamIscilikTutari ?? 0,
        genelBakiye: res?.ozet?.genelBakiye ?? 0,
        ibanliKayitSayisi: res?.ozet?.ibanliKayitSayisi ?? 0,
        nakitKayitSayisi: res?.ozet?.nakitKayitSayisi ?? 0,
        nakit: {
          kayitSayisi: res?.ozet?.nakit?.kayitSayisi ?? 0,
          toplamAlinan: res?.ozet?.nakit?.toplamAlinan ?? 0,
          toplamMalzeme: res?.ozet?.nakit?.toplamMalzeme ?? 0,
          kasayaKalan: res?.ozet?.nakit?.kasayaKalan ?? 0,
        },
        iban: {
          kayitSayisi: res?.ozet?.iban?.kayitSayisi ?? 0,
          toplamAlinan: res?.ozet?.iban?.toplamAlinan ?? 0,
          toplamMalzeme: res?.ozet?.iban?.toplamMalzeme ?? 0,
          kasayaKalan: res?.ozet?.iban?.kasayaKalan ?? 0,
        },
      });
    } catch (err) {
      console.error("Kasa kayıtları GET hata:", err);
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKasaKayitlari();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const resetFilters = () => {
    setSearch("");
    setPersonel("");
    setIsEmriKod("");
    setOdemeTipi("tumu");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const goDetail = (id) => {
    if (!id) return;
    router.push(`/kasaKayitlari/${id}`);
  };

  return (
    <div className="space-y-2 p-2">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2 border-b border-zinc-100 p-2 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
              Kasa Kayıtları
            </div>

            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {totalCount} kayıt • Sayfa {page}/{totalPages} • Nakit/Kişi:{" "}
              {ozet.nakitKayitSayisi} • IBAN: {ozet.ibanliKayitSayisi}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-[10px] font-semibold text-zinc-700"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-[10px] font-semibold text-zinc-700"
            >
              Anasayfa
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-[10px] font-semibold text-zinc-700"
            >
              Sıfırla
            </button>

            <button
              type="button"
              onClick={loadKasaKayitlari}
              className="h-7 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-700"
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="grid gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5">
            <div className="text-[10px] font-semibold text-emerald-700">
              Toplam Alınan
            </div>
            <div className="text-[13px] font-extrabold text-emerald-900">
              {moneyTR(ozet.toplamAlinanTutar)}
            </div>
          </div>

          <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5">
            <div className="text-[10px] font-semibold text-rose-700">
              Düşülen Malzeme
            </div>
            <div className="text-[13px] font-extrabold text-rose-900">
              - {moneyTR(ozet.toplamDusulenTutar)}
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5">
            <div className="text-[10px] font-semibold text-zinc-600">
              Malzeme Gideri
            </div>
            <div className="text-[13px] font-extrabold text-zinc-900">
              {moneyTR(ozet.toplamMalzemeTutari)}
            </div>
          </div>

          <div className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5">
            <div className="text-[10px] font-semibold text-indigo-700">
              İşçilik
            </div>
            <div className="text-[13px] font-extrabold text-indigo-900">
              {moneyTR(ozet.toplamIscilikTutari)}
            </div>
          </div>

          <div className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5">
            <div className="text-[10px] font-semibold text-sky-700">
              Kasaya Kalan Bakiye
            </div>
            <div className="text-[13px] font-extrabold text-sky-900">
              {moneyTR(ozet.genelBakiye)}
            </div>
          </div>
        </div>

        <div className="grid gap-1.5 border-t border-zinc-100 p-2 sm:grid-cols-2">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold text-amber-800">
                Nakit 
              </div>
              <div className="text-[10px] font-semibold text-amber-700">
                {ozet.nakit.kayitSayisi} kayıt
              </div>
            </div>

            <div className="mt-1 grid grid-cols-3 gap-1 text-[10px]">
              <div>
                <div className="text-amber-700">Alınan</div>
                <div className="font-extrabold text-amber-950">
                  {moneyTR(ozet.nakit.toplamAlinan)}
                </div>
              </div>
              <div>
                <div className="text-amber-700">Malzeme</div>
                <div className="font-extrabold text-amber-950">
                  {moneyTR(ozet.nakit.toplamMalzeme)}
                </div>
              </div>
              <div>
                <div className="text-amber-700">Kasaya Kalan</div>
                <div className="font-extrabold text-amber-950">
                  {moneyTR(ozet.nakit.kasayaKalan)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold text-emerald-800">
                IBAN 
              </div>
              <div className="text-[10px] font-semibold text-emerald-700">
                {ozet.iban.kayitSayisi} kayıt
              </div>
            </div>

            <div className="mt-1 grid grid-cols-3 gap-1 text-[10px]">
              <div>
                <div className="text-emerald-700">Alınan</div>
                <div className="font-extrabold text-emerald-950">
                  {moneyTR(ozet.iban.toplamAlinan)}
                </div>
              </div>
              <div>
                <div className="text-emerald-700">Malzeme</div>
                <div className="font-extrabold text-emerald-950">
                  {moneyTR(ozet.iban.toplamMalzeme)}
                </div>
              </div>
              <div>
                <div className="text-emerald-700">Kasaya Kalan</div>
                <div className="font-extrabold text-emerald-950">
                  {moneyTR(ozet.iban.kasayaKalan)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 p-2">
          <div className="grid gap-1.5 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className="mb-0.5 block text-[10px] text-zinc-500">
                Genel Arama
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
                value={personel}
                onChange={(e) => {
                  setPersonel(e.target.value);
                  setPage(1);
                }}
                placeholder="Kişi veya IBAN"
                className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-0.5 block text-[10px] text-zinc-500">
                İş Emri Kodu
              </label>
              <input
                type="text"
                value={isEmriKod}
                onChange={(e) => {
                  setIsEmriKod(e.target.value);
                  setPage(1);
                }}
                placeholder="EOS..."
                className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-0.5 block text-[10px] text-zinc-500">
                Liste Tipi
              </label>
              <select
                value={odemeTipi}
                onChange={(e) => {
                  setOdemeTipi(e.target.value);
                  setPage(1);
                }}
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
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-0.5 block text-[10px] text-zinc-500">
                Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-7 w-full rounded-md border border-zinc-300 bg-white px-2 text-[11px]"
              />
            </div>

            <div className="flex items-end md:col-span-1">
              <button
                type="button"
                onClick={loadKasaKayitlari}
                className="h-7 w-full rounded-md border border-sky-200 bg-sky-50 px-2 text-[10px] font-semibold text-sky-700"
              >
                Ara
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[1220px] text-[10px]">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-1.5 py-1.5 text-left font-bold text-zinc-600">
                Tarih
              </th>
              <th className="px-1.5 py-1.5 text-left font-bold text-zinc-600">
                İş Emri
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
            {items.map((x) => {
              const id = getVal(x, "id", "Id");
              const ibanliMi = Boolean(getVal(x, "ibanliMi", "IbanliMi"));

              const alinan = getVal(x, "alinanTutar", "AlinanTutar") ?? 0;
              const malzeme = getVal(x, "malzemeTutari", "MalzemeTutari") ?? 0;
              const dusulen = getVal(x, "dusulenTutar", "DusulenTutar") ?? malzeme;
              const bakiye = getVal(x, "bakiye", "Bakiye") ?? Number(alinan) - Number(dusulen);
              const iscilik = getVal(x, "iscilikTutari", "IscilikTutari") ?? 0;

              return (
                <tr
                  key={id}
                  onDoubleClick={() => goDetail(id)}
                  className={`border-b border-zinc-100 hover:bg-zinc-50 `}
                >
                  <td className="whitespace-nowrap px-1.5 py-1.5 text-zinc-700">
                    {formatDateTR(getVal(x, "kayitTarihi", "KayitTarihi"))}
                  </td>

                  <td className="whitespace-nowrap px-1.5 py-1.5 font-bold text-zinc-900">
                    {getVal(x, "isEmriKodu", "IsEmriKodu") ?? "-"}
                  </td>

                 

                  <td className="min-w-[220px] max-w-[280px] px-1.5 py-1.5 text-zinc-700">
                    <div className="truncate font-bold">
                      {getVal(x, "teslimEdilenKisi", "TeslimEdilenKisi") ?? "-"}
                    </div>

                    <div
                      className={`truncate text-[9px] ${
                        ibanliMi ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                     
                    </div>
                  </td>

                  <td className="max-w-[240px] px-1.5 py-1.5 text-zinc-700">
                    <div className="truncate font-semibold">
                      {getVal(x, "baslik", "Baslik") ?? "-"}
                    </div>
                    <div className="truncate text-[9px] text-zinc-500">
                      {getVal(x, "aciklama", "Aciklama") ?? ""}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-1.5 py-1.5 text-zinc-700">
                    {getVal(x, "kaydiYapanPersonel", "KaydiYapanPersonel") ?? "-"}
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
                    <button
                      type="button"
                      onClick={() => goDetail(id)}
                      className="h-6 rounded-md border border-sky-200 bg-sky-50 px-2 text-[10px] font-semibold text-sky-700"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              );
            })}

            {!items.length && !loading && (
              <tr>
                <td colSpan={12} className="py-6 text-center text-[11px] text-zinc-500">
                  Kasa kaydı bulunamadı.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={12} className="py-6 text-center text-[11px] text-zinc-500">
                  Kayıtlar yükleniyor...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}