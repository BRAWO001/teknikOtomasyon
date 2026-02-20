// components/yoneticiRaporu/DetayliTaleplerOzetPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";

function safe(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function pct(part, total) {
  const p = safe(part);
  const t = safe(total);
  if (t <= 0) return 0;
  return Math.round((p / t) * 100);
}

function Bar({ value = 0, total = 0 }) {
  const w = pct(value, total);
  return (
    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-100"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

export default function DetayliTaleplerOzetPanel({
  siteId = "",
  talepCinsi = "",
  teknikTalep = "",
  start = "",
  end = "",
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    if (siteId) qs.set("siteId", String(siteId));
    if (talepCinsi) qs.set("talepCinsi", String(talepCinsi));
    if (teknikTalep) qs.set("teknikTalep", String(teknikTalep));
    if (start && end) {
      qs.set("startDate", start);
      qs.set("endDate", end);
    }

    const s = qs.toString();
    return `DetayliFilterTalep/ozet${s ? `?${s}` : ""}`;
  }, [siteId, talepCinsi, teknikTalep, start, end]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await getDataAsync(endpoint);
        if (cancelled) return;
        setData(res || null);
      } catch (e) {
        console.error("OZET PANEL ERROR:", e);
        if (cancelled) return;
        setData(null);
        setErr("Özet verisi alınamadı.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const total = safe(data?.totalCount);
  const teknikEvet = safe(data?.teknik?.evet);
  const teknikHayir = safe(data?.teknik?.hayir);
  const teknikBil = safe(data?.teknik?.bilinmeyen);

  const byTalepCinsi = Array.isArray(data?.byTalepCinsi) ? data.byTalepCinsi : [];
  const bySite = Array.isArray(data?.bySite) ? data.bySite : [];

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
          Özet – Talep Kırılımları
        </div>
        {loading ? (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Yükleniyor…</div>
        ) : err ? (
          <div className="text-[11px] text-rose-600 dark:text-rose-300">{err}</div>
        ) : (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Toplam: <span className="font-semibold">{total}</span>
          </div>
        )}
      </div>

      {/* üst 3 kart */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
            Toplam Talep
          </div>
          <div className="mt-1 text-[18px] font-extrabold text-zinc-900 dark:text-zinc-100">
            {total}
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
            Filtrelere göre hesaplanır.
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
            Teknik Talep (Not_3)
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-300">Evet</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {teknikEvet} ({pct(teknikEvet, total)}%)
              </span>
            </div>
            <Bar value={teknikEvet} total={total} />

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-300">Hayır</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {teknikHayir} ({pct(teknikHayir, total)}%)
              </span>
            </div>
            <Bar value={teknikHayir} total={total} />

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-300">—</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {teknikBil} ({pct(teknikBil, total)}%)
              </span>
            </div>
            <Bar value={teknikBil} total={total} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
            En Çok Gelen Talep Cinsleri
          </div>

          <div className="mt-2 space-y-2">
            {(byTalepCinsi || []).slice(0, 5).map((x, idx) => {
              const c = safe(x?.count);
              const name = String(x?.talepCinsi ?? x?.TalepCinsi ?? "—");
              return (
                <div key={`${name}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-700 dark:text-zinc-200">{name}</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {c} ({pct(c, total)}%)
                    </span>
                  </div>
                  <Bar value={c} total={total} />
                </div>
              );
            })}

            {!byTalepCinsi.length && (
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Kayıt yok</div>
            )}
          </div>
        </div>
      </div>

      {/* site bazlı mini liste */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Site Bazlı (ilk 8)
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          {bySite.map((s, idx) => {
            const c = safe(s?.count);
            const ad = s?.siteAdi ?? s?.SiteAdi ?? "—";
            return (
              <div
                key={`${ad}-${idx}`}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {String(ad)}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {c} ({pct(c, total)}%)
                  </span>
                </div>
                <div className="mt-1">
                  <Bar value={c} total={total} />
                </div>
              </div>
            );
          })}

          {!bySite.length && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Kayıt yok</div>
          )}
        </div>
      </div>
    </div>
  );
}
