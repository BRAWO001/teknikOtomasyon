import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

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

function normalizePersonel(raw) {
  if (!raw) return null;
  const p = raw?.personel ?? raw;

  return {
    id: pick(p, "id", "Id") ?? null,
    ad: pick(p, "ad", "Ad") ?? "",
    soyad: pick(p, "soyad", "Soyad") ?? "",
    rol: pick(p, "rol", "Rol", "rolKod", "RolKod") ?? null,
    personelKodu: pick(p, "personelKodu", "PersonelKodu") ?? null,
  };
}

function normalizeList(arr) {
  if (!Array.isArray(arr)) return [];

  return arr.map((x) => ({
    id: pick(x, "id", "Id") ?? null,
    personelId: pick(x, "personelId", "PersonelId") ?? null,
    tarih: pick(x, "tarih", "Tarih") ?? null,
    personelAdSoyad: pick(x, "personelAdSoyad", "PersonelAdSoyad") ?? "",
    gorevi: pick(x, "gorevi", "Gorevi") ?? "",
    bagliOlduguBirimProje:
      pick(x, "bagliOlduguBirimProje", "BagliOlduguBirimProje") ?? "",
    duzenlemeDurumu:
      typeof pick(x, "duzenlemeDurumu", "DuzenlemeDurumu") === "boolean"
        ? pick(x, "duzenlemeDurumu", "DuzenlemeDurumu")
        : false,
    konuSayisi: Number(pick(x, "konuSayisi", "KonuSayisi") ?? 0),
    talepOneriSayisi: Number(
      pick(x, "talepOneriSayisi", "TalepOneriSayisi") ?? 0
    ),
    yorumSayisi: Number(pick(x, "yorumSayisi", "YorumSayisi") ?? 0),
    yoneticiSayisi: Number(pick(x, "yoneticiSayisi", "YoneticiSayisi") ?? 0),
    yoneticiler: Array.isArray(pick(x, "yoneticiler", "Yoneticiler"))
      ? pick(x, "yoneticiler", "Yoneticiler")
      : [],
  }));
}

function DuzenlemePill({ ok }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/25 dark:text-red-200"
      }`}
    >
      {ok ? "Açık" : "Kapalı"}
    </span>
  );
}

export default function GunlukRaporIndexPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const raw = getClientCookie("PersonelUserInfo");
    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const p = normalizePersonel(parsed);

      if (!p?.id) {
        router.push("/");
        return;
      }

      setPersonel(p);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      router.push("/");
    }
  }, [router]);

  const endpoint = useMemo(() => {
    if (!personel?.id) return "";

    const qs = new URLSearchParams();
    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);

    const base = `gunlukRapor/atanan-yonetici/${personel.id}`;
    return qs.toString() ? `${base}?${qs.toString()}` : base;
  }, [personel?.id, startDate, endDate]);

  const loadList = useCallback(async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      setErr("");
      const res = await getDataAsync(endpoint);
      setItems(normalizeList(res));
    } catch (e) {
      console.error("GUNLUK RAPOR LIST ERROR:", e);
      setItems([]);
      const status = e?.response?.status;
      setErr(status ? `Liste alınamadı (HTTP ${status}).` : "Liste alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!endpoint) return;
    loadList();
  }, [endpoint, loadList]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((x) => {
      const yoneticiText = (x.yoneticiler || [])
        .map((y) => {
          const p = y?.SecilenYonetici ?? y?.secilenYonetici;
          const ad = pick(p, "Ad", "ad") ?? "";
          const soyad = pick(p, "Soyad", "soyad") ?? "";
          return `${ad} ${soyad}`.trim();
        })
        .join(" ")
        .toLowerCase();

      const text = [
        x.id,
        x.personelAdSoyad,
        x.gorevi,
        x.bagliOlduguBirimProje,
        yoneticiText,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [items, search]);

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="p-3 space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Bana Atanmış Günlük Raporlar
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Giriş yapan yöneticiye atanmış rapor listesi
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
            >
              Ana Sayfa
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Filtreleri Sıfırla
            </button>

            <button
              type="button"
              onClick={loadList}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-6">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] text-zinc-500">Başlangıç Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] text-zinc-500">Bitiş Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] text-zinc-500">Arama</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Personel / görev / birim / yönetici / id"
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-[12px] outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {err}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Raporlar
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Toplam: {filteredItems.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full border-collapse text-[12px]">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                {[
                  "Rapor No",
                  "Tarih",
                  "Raporu Giren",
                  
                  "Konu",
                  "Talep / Öneri",
                  "Yorum",
                  "Yönetici",
                  "Düzenleme",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((r, i) => (
                <tr
                  key={r.id ?? i}
                  onClick={() => router.push(`/gunlukRapor/${r.id}`)}
                  className="cursor-pointer border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  title="Detaya git"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      #{safeText(r.id)}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDateTR(r.tarih)}
                  </td>

                  <td className="px-3 py-2">{safeText(r.personelAdSoyad)}</td>
                  

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-900/25 dark:text-sky-200">
                      {Number(r.konuSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-900/25 dark:text-indigo-200">
                      {Number(r.talepOneriSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-900/25 dark:text-amber-200">
                      {Number(r.yorumSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-200">
                      {Number(r.yoneticiSayisi) || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <DuzenlemePill ok={!!r.duzenlemeDurumu} />
                  </td>
                </tr>
              ))}

              {!loading && !filteredItems.length && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-10 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-10 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    Yükleniyor...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}