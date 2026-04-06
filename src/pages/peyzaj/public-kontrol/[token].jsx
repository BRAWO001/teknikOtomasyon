// src/pages/public-kontrol/[token].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "../../../utils/apiService";

function formatTR(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("tr-TR");
  } catch {
    return "-";
  }
}

function isImageFile(url = "") {
  const clean = String(url).split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].some((ext) =>
    clean.endsWith(ext)
  );
}

export default function PublicKontrolPage() {
  const router = useRouter();
  const { token } = router.query;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [publicAdi, setPublicAdi] = useState("");
  const [publicSoyadi, setPublicSoyadi] = useState("");
  const [publicTel, setPublicTel] = useState("");
  const [publicOnayDurumu, setPublicOnayDurumu] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const loadRecord = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const data = await getDataAsync(`peyzaj-is-emri-formu/public/${token}`);
      setRecord(data || null);

      setPublicAdi(data?.publicAdi ?? data?.PublicAdi ?? "");
      setPublicSoyadi(data?.publicSoyadi ?? data?.PublicSoyadi ?? "");
      setPublicTel(data?.publicTel ?? data?.PublicTel ?? "");
      setPublicOnayDurumu(
        data?.publicOnayDurumu ?? data?.PublicOnayDurumu ?? false
      );
    } catch (err) {
      console.error("Public kontrol kaydı yüklenirken hata:", err);
      setError(err?.message || "Kayıt alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadRecord();
  }, [token]);

  const progress = useMemo(() => {
    const value = Number(record?.durumKod ?? record?.DurumKod ?? 0);
    return Math.max(0, Math.min(100, value || 0));
  }, [record]);

  const progressClass = useMemo(() => {
    if (progress < 30) return "bg-red-500";
    if (progress < 75) return "bg-amber-500";
    return "bg-emerald-500";
  }, [progress]);

  const handleSave = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccess("");

      await postDataAsync(`peyzaj-is-emri-formu/public/${token}/kaydet`, {
        publicAdi,
        publicSoyadi,
        publicTel,
        publicOnayDurumu,
      });

      setSaveSuccess("Bilgiler başarıyla kaydedildi.");
      await loadRecord();
    } catch (err) {
      console.error("Public kontrol kaydedilirken hata:", err);
      setSaveError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Bilgiler kaydedilirken bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
        Kayıt yükleniyor...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <div className="mb-1 font-semibold">Hata</div>
          <div>{error || "Kayıt bulunamadı."}</div>
        </div>
      </div>
    );
  }

  const {
    kod,
    kod_2,
    kod_3,
    kisaBaslik,
    aciklama,
    durumKod,
    durumAd,
    olusturmaTarihiUtc,
    bitisTarihiUtc,
    projeSorSurecDurumu,
    projeSorSurNot,
    peyzajSorSurecDurumu,
    peyzajSorSurNot,
    site,
    apt,
    yapilanIslemler = [],
    malzemeler = [],
    dosyalar = [],
    notlar = [],
  } = record;

  const photoFiles = dosyalar.filter(
    (f) =>
      (f?.turAd || "").toLowerCase() === "foto" || isImageFile(f?.url || "")
  );
  const documentFiles = dosyalar.filter(
    (f) => !photoFiles.some((p) => p?.id === f?.id)
  );

  let kod3Label = null;
  let kod3Class = "";

  if (kod_3) {
    if (kod_3 === "ACIL") {
      kod3Label = "ACİL";
      kod3Class =
        "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900";
    } else {
      kod3Label = "DIŞ İŞ";
      kod3Class =
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                %{progress}
              </div>

              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Geri
              </button>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${progressClass}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold tracking-[0.08em] text-zinc-900 dark:text-zinc-50">
                  {kod}
                </span>

                {kod_2 && (
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900">
                    {kod_2}
                  </span>
                )}

                {kod3Label && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${kod3Class}`}
                  >
                    {kod3Label}
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {kisaBaslik}
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Durum:{" "}
                <span className="font-semibold">
                  {durumAd} ({durumKod})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
              <div>Oluşturma:</div>
              <div>{formatTR(olusturmaTarihiUtc)}</div>

              <div>Bitiş:</div>
              <div>{formatTR(bitisTarihiUtc)}</div>

              <div>Site:</div>
              <div>{site?.ad || "-"}</div>

              <div>Apartman:</div>
              <div>{apt?.ad || "-"}</div>
            </div>
          </header>

          {aciklama && (
            <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-[12px] text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800">
              {aciklama}
            </div>
          )}
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3">
            <h3 className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
              Public Kontrol Bilgileri
            </h3>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Bu alanları doldurup kaydedebilirsiniz.
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Ad
              </label>
              <input
                type="text"
                value={publicAdi}
                onChange={(e) => setPublicAdi(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Ad girin"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Soyad
              </label>
              <input
                type="text"
                value={publicSoyadi}
                onChange={(e) => setPublicSoyadi(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Soyad girin"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                Telefon
              </label>
              <input
                type="text"
                value={publicTel}
                onChange={(e) => setPublicTel(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Telefon girin"
              />
            </div>

            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100">
                <input
                  type="checkbox"
                  checked={publicOnayDurumu}
                  onChange={(e) => setPublicOnayDurumu(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className="font-medium">Onay veriyorum</span>
              </label>
            </div>
          </div>

          {(saveError || saveSuccess) && (
            <div className="mt-3 space-y-2">
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  {saveSuccess}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Kaydediliyor..." : "Bilgileri Kaydet"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2">
            <h3 className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
              Süreç Durumları
            </h3>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="mb-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                Proje Sorumlusu
              </div>
              <div className="mb-2 text-[11px] font-medium text-zinc-800 dark:text-zinc-100">
                {projeSorSurecDurumu || "Henüz girilmedi"}
              </div>
              <div className="whitespace-pre-wrap text-[11px] text-zinc-700 dark:text-zinc-200">
                {projeSorSurNot || "Not yok."}
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/30">
              <div className="mb-1 text-[11px] font-semibold text-sky-800 dark:text-sky-200">
                Peyzaj Sorumlusu
              </div>
              <div className="mb-2 text-[11px] font-medium text-zinc-800 dark:text-zinc-100">
                {peyzajSorSurecDurumu || "Henüz girilmedi"}
              </div>
              <div className="whitespace-pre-wrap text-[11px] text-zinc-700 dark:text-zinc-200">
                {peyzajSorSurNot || "Not yok."}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Yapılan İşlemler
          </div>

          {yapilanIslemler.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Kayıtlı işlem yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {yapilanIslemler.map((item) => {
                const islem = item?.islem || item?.Islem || null;
                return (
                  <div
                    key={item?.id ?? item?.Id}
                    className="rounded-lg bg-zinc-50 p-2 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
                  >
                    <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
                      {islem?.isinAdi || islem?.IsinAdi || "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

     

        <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Dosyalar
          </div>

          {dosyalar.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Dosya yok.
            </div>
          ) : (
            <div className="space-y-3">
              {photoFiles.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                    Fotoğraflar
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {photoFiles.map((f) => (
                      <a
                        key={f?.id ?? f?.Id}
                        href={f?.url || f?.Url}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40"
                      >
                        <img
                          src={f?.url || f?.Url}
                          alt={f?.dosyaAdi || f?.DosyaAdi || "Foto"}
                          className="h-32 w-full object-cover"
                        />
                        <div className="truncate px-2 py-1 text-[10px] text-zinc-600 dark:text-zinc-300">
                          {f?.dosyaAdi || f?.DosyaAdi || "Foto"}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {documentFiles.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                    Belgeler
                  </div>
                  <div className="space-y-1.5">
                    {documentFiles.map((f) => (
                      <a
                        key={f?.id ?? f?.Id}
                        href={f?.url || f?.Url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        <span className="truncate">
                          {f?.dosyaAdi || f?.DosyaAdi || "Belge"}
                        </span>
                        <span className="ml-3 shrink-0 text-zinc-500 dark:text-zinc-400">
                          Aç
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Notlar
          </div>

          {notlar.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Not yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {notlar.map((n) => {
                const p = n?.personel || n?.Personel || null;
                const fullName = `${p?.ad ?? p?.Ad ?? ""} ${p?.soyad ?? p?.Soyad ?? ""}`.trim();

                return (
                  <div
                    key={n?.id ?? n?.Id}
                    className="rounded-lg bg-zinc-50 p-2 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
                        {fullName || "Bilinmeyen Personel"}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatTR(n?.olusturmaTarihiUtc || n?.OlusturmaTarihiUtc)}
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap break-words text-[11px] text-zinc-700 dark:text-zinc-200">
                      {n?.metin || n?.Metin}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}