



// src/components/IsEmriCardSurecOzet.jsx

function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

function getTone(value) {
  const s = String(value ?? "").trim().toLowerCase();

  if (!s || s === "-") return "neutral";

  // ✅ iyi / olumlu
  if (
    s.includes("onay") ||
    s.includes("tamam") ||
    s.includes("bitti") ||
    s.includes("uygun") ||
    s.includes("olumlu") ||
    s.includes("ok")
  )
    return "ok";

  // ⚠️ bekleme / inceleme
  if (
    s.includes("bek") ||
    s.includes("incele") ||
    s.includes("kontrol") ||
    s.includes("revize") ||
    s.includes("hazırlan") ||
    s.includes("plan")
  )
    return "warn";

  // ❌ olumsuz
  if (
    s.includes("red") ||
    s.includes("iptal") ||
    s.includes("uygunsuz") ||
    s.includes("olumsuz") ||
    s.includes("hata")
  )
    return "bad";

  return "neutral";
}

function badgeClassByTone(tone) {
  if (tone === "ok") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "bad") return "border-red-200 bg-red-50 text-red-800";
  return "border-zinc-200 bg-white text-black";
}

function Row({ title, value, note }) {
  const v = value ?? "-";
  const tone = getTone(v);

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-[11px] ring-1 ring-zinc-200">
      <div className="min-w-0">
        <div className="font-semibold text-black">{title}</div>

        {note ? (
          <div className="mt-0.5 line-clamp-2 text-[10px] text-zinc-600">
            {note}
          </div>
        ) : null}
      </div>

      <span
        className={[
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
          badgeClassByTone(tone),
        ].join(" ")}
      >
        {v}
      </span>
    </div>
  );
}

export default function IsEmriCardSurecOzet({ data }) {
  const projeDurum = pick(
    data,
    "projeYoneticiSurecDurumu",
    "ProjeYoneticiSurecDurumu"
  );
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

  const hasAny = !!(
    projeDurum ||
    projeNot ||
    opTeknikDurum ||
    opTeknikNot ||
    opGenelDurum ||
    opGenelNot
  );

  return (
    <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-2 text-[11px] text-black shadow-sm">
      {!hasAny ? (
        <div className="px-2 py-1 text-[11px] text-black">
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
