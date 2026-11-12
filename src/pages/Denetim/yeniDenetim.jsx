// pages/Denetim/yeniDenetim.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import { roleGuard } from "@/utils/roleGuard";
import DenetimDosyaPanel from "@/components/Denetim/DenetimDosyaPanel";

export const getServerSideProps = (ctx) =>
  roleGuard(ctx, { allow: [40, 90, 30, 33, 34], redirectTo: "/" });

const input =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const label =
  "mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300";
const card =
  "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";
const field = (x, k) => x?.[k] ?? x?.[k.charAt(0).toUpperCase() + k.slice(1)];
const newTermin = () => ({
  localId: `${Date.now()}-${Math.random()}`,
  terminBaslik: "",
  terminAciklama: "",
  gorevlendirmeTarihi: new Date().toLocaleDateString("sv-SE"),
  uygunTerminSuresi: "",
});
const errMsg = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.title ||
  (typeof e?.response?.data === "string" ? e.response.data : e?.message) ||
  "İşlem sırasında hata oluştu.";

export default function YeniDenetimPage() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [personel, setPersonel] = useState(null);
  const [gorevlendirmeBasliklari, setGorevlendirmeBasliklari] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState("");
  const [siteId, setSiteId] = useState("");
  const personelId = Number(personel?.id ?? personel?.Id ?? 0);
  const [tarih, setTarih] = useState(() =>
    new Date().toLocaleDateString("sv-SE"),
  );
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [terminler, setTerminler] = useState([]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [createdId, setCreatedId] = useState(null);
  const [createdTerminCount, setCreatedTerminCount] = useState(0);
  const [filesSaved, setFilesSaved] = useState(false);


  
const terminGunFarki = (baslangic, bitis) => {
  if (!baslangic || !bitis) return null;

  const [by, bm, bd] = baslangic.split("-").map(Number);
  const [sy, sm, sd] = bitis.split("-").map(Number);

  const ilkTarih = Date.UTC(by, bm - 1, bd);
  const sonTarih = Date.UTC(sy, sm - 1, sd);

  const fark = Math.round(
    (sonTarih - ilkTarih) / (1000 * 60 * 60 * 24)
  );

  return Number.isFinite(fark) ? fark : null;
};


  // Giriş yapan personel: mevcut satın alma sayfasıyla aynı cookie.
  useEffect(() => {
    try {
      const raw = getClientCookie("PersonelUserInfo");
      if (!raw) {
        router.replace("/");
        return;
      }
      const parsed = JSON.parse(raw);
      if (Number(parsed?.id ?? parsed?.Id ?? 0) <= 0) {
        router.replace("/");
        return;
      }
      setPersonel(parsed);
    } catch (e) {
      console.error("DENETIM PERSONEL COOKIE:", e);
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getDataAsync("SiteAptEvControllerSet/sites"),
      getDataAsync("Denetim/gorevlendirme-basliklari"),
    ])
      .then(([s, basliklar]) => {
        if (!active) return;
        setSites(Array.isArray(s) ? s : []);
        setGorevlendirmeBasliklari(Array.isArray(basliklar) ? basliklar : []);
      })
      .catch((e) => {
        console.error("DENETIM LOOKUPS:", e);
        if (active)
          setLookupError("Proje veya görevlendirme başlıkları alınamadı.");
      })
      .finally(() => {
        if (active) setLoadingLookups(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedSite = useMemo(
    () => sites.find((x) => Number(field(x, "id")) === Number(siteId)),
    [sites, siteId],
  );
  const updateTermin = (localId, key, value) =>
    setTerminler((old) =>
      old.map((x) => (x.localId === localId ? { ...x, [key]: value } : x)),
    );
  const validate = () => {
    if (!siteId) return "Proje seçmelisiniz.";
    if (!personelId)
      return "Giriş yapan personel bilgisi bulunamadı. Tekrar giriş yapın.";
    if (!baslik.trim()) return "Denetim başlığı zorunludur.";
    for (let i = 0; i < terminler.length; i++) {
      const t = terminler[i];
      if (
        !t.terminBaslik.trim() ||
        !gorevlendirmeBasliklari.some(
          (b) => field(b, "gorevlendirmeBasligi") === t.terminBaslik,
        )
      )
        return `${i + 1}. görevlendirme için listeden geçerli bir başlık seçmelisiniz.`;
      if (!t.uygunTerminSuresi)
        return `${i + 1}. görevlendirme için termin tarihi seçmelisiniz.`;
      if (t.uygunTerminSuresi < t.gorevlendirmeTarihi)
        return `${i + 1}. görevlendirmede termin tarihi görevlendirme tarihinden önce olamaz.`;
    }
    return "";
  };

  // Kayıt sırası: denetim -> görevlendirmeler -> FTP dosyaları -> dosya URL kayıtları.
  // Bir aşama başarısız olursa oluşturulmuş ID saklanır; tekrar denemede aynı denetime devam edilir.
  async function handleSave() {
    if (saving) return;
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError("");
    let id = createdId;
    try {
      if (!id) {
        setProgress("Denetim oluşturuluyor...");
        const res = await postDataAsync("Denetim", {
          siteId: Number(siteId),
          tarih: new Date(`${tarih}T12:00:00`).toISOString(),
          denetimYapanPersonelId: Number(personelId),
          denetlemeBaslik: baslik.trim(),
          denetlemeAciklama: aciklama.trim() || null,
          denetlemeSurecDurumu: 10,
        });
        id = Number(field(res, "id"));
        if (!id)
          throw new Error(
            "Denetim oluşturuldu ancak API geçerli bir Id döndürmedi. Tekrar kaydetmeden önce listeyi kontrol edin.",
          );
        setCreatedId(id);
      }
      for (let i = createdTerminCount; i < terminler.length; i++) {
        const t = terminler[i];
        setProgress(
          `Görevlendirme kaydediliyor (${i + 1}/${terminler.length})...`,
        );
        await postDataAsync(`Denetim/${id}/terminler`, {
          terminBaslik: t.terminBaslik.trim(),
          terminAciklama: t.terminAciklama.trim() || null,
          gorevlendirmeTarihi: new Date(
            `${t.gorevlendirmeTarihi}T12:00:00`,
          ).toISOString(),
          uygunTerminSuresi: t.uygunTerminSuresi
            ? new Date(`${t.uygunTerminSuresi}T12:00:00`).toISOString()
            : null,
        });
        setCreatedTerminCount(i + 1);
      }
      if (!filesSaved && files.length) {
        const attachments = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          setProgress(`Dosya yükleniyor (${i + 1}/${files.length})...`);
          if (f.url) {
            attachments.push({ url: f.url, dosyaAdi: f.file.name, tur: f.tur });
            continue;
          }
          const formData = new FormData();
          formData.append("file", f.file);
          const result = await postDataAsync(
            "HttpUpload/upload-ftp",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          const url = result?.Url ?? result?.url;
          if (!url) throw new Error(`${f.file.name} yüklenirken URL dönmedi.`);
          setFiles((prev) =>
            prev.map((item) =>
              item.localId === f.localId ? { ...item, url } : item,
            ),
          );
          attachments.push({ url, dosyaAdi: f.file.name, tur: f.tur });
        }
        setProgress("Dosyalar denetime bağlanıyor...");
        await postDataAsync(`DenetimDosyaYukle/${id}`, attachments);
        setFilesSaved(true);
      }
      setProgress("Denetim başarıyla kaydedildi.");
      router.push(`/Denetim/denetimDetay?id=${id}`);
    } catch (e) {
      console.error("DENETIM SAVE ERROR:", e);
      setError(
        `${errMsg(e)}${id ? ` Denetim #${id} oluşturulmuş olabilir; tekrar denerseniz mevcut kayıttan devam edilir.` : ""}`,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-3 text-zinc-800 dark:text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Yeni Denetim</h1>
          
        </div>
        <button
          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs dark:border-zinc-700"
          onClick={() => router.push("/Denetim")}
        >
          ← Denetim listesi
        </button>
      </div>
      {lookupError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {lookupError}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {createdId && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          Denetim #{createdId} oluşturuldu. Kaydetme işlemi tamamlanana kadar bu
          sayfada kalın.
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-12">
        <section className={`${card} space-y-4 lg:col-span-7`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">01 · Denetim Bilgileri</h2>
            <span className="text-[11px] text-zinc-500">Temel bilgiler</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={label}>Proje *</span>
              <select
                disabled={loadingLookups || !!createdId}
                className={input}
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                <option value="">Proje seçiniz</option>
                {[...sites]
                  .sort((a, b) =>
                    String(field(a, "ad") || "").localeCompare(
                      String(field(b, "ad") || ""),
                      "tr",
                    ),
                  )
                  .map((s) => (
                    <option key={field(s, "id")} value={field(s, "id")}>
                      {field(s, "ad") || `Proje #${field(s, "id")}`}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span className={label}>Denetim tarihi *</span>
              <input
                disabled={!!createdId}
                type="date"
                className={input}
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
              />
            </label>
            <div className="sm:col-span-2">
              <span className={label}>Denetimi yapan personel</span>
              <div className={`${input} bg-zinc-50 dark:bg-zinc-800`}>
                {personel
                  ? `${personel.ad ?? personel.Ad ?? ""} ${personel.soyad ?? personel.Soyad ?? ""} `
                  : "Giriş bilgileri okunuyor..."}
              </div>
            </div>
            <label className="sm:col-span-2">
              <span className={label}>Denetim başlığı *</span>
              <input
                disabled={!!createdId}
                className={input}
                placeholder="Örn. Aylık ortak alan denetimi"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Denetim açıklaması</span>
              <textarea
                disabled={!!createdId}
                className={`${input} min-h-[130px] resize-y`}
                placeholder="Tespitler, inceleme kapsamı ve açıklamalar..."
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </label>
          </div>
          {selectedSite && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              Seçilen proje: <strong>{field(selectedSite, "ad")}</strong> · ID:{" "}
              {siteId}
            </div>
          )}
        </section>
        <section className={`${card} lg:col-span-5`}>
          <h2 className="mb-1 text-sm font-bold">02 · Denetim Dosyaları</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Fotoğraf veya belge ekleyin. 
          </p>
          <DenetimDosyaPanel
            value={files}
            onChange={setFiles}
            disabled={saving || filesSaved}
          />
        </section>
      </div>
      <section className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">
              03 · Görevlendirme ve Terminler
            </h2>
            <p className="text-xs text-zinc-500">
              İsterseniz birden fazla görevlendirme oluşturabilirsiniz.
            </p>
          </div>
          <button
            disabled={saving || !!createdId}
            type="button"
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            onClick={() => setTerminler((old) => [...old, newTermin()])}
          >
            + Görevlendirme Ekle
          </button>
        </div>
        {terminler.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-7 text-center text-xs text-zinc-500 dark:border-zinc-700">
            Henüz görevlendirme eklenmedi. Denetim, görevlendirme olmadan da
            oluşturulabilir.
          </div>
        ) : (
          
<div className="grid gap-3 xl:grid-cols-2">
  {terminler.map((t, i) => {
    const gunFarki = terminGunFarki(
      t.gorevlendirmeTarihi,
      t.uygunTerminSuresi
    );

    return (
      <div
        key={t.localId}
        className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/50"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold">
            Görevlendirme {i + 1}
          </h3>

          <button
            type="button"
            disabled={saving || !!createdId}
            className="text-xs font-semibold text-red-600 disabled:opacity-30"
            onClick={() =>
              setTerminler((old) =>
                old.filter((x) => x.localId !== t.localId)
              )
            }
          >
            Kaldır
          </button>
        </div>

        {/* Görevlendirme Başlığı */}
        <label>
          <span className={label}>
            Termin / Görevlendirme başlığı *
          </span>

          <select
            disabled={!!createdId || loadingLookups}
            className={input}
            value={t.terminBaslik}
            onChange={(e) =>
              updateTermin(
                t.localId,
                "terminBaslik",
                e.target.value
              )
            }
          >
            <option value="">Görev Başlığı Seçiniz</option>

            {gorevlendirmeBasliklari.map((b) => {
              const id = field(b, "id");
              const ad = field(b, "gorevlendirmeBasligi");

              return (
                <option key={id} value={ad}>
                  {ad}
                </option>
              );
            })}
          </select>
        </label>

        {/* Açıklama */}
        <label>
          <span className={label}>Açıklama</span>

          <textarea
            disabled={!!createdId}
            className={`${input} min-h-[90px]`}
            value={t.terminAciklama}
            onChange={(e) =>
              updateTermin(
                t.localId,
                "terminAciklama",
                e.target.value
              )
            }
            placeholder="Yapılacak işlemleri açıklayın..."
          />
        </label>

        {/* Tarih Seçimleri */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={label}>
              Görevlendirme tarihi
            </span>

            <input
              disabled={!!createdId}
              type="date"
              className={input}
              value={t.gorevlendirmeTarihi}
              onChange={(e) =>
                updateTermin(
                  t.localId,
                  "gorevlendirmeTarihi",
                  e.target.value
                )
              }
            />
          </label>

          <label>
            <span className={label}>
              Uygun termin tarihi *
            </span>

            <input
              disabled={!!createdId}
              type="date"
              min={t.gorevlendirmeTarihi}
              className={input}
              value={t.uygunTerminSuresi}
              onChange={(e) =>
                updateTermin(
                  t.localId,
                  "uygunTerminSuresi",
                  e.target.value
                )
              }
            />
          </label>
        </div>

        {/* Otomatik Termin Süresi */}
        {gunFarki !== null && gunFarki >= 0 && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Termin Süresi
              </div>

              <div className="mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                İki tarih arasındaki gün farkı.
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {gunFarki}
              </span>

              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Gün
              </span>
            </div>
          </div>
        )}

        {/* Geçersiz Tarih Uyarısı */}
        {gunFarki !== null && gunFarki < 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            Termin tarihi, görevlendirme tarihinden önce olamaz.
          </div>
        )}
      </div>
    );
  })}
</div>


        )}
      </section>
      <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
        <p className="text-xs text-zinc-500">
          {progress ||
            `${terminler.length} görevlendirme • ${files.length} dosya`}
        </p>
        <button
          disabled={saving || loadingLookups || !personelId}
          onClick={handleSave}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving
            ? "Kaydediliyor..."
            : createdId
              ? "Kaydetmeye Devam Et"
              : "Denetimi Oluştur ve Kaydet"}
        </button>
      </div>
    </div>
  );
}
