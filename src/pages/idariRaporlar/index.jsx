import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

function todayInputValue() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDaysInputValue(dateValue, days) {
  const d = new Date(dateValue || todayInputValue());
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getDateKey(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatDay(value) {
  try {
    return new Date(value).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatWeekday(value) {
  try {
    return new Date(value).toLocaleDateString("tr-TR", {
      weekday: "short",
    });
  } catch {
    return "";
  }
}

function pick(obj, a, b) {
  return obj?.[a] ?? obj?.[b];
}

function isSectionTitle(line) {
  const text = String(line || "").trim().toUpperCase();

  return (
    text === "HAVUZ İŞLERİ" ||
    text === "HAVUZ" ||
    text === "TEKNİK İŞLER" ||
    text === "TEKNIK İŞLER" ||
    text === "TEKNİK" ||
    text === "TEKNIK" ||
    text === "PEYZAJ İŞLERİ" ||
    text === "PEYZAJ" ||
    text === "MÜDÜR ÖZEL NOTU" ||
    text === "MUDUR OZEL NOTU"
  );
}

function normalizeSectionTitle(line) {
  const text = String(line || "").trim().toUpperCase();

  if (text.includes("HAVUZ")) return "HAVUZ";
  if (text.includes("TEKNİK") || text.includes("TEKNIK")) return "TEKNİK";
  if (text.includes("PEYZAJ")) return "PEYZAJ";
  if (text.includes("MÜDÜR") || text.includes("MUDUR")) return "MÜDÜR ÖZEL NOTU";

  return text;
}

function splitReportLines(text) {
  return String(text || "")
    .split("\n")
    .flatMap((x) => x.split(";"))
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !x.includes("────"));
}

function buildReportGroups(text) {
  const lines = splitReportLines(text);
  const groups = [];
  let current = null;

  for (const line of lines) {
    if (isSectionTitle(line)) {
      current = {
        title: normalizeSectionTitle(line),
        lines: [],
      };

      groups.push(current);
      continue;
    }

    if (!current) {
      current = {
        title: "GENEL",
        lines: [],
      };

      groups.push(current);
    }

    current.lines.push(line);
  }

  return groups.filter((x) => x.lines.length > 0);
}

function getGroupStyle(title) {
  if (title === "HAVUZ") {
    return {
      wrap: "border-blue-200 bg-blue-50/70",
      head: "border-blue-200 bg-blue-100 text-blue-900",
      badge: "border-blue-300 bg-blue-50 text-blue-900",
    };
  }

  if (title === "TEKNİK") {
    return {
      wrap: "border-amber-200 bg-amber-50/70",
      head: "border-amber-200 bg-amber-100 text-amber-900",
      badge: "border-amber-300 bg-amber-50 text-amber-900",
    };
  }

  if (title === "PEYZAJ") {
    return {
      wrap: "border-emerald-300 bg-emerald-50/90",
      head: "border-emerald-300 bg-emerald-200 text-emerald-950",
      badge: "border-emerald-400 bg-emerald-100 text-emerald-950",
    };
  }

  return {
    wrap: "border-zinc-200 bg-white",
    head: "border-zinc-100 bg-zinc-100 text-zinc-700",
    badge: "border-zinc-300 bg-zinc-100 text-zinc-700",
  };
}

function renderRaporMetni(text) {
  if (!text) {
    return <span className="text-[11px] text-emerald-400">—</span>;
  }

  const groups = buildReportGroups(text);

  if (!groups.length) {
    return <span className="text-[11px] text-emerald-400">—</span>;
  }

  return (
    <div className="space-y-2">
      {groups.map((group, groupIndex) => {
        const style = getGroupStyle(group.title);

        return (
          <div
            key={`${group.title}-${groupIndex}`}
            className={`rounded-lg border ${style.wrap}`}
          >
            <div
              className={`border-b px-2 py-1 text-[10px] font-black tracking-wide ${style.head}`}
            >
              {group.title}
            </div>

            <div className="space-y-1 px-2 py-2">
              {group.lines.map((line, index) => {
                const match = line.match(/^(.+?)\s+projesinde\s+(.*)$/i);

                if (!match) {
                  return (
                    <div
                      key={index}
                      className="text-[11px] leading-4 text-zinc-700"
                    >
                      {line}
                    </div>
                  );
                }

                const projeAdi = match[1].trim();
                const metin = match[2].trim();

                return (
                  <div
                    key={index}
                    className="text-[11px] leading-4 text-zinc-700"
                  >
                    <span
                      className={`mr-1 inline-flex rounded border px-1 py-[1px] text-[10px] font-black ${style.badge}`}
                    >
                      {projeAdi}
                    </span>
                    <span>projesinde {metin}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Badge({ children, type }) {
  const cls =
    type === "havuz"
      ? "border-blue-300 bg-blue-50 text-blue-900"
      : type === "teknik"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : type === "peyzaj"
      ? "border-emerald-400 bg-emerald-100 text-emerald-950"
      : "border-zinc-300 bg-zinc-100 text-zinc-700";

  return (
    <span
      className={`rounded border px-1.5 py-[1px] text-[9px] font-black ${cls}`}
    >
      {children}
    </span>
  );
}

export default function IdariRaporlarPage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(todayInputValue());

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleHome = () => {
    router.push("/");
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const startDate = useMemo(
    () => addDaysInputValue(selectedDate, -4),
    [selectedDate]
  );

  const endDate = useMemo(() => selectedDate, [selectedDate]);

  async function loadData(customSelectedDate = selectedDate) {
    try {
      setLoading(true);
      setError("");

      const customStart = addDaysInputValue(customSelectedDate, -4);
      const customEnd = customSelectedDate;

      const qs = new URLSearchParams();
      qs.append("startDate", customStart);
      qs.append("endDate", customEnd);

      const res = await getDataAsync(`idari-rapor?${qs.toString()}`);

      const gelenItems = res?.items || res?.Items || [];
      const gelenTotal =
        res?.summary?.total || res?.Summary?.Total || gelenItems.length;

      setItems(gelenItems);
      setTotal(gelenTotal);
    } catch (err) {
      console.error("İdari raporlar alınamadı:", err);
      setError("Raporlar alınırken hata oluştu.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const days = useMemo(() => {
    const list = [];

    for (let i = 4; i >= 0; i--) {
      const key = addDaysInputValue(endDate, -i);

      list.push({
        key,
        label: formatDay(key),
        weekday: formatWeekday(key),
      });
    }

    return list;
  }, [endDate]);

  const rows = useMemo(() => {
    const map = new Map();

    for (const item of items || []) {
      const personelId = pick(item, "personelId", "PersonelId");
      const personelAdSoyad =
        pick(item, "personelAdSoyad", "PersonelAdSoyad") ||
        `Personel #${personelId}`;

      const key = String(personelId || personelAdSoyad);
      const tarihKey = getDateKey(pick(item, "tarih", "Tarih"));

      if (!map.has(key)) {
        map.set(key, {
          key,
          personelAdSoyad,
          personelId,
          days: {},
        });
      }

      if (!map.get(key).days[tarihKey]) {
        map.get(key).days[tarihKey] = [];
      }

      map.get(key).days[tarihKey].push(item);
    }

    return Array.from(map.values()).sort((a, b) =>
      String(a.personelAdSoyad).localeCompare(String(b.personelAdSoyad), "tr")
    );
  }, [items]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-[1600px] space-y-2 px-2 py-2">
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-base font-black">İdari Raporlar</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-[11px] font-black text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98]"
              >
                ← Geri
              </button>

              <button
                type="button"
                onClick={handleHome}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100 active:scale-[0.98]"
              >
                Ana Sayfa
              </button>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-center">
                <div className="text-[9px] font-bold text-emerald-700">
                  Toplam
                </div>
                <div className="text-sm font-black text-emerald-900">
                  {total}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-[10px] font-bold text-zinc-500">
                Tarih Seç
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 w-full rounded-lg border border-zinc-300 px-2 text-xs outline-none focus:border-emerald-400"
              />
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
              {formatDay(startDate)} - {formatDay(endDate)} arası raporlar
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-center text-xs font-semibold text-emerald-700">
            Yükleniyor...
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-center text-xs font-semibold text-zinc-500">
            Seçilen tarih aralığında rapor bulunamadı.
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-[180px_repeat(5,minmax(190px,1fr))] border-b border-zinc-200">
                <div className="sticky left-0 z-20 border-r border-zinc-200 bg-zinc-100 px-2 py-2 text-[11px] font-black text-zinc-700">
                  Personel
                </div>

                {days.map((d, index) => {
                  const headerColor =
                    index % 3 === 0
                      ? "bg-blue-50 text-blue-800"
                      : index % 3 === 1
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-100 text-emerald-900";

                  return (
                    <div
                      key={d.key}
                      className={`border-r border-zinc-200 px-2 py-2 text-center ${headerColor}`}
                    >
                      <div className="text-[11px] font-black capitalize">
                        {d.weekday}
                      </div>
                      <div className="text-xs font-black">{d.label}</div>
                    </div>
                  );
                })}
              </div>

              {rows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[180px_repeat(5,minmax(190px,1fr))] border-b border-zinc-100 last:border-b-0"
                >
                  <div className="sticky left-0 z-10 border-r border-zinc-200 bg-white px-2 py-2">
                    <div className="text-xs font-black text-zinc-800">
                      {row.personelAdSoyad}
                    </div>
                  </div>

                  {days.map((day, dayIndex) => {
                    const dayItems = row.days[day.key] || [];

                    const cellBg =
                      dayIndex % 3 === 0
                        ? "bg-blue-50/25"
                        : dayIndex % 3 === 1
                        ? "bg-amber-50/25"
                        : "bg-emerald-50/60";

                    return (
                      <div
                        key={`${row.key}-${day.key}`}
                        className={`border-r border-zinc-100 px-2 py-2 align-top ${cellBg}`}
                      >
                        {dayItems.length === 0 ? (
                          <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white/70 py-8 text-[11px] font-bold text-zinc-300">
                            Rapor yok
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dayItems.map((item, itemIndex) => {
                              const id = pick(item, "id", "Id") || itemIndex;

                              const raporMetni = pick(
                                item,
                                "raporMetni",
                                "RaporMetni"
                              );

                              const not1 = pick(item, "not_1", "Not_1");
                              const not2 = pick(item, "not_2", "Not_2");
                              const not3 = pick(item, "not_3", "Not_3");

                              return (
                                <div
                                  key={id}
                                  className="rounded-lg border border-zinc-200 bg-white px-2 py-2 shadow-sm"
                                >
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    {not2 && <Badge type="havuz">HAVUZ</Badge>}
                                    {not1 && (
                                      <Badge type="teknik">TEKNİK</Badge>
                                    )}
                                    {not3 && (
                                      <Badge type="peyzaj">PEYZAJ</Badge>
                                    )}
                                  </div>

                                  <div>{renderRaporMetni(raporMetni)}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}