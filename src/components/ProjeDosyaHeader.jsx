export default function ProjeDosyaHeader({ baslik, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {baslik || "Dosya Ekle"}
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Proje yönetim dosyaları
        </div>
      </div>

      <button
        onClick={onClose}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Kapat
      </button>
    </div>
  );
}
