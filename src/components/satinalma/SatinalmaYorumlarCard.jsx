// ✅ src/components/satinalma/SatinalmaYorumlarCard.jsx
import { useMemo, useState } from "react";

function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    // ✅ UTC +3 (Türkiye)
    d.setHours(d.getHours() + 3);

    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

// ✅ "ne kadar önce" (1 gün 1 saat, 50 gün, 3 dk vs)
function timeAgoTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    // ✅ UTC +3 (Türkiye)
    d.setHours(d.getHours() + 3);

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();

    // gelecek tarih gelirse
    if (diffMs < 0) return "az sonra";

    const sec = Math.floor(diffMs / 1000);
    if (sec < 10) return "şimdi";
    if (sec < 60) return `${sec} sn önce`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} dk önce`;

    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} saat önce`;

    const day = Math.floor(hour / 24);
    if (day < 30) {
      const remHour = hour % 24;
      return remHour > 0 ? `${day} gün ${remHour} saat önce` : `${day} gün önce`;
    }

    const month = Math.floor(day / 30);
    if (month < 12) {
      const remDay = day % 30;
      return remDay > 0 ? `${month} ay ${remDay} gün önce` : `${month} ay önce`;
    }

    const year = Math.floor(day / 365);
    const remMonth = Math.floor((day % 365) / 30);
    return remMonth > 0 ? `${year} yıl ${remMonth} ay önce` : `${year} yıl önce`;
  } catch {
    return "-";
  }
}

export default function SatinalmaYorumlarCard({
  satinAlmaId,
  yorumlar,
  currentPersonelId,
  postDataAsync,
  onAfterSaved, // örn: () => fetchData(id)
}) {
  const [openAll, setOpenAll] = useState(false);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  const list = useMemo(() => {
    const arr = yorumlar ?? [];
    return [...arr].sort((a, b) => {
      const da = new Date(
        a?.olusturmaTarihiUtc ?? a?.OlusturmaTarihiUtc ?? 0
      ).getTime();
      const db = new Date(
        b?.olusturmaTarihiUtc ?? b?.OlusturmaTarihiUtc ?? 0
      ).getTime();
      return db - da;
    });
  }, [yorumlar]);

  const visible = openAll ? list : list.slice(0, 3);
  const total = list.length;

  const canPost = Boolean(
    satinAlmaId &&
      currentPersonelId &&
      postDataAsync &&
      (text || "").trim().length >= 3 &&
      !saving
  );

  const handleSave = async () => {
    if (!canPost) return;

    setSaving(true);
    setErr(null);
    setOk(null);

    try {
      // ✅ Endpoint: POST /api/satinalma/{satinAlmaId}/yorumlar
      // Body: { personelId, yorum }
      const res = await postDataAsync(
        `satinalma/${Number(satinAlmaId)}/yorumlar`,
        {
          personelId: Number(currentPersonelId),
          yorum: (text || "").trim(),
        }
      );

      setOk(res?.Message || "Yorum eklendi.");
      setText("");

      if (typeof onAfterSaved === "function") {
        await onAfterSaved();
      }
    } catch (e) {
      console.error("YORUM POST ERROR:", e?.response?.data || e);
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.Message ||
          "Yorum eklenirken hata oluştu."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setOk(null), 1500);
    }
  };

  const disabledPost = !currentPersonelId || saving;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] font-extrabold text-zinc-900">
          Notlar / Yorumlar
        </div>

        
      </div>

      {/* ✅ 2 Sütun: Sol textarea, sağ buton (alta taşmasın) */}
      <div className="mt-1 flex items-stretch gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            currentPersonelId
              ? "Kısa not / yorum yaz..."
              : "Yorum yazmak için giriş gerekli."
          }
          disabled={disabledPost}
          rows={2}
          className={`min-h-[56px] flex-1 resize-none rounded-lg border px-2 py-1 text-[12px] outline-none ${
            !currentPersonelId
              ? "border-zinc-200 bg-zinc-50 text-zinc-500"
              : "border-zinc-200 bg-white text-zinc-900 focus:border-sky-400"
          }`}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={!canPost}
          className={`min-h-[56px] shrink-0 whitespace-nowrap rounded-lg border px-3 text-[11px] font-extrabold transition ${
            canPost
              ? "border-sky-500 bg-sky-500 text-white hover:bg-sky-600"
              : "cursor-not-allowed border-sky-200 bg-sky-100 text-zinc-700"
          }`}
          title={!currentPersonelId ? "Giriş gerekli" : undefined}
        >
          {saving ? "Kaydediliyor..." : "Yorum ekle"}
        </button>
      </div>

      {/* ✅ Hata / OK satırı (tek satır, taşmasın) */}
      <div className="mt-1 line-clamp-1 text-[11px]">
        <span
          className={
            err
              ? "text-red-600"
              : ok
              ? "text-emerald-600"
              : "text-zinc-500"
          }
        >
          {err
            ? err
            : ok
            ? ok
            : (text || "").trim().length > 0 && (text || "").trim().length < 3
            ? "En az 3 karakter yaz."
            : " "}
        </span>
      </div>

      {/* Liste (3 yorum kompakt) */}
      <div className="mt-1 flex flex-col gap-2">
        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-1 text-[12px] text-zinc-500">
            Bu satın alma için henüz bir yorum eklenmemiş.
          </div>
        ) : (
          visible.map((y) => {
            const yid = y?.id ?? y?.Id;
            const yorum = y?.yorum ?? y?.Yorum ?? "";
            const dt = y?.olusturmaTarihiUtc ?? y?.OlusturmaTarihiUtc;

            const p = y?.personel ?? y?.Personel ?? null;
            const ad = p ? (p.ad ?? p.Ad ?? "").trim() : "";
            const soyad = p ? (p.soyad ?? p.Soyad ?? "").trim() : "";
            const fullName = `${ad} ${soyad}`.trim() || "Personel";

            return (
              <div
                key={yid ?? `${fullName}-${dt}`}
                className="rounded-lg border border-zinc-100 bg-zinc-50/40 p-1"
              >
                <div className="mb-1 flex items-baseline justify-between gap-1">
                  <div className="max-w-[60%] truncate text-[11px] font-extrabold text-zinc-900">
                    {fullName}
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-[10px] text-zinc-500">
                    {formatTR(dt)} • <strong>{timeAgoTR(dt)} </strong>
                  </div>
                </div>

                <div className="text-[11px] leading-snug text-zinc-900 whitespace-pre-wrap break-words">
                  {yorum}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-500">
          {total === 0 ? "Henüz yorum yok" : `${total} yorum`}
        </div>

        {total > 3 && (
          <button
            type="button"
            onClick={() => setOpenAll((p) => !p)}
            className="shrink-0 rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] font-extrabold text-zinc-900 hover:bg-zinc-100"
          >
            {openAll ? "Kapat" : "Tümünü göster"}
          </button>
        )}
      </div>
    </div>
  );
}
