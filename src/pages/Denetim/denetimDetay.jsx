
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { roleGuard } from "@/utils/roleGuard";
import DenetimNotPanel from "@/components/Denetim/DenetimNotPanel";
import DenetimGorevlendirmeCard, {
  SURECLER,
} from "@/components/Denetim/DenetimGorevlendirmeCard";
import DenetimSurecBar, {
  DenetimKalanGun,
  denetimIlerlemeHesapla,
  surecBilgisiGetir,
} from "@/components/Denetim/DenetimSurecBar";

export const getServerSideProps = (ctx) =>
  roleGuard(ctx, {
    allow: [40, 90, 30, 33, 34],
    redirectTo: "/",
  });

const f = (o, k) =>
  o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const DURUMLAR = [
  { value: 10, label: "Beklemede" },
  { value: 30, label: "Devam ediyor" },
  { value: 90, label: "İptal" },
  { value: 100, label: "Tamamlandı" },
];

const durumRenkleri = {
  10: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  30: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  90: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  100: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
};

const todayValue = () => {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const emptyTermin = () => ({
  terminBaslik: "",
  terminAciklama: "",
  gorevlendirmeTarihi: todayValue(),
  uygunTerminSuresi: "",
});

const toApiDate = (value) =>
  value ? `${value}T12:00:00` : null;

const formatTarih = (value) => {
  if (!value) return "-";

  const [y, m, d] = String(value).slice(0, 10).split("-");

  return y && m && d ? `${d}.${m}.${y}` : "-";
};

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

// ==========================================
// DOSYA TÜRÜ
// ==========================================
const dosyaBilgisi = (dosya) => {
  const ad = String(f(dosya, "dosyaAdi") || "Dosya");
  const url = String(f(dosya, "url") || "");
  const path = url.split("?")[0].split("#")[0];

  const uzanti = (ad.includes(".") ? ad : path)
    .split(".")
    .pop()
    .toLowerCase();

  const isImage = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "bmp",
  ].includes(uzanti);

  let type = "BELGE";
  let color =
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

  if (isImage) {
    type = "GÖRSEL";
    color =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  } else if (uzanti === "pdf") {
    type = "PDF";
    color =
      "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  } else if (["doc", "docx"].includes(uzanti)) {
    type = "WORD";
    color =
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  } else if (["xls", "xlsx", "csv"].includes(uzanti)) {
    type = "EXCEL";
    color =
      "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300";
  }

  return { ad, url, type, color, isImage };
};

