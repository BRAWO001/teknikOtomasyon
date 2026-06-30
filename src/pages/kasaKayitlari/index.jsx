import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";

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

export default function KasaKayitlariPage() {
  const router = useRouter();
  const defaults = getDefaultRange();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [toplamKasaTutari, setToplamKasaTutari] = useState(0);
  const [toplamIscilikTutari, setToplamIscilikTutari] = useState(0);
  const [toplamMalzemeTutari, setToplamMalzemeTutari] = useState(0);

  const [search, setSearch] = useState("");
  const [personel, setPersonel] = useState("");
  const [isEmriKod, setIsEmriKod] = useState("");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    if (search.trim()) qs.set("search", search.trim());
    if (personel.trim()) qs.set("personel", personel.trim());
    if (isEmriKod.trim()) qs.set("isEmriKod", isEmriKod.trim());

    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);

    return `kasa-kayit?${qs.toString()}`;
  }, [page, pageSize, search, personel, isEmriKod, startDate, endDate]);

  async function loadKasaKayitlari() {
    setLoading(true);

    try {
      const res = await getDataAsync(endpoint);

      setItems(res?.items || []);
      setTotalPages(res?.totalPages || 1);
      setTotalCount(res?.totalCount || 0);

      setToplamKasaTutari(res?.toplamKasaTutari ?? 0);
      setToplamIscilikTutari(res?.toplamIscilikTutari ?? 0);
      setToplamMalzemeTutari(res?.toplamMalzemeTutari ?? 0);
    } catch (err) {
      console.error("Kasa kayıtları GET hata:", err);

      setItems([]);
      setTotalPages(1);
      setTotalCount(0);

      setToplamKasaTutari(0);
      setToplamIscilikTutari(0);
      setToplamMalzemeTutari(0);
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
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const goDetail = (id) => {
    router.push(`/kasaKayitlari/${id}`);
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Kasa Kayıtları
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Toplam: {totalCount} kayıt • Sayfa: {page}/{totalPages}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              ⌂ Anasayfa
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Filtreleri Sıfırla
            </button>

            <button
              type="button"
              onClick={loadKasaKayitlari}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
              Toplam Kasa
            </div>
            <div className="mt-1 text-lg font-extrabold text-emerald-900 dark:text-emerald-100">
              {moneyTR(toplamKasaTutari)}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              Toplam İşçilik
            </div>
            <div className="mt-1 text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              {moneyTR(toplamIscilikTutari)}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              Toplam Malzeme
            </div>
            <div className="mt-1 text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              {moneyTR(toplamMalzemeTutari)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[190px] flex-[1.3]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Başlık / Açıklama / Genel Arama
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Metin ara"
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="min-w-[150px] flex-1">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Teslim Edilen Personel
              </label>
              <input
                type="text"
                value={personel}
                onChange={(e) => {
                  setPersonel(e.target.value);
                  setPage(1);
                }}
                placeholder="Personel ara"
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="min-w-[150px] flex-1">
              <label className="mb-1 block text-[11px] text-zinc-500">
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
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="w-[135px]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Başlangıç
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="w-[135px]">
              <label className="mb-1 block text-[11px] text-zinc-500">
                Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="h-8 rounded-md border border-zinc-300 bg-white px-3 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Sıfırla
              </button>

              <button
                type="button"
                onClick={loadKasaKayitlari}
                className="h-8 rounded-md border border-sky-200 bg-sky-50 px-3 text-[12px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200"
              >
                Ara
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Kasa Listesi
          </div>

          {loading && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Yükleniyor…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ◀ Önceki
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Sonraki ▶
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-[900px] w-full text-[10px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60">
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                Tarih
              </th>
              <th className="px-2 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                İş Emri
              </th>
              <th className="px-2 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                Başlık
              </th>
              <th className="px-2 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                Teslim Edilen
              </th>
              <th className="px-2 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                Kaydı Yapan
              </th>
              <th className="px-2 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-300">
                Toplam
              </th>
              <th className="px-2 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-300">
                İşlem
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((x) => (
              <tr
                key={x.id ?? x.Id}
                onDoubleClick={() => goDetail(x.id ?? x.Id)}
                className="border-b border-zinc-100/80 hover:bg-zinc-50/80 dark:border-zinc-800/70 dark:hover:bg-zinc-800/30"
              >
                <td className="whitespace-nowrap px-2 py-2 text-zinc-700 dark:text-zinc-200">
                  {formatDateTR(x.kayitTarihi ?? x.KayitTarihi)}
                </td>

                <td className="whitespace-nowrap px-2 py-2 font-semibold text-zinc-800 dark:text-zinc-100">
                  {x.isEmriKodu ?? x.IsEmriKodu ?? "-"}
                </td>

                <td className="max-w-[240px] truncate px-2 py-2 text-zinc-700 dark:text-zinc-200">
                  <div className="font-semibold">
                    {x.baslik ?? x.Baslik ?? "-"}
                  </div>
                  <div className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                    {x.aciklama ?? x.Aciklama ?? ""}
                  </div>
                </td>

                <td className="whitespace-nowrap px-2 py-2 text-zinc-700 dark:text-zinc-200">
                  {x.teslimEdilenPersonel ?? x.TeslimEdilenPersonel ?? "-"}
                </td>

                <td className="whitespace-nowrap px-2 py-2 text-zinc-700 dark:text-zinc-200">
                  {x.kaydiYapanPersonel ?? x.KaydiYapanPersonel ?? "-"}
                </td>

                <td className="whitespace-nowrap px-2 py-2 text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                  {moneyTR(x.alinanToplamTutar ?? x.AlinanToplamTutar)}
                </td>

                <td className="whitespace-nowrap px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => goDetail(x.id ?? x.Id)}
                    className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200"
                  >
                    Detay
                  </button>
                </td>
              </tr>
            ))}

            {!items.length && !loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Kasa kaydı bulunamadı.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
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