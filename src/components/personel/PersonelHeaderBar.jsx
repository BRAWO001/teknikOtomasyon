// ======================================
// src/components/personel/PersonelHeaderBar.jsx
// ======================================
import { useMemo } from "react";

export default function PersonelHeaderBar({ personel, onLogout }) {
  const adSoyad = useMemo(() => {
    if (!personel) return "";
    return `${personel.ad ?? personel.Ad} ${personel.soyad ?? personel.Soyad}`;
  }, [personel]);

  const kod = personel?.personelKodu ?? personel?.PersonelKodu ?? "";

  return (
    <header className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            EOS Teknik • Personel Paneli
          </div>

          {personel ? (
            <div className="mt-1 flex flex-wrap items-end gap-2">
              <div className="truncate text-[16px] font-extrabold text-zinc-900 dark:text-zinc-100">
                {adSoyad}
              </div>
              <div className="rounded-full bg-emerald-50 px-2 py-[2px] text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {kod || "—"}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
              Personel bilgisi yükleniyor...
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          

          <button
            onClick={onLogout}
            className="rounded-xl bg-rose-600 px-4 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-rose-700"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>
  );
}
