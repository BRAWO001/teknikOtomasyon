// src/components/yonetimKurulu/IletiDosyaOzetCard.jsx
import { useMemo } from "react";

function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}
function fileExt(name) {
  const s = String(name || "");
  const idx = s.lastIndexOf(".");
  return idx >= 0 ? s.slice(idx + 1).toLowerCase() : "";
}
function isImageUrl(url, dosyaAdi) {
  const u = String(url || "");
  const n = String(dosyaAdi || "");
  const ext = fileExt(n) || fileExt(u.split("?")[0]);
  return ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext);
}
function isPdf(url, dosyaAdi) {
  const u = String(url || "");
  const n = String(dosyaAdi || "");
  const ext = fileExt(n) || fileExt(u.split("?")[0]);
  return ext === "pdf";
}
function isValidHttpUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function DosyaMiniTile({ d }) {
  const url = pickAny(d, "Url", "url");
  const dosyaAdi = pickAny(d, "DosyaAdi", "dosyaAdi") ?? "-";
  const canOpen = url && isValidHttpUrl(url);

  const img = isImageUrl(url, dosyaAdi);
  const pdf = isPdf(url, dosyaAdi);

  const open = () => {
    if (!canOpen) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={open}
      className={[
        "overflow-hidden rounded-xl border bg-white p-2 shadow-sm dark:bg-zinc-900",
        "border-zinc-200 dark:border-zinc-800",
        canOpen ? "cursor-pointer hover:border-sky-300 dark:hover:border-sky-700" : "opacity-70",
      ].join(" ")}
      title={dosyaAdi}
    >
      {img && canOpen ? (
        <div className="h-[66px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={dosyaAdi} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-[66px] w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] font-extrabold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {pdf ? "PDF" : img ? "GÖRSEL" : "BELGE"}
        </div>
      )}
    </div>
  );
}

export default function IletiDosyaOzetCard({ dosyalar, onOpen }) {
  const list = Array.isArray(dosyalar) ? dosyalar : [];

  const ozet = useMemo(() => {
    const foto = [];
    const belge = [];
    list.forEach((d) => {
      const turKod = Number(pickAny(d, "TurKod", "turKod", "Tur", "tur")) || 0;
      const url = pickAny(d, "Url", "url");
      const dosyaAdi = pickAny(d, "DosyaAdi", "dosyaAdi");

      if (turKod === 10) foto.push(d);
      else if (turKod === 20) belge.push(d);
      else {
        if (isImageUrl(url, dosyaAdi)) foto.push(d);
        else belge.push(d);
      }
    });
    return { foto, belge, total: list.length };
  }, [list]);

  // mini preview: max 6 dosya göster
  const preview = useMemo(() => list.slice(0, 6), [list]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12px] font-extrabold text-zinc-900 dark:text-zinc-100">
          İletiye Eklenen Belgeler
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-zinc-300 bg-blue-100 px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          title="Dosyaları görüntüle / yükle"
        >
          Dosya Ekle / Görüntüle ({ozet.total})
        </button>

        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className="rounded-full border border-zinc-200 bg-white px-2 py-[2px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            Foto: <b>{ozet.foto.length}</b>
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-2 py-[2px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            Belge: <b>{ozet.belge.length}</b>
          </span>
        </div>
      </div>

      {ozet.total === 0 ? (
        <div className="mt-2 text-[12px] text-zinc-600 dark:text-zinc-300">
          Henüz dosya yok, yükleyebilirsiniz.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {preview.map((d, idx) => (
            <DosyaMiniTile key={`${pickAny(d, "Id", "id") || idx}-${pickAny(d, "Url", "url")}`} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
