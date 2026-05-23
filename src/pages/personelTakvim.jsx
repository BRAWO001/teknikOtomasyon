import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { useRouter } from "next/router";

const TADILAT_PERSONEL_IDS = [54, 2, 110, 106];

function toDateInputValue(d) {
  try {
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getDefaultStartDate() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 7);
  return toDateInputValue(start);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateTR(dateValue) {
  if (!dateValue) return "-";
  try {
    return new Date(dateValue).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateValue;
  }
}

function formatDayNameTR(dateValue) {
  if (!dateValue) return "";
  try {
    return new Date(dateValue).toLocaleDateString("tr-TR", {
      weekday: "long",
    });
  } catch {
    return "";
  }
}

function getDateKey(dateValue) {
  if (!dateValue) return "";

  try {
    const d = new Date(dateValue);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getPersonelFullName(personel) {
  const ad = personel?.ad ?? personel?.Ad ?? "";
  const soyad = personel?.soyad ?? personel?.Soyad ?? "";
  const full = `${ad} ${soyad}`.trim();
  return full || "Atanmamış Personel";
}

function getItemsFromResponse(res) {
  return res?.items ?? res?.Items ?? [];
}

function getSummaryFromResponse(res) {
  return res?.summary ?? res?.Summary ?? {};
}

function getWorkType(item) {
  const kaynakTipi = String(item?.kaynakTipi ?? item?.KaynakTipi ?? "").toUpperCase();
  const rolKod = Number(item?.rolKod ?? item?.RolKod ?? 0);
  const personelId = Number(item?.personelId ?? item?.PersonelId ?? 0);
  const kod2 = String(item?.kod_2 ?? item?.Kod_2 ?? "").toUpperCase();
  const kod3 = String(item?.kod_3 ?? item?.Kod_3 ?? "").toUpperCase();

  if (TADILAT_PERSONEL_IDS.includes(personelId)) {
    return "TADILAT";
  }

  if (
    kaynakTipi.includes("HAVUZ") ||
    rolKod === 34 ||
    kod2.includes("HAVUZ") ||
    kod3.includes("HAVUZ")
  ) {
    return "HAVUZ";
  }

  if (
    kaynakTipi.includes("PEYZAJ") ||
    rolKod === 33 ||
    kod2.includes("PEYZAJ") ||
    kod3.includes("PEYZAJ")
  ) {
    return "PEYZAJ";
  }

  return "TEKNIK";
}

function getWorkStyle(item) {
  const type = getWorkType(item);

  if (type === "TADILAT") {
    return {
      wrapper:
        "border-orange-200 bg-orange-50 text-orange-950 hover:bg-orange-100 dark:border-orange-900/70 dark:bg-orange-950/35 dark:text-orange-100",
      dot: "bg-orange-500",
      label: "Tadilat",
    };
  }

  if (type === "HAVUZ") {
    return {
      wrapper:
        "border-purple-200 bg-purple-50 text-purple-950 hover:bg-purple-100 dark:border-purple-900/70 dark:bg-purple-950/35 dark:text-purple-100",
      dot: "bg-purple-500",
      label: "Havuz",
    };
  }

  if (type === "PEYZAJ") {
    return {
      wrapper:
        "border-green-200 bg-green-50 text-green-900 hover:bg-green-100 dark:border-green-900/70 dark:bg-green-950/35 dark:text-green-100",
      dot: "bg-green-500",
      label: "Peyzaj",
    };
  }

  return {
    wrapper:
      "border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/35 dark:text-blue-100",
    dot: "bg-blue-500",
    label: "Teknik",
  };
}

export default function PersonelTakvimPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const [siteId, setSiteId] = useState("");
  const [personelId, setPersonelId] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState(getDefaultStartDate());

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    if (startDate) qs.set("startDate", startDate);
    if (siteId) qs.set("siteId", String(siteId));
    if (personelId) qs.set("personelId", String(personelId));
    if (status) qs.set("status", String(status));

    return `takvim/personel-haftalik?${qs.toString()}`;
  }, [startDate, siteId, personelId, status]);

  const days = useMemo(() => {
    const base = startDate || getDefaultStartDate();

    return Array.from({ length: 10 }).map((_, index) => {
      const d = addDays(base, index);

      return {
        key: toDateInputValue(d),
        date: d,
        label: formatDateTR(d),
        dayName: formatDayNameTR(d),
      };
    });
  }, [startDate]);

  const personelRows = useMemo(() => {
    const map = new Map();

    for (const group of items || []) {
      const personel = group?.personel ?? group?.Personel ?? {};
      const id = personel?.id ?? personel?.Id ?? 0;
      const name = getPersonelFullName(personel);
      const personelKodu = personel?.personelKodu ?? personel?.PersonelKodu ?? "";
      const telefon = personel?.telefon ?? personel?.Telefon ?? "";
      const key = String(id || name);

      if (!map.has(key)) {
        map.set(key, {
          key,
          personel: {
            id,
            name,
            personelKodu,
            telefon,
          },
          days: {},
          total: 0,
        });
      }

      const row = map.get(key);
      const groupTarihKey = getDateKey(group?.tarih ?? group?.Tarih);
      const isler = group?.isler ?? group?.Isler ?? [];

      for (const work of isler) {
        const workTarihKey = getDateKey(
          work?.tarih ??
            work?.Tarih ??
            work?.olusturmaTarihiUtc ??
            work?.OlusturmaTarihiUtc ??
            group?.tarih ??
            group?.Tarih
        );

        const finalTarihKey = workTarihKey || groupTarihKey;

        row.days[finalTarihKey] = [...(row.days[finalTarihKey] || []), work];
      }

      row.total += Number(group?.toplamIsSayisi ?? group?.ToplamIsSayisi ?? isler.length ?? 0);
    }

    return Array.from(map.values()).sort((a, b) =>
      String(a.personel.name).localeCompare(String(b.personel.name), "tr")
    );
  }, [items]);

  async function loadData() {
    setLoading(true);

    try {
      const res = await getDataAsync(endpoint);
      setItems(getItemsFromResponse(res));
      setSummary(getSummaryFromResponse(res));
    } catch (err) {
      console.error("Personel takvim GET hata:", err);
      setItems([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const loadLists = async () => {
      try {
        const siteRes = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(siteRes || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    };

    loadLists();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const resetFilters = () => {
    setSiteId("");
    setPersonelId("");
    setStatus("");
    setStartDate(getDefaultStartDate());
  };

  const refresh = async () => {
    await loadData();
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Personel Takvimi
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ⌂ Anasayfa
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Filtreleri Sıfırla
            </button>

            <button
              type="button"
              onClick={refresh}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/45"
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Başlangıç</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-zinc-500">Site</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Tümü</option>
              {sites.map((s) => (
                <option key={s.id ?? s.Id} value={s.id ?? s.Id}>
                  {s.ad ?? s.Ad ?? `Site #${s.id ?? s.Id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Teknik
            </div>

            <div className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Peyzaj
            </div>

            <div className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Tadilat
            </div>

            <div className="flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-100">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Havuz
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-1 border-b border-zinc-200 p-1.5 dark:border-zinc-800">
          {loading && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
              Yükleniyor…
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[160px_repeat(10,minmax(85px,1fr))] border-b border-zinc-200 dark:border-zinc-800">
              <div className="sticky left-0 z-10 border-r border-zinc-200 bg-zinc-50 p-1 text-[9px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Personel
              </div>

              {days.map((d) => (
                <div
                  key={d.key}
                  className="border-r border-zinc-200 bg-zinc-50 p-1 text-center dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="text-[9px] font-bold leading-tight text-zinc-700 dark:text-zinc-200">
                    {d.label}
                  </div>

                  <div className="capitalize text-[8px] leading-tight text-zinc-500 dark:text-zinc-400">
                    {d.dayName}
                  </div>
                </div>
              ))}
            </div>

            {personelRows.length === 0 && !loading ? (
              <div className="p-3 text-center text-[10px] text-zinc-500 dark:text-zinc-400">
                Bu tarih aralığında personel takvim kaydı bulunamadı.
              </div>
            ) : (
              personelRows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[160px_repeat(10,minmax(85px,1fr))] border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
                >
                  <div className="sticky left-0 z-10 border-r border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="truncate text-[10px] font-bold leading-tight text-zinc-800 dark:text-zinc-100">
                      {row.personel.name} * {row.total} iş
                    </div>
                  </div>

                  {days.map((d) => {
                    const works = row.days[d.key] || [];

                    return (
                      <div
                        key={`${row.key}-${d.key}`}
                        className="min-h-[58px] border-r border-zinc-100 p-[2px] align-top dark:border-zinc-800"
                      >
                        {works.length === 0 ? (
                          <div className="flex h-full min-h-[54px] items-center justify-center text-[8px] text-zinc-300 dark:text-zinc-700">
                            —
                          </div>
                        ) : (
                          <div className="space-y-[2px]">
                            {works.map((work, index) => {
                              const style = getWorkStyle(work);
                              const kod = work?.kod ?? work?.Kod ?? "-";
                              const title =
                                work?.kisaBaslik ??
                                work?.KisaBaslik ??
                                work?.aciklama ??
                                work?.Aciklama ??
                                "İş";

                              const siteAdi = work?.siteAdi ?? work?.SiteAdi ?? "";
                              const aptAdi = work?.aptAdi ?? work?.AptAdi ?? "";

                              return (
                                <button
                                  key={`${kod}-${index}`}
                                  type="button"
                                  title={title}
                                  onClick={() => {
                                    const kaynak = String(
                                      work?.kaynakTipi ?? work?.KaynakTipi ?? ""
                                    ).toUpperCase();

                                    const isEmriId = work?.isEmriId ?? work?.IsEmriId;
                                    const peyzajId =
                                      work?.peyzajIsEmriId ?? work?.PeyzajIsEmriId;

                                    if (kaynak.includes("PEYZAJ") && peyzajId) {
                                      window.open(`/peyzaj/isEmriDetay/${peyzajId}`, "_blank");
                                      return;
                                    }

                                    if (isEmriId) {
                                      window.open(`/teknik/isEmriDetay/${isEmriId}`, "_blank");
                                    }
                                  }}
                                  className={`w-full cursor-pointer rounded-md border px-1 py-[2px] text-left shadow-sm transition ${style.wrapper}`}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />

                                    <span className="truncate text-[7px] font-bold uppercase tracking-wide">
                                      {style.label}
                                    </span>
                                  </div>

                                  {(siteAdi || aptAdi) && (
                                    <div className="mt-[1px] truncate text-[8px] opacity-70">
                                      {siteAdi}
                                      {aptAdi ? ` / ${aptAdi}` : ""}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}