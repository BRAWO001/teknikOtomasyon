export default function IdariHeaderBar({
  personel,
  totalCount,
  onGoHome,
  onGoOnayiBekleyen,
  onGoReddedilen,
  yoneticiRaporu,
  onYeniTalep,
  onLogout,
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-300">
          İdari Personel
        </h1>

        {personel && (
          <p className="mt-1 text-[16px] text-emerald-500 dark:text-emerald-400">
            İdari Personel:{" "}
            <span className="font-semibold">
              {personel.ad} {personel.soyad}
            </span>{" "}
            ({personel.personelKodu})
          </p>
        )}

        <p className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-400">
          Toplam kayıt sayısı: <span className="font-bold">{totalCount}</span>
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <button
          onClick={onGoHome}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100"
        >
          Ana Sayfa
        </button>
        <button
          onClick={yoneticiRaporu}
          className="rounded-md border border-blue-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-amber-100"
        >
          Yönetici Raporu
        </button>

        <button
          onClick={onGoOnayiBekleyen}
          className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
        >
          Onay Bekleyen Talepler
        </button>

        <button
          onClick={onGoReddedilen}
          className="rounded-md border border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
        >
          Reddedilen Talepler
        </button>

        <button
          onClick={onYeniTalep}
          className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Yeni Satın Alma Talebi Oluştur
        </button>

        <button
          onClick={onLogout}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
