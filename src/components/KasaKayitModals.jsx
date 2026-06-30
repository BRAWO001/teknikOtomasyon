import { useEffect, useMemo, useState } from "react";
import { postDataAsync } from "../utils/apiService";

const PERSONEL_OPTIONS = [
  "Ali Oğuz",
  "Burcu Kuş",
  "Cem Eren",
  "Çağlar Şenol",
  "Özer Aydın",
  "IBAN Hesap Eos",
].sort((a, b) => a.localeCompare(b, "tr"));

function toNumber(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.split("=").slice(1).join("="));
}

function getCurrentPersonelAdSoyad() {
  try {
    const raw = getCookie("PersonelUserInfo");
    if (!raw) return "";

    const obj = JSON.parse(raw);

    const ad =
      obj?.ad ??
      obj?.Ad ??
      obj?.personel?.ad ??
      obj?.personel?.Ad ??
      "";

    const soyad =
      obj?.soyad ??
      obj?.Soyad ??
      obj?.personel?.soyad ??
      obj?.personel?.Soyad ??
      "";

    const adSoyad =
      obj?.adSoyad ??
      obj?.AdSoyad ??
      obj?.personel?.adSoyad ??
      obj?.personel?.AdSoyad ??
      `${ad} ${soyad}`;

    return String(adSoyad || "").trim();
  } catch {
    return "";
  }
}

export default function KasaKayitModals({
  isOpen,
  onClose,
  isEmriId,
  isEmriKod,
  defaultBaslik = "Kasa Kaydı",
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [kaydiYapanPersonel, setKaydiYapanPersonel] = useState("");

  const [form, setForm] = useState({
    baslik: defaultBaslik,
    aciklama: "",
    teslimEdilenPersonel: "",
    iscilikTutari: "",
    malzemeTutari: "",
    not_3: "",
    not_4: "",
    not_5: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    setSaving(false);
    setSaveError("");
    setSaveSuccess("");

    const adSoyad = getCurrentPersonelAdSoyad();
    setKaydiYapanPersonel(adSoyad);

    setForm({
      baslik: defaultBaslik,
      aciklama: "",
      teslimEdilenPersonel: "",
      iscilikTutari: "",
      malzemeTutari: "",
      not_3: "",
      not_4: "",
      not_5: "",
    });
  }, [isOpen, defaultBaslik]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const iscilik = useMemo(
    () => toNumber(form.iscilikTutari),
    [form.iscilikTutari]
  );

  const malzeme = useMemo(
    () => toNumber(form.malzemeTutari),
    [form.malzemeTutari]
  );

  const toplam = useMemo(() => iscilik + malzeme, [iscilik, malzeme]);

  const validate = () => {
    if (!isEmriId) return "İş emri ID bulunamadı.";
    if (!String(form.baslik || "").trim()) return "Başlık zorunlu.";

    if (!String(form.teslimEdilenPersonel || "").trim()) {
      return "Teslim edilen personel seçiniz.";
    }

    if (!kaydiYapanPersonel) {
      return "Kaydı yapan personel bilgisi bulunamadı.";
    }

    if (iscilik < 0) return "İşçilik tutarı negatif olamaz.";
    if (malzeme < 0) return "Malzeme tutarı negatif olamaz.";
    if (toplam <= 0) return "Toplam tutar 0'dan büyük olmalı.";

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setSaveError("");
    setSaveSuccess("");

    const v = validate();
    if (v) {
      setSaveError(v);
      return;
    }

    const payload = {
      isEmriId: Number(isEmriId),
      baslik: form.baslik.trim(),
      aciklama: form.aciklama?.trim() || null,
      teslimEdilenPersonel: form.teslimEdilenPersonel,

      iscilikTutari: iscilik,
      malzemeTutari: malzeme,
      alinanToplamTutar: toplam,

      // İş emri kodu
      not_1: isEmriKod || "",

      // Kaydı yapan kişi
      not_2: kaydiYapanPersonel,

      not_3: form.not_3?.trim() || null,
      not_4: form.not_4?.trim() || null,
      not_5: form.not_5?.trim() || null,
    };

    try {
      setSaving(true);

      const res = await postDataAsync("kasa-kayit", payload);

      setSaveSuccess("Kasa kaydı başarıyla oluşturuldu.");
      onSaved?.(res);

      setTimeout(() => {
        onClose?.();
      }, 500);
    } catch (err) {
      console.error("Kasa kaydı oluşturulurken hata:", err);
      setSaveError(err?.message || "Kasa kaydı oluşturulurken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-3 top-3 z-50 w-[calc(100%-24px)] max-w-md print:hidden">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
              İş Emri {isEmriKod ? `#${isEmriKod}` : ""}
            </div>
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
              Kasa Kaydı Oluştur
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 p-4 text-xs">
          <div>
            <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              Başlık
            </div>
            <input
              value={form.baslik}
              onChange={(e) => setField("baslik", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              placeholder="Örn: Kasa tahsilatı"
            />
          </div>

          <div>
            <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              Teslim Edilen Personel
            </div>
            <select
              value={form.teslimEdilenPersonel}
              onChange={(e) => setField("teslimEdilenPersonel", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="">Seçiniz</option>
              {PERSONEL_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Kaydı yapan kişi: <b>{kaydiYapanPersonel || "-"}</b>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                İşçilik Tutarı
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={form.iscilikTutari}
                onChange={(e) => setField("iscilikTutari", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="0"
              />
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Malzeme Tutarı
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={form.malzemeTutari}
                onChange={(e) => setField("malzemeTutari", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="text-[11px] text-emerald-700 dark:text-emerald-200">
              Alınan Toplam Tutar
            </div>
            <div className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">
              ₺ {toplam.toFixed(2)}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              Açıklama
            </div>
            <textarea
              rows={3}
              value={form.aciklama}
              onChange={(e) => setField("aciklama", e.target.value)}
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              placeholder="Kısa açıklama..."
            />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            
            <div>
               Kasa kaydını oluşturan kişi: <b>{kaydiYapanPersonel || "-"}</b>
            </div>
            
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {saveSuccess}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Kapat
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kasa Kaydı Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}