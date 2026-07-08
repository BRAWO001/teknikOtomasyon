import { useEffect, useMemo, useState } from "react";

const TUR_OPTIONS = [
  { value: "Genel", label: "Genel" },
  { value: "Tutanak", label: "Tutanak" },
  { value: "KararDefteri", label: "Karar Defteri" },
  { value: "Sozlesme", label: "Sözleşme" },
  { value: "Ihtarname", label: "İhtarname" },
  { value: "Tedarikçi / Dış İşlem", label: "Tedarikçi / Dış İşlem" },
];

function extOf(nameOrUrl = "") {
  const s = String(nameOrUrl).toLowerCase();
  const q = s.split("?")[0];
  const parts = q.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function iconFromExt(ext) {
  const e = (ext || "").toLowerCase();
  if (["pdf"].includes(e)) return "PDF";
  if (["doc", "docx"].includes(e)) return "WD";
  if (["xls", "xlsx"].includes(e)) return "XL";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(e)) return "IM";
  if (["zip", "rar", "7z"].includes(e)) return "ZP";
  return "FL";
}

function isImageUrl(nameOrUrl = "") {
  const ext = extOf(nameOrUrl);
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
}

function normalizeIso(iso) {
  if (!iso) return null;
  const s = String(iso).trim();
  const tFixed = s.includes("T") ? s : s.replace(" ", "T");
  const hasZone = /Z$|[+-]\d{2}:\d{2}$/.test(tFixed);
  return hasZone ? tFixed : `${tFixed}Z`;
}

function formatTRWithIstanbulTZ(iso) {
  const fixed = normalizeIso(iso);
  if (!fixed) return "-";

  try {
    const d = new Date(fixed);
    return d.toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function ImageSideModal({ item, onClose }) {
  useEffect(() => {
    if (!item) return;

    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onClose]);

  if (!item) return null;

  const openImageNewTab = () => {
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/95">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-zinc-800 bg-black text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-extrabold text-emerald-400">
              {item.baslik || item.name || "Görsel"}
            </h3>

            {item.aciklama && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                {item.aciklama}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
              <span className="rounded-full border border-zinc-700 px-2 py-1">
                {item.tur}
              </span>

              <span className="rounded-full border border-zinc-700 px-2 py-1">
                {item.tarihTR}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-900"
          >
            Kapat ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <button
            type="button"
            onClick={openImageNewTab}
            className="mb-3 self-end rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Görseli Büyük Aç
          </button>

          <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.baslik || item.name || "Görsel"}
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjeUploadedFilesSection({
  files,
  loadingFiles,
  filesError,
}) {
  const totalCount = files?.length || 0;

  const [turFilter, setTurFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const filteredFiles = useMemo(() => {
    const list = Array.isArray(files) ? files : [];
    const query = (q || "").trim().toLowerCase();

    const filtered = list.filter((f) => {
      const tur = (f.tur || f.Tur || "Genel").trim();
      if (turFilter !== "ALL" && tur !== turFilter) return false;

      if (!query) return true;

      const url = (f.url || f.Url || "").toLowerCase();
      const name = (f.dosyaAdi || f.DosyaAdi || url || "").toLowerCase();
      const baslik = (f.belgeBasligi || f.BelgeBasligi || "").toLowerCase();
      const aciklama = (
        f.belgeAciklamasi ||
        f.BelgeAciklamasi ||
        ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        baslik.includes(query) ||
        aciklama.includes(query) ||
        url.includes(query)
      );
    });

    filtered.sort((a, b) => {
      const ta = new Date(
        normalizeIso(a.yuklemeTarihiUtc || a.YuklemeTarihiUtc || 0) || 0
      ).getTime();

      const tb = new Date(
        normalizeIso(b.yuklemeTarihiUtc || b.YuklemeTarihiUtc || 0) || 0
      ).getTime();

      return tb - ta;
    });

    return filtered;
  }, [files, turFilter, q]);

  const shownCount = filteredFiles.length;

  return (
    <div>
      <ImageSideModal
        item={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">
            Yüklenmiş Dosyalar
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Gösterilen: <span className="font-semibold">{shownCount}</span> /{" "}
            <span className="font-semibold">{totalCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={turFilter}
            onChange={(e) => setTurFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          >
            <option value="ALL">Tümü</option>
            {TUR_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: başlık, açıklama, dosya adı..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 outline-none focus:border-zinc-500 sm:w-64 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>
      </div>

      {loadingFiles && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
          Dosyalar yükleniyor...
        </div>
      )}

      {filesError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {filesError}
        </div>
      )}

      {!loadingFiles && !filesError && totalCount === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Dosya bulunamadı.
        </div>
      )}

      {!loadingFiles && !filesError && totalCount > 0 && shownCount === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Filtreye göre sonuç bulunamadı.
        </div>
      )}

      {!loadingFiles && !filesError && shownCount > 0 && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {filteredFiles.map((f, idx) => {
            const url = f.url || f.Url;
            const name = f.dosyaAdi || f.DosyaAdi || url;
            const tur = (f.tur || f.Tur || "Genel").trim();

            const ext = extOf(name) || extOf(url);
            const icon = iconFromExt(ext);

            const baslik = f.belgeBasligi || f.BelgeBasligi || "";
            const aciklama = f.belgeAciklamasi || f.BelgeAciklamasi || "";

            const tarihIso = f.yuklemeTarihiUtc || f.YuklemeTarihiUtc || null;
            const tarihTR = formatTRWithIstanbulTZ(tarihIso);

            const showThumb = isImageUrl(url) || isImageUrl(name);

            const cardContent = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">
                      {baslik || name}
                    </div>

                    {aciklama && (
                      <div className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {aciklama}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {tarihTR}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                      {icon}
                    </span>

                    <div className="min-w-0">
                      <div className="truncate font-semibold">{name}</div>
                      <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {tur}
                      </div>
                    </div>
                  </div>

                  {showThumb && (
                    <div className="flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="thumb"
                        className="h-12 w-12 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </>
            );

            if (showThumb) {
              return (
                <button
                  key={f.id ?? idx}
                  type="button"
                  onClick={() =>
                    setSelectedImage({
                      url,
                      name,
                      baslik,
                      aciklama,
                      tur,
                      tarihTR,
                    })
                  }
                  className="group cursor-pointer w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <a
                key={f.id ?? idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {cardContent}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}