// ==========================================
// DOSYA KARTI
// ==========================================
function DenetimDosyaCard({ dosya }) {
  const { ad, url, type, color, isImage } =
    dosyaBilgisi(dosya);

  const [imageError, setImageError] = useState(false);
  const validUrl = /^(https?:\/\/|\/(?!\/))/i.test(url);

  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
        {isImage && validUrl && !imageError ? (
          <img
            src={url}
            alt={ad}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-0.5 text-zinc-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path d="M6 2.75h8l4 4V21H6a2 2 0 0 1-2-2V4.75a2 2 0 0 1 2-2Z" />
              <path d="M14 2.75v4h4M8 12h8M8 16h6" />
            </svg>

            <span className="text-[7px] font-bold">
              {type}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[11px] font-semibold"
          title={ad}
        >
          {ad}
        </p>

        <span
          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${color}`}
        >
          {type}
        </span>
      </div>

      {validUrl && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md border border-zinc-200 px-2 py-1.5 text-[10px] font-semibold text-sky-600 hover:bg-sky-50 dark:border-zinc-700 dark:text-sky-400"
        >
          Aç ↗
        </a>
      )}
    </div>
  );
}

export default function DenetimDetayPage() {
  const router = useRouter();

  const seriNo =
    typeof router.query.seriNo === "string"
      ? router.query.seriNo.trim()
      : "";

  const [data, setData] = useState(null);
  const [basliklar, setBasliklar] = useState([]);
  const [personelId, setPersonelId] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [newTermin, setNewTermin] = useState(emptyTermin);

  const [editingDurum, setEditingDurum] = useState(false);
  const [selectedDurum, setSelectedDurum] = useState("10");

  // ==========================================
  // GİRİŞ YAPAN PERSONEL
  // ==========================================
  useEffect(() => {
    try {
      const raw = getClientCookie("PersonelUserInfo");

      const personel =
        typeof raw === "string" ? JSON.parse(raw) : raw;

      const id = Number(
        personel?.id ?? personel?.Id ?? 0
      );

      if (Number.isInteger(id) && id > 0) {
        setPersonelId(id);
      }
    } catch (e) {
      console.error("DENETIM PERSONEL COOKIE:", e);
    }
  }, []);

  // ==========================================
  // DETAY GET
  // ==========================================
  const refresh = useCallback(async () => {
    if (!seriNo) return;

    const result = await getDataAsync(
      `Denetim/seri-no/${encodeURIComponent(seriNo)}`
    );

    setData(result);
    return result;
  }, [seriNo]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!seriNo) {
      setData(null);
      setLoading(false);
      setError("Geçersiz denetim seri numarası.");
      return;
    }

    let active = true;

    setLoading(true);
    setData(null);
    setError("");
    setSuccess("");

    Promise.all([
      getDataAsync(
        `Denetim/seri-no/${encodeURIComponent(seriNo)}`
      ),
      getDataAsync("Denetim/gorevlendirme-basliklari"),
    ])
      .then(([detail, titles]) => {
        if (!active) return;

        setData(detail);
        setBasliklar(
          Array.isArray(titles) ? titles : []
        );

        setSelectedDurum(
          String(f(detail, "denetlemeSurecDurumu") ?? 10)
        );
      })
      .catch((e) => {
        console.error("DENETIM DETAIL GET:", e);

        if (active) {
          setError("Denetim bilgileri alınamadı.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router.isReady, seriNo]);

  // ==========================================
  // ORTAK POST İŞLEMİ
  // ==========================================
  const perform = async (action, message) => {
    if (busyRef.current) {
      throw new Error("Başka bir işlem devam ediyor.");
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await action();
      const detail = await refresh();
      setSuccess(message);
      return detail;
    } catch (e) {
      console.error("DENETIM SAVE:", e);

      setError(
        e?.response?.data?.message ||
          e?.message ||
          "İşlem tamamlanamadı."
      );

      throw e;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  // ==========================================
  // DENETİM DURUMUNU DEĞİŞTİR
  // ==========================================
  const updateDurum = async () => {
    const yeniDurum = Number(selectedDurum);
    const eskiDurum = Number(
      f(data, "denetlemeSurecDurumu")
    );

    if (yeniDurum === eskiDurum) {
      setEditingDurum(false);
      return;
    }

    if (!DURUMLAR.some((x) => x.value === yeniDurum)) {
      setError("Geçersiz süreç durumu.");
      return;
    }

    try {
      await perform(
        () =>
          postDataAsync(
            `Denetim/${f(data, "id")}/durum`,
            { denetlemeSurecDurumu: yeniDurum }
          ),
        "Denetim süreç durumu güncellendi."
      );

      setEditingDurum(false);
    } catch {
      // Hata perform içinde gösteriliyor.
    }
  };

  // ==========================================
  // DENETİM GENEL NOTU
  // ==========================================
  const addNot = (metin) => {
    if (!personelId) {
      return Promise.reject(
        new Error("Giriş yapan personel bulunamadı.")
      );
    }

    return perform(
      () =>
        postDataAsync(
          `Denetim/${f(data, "id")}/notlar`,
          { personelId, metin }
        ),
      "Denetim notu eklendi."
    );
  };

  // ==========================================
  // GÖREVLENDİRME NOTU
  // ==========================================
  const addTerminNot = (terminId, metin) => {
    if (!personelId) {
      return Promise.reject(
        new Error("Giriş yapan personel bulunamadı.")
      );
    }

    return perform(
      () =>
        postDataAsync(
          `Denetim/terminler/${terminId}/notlar`,
          { personelId, metin }
        ),
      "Görevlendirme notu eklendi."
    );
  };

  // ==========================================
  // GÖREVLENDİRME GÜNCELLE
  // ==========================================
  const updateTermin = (terminId, payload) =>
    perform(
      () =>
        postDataAsync(
          `Denetim/terminler/${terminId}/update`,
          payload
        ),
      "Görevlendirme güncellendi."
    );

  // ==========================================
  // GÖREVLENDİRME SÜRECİ EKLE
  // ==========================================
  const addSurec = (terminId, surecDetayi) =>
    perform(
      () =>
        postDataAsync(
          `Denetim/terminler/${terminId}/surecler`,
          { surecDetayi }
        ),
      "Görevlendirme süreci kaydedildi."
    );

  // ==========================================
  // YENİ GÖREVLENDİRME
  // ==========================================
  const addTermin = async (e) => {
    e.preventDefault();

    if (
      !newTermin.terminBaslik.trim() ||
      !newTermin.gorevlendirmeTarihi
    ) {
      setError(
        "Görevlendirme başlığı ve tarihi zorunlu."
      );
      return;
    }

    if (
      newTermin.uygunTerminSuresi &&
      newTermin.uygunTerminSuresi <
        newTermin.gorevlendirmeTarihi
    ) {
      setError(
        "Termin tarihi başlangıçtan önce olamaz."
      );
      return;
    }

    try {
      await perform(
        () =>
          postDataAsync(
            `Denetim/${f(data, "id")}/terminler`,
            {
              terminBaslik: newTermin.terminBaslik.trim(),
              terminAciklama:
                newTermin.terminAciklama.trim() || null,
              gorevlendirmeTarihi: toApiDate(
                newTermin.gorevlendirmeTarihi
              ),
              uygunTerminSuresi: toApiDate(
                newTermin.uygunTerminSuresi
              ),
            }
          ),
        "Görevlendirme eklendi."
      );

      setNewTermin(emptyTermin());
      setShowNew(false);
    } catch {
      // Hata perform içinde gösteriliyor.
    }
  };

  // ==========================================
  // VERİLER
  // ==========================================
  const gorevlendirmeler =
    f(data, "gorevlendirmeler") || [];

  const notlar = f(data, "notlar") || [];
  const dosyalar = f(data, "dosyalar") || [];

  const durum = Number(
    f(data, "denetlemeSurecDurumu")
  );

  const durumLabel =
    DURUMLAR.find((x) => x.value === durum)?.label ||
    "Bilinmiyor";

  const yeniTerminGunFarki = gunFarki(
    newTermin.gorevlendirmeTarihi,
    newTermin.uygunTerminSuresi
  );

  const tamamlanmaOrani =
    denetimIlerlemeHesapla(gorevlendirmeler);

  const surecOzet = SURECLER.map((s) => ({
    ...s,
    adet: gorevlendirmeler.filter(
      (t) => surecBilgisiGetir(t).value === s.value
    ).length,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-3 p-2 text-zinc-800 dark:text-zinc-100">
      {/* SAYFA BAŞLIĞI */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Denetim Yönetimi / Denetim Detayı
          </p>

          <h1 className="break-words text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {f(data, "siteAdi") || "Proje yükleniyor..."}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
            <span>Seri No: {seriNo || "-"}</span>

            {data && (
              <>
                <span>•</span>
                <span>{formatTarih(f(data, "tarih"))}</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/Denetim")}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-[11px] font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← Listeye dön
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-zinc-200 p-4 text-xs dark:border-zinc-800">
          Denetim bilgileri yükleniyor...
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
        >
          {success}
        </p>
      )}

      {!loading && data && (
        <>
          {/* 2/3 AÇIKLAMA + 1/3 NOTLAR */}
          <div className="grid items-start gap-3 lg:grid-cols-3">
            <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Denetim Bilgileri
                  </p>

                  <h2 className="mt-1 text-base font-bold">
                    {f(data, "denetlemeBaslik")}
                  </h2>
                </div>

                <span
                  className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                    durumRenkleri[durum] ||
                    "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {durumLabel}
                </span>
              </div>

              <div className="mt-3 rounded-md bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/60">
                <p className="mb-1 text-[10px] font-semibold text-zinc-400">
                  Açıklama
                </p>

                <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {f(data, "denetlemeAciklama") ||
                    "Açıklama bulunmuyor."}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-[11px] sm:grid-cols-4 dark:border-zinc-800">
                <div>
                  <p className="text-[10px] text-zinc-400">
                    Seri No
                  </p>
                  <p className="font-semibold">
                    {f(data, "seriNo")}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-400">
                    Proje
                  </p>
                  <p className="font-semibold">
                    {f(data, "siteAdi") ||
                      `Proje #${f(data, "siteId")}`}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-400">
                    Denetim Tarihi
                  </p>
                  <p className="font-semibold">
                    {formatTarih(f(data, "tarih"))}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-400">
                    Görevlendirme
                  </p>
                  <p className="font-semibold">
                    {gorevlendirmeler.length} kayıt
                  </p>
                </div>
              </div>
            </section>

            <aside className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <DenetimNotPanel
                title="Denetim Genel Notları"
                notlar={notlar}
                compact
                busy={busy}
                disabled={!personelId}
                onSave={addNot}
              />
            </aside>
          </div>

          {/* DENETİM SÜREÇ TAKİBİ */}
          <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold">
                  Denetim Süreç Takibi
                </h3>

                <p className="mt-0.5 text-[10px] text-zinc-400">
                  Denetimin genel durumu ve görevlendirme ilerlemesi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600">
                  %{tamamlanmaOrani} tamamlandı
                </span>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setSelectedDurum(String(durum));
                    setEditingDurum((value) => !value);
                  }}
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-[10px] font-semibold hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {editingDurum ? "Vazgeç" : "Durumu değiştir"}
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {DURUMLAR.filter((x) => x.value !== 90).map(
                (s) => {
                  const aktif = durum === s.value;

                  return (
                    <div
                      key={s.value}
                      className={`rounded-md border px-2 py-2 text-center ${
                        aktif
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                          : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold ${
                          aktif
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-zinc-400"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            {durum === 90 && (
              <p className="mt-2 text-[11px] font-semibold text-red-600">
                Denetim iptal durumunda.
              </p>
            )}

            {editingDurum && (
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950/50">
                <label className="min-w-[170px] flex-1 space-y-1">
                  <span className="text-[10px] text-zinc-500">
                    Yeni denetim durumu
                  </span>

                  <select
                    className={inputClass}
                    value={selectedDurum}
                    disabled={busy}
                    onChange={(e) =>
                      setSelectedDurum(e.target.value)
                    }
                  >
                    {DURUMLAR.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={
                    busy || Number(selectedDurum) === durum
                  }
                  onClick={updateDurum}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {busy ? "Kaydediliyor..." : "Durumu kaydet"}
                </button>
              </div>
            )}

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${tamamlanmaOrani}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {surecOzet.map((s) => (
                <span
                  key={s.value}
                  className="text-[10px] text-zinc-500"
                >
                  {s.label}:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {s.adet}
                  </strong>
                </span>
              ))}
            </div>
          </section>

          {/* GÖREVLENDİRME İLERLEME ÖZETİ */}
          <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold">
                  Görevlendirme İlerleme Durumu
                </h3>

                <p className="mt-0.5 text-[10px] text-zinc-400">
                  {gorevlendirmeler.length} görevlendirme
                </p>
              </div>

              <div className="flex items-center gap-2">
                <DenetimKalanGun
                  terminler={gorevlendirmeler}
                />

                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  %{tamamlanmaOrani}
                </span>
              </div>
            </div>

            {gorevlendirmeler.length === 0 ? (
              <p className="text-[11px] text-zinc-400">
                Görevlendirme bulunmuyor.
              </p>
            ) : (
              <div className="grid gap-x-5 gap-y-2.5 md:grid-cols-2">
                {gorevlendirmeler.map((termin) => (
                  <div
                    key={f(termin, "id")}
                    className="rounded-md border border-zinc-100 bg-zinc-50/60 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <DenetimSurecBar
                      termin={termin}
                      showDays
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* GÖREVLENDİRMELER */}
          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">
                  Görevlendirmeler
                </h2>

                <p className="text-[10px] text-zinc-400">
                  {gorevlendirmeler.length} görevlendirme kaydı
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setShowNew((value) => !value)
                }
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                {showNew
                  ? "Vazgeç"
                  : "+ Görevlendirme ekle"}
              </button>
            </div>

            {showNew && (
              <form
                onSubmit={addTermin}
                className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/30 p-3 dark:border-emerald-900 dark:bg-zinc-900"
              >
                <h3 className="text-xs font-bold">
                  Yeni Görevlendirme
                </h3>

                <select
                  className={inputClass}
                  value={newTermin.terminBaslik}
                  onChange={(e) =>
                    setNewTermin((value) => ({
                      ...value,
                      terminBaslik: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    Görevlendirme başlığı seçiniz
                  </option>

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
                  rows={2}
                  maxLength={4000}
                  className={inputClass}
                  placeholder="Görevlendirme açıklaması"
                  value={newTermin.terminAciklama}
                  onChange={(e) =>
                    setNewTermin((value) => ({
                      ...value,
                      terminAciklama: e.target.value,
                    }))
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-[10px] text-zinc-500">
                      Görevlendirme Tarihi
                    </span>

                    <input
                      type="date"
                      className={inputClass}
                      value={newTermin.gorevlendirmeTarihi}
                      onChange={(e) =>
                        setNewTermin((value) => ({
                          ...value,
                          gorevlendirmeTarihi: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] text-zinc-500">
                      Uygun Termin Tarihi
                    </span>

                    <input
                      type="date"
                      className={inputClass}
                      min={
                        newTermin.gorevlendirmeTarihi ||
                        undefined
                      }
                      value={newTermin.uygunTerminSuresi}
                      onChange={(e) =>
                        setNewTermin((value) => ({
                          ...value,
                          uygunTerminSuresi: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  {yeniTerminGunFarki !== null &&
                    yeniTerminGunFarki >= 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        Termin süresi: {yeniTerminGunFarki} gün
                      </span>
                    )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="ml-auto rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40"
                  >
                    {busy
                      ? "Kaydediliyor..."
                      : "Görevlendirmeyi kaydet"}
                  </button>
                </div>
              </form>
            )}

            {gorevlendirmeler.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-center text-xs text-zinc-400 dark:border-zinc-800">
                Henüz görevlendirme bulunmuyor.
              </div>
            ) : (
              <div className="grid items-start gap-2 lg:grid-cols-2">
                {gorevlendirmeler.map((t) => (
                  <DenetimGorevlendirmeCard
                    key={f(t, "id")}
                    termin={t}
                    basliklar={basliklar}
                    busy={busy}
                    onUpdate={updateTermin}
                    onSurec={addSurec}
                    onNot={addTerminNot}
                  />
                ))}
              </div>
            )}
          </section>

          {/* DOSYALAR */}
          <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold">
                Denetim Dosyaları
              </h2>

              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">
                {dosyalar.length} dosya
              </span>
            </div>

            {dosyalar.length === 0 ? (
              <p className="text-[11px] text-zinc-400">
                Dosya bulunmuyor.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {dosyalar.map((d) => (
                  <DenetimDosyaCard
                    key={f(d, "id")}
                    dosya={d}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
