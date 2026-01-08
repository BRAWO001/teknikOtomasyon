import { useRouter } from "next/router";

export default function SatinalmaTopBar({ totalCount }) {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] text-emerald-800">
          Toplam kayıt sayısı: <span className="font-bold">{totalCount}</span>
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <button
          onClick={() => router.push("/")}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100"
        >
          Ana Sayfa
        </button>

        <button
          onClick={() => router.push("/satinalma/onayBekleyen")}
          className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
        >
          Onay Bekleyen Taleplerim
        </button>

        <button
          onClick={() => router.push("/satinalma/onaylananTalepler")}
          className="rounded-md border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
        >
          Onayladığım Talepler
        </button>

        <button
          onClick={() => router.push("/satinalma/reddedilen")}
          className="rounded-md border border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
        >
          Reddedilen Talepler
        </button>

        <button
          onClick={() => router.push("/satinalma/yeni")}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          + Yeni Satın Alma Talebi Oluştur
        </button>
      </div>
    </div>
  );
}
