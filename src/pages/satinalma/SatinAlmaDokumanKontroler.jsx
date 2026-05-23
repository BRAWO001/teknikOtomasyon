import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { getDataAsync } from "@/utils/apiService";

function formatDate(v) {
  if (!v) return "-";

  try {
    return new Date(v).toLocaleString("tr-TR");
  } catch {
    return "-";
  }
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
  start.setMonth(start.getMonth() - 1);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

function isImageFile(file) {
  const url = String(file?.url || file?.Url || "").toLowerCase();

  return [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".heic",
    ".heif",
    ".jfif",
    ".bmp",
    ".avif",
  ].some((x) => url.endsWith(x));
}

function getFileName(file) {
  return file?.dosyaAdi || file?.DosyaAdi || "Belge";
}

function getFileUrl(file) {
  return file?.url || file?.Url || "";
}

function SatinAlmaTalepCard({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Kayıt bulunamadı.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      {data.map((item) => {
        const id = item?.id || item?.Id;

        const talepEden = item?.talepEden || item?.TalepEden;

        const site = item?.site || item?.Site;

        const yorumlar = item?.yorumlar || item?.Yorumlar || [];

        const dosyalar = item?.dosyalar || item?.Dosyalar || [];

        return (
          <div
            key={id}
            className="rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                    #{item?.seriNo || item?.SeriNo || id}
                  </span>

                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                    {item?.talepCinsi || item?.TalepCinsi || "Satın Alma"}
                  </span>

                  <span className="text-[10px] text-zinc-500">
                    {formatDate(item?.tarih || item?.Tarih)}
                  </span>
                </div>

                <div className="mt-1 text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
                  {site?.ad || site?.Ad || "Site yok"}
                </div>

                <div className="mt-1 line-clamp-3 text-[11px] leading-snug text-zinc-700 dark:text-zinc-200">
                  {item?.talepAciklamasi ||
                    item?.TalepAciklamasi ||
                    item?.aciklama ||
                    item?.Aciklama ||
                    "-"}
                </div>
              </div>

              <div className="min-w-[110px] text-right text-[10px] text-zinc-500">
                <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                  Talep Eden
                </div>

                <div className="leading-tight">
                  {talepEden
                    ? `${talepEden?.ad || talepEden?.Ad || ""} ${
                        talepEden?.soyad || talepEden?.Soyad || ""
                      }`
                    : "-"}
                </div>

                {(talepEden?.telefon || talepEden?.Telefon) && (
                  <div className="mt-0.5">
                    {talepEden?.telefon || talepEden?.Telefon}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {/* BELGELER */}
              <div className="rounded-md border border-zinc-100 bg-zinc-50 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="mb-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
                  Belgeler ({dosyalar.length})
                </div>

                <div className="flex max-h-28 flex-wrap gap-1 overflow-auto pr-1">
                  {dosyalar.map((d) => {
                    const url = getFileUrl(d);

                    if (!url) return null;

                    const image = isImageFile(d);

                    return (
                      <a
                        key={d?.id || d?.Id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={getFileName(d)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white text-[8px] font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt={getFileName(d)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="px-1 text-center leading-tight">
                            PDF
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* YORUMLAR */}
              <div className="rounded-md border border-zinc-100 bg-zinc-50 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="mb-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
                  Not / Yorumlar ({yorumlar.length})
                </div>

                {yorumlar.length ? (
                  <div className="max-h-28 space-y-1 overflow-auto pr-1">
                    {yorumlar.map((y) => {
                      const yazan =
                        y?.yazanPersonel ||
                        y?.YazanPersonel ||
                        y?.personel ||
                        y?.Personel;

                      return (
                        <div
                          key={y?.id || y?.Id}
                          className="rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div className="flex justify-between gap-1 text-[9px] text-zinc-500">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                              {yazan
                                ? `${yazan?.ad || yazan?.Ad || ""} ${
                                    yazan?.soyad || yazan?.Soyad || ""
                                  }`
                                : "Personel"}
                            </span>

                            <span className="shrink-0">
                              {formatDate(
                                y?.olusturmaTarihiUtc ||
                                  y?.OlusturmaTarihiUtc
                              )}
                            </span>
                          </div>

                          <div className="mt-0.5 break-words text-[10px] leading-snug text-zinc-700 dark:text-zinc-200">
                            {y?.yorum || y?.Yorum || "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-400">
                    Yorum yok.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SatinAlmaTalepleriPage() {
  const router = useRouter();

  const defaults = getDefaultRange();

  const [personel, setPersonel] = useState(null);

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [pageSize] = useState(30);

  const [totalPages, setTotalPages] = useState(1);

  const [totalCount, setTotalCount] = useState(0);

  const [startDate, setStartDate] = useState(defaults.startDate);

  const [endDate, setEndDate] = useState(defaults.endDate);

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const c = getClientCookie("PersonelUserInfo");

      if (!c) {
        router.replace("/");
        return;
      }

      const parsed = JSON.parse(c);

      setPersonel(parsed?.personel ?? parsed);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);

      router.replace("/");
    }
  }, [router]);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    qs.set("page", String(page));

    qs.set("pageSize", String(pageSize));

    if (startDate) {
      qs.set("startDate", startDate);
    }

    if (endDate) {
      qs.set("endDate", endDate);
    }

    if (searchText.trim()) {
      qs.set("q", searchText.trim());
    }

    return `satinalma/satin-alma-talepleri?${qs.toString()}`;
  }, [page, pageSize, startDate, endDate, searchText]);

  async function loadItems() {
    setLoading(true);

    try {
      const res = await getDataAsync(endpoint);

      setItems(res?.items || res?.Items || []);

      setTotalPages(res?.totalPages || res?.TotalPages || 1);

      setTotalCount(res?.totalCount || res?.TotalCount || 0);
    } catch (e) {
      console.error("Satın alma talepleri GET hata:", e);

      setItems([]);

      setTotalPages(1);

      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!personel) return;

    loadItems();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, personel]);

  function resetDateFilters() {
    const d = getDefaultRange();

    setStartDate(d.startDate);

    setEndDate(d.endDate);

    setSearchText("");

    setPage(1);
  }

  return (
    <div className="space-y-2 p-2">
      {/* HEADER */}
      <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Satın Alma Belgeleri
            </div>

            <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              {totalCount} kayıt • Sayfa {page}/{totalPages}
              {loading ? " • Yükleniyor..." : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={loadItems}
            className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200"
          >
            Yenile
          </button>
        </div>

        {/* FİLTRELER */}
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500">
              Başlangıç
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500">
              Bitiş
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500">
              Fatura No / Yorum / Seri No
            </label>

            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Ara..."
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                loadItems();
              }}
              className="h-8 w-full rounded-md border border-sky-200 bg-sky-50 px-3 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200"
            >
              Filtrele
            </button>
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={resetDateFilters}
            className="h-8 rounded-md border border-zinc-300 bg-white px-3 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
          Liste
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => Math.max(1, p - 1))
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            ◀ Önceki
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Sonraki ▶
          </button>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Yükleniyor...
        </div>
      ) : (
        <SatinAlmaTalepCard data={items} />
      )}
    </div>
  );
}