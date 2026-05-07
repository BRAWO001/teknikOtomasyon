



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

function parseDateSafe(iso) {
  if (!iso) return null;

  const s = String(iso).trim().replace(" ", "T");

  const hasTZ = /([zZ]|[+\-]\d{2}:\d{2})$/.test(s);

  const d = new Date(hasTZ ? s : `${s}Z`);

  return isNaN(d.getTime()) ? null : d;
}

function formatTR(iso) {
  const d = parseDateSafe(iso);

  if (!d) return "-";

  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgoTR(iso) {
  const dt = parseDateSafe(iso);

  if (!dt) return "";

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

  if (hours > 0 && parts.length < 2)
    parts.push(`${hours} saat`);

  if (minutes > 0 && parts.length < 2)
    parts.push(`${minutes} dk`);

  if (!parts.length) parts.push("az önce");

  return future
    ? `${parts.join(" ")} sonra`
    : `${parts.join(" ")}`;
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
  endpoint = "DetayliFilterTalep/son-yorumlu-ozet",
  take = 10,
  stickyTop = 8,
}) {
  const rootRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openList, setOpenList] = useState(false);

  const requestPath = useMemo(() => {
    const qs = new URLSearchParams();

    qs.set("take", String(Number(take) || 10));

    return `${endpoint}?${qs.toString()}`;
  }, [endpoint, take]);

  const fetchIt = async () => {
    setLoading(true);
    setErr("");

    try {
      console.log(
        "[SonYorumOzetMiniPanel] requestPath =",
        requestPath
      );

      const res = await getDataAsync(requestPath);

      console.log(
        "[SonYorumOzetMiniPanel] RESPONSE =",
        res
      );

      const arr = res?.items ?? res?.Items ?? [];

      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error(
        "SON_YORUM_OZET_ERROR:",
        e?.response?.data || e
      );

      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.Message ||
          `404 ise şu path yanlış: ${requestPath}`
      );

      setItems([]);
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

      if (!el.contains(ev.target))
        setOpenList(false);
    };

    document.addEventListener("mousedown", onDown);

    return () =>
      document.removeEventListener("mousedown", onDown);
  }, [openList]);

  // ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenList(false);
      }
    };

    document.addEventListener("keydown", onKey);

    return () =>
      document.removeEventListener("keydown", onKey);
  }, []);

  const sorted = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];

    return [...arr].sort((a, b) => {
      const da =
        parseDateSafe(
          a?.SonYorumTarihiUtc ??
            a?.sonYorumTarihiUtc
        )?.getTime() ?? 0;

      const db =
        parseDateSafe(
          b?.SonYorumTarihiUtc ??
            b?.sonYorumTarihiUtc
        )?.getTime() ?? 0;

      return db - da;
    });
  }, [items]);

  const headerInfo = useMemo(() => {
    const total = sorted.length;

    if (!total)
      return {
        total: 0,
        lastDt: null,
        lastAgo: "",
      };

    const dt =
      sorted[0]?.SonYorumTarihiUtc ??
      sorted[0]?.sonYorumTarihiUtc ??
      null;

    return {
      total,
      lastDt: dt,
      lastAgo: timeAgoTR(dt),
    };
  }, [sorted]);

  return (
    <section
      ref={rootRef}
      className="z-40 rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      style={{
        position: "sticky",
        top: stickyTop,
      }}
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
                <span className="font-bold">
                  ({headerInfo.lastAgo})
                </span>
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
          >
            {openList ? "▲" : "▼"}
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          className={`absolute left-0 right-0 top-0 z-50 overflow-hidden rounded-b-md border-t border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-200 ${
            openList
              ? "max-h-[520px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="max-h-[520px] overflow-auto px-3 py-2">
            {loading ? (
              <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                Yükleniyor...
              </div>
            ) : err ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {err}
              </div>
            ) : sorted.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                Yorum özeti bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map((x) => {
                  const id =
                    x?.TalepId ??
                    x?.talepId ??
                    x?.SatinAlmaId ??
                    x?.satinAlmaId ??
                    `${Math.random()}`;

                  const cins =
                    x?.TalepCinsi ??
                    x?.talepCinsi ??
                    "-";

                  const yorumSay =
                    x?.YorumSayisi ??
                    x?.yorumSayisi ??
                    0;

                  const dt =
                    x?.SonYorumTarihiUtc ??
                    x?.sonYorumTarihiUtc ??
                    null;

                  const href =
                    id &&
                    (x?.SatinAlmaId ||
                      x?.satinAlmaId ||
                      x?.TalepId ||
                      x?.talepId)
                      ? `/satinalma/teklifler/${id}`
                      : "#";

                  // ✅ KRİTİK DÜZELTME
                  const sonYorum =
                    x?.sonYorum ??
                    x?.SonYorum ??
                    null;

                  const yorumYazan =
                    sonYorum?.yazanAd ??
                    sonYorum?.YazanAd ??
                    sonYorum?.yazan ??
                    sonYorum?.Yazan ??
                    "-";

                  const yorumMetni =
                    sonYorum?.yorumMetni ??
                    sonYorum?.YorumMetni ??
                    sonYorum?.yorum ??
                    sonYorum?.Yorum ??
                    "-";

                  const siteAdi =
                    x?.siteAdi ??
                    x?.SiteAdi ??
                    x?.projeAdi ??
                    x?.ProjeAdi ??
                    "-";

                  return (
                    <Link
                      key={id}
                      href={href}
                      className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-left transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:bg-zinc-950/60 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex rounded-full px-2 py-[1px] text-[10px] font-semibold ${chipClass(
                                cins
                              )}`}
                            >
                              {safeText(cins)}
                            </span>

                            <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
                              TLP-{safeText(id)}
                            </span>
                          </div>

                          {/* detay alanı */}
                          <div className="mt-1 flex flex-col gap-[2px] text-[10.5px] text-zinc-500 dark:text-zinc-400">
                            {/* tarih + süre */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="shrink-0 whitespace-nowrap">
                                {formatTR(dt)}
                              </span>

                              <span className="shrink-0 whitespace-nowrap font-bold text-zinc-600 dark:text-zinc-300">
                                {timeAgoTR(dt)}
                              </span>
                            </div>

                            {/* site */}
                            <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                              {safeText(siteAdi)}
                            </div>

                            {/* yorumu bırakan */}
                            <div className="text-zinc-600 dark:text-zinc-300">
                              <span className="font-bold">
                                Yorumu bırakan:
                              </span>{" "}
                              {safeText(yorumYazan)}
                            </div>

                            {/* yorum */}
                            <div
                              className="line-clamp-2 text-zinc-500 dark:text-zinc-400"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                              }}
                            >
                              <span className="font-bold">
                                Yorum:
                              </span>{" "}
                              {safeText(yorumMetni)}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-[10px] text-zinc-600 dark:text-zinc-300">
                            Not
                          </div>

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