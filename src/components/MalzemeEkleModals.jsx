// src/components/MalzemeEkleModals.jsx

import { useEffect, useState } from "react";
import { getDataAsync, postDataAsync } from "../utils/apiService";
import IsEmriToSatinalmaTalepModal from "@/components/teknik/IsEmriToSatinalmaTalepModal";

const KDV_ORANI = 0.2;

const KAYNAK_OPTIONS = [
  { value: 10, key: "Depo", label: "Depodan" },
  { value: 20, key: "YeniAlim", label: "Yeni alım" },
  { value: 30, key: "IsverenTemini", label: "İşveren temini" },
];

export default function MalzemeEkleModals({
  isOpen,
  onClose,
  isEmriId,
  isEmriKod,
}) {
  if (!isOpen) return null;

  const [teknikTalepModalOpen, setTeknikTalepModalOpen] = useState(false);

  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [malzemeler, setMalzemeler] = useState([]);
  const [pendingList, setPendingList] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [kdvIncluded, setKdvIncluded] = useState(true);
  const [kdvDahilHesapla, setKdvDahilHesapla] = useState(true);

  const [form, setForm] = useState({
    malzemeAdi: "",
    adet: "",
    birimFiyat: "",
    kaynak: 20,
  });

  const [birimFiyatGiris, setBirimFiyatGiris] = useState("");

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const hesaplaNetBirimFiyat = (value) => {
    const sayi = Number(value);
    if (value === "" || isNaN(sayi)) return "";
    return kdvDahilHesapla
      ? Number((sayi / (1 + KDV_ORANI)).toFixed(2))
      : sayi;
  };

  const handleBirimFiyatChange = (value) => {
    setBirimFiyatGiris(value);
    setField("birimFiyat", hesaplaNetBirimFiyat(value));
  };

  const toggleKdvDahilHesapla = () => {
    setKdvDahilHesapla((prev) => {
      const yeniDurum = !prev;
      const sayi = Number(birimFiyatGiris);

      if (birimFiyatGiris !== "" && !isNaN(sayi)) {
        const netFiyat = yeniDurum
          ? Number((sayi / (1 + KDV_ORANI)).toFixed(2))
          : sayi;

        setForm((old) => ({
          ...old,
          birimFiyat: netFiyat,
        }));
      }

      return yeniDurum;
    });
  };

  const loadMalzemeler = async () => {
    if (!isEmriId) return;

    try {
      setLoadingList(true);
      setListError("");

      const data = await getDataAsync(`MalzemeEkle/${isEmriId}`);
      setMalzemeler(data || []);
    } catch (err) {
      console.error("Malzemeler alınırken hata:", err);
      setListError(err?.message || "Malzemeler alınırken bir hata oluştu.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen && isEmriId) {
      loadMalzemeler();
      setPendingList([]);
      setSaveError("");
      setSaveSuccess("");
      setKdvDahilHesapla(true);
      setBirimFiyatGiris("");
      setForm({
        malzemeAdi: "",
        adet: "",
        birimFiyat: "",
        kaynak: 20,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEmriId]);

  const validate = () => {
    if (!form.malzemeAdi.trim()) return "Malzeme adı zorunlu.";

    const adet = Number(form.adet);
    if (!adet || adet <= 0) return "Adet 0'dan büyük olmalı.";

    const birim = Number(form.birimFiyat);
    if (isNaN(birim) || birim < 0) return "Birim fiyat 0 veya pozitif olmalı.";

    if (![10, 20, 30].includes(Number(form.kaynak))) {
      return "Lütfen bir kaynak seçiniz.";
    }

    return "";
  };

  const onAddToList = (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    const v = validate();
    if (v) {
      setSaveError(v);
      return;
    }

    const newItem = {
      malzemeAdi: form.malzemeAdi.trim(),
      adet: Number(form.adet),
      birimFiyat: Number(form.birimFiyat),
      kaynak: Number(form.kaynak),
    };

    setPendingList((prev) => [...prev, newItem]);

    setForm((prev) => ({
      ...prev,
      malzemeAdi: "",
      adet: "",
      birimFiyat: "",
    }));

    setBirimFiyatGiris("");
  };

  const removePendingItem = (index) => {
    setPendingList((prev) => prev.filter((_, i) => i !== index));
  };

  const onSaveList = async () => {
    setSaveError("");
    setSaveSuccess("");

    if (!isEmriId) {
      setSaveError("İş emri ID bulunamadı.");
      return;
    }

    if (!pendingList.length) {
      setSaveError("Kaydedilecek malzeme bulunmuyor. Önce listeye ekleyin.");
      return;
    }

    try {
      setSaving(true);

      const res = await postDataAsync(`MalzemeEkle/${isEmriId}`, pendingList);

      setSaveSuccess("Malzeme listesi başarıyla kaydedildi.");
      setMalzemeler(res || []);
      setPendingList([]);
    } catch (err) {
      console.error("Malzeme listesi kaydedilirken hata:", err);
      setSaveError(err?.message || "Malzeme listesi kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const allForTotal = [...malzemeler, ...pendingList];

  const toplamNetTutar = allForTotal.reduce((acc, m) => {
    const birim = Number(m.birimFiyat ?? 0);
    const adet = Number(m.adet ?? 0);
    return acc + birim * adet;
  }, 0);

  const toplamTutarGosterilen = kdvIncluded
    ? toplamNetTutar * (1 + KDV_ORANI)
    : toplamNetTutar;

  const isKaynakActive = (val) => Number(form.kaynak) === Number(val);

  const kaynakLabelFromItem = (item) => {
    const code = Number(item.kaynak ?? item.kaynakKod);
    const found = KAYNAK_OPTIONS.find((x) => x.value === code);

    if (found) return found.label;
    if (item.kaynakAd) return item.kaynakAd;

    return "Bilinmiyor";
  };

  const handleCloseAndReload = () => {
    onClose?.();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black p-4 sm:p-6 md:p-10">
      <div className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              İş Emri
            </div>

            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {isEmriKod ? `#${isEmriKod}` : `ID: ${isEmriId}`}

              <button
                type="button"
                onClick={() => setTeknikTalepModalOpen(true)}
                className="ml-2 rounded-xl border border-zinc-300 bg-emerald-600 px-3 py-2 text-[12px] font-extrabold text-white hover:bg-emerald-700"
              >
                + Hızlı Satın Alma Talebi Oluştur
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Malzeme / İşçilik ekle, listeyi oluştur ve tek seferde kaydet.
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAndReload}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Özet
                </div>

                <div className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <span className="font-semibold">{malzemeler.length}</span> •
                  Yeni kaydedilmemiş:{" "}
                  <span className="font-semibold">{pendingList.length}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Genel Tutar
                </div>

                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  ₺ {toplamTutarGosterilen.toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => setKdvIncluded((v) => !v)}
                  className="mt-1 rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {kdvIncluded ? "KDV %20 dahil göster" : "KDV hariç göster"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col">
              <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mevcut Malzemeler
              </div>

              {loadingList ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Malzemeler yükleniyor...
                </div>
              ) : listError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {listError}
                </div>
              ) : malzemeler.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Bu iş emrine henüz malzeme eklenmemiş.
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto">
                  {malzemeler.map((m) => {
                    const netUnit = Number(m.birimFiyat ?? 0);
                    const adet = Number(m.adet ?? 0);
                    const unit = kdvIncluded ? netUnit * (1 + KDV_ORANI) : netUnit;
                    const total = unit * adet;

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-xs ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                            {m.malzemeAdi}
                          </div>

                          <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            Adet: <span className="font-semibold">{adet}</span>{" "}
                            • Kaynak:{" "}
                            <span className="font-semibold">
                              {kaynakLabelFromItem(m)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="rounded-full bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                            ₺ {unit.toFixed(2)}
                          </span>

                          <span className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            Tutar: ₺ {total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {pendingList.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kaydedilmemiş Yeni Kalemler
                  </div>

                  <div className="space-y-2">
                    {pendingList.map((m, index) => {
                      const netUnit = Number(m.birimFiyat ?? 0);
                      const adet = Number(m.adet ?? 0);
                      const unit = kdvIncluded ? netUnit * (1 + KDV_ORANI) : netUnit;
                      const total = unit * adet;

                      return (
                        <div
                          key={`pending-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-xs ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-50 dark:ring-emerald-900"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-emerald-900 dark:text-emerald-50">
                              {m.malzemeAdi}
                            </div>

                            <div className="mt-0.5 text-[11px] text-emerald-700/90 dark:text-emerald-200/90">
                              Adet: <span className="font-semibold">{adet}</span>{" "}
                              • Kaynak:{" "}
                              <span className="font-semibold">
                                {kaynakLabelFromItem(m)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-emerald-900 px-2 py-1 text-[11px] font-semibold text-white dark:bg-emerald-300 dark:text-emerald-900">
                              ₺ {unit.toFixed(2)}
                            </span>

                            <span className="text-[11px] text-emerald-800 dark:text-emerald-200">
                              Tutar: ₺ {total.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => removePendingItem(index)}
                              className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-transparent dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Yeni Malzeme / İşçilik Ekle
                </div>

                <button
                  type="button"
                  onClick={toggleKdvDahilHesapla}
                  className={[
                    "rounded-full border px-3 py-1 text-[10px] font-extrabold transition",
                    kdvDahilHesapla
                      ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
                  ].join(" ")}
                >
                  KDV DAHİL HESAPLA
                </button>
              </div>

              <form
                onSubmit={onAddToList}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Malzeme / İşçilik Adı
                    </div>

                    <input
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-200"
                      value={form.malzemeAdi}
                      onChange={(e) => setField("malzemeAdi", e.target.value)}
                      placeholder="Örn: Kablo, sigorta..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setField("malzemeAdi", "İşçilik")}
                    className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/60"
                  >
                    İşçilik
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Adet
                    </div>

                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-200"
                      value={form.adet}
                      onChange={(e) => setField("adet", e.target.value)}
                      placeholder="Örn: 1, 2, 3..."
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Birim Fiyat {kdvDahilHesapla ? "KDV Dahil" : "KDV Hariç"} (₺)
                    </div>

                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-200"
                      value={birimFiyatGiris}
                      onChange={(e) => handleBirimFiyatChange(e.target.value)}
                      placeholder={kdvDahilHesapla ? "Örn: 600" : "Örn: 500"}
                    />

                    {birimFiyatGiris !== "" && (
                      <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                        Kaydedilecek KDV hariç fiyat:{" "}
                        <b>₺ {Number(form.birimFiyat || 0).toFixed(2)}</b>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Kaynak
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {KAYNAK_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField("kaynak", opt.value)}
                        className={[
                          "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                          isKaynakActive(opt.value)
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    ))}
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

                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Satırı önce listeye ekle, ardından <b>Listeyi Kaydet</b>
                  </div>

                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-900 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    Listeye ekle
                  </button>
                </div>
              </form>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Kapat
                </button>

                <button
                  type="button"
                  onClick={onSaveList}
                  disabled={saving || pendingList.length === 0}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  {saving ? "Kaydediliyor..." : "Listeyi Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <IsEmriToSatinalmaTalepModal
        isOpen={teknikTalepModalOpen}
        onClose={() => setTeknikTalepModalOpen(false)}
        isEmriId={isEmriId}
        onAfterCreated={async () => {
          setTeknikTalepModalOpen(false);
          await loadMalzemeler();
        }}
      />
    </div>
  );
}

