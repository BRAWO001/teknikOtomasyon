
import {
  DenetimKalanGun,
  denetimIlerlemeHesapla,
} from "@/components/Denetim/DenetimSurecBar";
import DenetimSurecBar from "@/components/Denetim/DenetimSurecBar";

const f = (o, k) =>
  o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];

const DURUMLAR = {
  10: {
    label: "Beklemede",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  30: {
    label: "Devam ediyor",
    color: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
  },
  90: {
    label: "İptal",
    color: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  },
  100: {
    label: "Tamamlandı",
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
};

const formatTarih = (value) => {
  if (!value) return "-";

  const [y, m, d] = String(value).slice(0, 10).split("-");
  return y && m && d ? `${d}.${m}.${y}` : "-";
};

export default function DenetimListeCard({
  data = [],
  onDetail,
}) {
  return (
    <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => {
        const seriNo = f(item, "seriNo");
        const terminler = f(item, "gorevlendirmeler") || [];
        const durum = Number(f(item, "denetlemeSurecDurumu"));
        const durumInfo = DURUMLAR[durum] || {
          label: "Bilinmiyor",
          color: "bg-zinc-100 text-zinc-500",
        };

        const progress = denetimIlerlemeHesapla(terminler);
        const terminSayisi =
          f(item, "terminSayisi") ?? terminler.length;

        return (
          <button
            key={f(item, "id") ?? seriNo}
            type="button"
            onClick={() => onDetail?.(seriNo)}
            className="group min-w-0 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
                  {f(item, "siteAdi") || "Proje belirtilmemiş"}
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-zinc-400">
                  {seriNo} • {formatTarih(f(item, "tarih"))}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-semibold ${durumInfo.color}`}
              >
                {durumInfo.label}
              </span>
            </div>

            <h3 className="mb-3 line-clamp-2 min-h-[30px] text-xs font-semibold leading-relaxed text-zinc-800 group-hover:text-emerald-700 dark:text-zinc-100">
              {f(item, "denetlemeBaslik") || "Başlıksız denetim"}
            </h3>

            <div className="border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-zinc-500">
                  Görevlendirmeler ({terminSayisi})
                </span>

                <DenetimKalanGun
                  terminler={terminler}
                  compact
                />
              </div>

              {terminler.length > 0 ? (
                <div className="space-y-2">
                  {terminler.map((termin) => (
                    <DenetimSurecBar
                      key={f(termin, "id")}
                      termin={termin}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md bg-zinc-50 px-2 py-2 text-[10px] text-zinc-400 dark:bg-zinc-950/50">
                  Görevlendirme süreç bilgisi bulunmuyor.
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <span className="text-[10px] font-bold text-emerald-600">
                  %{progress}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-[10px] text-zinc-400 dark:border-zinc-800">
              <span>
                {f(item, "dosyaSayisi") ?? 0} dosya •{" "}
                {f(item, "notSayisi") ?? 0} not
              </span>

              <span className="font-semibold text-emerald-600">
                Denetimi aç →
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
