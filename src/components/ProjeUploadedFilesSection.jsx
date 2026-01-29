import { useMemo, useState } from "react";

// ✅ Site yönetimine uygun seçenekler
const TUR_OPTIONS = [
  { value: "Genel", label: "Genel" },
  { value: "Tutanak", label: "Tutanak" },
  { value: "KararDefteri", label: "Karar Defteri" },
  { value: "Sozlesme", label: "Sözleşme" },
  { value: "Ihtarname", label: "İhtarname" },
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
  if (["png", "jpg", "jpeg", "webp"].includes(e)) return "IM";
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

export default function ProjeUploadedFilesSection({
  files,
  loadingFiles,
  filesError,
}) {
  const totalCount = files?.length || 0;

  // ✅ filtre state
  const [turFilter, setTurFilter] = useState("ALL");
  const [q, setQ] = useState("");

  // ✅ filtre + arama + sıralama (en yeni üstte)
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
      const aciklama = (f.belgeAciklamasi || f.BelgeAciklamasi || "").toLowerCase();

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
      {/* ✅ Üst Bar */}
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
          {/* ✅ Tür filtresi */}
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

          {/* ✅ Arama */}
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

      {/* ✅ 2 sütun liste */}
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

            return (
              <a
                key={f.id ?? idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {/* Başlık + tarih */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {baslik ? (
                      <div className="text-[13px] font-semibold truncate">
                        {baslik}
                      </div>
                    ) : (
                      <div className="text-[13px] font-semibold truncate">
                        {name}
                      </div>
                    )}

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

                {/* Alt satır: ikon + dosya adı + tür + thumbnail */}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
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

                  {/* ✅ Görsel thumbnail */}
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
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
