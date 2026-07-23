export default function Pagination({
  page,
  totalPages,
  totalCount,
  loading,
  onPageChange,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
      <div className="text-[10px] text-zinc-500">
        Toplam {totalCount} kayıt
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="h-7 rounded-md border border-zinc-300 bg-white px-3 text-[10px] font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Önceki
        </button>

        <div className="min-w-[70px] text-center text-[10px] font-semibold text-zinc-700">
          {page} / {totalPages}
        </div>

        <button
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="h-7 rounded-md border border-zinc-300 bg-white px-3 text-[10px] font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
