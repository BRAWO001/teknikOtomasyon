import { useRouter } from "next/router";

export default function SatinalmaTopBar({ totalCount }) {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            onClick={() => router.push("/")}
            className="group inline-flex h-15 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[13px] font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] sm:w-auto"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-zinc-100 text-[12px] text-zinc-700 ring-1 ring-zinc-200 group-hover:bg-zinc-200/60">
              🏠
            </span>
            Ana Sayfa
          </button>

          <button
            onClick={() => router.push("/satinalma/onayBekleyen")}
            className="group inline-flex h-15 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-[13px] font-semibold text-amber-900 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 active:scale-[0.99] sm:w-auto"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-100 text-[12px] text-amber-900 ring-1 ring-amber-200 group-hover:bg-amber-200/60">
              ⏳
            </span>
            Onay Bekleyen Taleplerim
          </button>

          <button
            onClick={() => router.push("/operasyonPersonelTalepListem")}
            className="group inline-flex h-15 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-[13px] font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-orange-100 active:scale-[0.99] sm:w-auto"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-orange-100 text-[12px] text-orange-900 ring-1 ring-orange-200 group-hover:bg-orange-200/60">
              📌
            </span>
            Açtığım Talepler
          </button>

          <button
            onClick={() => router.push("/satinalma/onaylananTalepler")}
            className="group inline-flex h-15 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[13px] font-semibold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.99] sm:w-auto"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-100 text-[12px] text-emerald-900 ring-1 ring-emerald-200 group-hover:bg-emerald-200/60">
              ✅
            </span>
            Onayladığım Talepler
          </button>

          <button
            onClick={() => router.push("/satinalma/reddedilen")}
            className="group inline-flex h-15 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[13px] font-semibold text-red-900 shadow-sm transition hover:border-red-300 hover:bg-red-100 active:scale-[0.99] sm:w-auto"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-red-100 text-[12px] text-red-900 ring-1 ring-red-200 group-hover:bg-red-200/60">
              ⛔
            </span>
            Reddedilen Talepler
          </button>

          <div className="sm:ml-auto sm:flex sm:items-center">
            <button
              onClick={() => router.push("/satinalma/yeni")}
              className="group inline-flex cursor-pointer h-15 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-[13px] font-extrabold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] sm:w-auto"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/15 text-[14px] ring-1 ring-white/20 group-hover:bg-white/20">
                +
              </span>
              Yeni Talep Oluştur
            </button>
          </div>
        </div>
    </div>
  );
}
