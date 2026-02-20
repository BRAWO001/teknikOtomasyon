// src/components/yoneticiRaporu/SonYorumOzetMiniPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import Link from "next/link";

/* helpers */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}
function formatTR(iso) {
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
function timeAgoTR(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const absMs = Math.abs(diffMs);
  const future = diffMs < 0;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const days = Math.floor(absMs / day);
  const hours = Math.floor((absMs % day) / hour);
  const minutes = Math.floor((absMs % hour) / minute);

  const parts = [];
  if (days > 0) parts.push(`${days} gün`);
  if (hours > 0 && parts.length < 2) parts.push(`${hours} saat`);
  if (minutes > 0 && parts.length < 2) parts.push(`${minutes} dk`);
  if (!parts.length) parts.push("az önce");

  return future ? `${parts.join(" ")} sonra` : `${parts.join(" ")}`;
}
function chipClass(kind) {
  if (kind === "Satın Alma")
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200";
  if (kind === "Teknik Talep")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200";
  if (kind === "Güvenlik")
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200";
  return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100";
}

export default function SonYorumOzetMiniPanel({
  // 🔴 İKİ ALTERNATİF VAR:
  // A) apiService baseURL "/api" ekliyorsa -> "DetayliFilterTalep/son-yorumlu-ozet"
  // B) eklemiyorsa -> "api/DetayliFilterTalep/son-yorumlu-ozet"
  endpoint = "DetayliFilterTalep/son-yorumlu-ozet",
  take = 10,
  stickyTop = 8,
}) {
  const rootRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openList, setOpenList] = useState(false);
  const [selected, setSelected] = useState(null);

  const requestPath = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("take", String(Number(take) || 10));
    return `${endpoint}?${qs.toString()}`;
  }, [endpoint, take]);

  const fetchIt = async () => {
    setLoading(true);
    setErr("");
    try {
      // ✅ DEBUG: tarayıcı konsolunda "tam path" gör
      console.log("[SonYorumOzetMiniPanel] requestPath =", requestPath);

      const res = await getDataAsync(requestPath);
      const arr = res?.items ?? res?.Items ?? [];
      setItems(Array.isArray(arr) ? arr : []);
      setSelected(null);
    } catch (e) {
      console.error("SON_YORUM_OZET_ERROR:", e?.response?.data || e);
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.Message ||
          `404 ise şu path yanlış: ${requestPath}`
      );
      setItems([]);
      setSelected(null);
      setOpenList(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestPath]);

  // dışarı tıklayınca kapat
  useEffect(() => {
    const onDown = (ev) => {
      if (!openList) return;
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(ev.target)) setOpenList(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openList]);

  // ESC kapat
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenList(false);
        setSelected(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const sorted = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    return [...arr].sort((a, b) => {
      const da = new Date(a?.SonYorumTarihiUtc ?? a?.sonYorumTarihiUtc ?? 0).getTime();
      const db = new Date(b?.SonYorumTarihiUtc ?? b?.sonYorumTarihiUtc ?? 0).getTime();
      return (db || 0) - (da || 0);
    });
  }, [items]);

  const headerInfo = useMemo(() => {
    const total = sorted.length;
    if (!total) return { total: 0, lastDt: null, lastAgo: "" };
    const dt = sorted[0]?.SonYorumTarihiUtc ?? sorted[0]?.sonYorumTarihiUtc ?? null;
    return { total, lastDt: dt, lastAgo: timeAgoTR(dt) };
  }, [sorted]);

  return (
    <section
      ref={rootRef}
      className="z-40 rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      style={{ position: "sticky", top: stickyTop }}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
            Son Bırakılan Yorumlar
          </div>
          <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
            {headerInfo.total} kayıt
            {headerInfo.lastDt ? (
              <>
                {" "}
                • Son: {formatTR(headerInfo.lastDt)}{" "}
                <span className="font-bold">({headerInfo.lastAgo})</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchIt}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Yenile
          </button>

          <button
            type="button"
            onClick={() => setOpenList((p) => !p)}
            className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-extrabold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-950/60"
            title="Listeyi aç/kapat"
          >
            {openList ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-3 pb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          Yükleniyor…
        </div>
      ) : err ? (
        <div className="px-3 pb-3">
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </div>
        </div>
      ) : null}

      {/* dropdown absolute */}
      <div className="relative">
        <div
          className={`absolute left-0 right-0 top-0 z-50 overflow-hidden rounded-b-md border-t border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-200 ${
            openList ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="max-h-72 overflow-auto px-3 py-2">
            {sorted.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                Yorum özeti bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map((x) => {
                  const id = x?.TalepId ?? x?.talepId ?? x?.SatinAlmaId ?? x?.satinAlmaId ?? `${Math.random()}`;
                  const cins = x?.TalepCinsi ?? x?.talepCinsi ?? "-";
                  const yorumSay = x?.YorumSayisi ?? x?.yorumSayisi ?? 0;
                  const dt = x?.SonYorumTarihiUtc ?? x?.sonYorumTarihiUtc ?? null;

                  const href =
                    id && (x?.SatinAlmaId || x?.satinAlmaId || x?.TalepId || x?.talepId)
                      ? `/satinalma/teklifler/${id}`
                      : "#";

                  return (
                    <Link
                      key={id}
                      href={href}
                      className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-left transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:bg-zinc-950/60 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full px-2 py-[1px] text-[10px] font-semibold ${chipClass(cins)}`}>
                              {safeText(cins)}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
                              TLP-{safeText(id)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10.5px] text-zinc-500 dark:text-zinc-400">
                            <span className="shrink-0 whitespace-nowrap">{formatTR(dt)}</span>
                            <span className="shrink-0 whitespace-nowrap font-bold text-zinc-600 dark:text-zinc-300">
                              {timeAgoTR(dt)}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-[10px] text-zinc-600 dark:text-zinc-300">Not</div>
                          <div className="text-[13px] font-extrabold text-zinc-900 dark:text-zinc-50">
                            {yorumSay}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
