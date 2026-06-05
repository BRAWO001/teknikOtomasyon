




// src/components/projeGorevlileri/ProjeGorevlileriSonYorumOzetCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import Link from "next/link";

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
  const future = diffMs < 0;
  const absMs = Math.abs(diffMs);

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
  if (parts.length === 0) parts.push("az önce");

  return future ? `${parts.join(" ")} sonra` : `${parts.join(" ")}`;
}

export default function ProjeGorevlileriSonYorumOzetCard({
  personelId,
  take = 30,
}) {
  const rootRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [openList, setOpenList] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchIt = async () => {
    if (!personelId) return;

    setLoading(true);
    setErr(null);

    try {
      const res = await getDataAsync(
        `ProjeYoneticileri/satinalma/son-yorum-ozet?personelId=${Number(
          personelId
        )}&take=${Number(take) || 10}`
      );

      const arr = res?.items ?? res?.Items ?? [];
      setItems(Array.isArray(arr) ? arr : []);
      setSelected(null);
    } catch (e) {
      console.error("SON YORUM OZET GET ERROR:", e?.response?.data || e);
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.Message ||
          "Yorum özetleri alınamadı."
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
  }, [personelId, take]);

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

  const sorted = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];

    return [...arr].sort((a, b) => {
      const da =
        parseDateSafe(
          a?.sonYorumTarihiUtc ??
            a?.SonYorumTarihiUtc ??
            a?.talepTarihiUtc ??
            a?.TalepTarihiUtc
        )?.getTime() ?? 0;

      const db =
        parseDateSafe(
          b?.sonYorumTarihiUtc ??
            b?.SonYorumTarihiUtc ??
            b?.talepTarihiUtc ??
            b?.TalepTarihiUtc
        )?.getTime() ?? 0;

      return db - da;
    });
  }, [items]);

  const headerInfo = useMemo(() => {
    const total = sorted.length;
    if (total === 0) return { total: 0, lastDt: null, lastAgo: "" };

    const last = sorted[0];
    const dt =
      last?.sonYorumTarihiUtc ??
      last?.SonYorumTarihiUtc ??
      last?.talepTarihiUtc ??
      last?.TalepTarihiUtc ??
      null;

    return { total, lastDt: dt, lastAgo: timeAgoTR(dt) };
  }, [sorted]);

  return (
    <section
      ref={rootRef}
      className="relative rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* ✅ DETAY ÜST SEKME */}
      <div
        className={`absolute left-0 right-0 top-0 z-30 overflow-hidden rounded-t-md border-b border-zinc-200 bg-white/95 backdrop-blur transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950/90 ${
          selected ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {selected && (
          <div className="flex items-start justify-between gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-50">
                Yorum Detayı
              </div>

              {(() => {
                const satinAlmaId =
                  selected?.satinAlmaId ?? selected?.SatinAlmaId ?? null;

                const yorumSayisi =
                  selected?.yorumSayisi ?? selected?.YorumSayisi ?? 0;

                const dt =
                  selected?.sonYorumTarihiUtc ??
                  selected?.SonYorumTarihiUtc ??
                  selected?.talepTarihiUtc ??
                  selected?.TalepTarihiUtc ??
                  null;

                const sonYorum =
                  selected?.sonYorum ?? selected?.SonYorum ?? null;

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
                  selected?.siteAdi ??
                  selected?.SiteAdi ??
                  selected?.projeAdi ??
                  selected?.ProjeAdi ??
                  "-";

                return (
                  <div className="mt-1">
                    <Link
                      href={`/satinalma/teklifler/${satinAlmaId}`}
                      className="block rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] transition hover:bg-zinc-100 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60"
                    >
                      <div className="text-[11px] leading-snug text-zinc-700 dark:text-zinc-200">
                        <div>
                          <span className="font-bold">Sayfaya Git</span>
                          <br />
                          <span className="font-bold">Yorum:</span>{" "}
                          {yorumSayisi} adet
                        </div>

                        <div>
                          <span className="font-bold">Son yorum:</span>{" "}
                          {formatTR(dt)}{" "}
                          <span className="text-[10.5px] font-bold text-zinc-600 dark:text-zinc-300">
                            ({timeAgoTR(dt)})
                          </span>
                        </div>

                        <div>
                          <span className="font-bold">Site / Proje:</span>{" "}
                          {safeText(siteAdi)}
                        </div>

                        <div>
                          <span className="font-bold">Yorumu bırakan:</span>{" "}
                          {safeText(yorumYazan)}
                        </div>

                        <div
                          className="mt-1 line-clamp-3"
                          style={{ wordBreak: "break-word" }}
                        >
                          <span className="font-bold">Yorum:</span>{" "}
                          {safeText(yorumMetni)}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="shrink-0 rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Kapat
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
          Son Notlar
        </div>

        <button
          type="button"
          onClick={fetchIt}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Yenile
        </button>
      </div>

      {loading && (
        <div className="mt-2 text-[11px] text-zinc-500">Yükleniyor...</div>
      )}

      {err && !loading && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </div>
      )}

      {!loading && !err && (
        <>
          {/* ✅ TEK SATIR */}
          <button
            type="button"
            onClick={() => setOpenList((p) => !p)}
            className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-left transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60"
            title="Listeyi aç/kapat"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="shrink-0 text-[11px] text-zinc-600 dark:text-zinc-300">
                    <strong>{headerInfo.total} Not</strong>
                  </div>

                  {headerInfo.lastDt && (
                    <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      • Son yorum: {formatTR(headerInfo.lastDt)}{" "}
                      <span className="ml-1 font-bold">
                        {headerInfo.lastAgo}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-[12px] font-bold text-zinc-600 dark:text-zinc-300">
                {openList ? "▲" : "▼"}
              </div>
            </div>
          </button>

          {/* ✅ Açılan Liste */}
          <div
            className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-zinc-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-950 transition-all duration-200 ${
              openList ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="max-h-96 overflow-auto p-2">
              {sorted.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                  Son {Number(take) || 10} talep içinde yorum özeti bulunamadı.
                </div>
              ) : (
                <div className="space-y-2">
                  {sorted.map((x) => {
                    const id = x?.satinAlmaId ?? x?.SatinAlmaId ?? null;

                    const talepCinsi =
                      x?.talepCinsi ?? x?.TalepCinsi ?? "-";

                    const yorumSayisi =
                      x?.yorumSayisi ?? x?.YorumSayisi ?? 0;

                    const dt =
                      x?.sonYorumTarihiUtc ??
                      x?.SonYorumTarihiUtc ??
                      x?.talepTarihiUtc ??
                      x?.TalepTarihiUtc ??
                      null;

                    const sonYorum = x?.sonYorum ?? x?.SonYorum ?? null;

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
                      <button
                        key={id ?? `${talepCinsi}-${dt ?? "0"}-${yorumSayisi}`}
                        type="button"
                        onClick={() => {
                          setSelected(x);
                          setOpenList(false);
                        }}
                        title="Detayı aç"
                        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-left transition hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:bg-zinc-950/60 dark:hover:border-zinc-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                              {safeText(talepCinsi)}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span className="shrink-0 whitespace-nowrap">
                                {formatTR(dt)}
                              </span>
                              <span className="shrink-0 whitespace-nowrap font-bold text-zinc-600 dark:text-zinc-300">
                                {timeAgoTR(dt)}
                              </span>
                            </div>

                            <div className="mt-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                              {safeText(siteAdi)}
                            </div>

                            <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                              <span className="font-bold">
                                Yorumu bırakan:
                              </span>{" "}
                              {safeText(yorumYazan)}
                            </div>

                            <div
                              className="mt-1 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400"
                              style={{ wordBreak: "break-word" }}
                            >
                              <span className="font-bold">Yorum:</span>{" "}
                              {safeText(yorumMetni)}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                              Not
                            </div>
                            <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50">
                              {yorumSayisi}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}