
import { useEffect, useMemo, useState } from "react";

const f = (o, k) =>
  o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];

const DURUMLAR = {
  10: {
    label: "Beklemede",
    percent: 10,
    color: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  30: {
    label: "Devam ediyor",
    percent: 50,
    color: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
  },
  70: {
    label: "Kontrol aşamasında",
    percent: 80,
    color: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
  },
  90: {
    label: "İptal",
    percent: 0,
    color: "bg-red-400",
    text: "text-red-600 dark:text-red-400",
  },
  100: {
    label: "Tamamlandı",
    percent: 100,
    color: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};

const dateOnly = (value) => {
  if (!value) return null;

  const parts = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN))
    return null;

  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
};

export const kalanGunHesapla = (value, now = new Date()) => {
  const hedef = dateOnly(value);
  if (hedef === null) return null;

  const bugun = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return Math.round((hedef - bugun) / 86400000);
};

export const sonSurecGetir = (termin) => {
  const surecler = f(termin, "surecler") || [];

  if (!surecler.length) return null;

  return [...surecler].sort(
    (a, b) => Number(f(b, "id")) - Number(f(a, "id"))
  )[0];
};

export const surecBilgisiGetir = (termin) => {
  const son = sonSurecGetir(termin);

  if (!son) {
    return {
      label: "Süreç girilmedi",
      percent: 0,
      color: "bg-zinc-300 dark:bg-zinc-700",
      text: "text-zinc-400",
      value: null,
    };
  }

  const value = Number(f(son, "surecDetayi"));
  const info = DURUMLAR[value];

  return {
    ...(info || {
      label: `Süreç ${value}`,
      percent: 0,
      color: "bg-zinc-400",
      text: "text-zinc-500",
    }),
    value,
  };
};

export const denetimIlerlemeHesapla = (terminler = []) => {
  if (!terminler.length) return 0;

  const toplam = terminler.reduce((sum, termin) => {
    return sum + surecBilgisiGetir(termin).percent;
  }, 0);

  return Math.round(toplam / terminler.length);
};

export const sonTerminBilgisiGetir = (
  terminler = [],
  now = new Date()
) => {
  const tarihler = terminler
    .map((t) => f(t, "uygunTerminSuresi"))
    .filter(Boolean);

  if (!tarihler.length) return null;

  const sonTarih = tarihler.reduce((latest, current) =>
    dateOnly(current) > dateOnly(latest)
      ? current
      : latest
  );

  const kalanGun = kalanGunHesapla(sonTarih, now);

  return { tarih: sonTarih, kalanGun };
};

export function DenetimKalanGun({
  terminler = [],
  compact = false,
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(
      () => setNow(new Date()),
      60000
    );

    return () => clearInterval(timer);
  }, []);

  const info = useMemo(
    () => sonTerminBilgisiGetir(terminler, now),
    [terminler, now]
  );

  if (!info) {
    return (
      <span className="text-[10px] text-zinc-400">
        Termin yok
      </span>
    );
  }

  const { kalanGun } = info;

  const text =
    kalanGun > 0
      ? `${kalanGun} gün kaldı`
      : kalanGun === 0
        ? "Son gün"
        : `${Math.abs(kalanGun)} gün geçti`;

  const color =
    kalanGun < 0
      ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
      : kalanGun <= 3
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";

  return (
    <span
      title={`Son termin: ${String(info.tarih).slice(0, 10)}`}
      className={`inline-flex shrink-0 items-center rounded-md font-semibold ${color} ${
        compact
          ? "px-1.5 py-0.5 text-[9px]"
          : "px-2 py-1 text-[10px]"
      }`}
    >
      {text}
    </span>
  );
}

export default function DenetimSurecBar({
  termin,
  showTitle = true,
  showDays = false,
  compact = false,
}) {
  const info = surecBilgisiGetir(termin);
  const title = f(termin, "terminBaslik") || "Görevlendirme";

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex min-w-0 items-center justify-between gap-2">
        {showTitle && (
          <span
            title={title}
            className="min-w-0 truncate text-[10px] font-medium text-zinc-700 dark:text-zinc-200"
          >
            {title}
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className={`text-[9px] font-semibold ${info.text}`}>
            {info.label}
          </span>

          {showDays && (
            <DenetimKalanGun
              terminler={[termin]}
              compact
            />
          )}
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ${
          compact ? "h-1" : "h-1.5"
        }`}
        role="progressbar"
        aria-label={`${title}: ${info.label}`}
        aria-valuenow={info.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${info.color}`}
          style={{ width: `${info.percent}%` }}
        />
      </div>
    </div>
  );
}
