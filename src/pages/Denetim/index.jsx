
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { roleGuard } from "@/utils/roleGuard";
import DenetimListeCard from "@/components/Denetim/DenetimListeCard";

export const getServerSideProps = (ctx) =>
  roleGuard(ctx, {
    allow: [40, 90, 30, 33, 34],
    redirectTo: "/",
  });

const DURUMLAR = [
  { value: "", label: "Tüm durumlar" },
  { value: "10", label: "Beklemede" },
  { value: "30", label: "Devam ediyor" },
  { value: "90", label: "İptal" },
  { value: "100", label: "Tamamlandı" },
];

const inputClass =
  "h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const buttonClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

const pick = (obj, key) =>
  obj?.[key] ??
  obj?.[key.charAt(0).toUpperCase() + key.slice(1)];

export default function DenetimIndexPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [siteId, setSiteId] = useState("");
  const [durum, setDurum] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 18;
  const [reload, setReload] = useState(0);

  // ==========================================
  // ARAMA GECİKTİRME
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // ==========================================
  // PROJELER
  // ==========================================
  useEffect(() => {
    let active = true;

    getDataAsync("SiteAptEvControllerSet/sites")
      .then((data) => {
        if (active) {
          setSites(Array.isArray(data) ? data : []);
        }
      })
      .catch((e) => {
        console.error("DENETIM SITES GET:", e);
      });

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // DENETİM LİSTESİ
  // ==========================================
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();

    if (siteId) params.set("siteId", siteId);
    if (durum) params.set("durum", durum);

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    setLoading(true);
    setError("");

    getDataAsync(
      `Denetim${params.toString() ? `?${params}` : ""}`
    )
      .then((data) => {
        if (active) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch((e) => {
        console.error("DENETIM LIST GET:", e);

        if (active) {
          setItems([]);
          setError(
            "Denetim listesi alınamadı. API bağlantısını kontrol edin."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [siteId, durum, debouncedSearch, reload]);

  // ==========================================
  // TARİH FİLTRELERİ
  // ==========================================
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const date = String(
        pick(item, "tarih") || ""
      ).slice(0, 10);

      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;

      return true;
    });
  }, [items, startDate, endDate]);

  // ==========================================
  // SAYFALAMA
  // ==========================================
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ==========================================
  // FİLTRELERİ SIFIRLA
  // ==========================================
  const reset = () => {
    setSiteId("");
    setDurum("");
    setSearch("");
    setDebouncedSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // ==========================================
  // SERİ NO İLE DETAYA GİT
  // ==========================================
  const handleDetail = (seriNo) => {
    if (!seriNo || !String(seriNo).trim()) return;

    router.push({
      pathname: "/Denetim/denetimDetay",
      query: {
        seriNo: String(seriNo).trim(),
      },
    });
  };

  return (
    <div className="space-y-3 p-2 text-zinc-800 dark:text-zinc-100">
      <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">
              Denetim Yönetimi
            </h1>

            <p className="text-xs text-zinc-500">
              {filtered.length} denetim • Sayfa{" "}
              {currentPage}/{totalPages}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => router.push("/")}
            >
              Anasayfa
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={reset}
            >
              Filtreleri sıfırla
            </button>

            <button
              type="button"
              className={buttonClass}
              disabled={loading}
              onClick={() => setReload((x) => x + 1)}
            >
              Yenile
            </button>

            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              onClick={() =>
                router.push("/Denetim/yeniDenetim")
              }
            >
              + Yeni Denetim
            </button>
          </div>
        </div>

        {/* FİLTRELER */}
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          <label className="space-y-1">
            <span className="text-[11px] text-zinc-500">
              Proje
            </span>

            <select
              className={inputClass}
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tüm projeler</option>

              {[...sites]
                .sort((a, b) =>
                  String(pick(a, "ad") || "").localeCompare(
                    String(pick(b, "ad") || ""),
                    "tr"
                  )
                )
                .map((s) => (
                  <option
                    key={pick(s, "id")}
                    value={pick(s, "id")}
                  >
                    {pick(s, "ad") ||
                      `Proje #${pick(s, "id")}`}
                  </option>
                ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-zinc-500">
              Durum
            </span>

            <select
              className={inputClass}
              value={durum}
              onChange={(e) => {
                setDurum(e.target.value);
                setPage(1);
              }}
            >
              {DURUMLAR.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-zinc-500">
              Başlangıç tarihi
            </span>

            <input
              type="date"
              className={inputClass}
              max={endDate || undefined}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] text-zinc-500">
              Bitiş tarihi
            </span>

            <input
              type="date"
              className={inputClass}
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="col-span-2 space-y-1 md:col-span-1">
            <span className="text-[11px] text-zinc-500">
              Detaylı arama
            </span>

            <input
              className={inputClass}
              value={search}
              placeholder="Başlık, proje, seri no, not, görevlendirme..."
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>

        <p className="mt-2 text-[10px] text-zinc-400">
          Arama; denetim başlığı, açıklaması, seri no, proje,
          genel notlar, görevlendirmeler ve görevlendirme
          notlarını kapsar.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 p-8 text-center text-sm dark:border-zinc-800">
          Denetimler yükleniyor...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Seçilen filtrelere uygun denetim bulunamadı.
        </div>
      ) : (
        <DenetimListeCard
          data={visible}
          onDetail={handleDetail}
        />
      )}

      {/* SAYFALAMA */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={loading || currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
        >
          ← Önceki
        </button>

        <span className="text-xs">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          className={buttonClass}
          disabled={loading || currentPage >= totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          Sonraki →
        </button>
      </div>
    </div>
  );
}
