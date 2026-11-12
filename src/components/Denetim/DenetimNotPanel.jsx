
import { useEffect, useState } from "react";

const f = (o, k) =>
  o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];

const relativeTime = (value, now) => {
  if (!value) return "-";

  const tarih = new Date(value);
  if (Number.isNaN(tarih.getTime())) return "-";

  const fark = Math.max(
    0,
    Math.floor((now.getTime() - tarih.getTime()) / 1000)
  );

  if (fark < 60) return "Az önce";
  if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`;
  if (fark < 86400)
    return `${Math.floor(fark / 3600)} saat önce`;
  if (fark < 172800) return "Dün";

  return `${Math.floor(fark / 86400)} gün önce`;
};

const fullDate = (value) => {
  if (!value) return "-";

  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("tr-TR");
};

export default function DenetimNotPanel({
  title = "Notlar",
  notlar = [],
  onSave,
  busy = false,
  disabled = false,
  compact = false,
}) {
  const [metin, setMetin] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(
      () => setNow(new Date()),
      60000
    );

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const text = metin.trim();

    if (!text) {
      setError("Not metni boş olamaz.");
      return;
    }

    if (typeof onSave !== "function") {
      setError("Not kaydetme işlemi tanımlanmamış.");
      return;
    }

    setError("");

    try {
      await onSave(text);
      setMetin("");
      setNow(new Date());
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Not kaydedilemedi."
      );
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold">
          {title}
        </h3>

        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">
          {notlar.length}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mb-2 space-y-1.5">
        <textarea
          rows={compact ? 2 : 3}
          maxLength={4000}
          value={metin}
          disabled={busy || disabled}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Not bırakın..."
          className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
        />

        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] text-zinc-400">
            {metin.length}/4000
          </span>

          <button
            type="submit"
            disabled={busy || disabled || !metin.trim()}
            className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {busy ? "Kaydediliyor..." : "+ Not ekle"}
          </button>
        </div>

        {error && (
          <p className="text-[10px] text-red-600">
            {error}
          </p>
        )}
      </form>

      <div
        className={`space-y-1 overflow-y-auto ${
          compact ? "max-h-56" : "max-h-80"
        }`}
      >
        {notlar.length === 0 ? (
          <p className="rounded-md bg-zinc-50 px-2 py-3 text-center text-[10px] text-zinc-400 dark:bg-zinc-950/50">
            Henüz not bulunmuyor.
          </p>
        ) : (
          notlar.map((n) => {
            const adSoyad =
              f(n, "personelAdSoyad") ||
              "Bilinmeyen personel";

            const tarih =
              f(n, "olusturmaTarihiUtc") ??
              f(n, "olusturmaTarihUtc");

            return (
              <div
                key={f(n, "id")}
                className="rounded-md border border-zinc-100 bg-zinc-50/70 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {adSoyad.charAt(0).toLocaleUpperCase("tr")}
                    </div>

                    <span className="truncate text-[10px] font-semibold text-zinc-800 dark:text-zinc-100">
                      {adSoyad}
                    </span>
                  </div>

                  <time
                    dateTime={tarih || undefined}
                    title={fullDate(tarih)}
                    className="shrink-0 text-[9px] text-zinc-400"
                  >
                    {relativeTime(tarih, now)}
                  </time>
                </div>

                <p className="mt-1 whitespace-pre-wrap break-words pl-[26px] text-[11px] leading-[1.4] text-zinc-600 dark:text-zinc-300">
                  {f(n, "metin")}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
