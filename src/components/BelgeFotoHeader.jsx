// src/components/BelgeFotoHeader.jsx

export default function BelgeFotoHeader({ isEmriId, isEmriKod, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Belge / Foto
        {isEmriId && (
          <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
            (İş Emri: {isEmriKod || isEmriId})
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Kapat
      </button>
    </div>
  );
}
