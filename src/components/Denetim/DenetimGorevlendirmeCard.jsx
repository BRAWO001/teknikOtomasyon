
import { useEffect, useState } from "react";
import DenetimNotPanel from "./DenetimNotPanel";

const f = (o, k) =>
  o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];

const dateValue = (value) =>
  value ? String(value).slice(0, 10) : "";

const formatTarih = (value) => {
  const tarih = dateValue(value);
  if (!tarih) return "-";
  const [y, m, d] = tarih.split("-");
  return `${d}.${m}.${y}`;
};

const dateToApi = (value) =>
  value ? `${value}T12:00:00` : null;

const gunFarki = (baslangic, bitis) => {
  if (!baslangic || !bitis) return null;

  const [y1, m1, d1] = baslangic.split("-").map(Number);
  const [y2, m2, d2] = bitis.split("-").map(Number);

  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) -
      Date.UTC(y1, m1 - 1, d1)) /
      86400000
  );
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

// DenetimTerminSurecDetayi enum değerleriyle aynı tutulmalı.
export const SURECLER = [
  { value: 10, label: "Başladı" },
  { value: 30, label: "Malzeme Temini" },
  { value: 70, label: "Son Kontrol" },
  { value: 100, label: "Tamamlandı" },
];

export default function DenetimGorevlendirmeCard({
  termin,
  basliklar = [],
  busy = false,
  onUpdate,
  onSurec,
  onNot,
}) {
  const id = f(termin, "id");

  const [editing, setEditing] = useState(false);
  const [showSurec, setShowSurec] = useState(false);
  const [showNotlar, setShowNotlar] = useState(false);
  const [form, setForm] = useState({});
  const [surec, setSurec] = useState("10");
  const [error, setError] = useState("");
  const [localBusy, setLocalBusy] = useState(false);

  const notlar = f(termin, "notlar") || [];
  const surecler = [...(f(termin, "surecler") || [])].sort(
    (a, b) => Number(f(a, "id")) - Number(f(b, "id"))
  );

  const sonSurec = surecler.length
    ? Number(f(surecler[surecler.length - 1], "surecDetayi"))
    : null;

  const currentSurec = SURECLER.find(
    (x) => x.value === sonSurec
  );

  const currentIndex = SURECLER.findIndex(
    (x) => x.value === sonSurec
  );

  useEffect(() => {
    setForm({
      terminBaslik: f(termin, "terminBaslik") || "",
      terminAciklama: f(termin, "terminAciklama") || "",
      gorevlendirmeTarihi: dateValue(
        f(termin, "gorevlendirmeTarihi")
      ),
      uygunTerminSuresi: dateValue(
        f(termin, "uygunTerminSuresi")
      ),
    });
  }, [termin]);

  const fark = gunFarki(
    form.gorevlendirmeTarihi,
    form.uygunTerminSuresi
  );

  const handleSave = async () => {
    if (!form.terminBaslik?.trim()) {
      setError("Görevlendirme başlığı zorunlu.");
      return;
    }

    if (!form.gorevlendirmeTarihi) {
      setError("Görevlendirme tarihi zorunlu.");
      return;
    }

    if (fark !== null && fark < 0) {
      setError("Termin tarihi başlangıçtan önce olamaz.");
      return;
    }

    setLocalBusy(true);
    setError("");

    try {
      await onUpdate(id, {
        terminBaslik: form.terminBaslik.trim(),
        terminAciklama: form.terminAciklama.trim() || null,
        gorevlendirmeTarihi: dateToApi(
          form.gorevlendirmeTarihi
        ),
        uygunTerminSuresi: dateToApi(
          form.uygunTerminSuresi
        ),
        not_1: f(termin, "not_1") ?? null,
        not_2: f(termin, "not_2") ?? null,
        not_3: f(termin, "not_3") ?? null,
        not_4: f(termin, "not_4") ?? null,
        not_5: f(termin, "not_5") ?? null,
      });

      setEditing(false);
    } catch (e) {
      setError(e?.message || "Görevlendirme güncellenemedi.");
    } finally {
      setLocalBusy(false);
    }
  };

  const handleSurec = async () => {
    if (sonSurec === Number(surec)) {
      setError("Bu süreç zaten son kayıt olarak bulunuyor.");
      return;
    }

    setLocalBusy(true);
    setError("");

    try {
      await onSurec(id, Number(surec));
      setShowSurec(false);
    } catch (e) {
      setError(e?.message || "Süreç kaydedilemedi.");
    } finally {
      setLocalBusy(false);
    }
  };

  return (
    <article className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* BAŞLIK */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold leading-5 text-zinc-900 dark:text-zinc-100">
            {f(termin, "terminBaslik")}
          </h3>

          <p className="mt-0.5 text-[10px] text-zinc-400">
            Görevlendirme #{id}
          </p>
        </div>

        <button
          type="button"
          disabled={busy || localBusy}
          onClick={() => {
            setEditing((value) => !value);
            setError("");
          }}
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {editing ? "Vazgeç" : "Düzenle"}
        </button>
      </div>

      {/* AÇIKLAMA VE TARİHLER */}
      {!editing ? (
        <div className="mt-2 space-y-2">
          <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {f(termin, "terminAciklama") ||
              "Açıklama bulunmuyor."}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-100 pt-2 text-[10px] text-zinc-500 dark:border-zinc-800">
            <span>
              Başlangıç:{" "}
              <strong className="text-zinc-700 dark:text-zinc-200">
                {formatTarih(
                  f(termin, "gorevlendirmeTarihi")
                )}
              </strong>
            </span>

            <span>
              Termin:{" "}
              <strong className="text-zinc-700 dark:text-zinc-200">
                {formatTarih(
                  f(termin, "uygunTerminSuresi")
                )}
              </strong>
            </span>

            {fark !== null && fark >= 0 && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {fark} gün
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <select
            className={inputClass}
            value={form.terminBaslik || ""}
            onChange={(e) =>
              setForm((v) => ({
                ...v,
                terminBaslik: e.target.value,
              }))
            }
          >
            <option value="">Başlık seçiniz</option>

            {form.terminBaslik &&
              !basliklar.some(
                (b) =>
                  f(b, "gorevlendirmeBasligi") ===
                  form.terminBaslik
              ) && (
                <option value={form.terminBaslik}>
                  {form.terminBaslik}
                </option>
              )}

            {basliklar.map((b) => (
              <option
                key={f(b, "id")}
                value={f(b, "gorevlendirmeBasligi")}
              >
                {f(b, "gorevlendirmeBasligi")}
              </option>
            ))}
          </select>

          <textarea
            rows={10}
            className={inputClass}
            placeholder="Görevlendirme açıklaması"
            value={form.terminAciklama || ""}
            onChange={(e) =>
              setForm((v) => ({
                ...v,
                terminAciklama: e.target.value,
              }))
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] text-zinc-500">
                Görevlendirme
              </span>

              <input
                type="date"
                className={inputClass}
                value={form.gorevlendirmeTarihi || ""}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    gorevlendirmeTarihi: e.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] text-zinc-500">
                Termin
              </span>

              <input
                type="date"
                className={inputClass}
                min={form.gorevlendirmeTarihi || undefined}
                value={form.uygunTerminSuresi || ""}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    uygunTerminSuresi: e.target.value,
                  }))
                }
              />
            </label>
          </div>

          {fark !== null && (
            <p className={`text-[11px] font-semibold ${
              fark < 0 ? "text-red-600" : "text-emerald-600"
            }`}>
              Termin süresi: {fark} gün
            </p>
          )}

          <button
            type="button"
            disabled={busy || localBusy}
            onClick={handleSave}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40"
          >
            {localBusy ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      )}

      {/* KOMPAKT SÜREÇ TAKİBİ */}
      <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold">
            Süreç Takibi
          </span>

          <button
            type="button"
            disabled={busy || localBusy}
            onClick={() => setShowSurec((v) => !v)}
            className="text-[10px] font-semibold text-sky-600 hover:underline disabled:opacity-40 dark:text-sky-400"
          >
            {showSurec ? "Kapat" : "+ Süreç güncelle"}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {SURECLER.map((s, index) => {
            const completed =
              currentIndex >= 0 && index <= currentIndex;
            const current = index === currentIndex;

            return (
              <div key={s.value} className="min-w-0">
                <div
                  className={`h-1.5 rounded-full ${
                    completed
                      ? "bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />

                <p
                  className={`mt-1 text-center text-[9px] leading-tight ${
                    current
                      ? "font-bold text-emerald-700 dark:text-emerald-300"
                      : "text-zinc-400"
                  }`}
                >
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-[10px] text-zinc-500">
          Güncel durum:{" "}
          <strong className="text-zinc-700 dark:text-zinc-200">
            {currentSurec?.label || "Süreç girilmedi"}
          </strong>
        </p>

        {showSurec && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-zinc-50 p-2 dark:bg-zinc-950">
            <select
              className={`${inputClass} min-w-0 flex-1`}
              value={surec}
              onChange={(e) => setSurec(e.target.value)}
            >
              {SURECLER.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={
                busy ||
                localBusy ||
                sonSurec === Number(surec)
              }
              onClick={handleSurec}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              Kaydet
            </button>
          </div>
        )}

        {surecler.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[10px] text-zinc-500 hover:text-zinc-700">
              Süreç geçmişi ({surecler.length})
            </summary>

            <div className="mt-2 space-y-1 border-l-2 border-zinc-200 pl-2 dark:border-zinc-700">
              {surecler.map((s, index) => (
                <p
                  key={f(s, "id") ?? index}
                  className="text-[10px] text-zinc-500"
                >
                  {index + 1}.{" "}
                  {SURECLER.find(
                    (x) =>
                      x.value ===
                      Number(f(s, "surecDetayi"))
                  )?.label || "Bilinmeyen süreç"}
                </p>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* GÖREVLENDİRME NOTLARI */}
      <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowNotlar((v) => !v)}
          className="flex w-full items-center justify-between text-left text-[11px] font-semibold"
        >
          <span>Görevlendirme Notları ({notlar.length})</span>
          <span className="text-zinc-400">
            {showNotlar ? "Gizle −" : "Göster +"}
          </span>
        </button>

        {showNotlar && (
          <div className="mt-3">
            <DenetimNotPanel
              title="Not Geçmişi"
              notlar={notlar}
              compact
              busy={busy || localBusy}
              onSave={(metin) => onNot(id, metin)}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          {error}
        </p>
      )}
    </article>
  );
}
