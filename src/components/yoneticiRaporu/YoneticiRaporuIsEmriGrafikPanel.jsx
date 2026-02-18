import React, { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";

/* ===== helpers ===== */
function moneyTR(val, currency = "TRY") {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(val));
}

function clampPct(n) {
  if (Number.isNaN(n) || n === null || n === undefined) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/* ===== mini chart ===== */
function MiniStackBar({ title, items = [] }) {
  const total = items.reduce((a, x) => a + (Number(x.value) || 0), 0) || 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-zinc-600 dark:text-zinc-300">{title}</span>
        <span className="font-semibold text-zinc-800 dark:text-zinc-100">
          {total}
        </span>
      </div>

      <div className="mt-1 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex">
        {items.map((it, idx) => {
          const v = Number(it.value) || 0;
          const w = total > 0 ? (v / total) * 100 : 0;
          return (
            <div
              key={`${it.label}-${idx}`}
              className={it.className || "bg-zinc-600"}
              style={{ width: `${w}%` }}
              title={`${it.label}: ${v}`}
            />
          );
        })}
      </div>

      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-600 dark:text-zinc-300">
        {items.map((it, idx) => (
          <span key={`${it.label}-l-${idx}`} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-sm ${it.className || "bg-zinc-600"}`} />
            {it.label}:{" "}
            <b className="text-zinc-900 dark:text-zinc-100">{it.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function TutarBars({ tutarlar }) {
  const rows = [
    { key: "MalzemeToplam", label: "Toplam", val: tutarlar?.malzemeToplam ?? 0 },
    { key: "DepoToplam", label: "Depo", val: tutarlar?.depoToplam ?? 0 },
    { key: "YeniAlimToplam", label: "Yeni Alım", val: tutarlar?.yeniAlimToplam ?? 0 },
    { key: "IsverenTeminiToplam", label: "İşveren", val: tutarlar?.isverenTeminiToplam ?? 0 },
    { key: "DigerToplam", label: "Diğer", val: tutarlar?.digerToplam ?? 0 },
  ];

  const max = rows.reduce((m, x) => Math.max(m, Number(x.val) || 0), 0);

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const v = Number(r.val) || 0;
        const pct = max > 0 ? clampPct((v / max) * 100) : 0;

        return (
          <div key={r.key} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">{r.label}</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{moneyTR(v, "TRY")}</span>
            </div>

            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-600 dark:bg-zinc-200"
                style={{ width: `${pct}%` }}
                title={moneyTR(v, "TRY")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================================================== */

export default function YoneticiRaporuIsEmriGrafikPanel({
  siteId = null,
  personelId = null,
  start = null,
  end = null,
  className = "",
  req = undefined,
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();

    if (siteId) params.set("siteId", String(siteId));
    if (personelId) params.set("personelId", String(personelId));

    // ✅ tarih: sadece ikisi birlikte (senin standart)
    if (start && end) {
      params.set("start", start);
      params.set("end", end);
    }

    const qs = params.toString();
    return `yoneticiraporu/grafikIsEmirleriDetayliYoneticiRaporu${qs ? `?${qs}` : ""}`;
  }, [siteId, personelId, start, end]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const json = await getDataAsync(endpoint, { req });
        if (!alive) return;
        setData(json);
      } catch (e) {
        if (!alive) return;

        const msg =
          e?.response?.data?.message ||
          e?.response?.data ||
          e?.message ||
          "Hata oluştu";

        setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
        setData(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [endpoint, req]);

  const view = data || {};

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            İş Emirleri Grafik Özeti
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {loading ? "Yükleniyor..." : err ? "Hata" : "Hazır"}
          </div>
        </div>

        <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
          Toplam: <b className="text-zinc-900 dark:text-white">{view?.totalCount ?? 0}</b>{" "}
          <span className="mx-1">•</span>
          Site: <b className="text-zinc-900 dark:text-white">{view?.uniqueSiteCount ?? 0}</b>{" "}
          <span className="mx-1">•</span>
          Ortalama Süre:{" "}
          <b className="text-zinc-900 dark:text-white">
            {Math.round(view?.sure?.ortalamaDakika ?? 0)} dk
          </b>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {err ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {err}
          </div>
        ) : null}

        {!data && !loading && !err ? (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Veri yok</div>
        ) : null}

        {!!data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Sol: Tutarlar */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2">
              <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                Malzeme Tutarları (TRY)
              </div>
              <div className="mt-2 rounded-md bg-zinc-50 dark:bg-zinc-800/40 p-2">
                <TutarBars tutarlar={view?.tutarlar} />
              </div>
            </div>

            {/* Orta: Durum dağılımı */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 space-y-2">
              <MiniStackBar
                title="Durum Dağılımı"
                items={[
                  { label: "Beklemede", value: view?.durum?.beklemede ?? 0, className: "bg-amber-500" },
                  { label: "Devam", value: view?.durum?.devamEdiyor ?? 0, className: "bg-sky-500" },
                  { label: "Malzeme", value: view?.durum?.malzemeTemini ?? 0, className: "bg-violet-500" },
                  { label: "Bitti", value: view?.durum?.isBitirildi ?? 0, className: "bg-emerald-500" },
                  { label: "Diğer", value: view?.durum?.diger ?? 0, className: "bg-zinc-500" },
                ]}
              />

              <MiniStackBar
                title="Süre Hesaplanabilen (Başlangıç+Bitiş)"
                items={[
                  {
                    label: "Hesaplanabilir",
                    value: view?.sure?.sureHesaplanabilirCount ?? 0,
                    className: "bg-indigo-500",
                  },
                  {
                    label: "Diğerleri",
                    value: Math.max(0, (view?.totalCount ?? 0) - (view?.sure?.sureHesaplanabilirCount ?? 0)),
                    className: "bg-zinc-400 dark:bg-zinc-600",
                  },
                ]}
              />
            </div>

            {/* Sağ: Hızlı özet */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 space-y-2">
              <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/40 p-2 text-[11px] text-zinc-700 dark:text-zinc-200">
                <div>
                  Toplam dakika:{" "}
                  <b className="text-zinc-900 dark:text-white">
                    {Math.round(view?.sure?.toplamDakika ?? 0)}
                  </b>
                </div>
                <div className="mt-1">
                  Ortalama dakika:{" "}
                  <b className="text-zinc-900 dark:text-white">
                    {Math.round(view?.sure?.ortalamaDakika ?? 0)}
                  </b>
                </div>
                <div className="mt-1">
                  Min/Max Oluşturma:{" "}
                  <b className="text-zinc-900 dark:text-white">
                    {view?.minOlusturmaTarihi ? "Var" : "-"}
                  </b>{" "}
                  /{" "}
                  <b className="text-zinc-900 dark:text-white">
                    {view?.maxOlusturmaTarihi ? "Var" : "-"}
                  </b>
                </div>
              </div>

              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
