




// components/yoneticiRaporu/YoneticiRaporuSatinAlmaGrafikPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";

/* ===== küçük helperlar ===== */
function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
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

/* ===== mini chart componentleri ===== */
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
          const w = total > 0 ? (it.value / total) * 100 : 0;
          return (
            <div
              key={`${it.label}-${idx}`}
              className={it.className || "bg-zinc-600"}
              style={{ width: `${w}%` }}
              title={`${it.label}: ${it.value}`}
            />
          );
        })}
      </div>

      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-600 dark:text-zinc-300">
        {items.map((it, idx) => (
          <span key={`${it.label}-l-${idx}`} className="flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-sm ${
                it.className || "bg-zinc-600"
              }`}
            />
            {it.label}:{" "}
            <b className="text-zinc-900 dark:text-zinc-100">{it.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function MoneyBars({ paraToplamlari = [] }) {
  const maxGross = useMemo(() => {
    return (paraToplamlari || []).reduce(
      (m, x) => Math.max(m, Number(x?.grossSum) || 0),
      0
    );
  }, [paraToplamlari]);

  if (!paraToplamlari?.length) {
    return (
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Toplam bulunamadı
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {paraToplamlari.map((m, idx) => {
        const cur = m?.paraBirimi || "TRY";
        const gross = Number(m?.grossSum) || 0;
        const net = Number(m?.netSum) || 0;
        const kdv = Number(m?.kdvSum) || 0;

        const pct = maxGross > 0 ? clampPct((gross / maxGross) * 100) : 0;

        return (
          <div key={`${cur}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {cur} ({m?.rowCount ?? 0} kayıt)
              </span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {moneyTR(gross, cur)}
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-600 dark:bg-zinc-200"
                style={{ width: `${pct}%` }}
                title={`Toplam: ${moneyTR(gross, cur)}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-600 dark:text-zinc-300">
              <span>
                Ara:{" "}
                <b className="text-zinc-900 dark:text-white">
                  {moneyTR(net, cur)}
                </b>
              </span>
              <span>
                KDV:{" "}
                <b className="text-zinc-900 dark:text-white">
                  {moneyTR(kdv, cur)}
                </b>
              </span>
              <span>
                Kalem:{" "}
                <b className="text-zinc-900 dark:text-white">
                  {m?.kalemSum ?? 0}
                </b>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================================================== */

export default function YoneticiRaporuSatinAlmaGrafikPanel({
  start = null, // "2026-01-01"
  end = null, // "2026-01-31"
  className = "",
  req = undefined, // SSR kullanırsan dışarıdan req verebilirsin (opsiyonel)
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  // apiService endpoint birleştiriyor => burada sadece path üretelim
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    const qs = params.toString();
    return `yoneticiraporu/grafikSatinAlmaDetayliYoneticiRaporu${qs ? `?${qs}` : ""}`;
  }, [start, end]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ SENİN GET (token/cookie otomatik)
        const json = await getDataAsync(endpoint, { req });

        if (!alive) return;
        setData(json);
      } catch (e) {
        if (!alive) return;

        // axios error message daha okunur olsun
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

  const totalKalem = useMemo(() => {
    return (view?.paraToplamlari || []).reduce(
      (a, x) => a + (Number(x?.kalemSum) || 0),
      0
    );
  }, [view?.paraToplamlari]);

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
        

        
      </div>

      <div className="p-3">
        {!data && !loading && !err && (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Veri yok
          </div>
        )}

        {!!data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Sol: metrikler */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-1">
              <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                Toplam Kayıt : {view?.totalCount ?? 0}  -- Farklı Site : {view?.uniqueSiteCount ?? 0}  ----  Toplam Kalem :  {totalKalem}
              </div>
            

              
               <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/40 p-1 mt">
               Toplam
                <MoneyBars paraToplamlari={view?.paraToplamlari || []} />
              </div>
            </div>

            {/* Orta: durum + satın alındı */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 space-y-1">
              <MiniStackBar
                title="Durum Dağılımı"
                items={[
                  {
                    label: "Onaylandı",
                    value: view?.durum?.onaylandi ?? 0,
                    className: "bg-emerald-500",
                  },
                  {
                    label: "Beklemede",
                    value: view?.durum?.beklemede ?? 0,
                    className: "bg-amber-500",
                  },
                  {
                    label: "Reddedildi",
                    value: view?.durum?.reddedildi ?? 0,
                    className: "bg-rose-500",
                  },
                  {
                    label: "Onaycı Yok",
                    value: view?.durum?.onayciYok ?? 0,
                    className: "bg-zinc-500",
                  },
                ]}
              />

              <MiniStackBar
                title="Satın Alındı"
                items={[
                  {
                    label: "Satın alındı",
                    value: view?.satinAlindi?.satinAlindi ?? 0,
                    className: "bg-emerald-500",
                  },
                  {
                    label: "Satın alınmadı",
                    value: view?.satinAlindi?.satinAlinmadi ?? 0,
                    className: "bg-rose-500",
                  },
                  {
                    label: "Diğer",
                    value: view?.satinAlindi?.diger ?? 0,
                    className: "bg-zinc-500",
                  },
                  {
                    label: "Boş",
                    value: view?.satinAlindi?.bos ?? 0,
                    className: "bg-zinc-300 dark:bg-zinc-600",
                  },
                ]}
              />
              
            </div>

            {/* Sağ: fatura/teknik/süreç + para */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 space-y-1">
              <MiniStackBar
                title="Fatura"
                items={[
                  {
                    label: "Var",
                    value: view?.fatura?.var ?? 0,
                    className: "bg-indigo-500",
                  },
                  {
                    label: "Yok",
                    value: view?.fatura?.yok ?? 0,
                    className: "bg-zinc-500",
                  },
                ]}
              />

              <MiniStackBar
                title="Teknik Talep"
                items={[
                  {
                    label: "Evet",
                    value: view?.teknikTalep?.evet ?? 0,
                    className: "bg-emerald-500",
                  },
                  {
                    label: "Hayır",
                    value: view?.teknikTalep?.hayir ?? 0,
                    className: "bg-rose-500",
                  },
                  {
                    label: "Diğer",
                    value: view?.teknikTalep?.diger ?? 0,
                    className: "bg-zinc-500",
                  },
                  {
                    label: "Boş",
                    value: view?.teknikTalep?.bos ?? 0,
                    className: "bg-zinc-300 dark:bg-zinc-600",
                  },
                ]}
              />

              <MiniStackBar
                title="Proje Yöneticisi Süreci"
                items={[
                  {
                    label: "Tamamlandı",
                    value: view?.projeSureci?.tamamlandi ?? 0,
                    className: "bg-indigo-500",
                  },
                  {
                    label: "Diğer",
                    value: view?.projeSureci?.diger ?? 0,
                    className: "bg-zinc-500",
                  },
                  {
                    label: "Boş",
                    value: view?.projeSureci?.bos ?? 0,
                    className: "bg-zinc-300 dark:bg-zinc-600",
                  },
                ]}
              />

             
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
