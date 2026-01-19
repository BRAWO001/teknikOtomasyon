// src/components/IsEmriCardSurecOzet.jsx
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

function Row({ title, value, note }) {
  const v = value ?? "-";
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-[11px] ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="min-w-0">
        <div className="font-semibold text-zinc-700 dark:text-zinc-200">{title}</div>
        {note ? (
          <div className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500 dark:text-zinc-400">
            {note}
          </div>
        ) : null}
      </div>
      <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
        {v}
      </span>
    </div>
  );
}

export default function IsEmriCardSurecOzet({ data }) {
  const projeDurum = pick(data, "projeYoneticiSurecDurumu", "ProjeYoneticiSurecDurumu");
  const projeNot = pick(data, "projeYoneticiSurecNotu", "ProjeYoneticiSurecNotu");

  const opTeknikDurum = pick(
    data,
    "operasyonTeknikMudurSurecDurumu",
    "OperasyonTeknikMudurSurecDurumu"
  );
  const opTeknikNot = pick(
    data,
    "operasyonTeknikMudurSurecNotu",
    "OperasyonTeknikMudurSurecNotu"
  );

  const opGenelDurum = pick(
    data,
    "operasyonGenelMudurSurecDurumu",
    "OperasyonGenelMudurSurecDurumu"
  );
  const opGenelNot = pick(
    data,
    "operasyonGenelMudurSurecNotu",
    "OperasyonGenelMudurSurecNotu"
  );

  const hasAny = !!(projeDurum || projeNot || opTeknikDurum || opTeknikNot || opGenelDurum || opGenelNot);

  return (
    <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
      

      {!hasAny ? (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Henüz süreç bilgisi girilmedi.
        </div>
      ) : (
        <div className="space-y-1">
          <Row title="Proje Yöneticisi" value={projeDurum} note={projeNot} />
          <Row title="Op. Teknik Müdür" value={opTeknikDurum} note={opTeknikNot} />
          <Row title="Op. Genel Müdür" value={opGenelDurum} note={opGenelNot} />
        </div>
      )}
    </div>
  );
}
