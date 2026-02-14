// src/components/SatinalmaHeaderCard.jsx
import { useRouter } from "next/router";

function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);

    // ✅ Türkiye UTC+3 düzeltmesi
    d.setHours(d.getHours() + 3);

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

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

export default function SatinalmaHeaderCard({
  seriNo,
  tarih,
  talepCinsi,
  talepEden,
  aciklama,

  // ✅ Teknik Açıklama (Not_4)
  teknikAciklama,
}) {
  const router = useRouter();

  const talepEdenAd = talepEden
    ? `${talepEden.ad ?? talepEden.Ad ?? ""} ${talepEden.soyad ?? talepEden.Soyad ?? ""}`.trim()
    : "";

  // ✅ Hızlı iş emri oluştur
  const handleNewIsEmri = () => {
    window.open("/teknikIsEmriEkle", "_blank", "noopener,noreferrer");
  };


  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-[12px] leading-relaxed shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* ÜST BAŞLIK */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[12px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Satın Alma Bilgileri
        </div>

        {seriNo ? (
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-extrabold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            Seri No: {safeText(seriNo)}
          </span>
        ) : null}
      </div>

      {/* SATIRLAR */}
      <div className="space-y-1.5">
        <div>
          <span className="font-extrabold text-zinc-800 dark:text-zinc-200">Tarih:</span>{" "}
          <span className="text-zinc-900 dark:text-zinc-100">{formatTR(tarih)}</span>
        </div>

        <div>
          <span className="font-extrabold text-zinc-800 dark:text-zinc-200">Talep Cinsi:</span>{" "}
          <span className="text-zinc-900 dark:text-zinc-100">{safeText(talepCinsi)}</span>
        </div>

        <div>
          <span className="font-extrabold text-zinc-800 dark:text-zinc-200">Talep Eden:</span>{" "}
          <span className="text-zinc-900 dark:text-zinc-100">{safeText(talepEdenAd)}</span>
        </div>

        <div>
          <span className="font-extrabold text-zinc-800 dark:text-zinc-200">Talep Açıklama:</span>{" "}
          <span className="text-zinc-900 dark:text-zinc-100">{safeText(aciklama)}</span>
        </div>
      </div>

      {/* ✅ TEKNİK AÇIKLAMA + BUTON (YAN YANA) */}
      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
              Teknik Açıklama
            </div>
            
          </div>

          <button
            type="button"
            onClick={handleNewIsEmri}
            className="group inline-flex h-5 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-1 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            title="Hızlı iş emri oluştur"
          >
            <svg
              className="h-3.5 w-3.5 text-white/90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Hızlı İş Emri Oluştur
          </button>
        </div>

        <div className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          {safeText(teknikAciklama)}
        </div>
      </div>
    </div>
  );
}
