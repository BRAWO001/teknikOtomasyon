import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie } from "@/utils/cookieService";

// Oturum bilgisi yalnızca ekranda gösterim ve ilk site tercihi içindir.
// Yetki, kullanıcı ID ve SMS hedefi her zaman backend tarafından doğrulanır.
function sakinOturumuOku() {
  if (typeof window === "undefined") return null;
  try {
    const raw = getCookie("SakinUserInfo");
    if (!raw) return null;
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    return value?.kullaniciTipi === "sakin" ? value : null;
  } catch {
    return null;
  }
}

const fieldClass =
  "mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-emerald-900";
const buttonClass =
  "rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const read = (obj, camel, pascal) => obj?.[camel] ?? obj?.[pascal];
const errorText = (err) => {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) return Object.values(data.errors).flat().join(" | ");
  return err?.message || "İşlem sırasında hata oluştu.";
};
const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" });
};
const maskPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10
    ? `${digits.slice(0, 3)} *** ** ${digits.slice(-2)}`
    : "Kayıtlı telefon";
};

export default function VekaletVerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const [oturum, setOturum] = useState(null);
  const [apiBilgiHatasi, setApiBilgiHatasi] = useState("");
  const [bolumler, setBolumler] = useState([]);
  const [toplantilar, setToplantilar] = useState([]);
  const [toplantiLoading, setToplantiLoading] = useState(false);
  const [toplantiHatasi, setToplantiHatasi] = useState("");
  const [toplantiYuklendi, setToplantiYuklendi] = useState(false);
  const [toplantiYenile, setToplantiYenile] = useState(0);
  const [siteId, setSiteId] = useState("");
  const [toplantiId, setToplantiId] = useState("");
  const [seciliBolumler, setSeciliBolumler] = useState([]);
  const [form, setForm] = useState({
    vekaletVerilenAd: "",
    vekaletVerilenSoyad: "",
    vekaletVerilenTelNo: "",
    vekaletNot: "",
  });
  const [step, setStep] = useState("form"); // form -> otp -> ready -> done
  const [basvuruGuid, setBasvuruGuid] = useState("");
  const [kod, setKod] = useState("");
  const [sonuc, setSonuc] = useState(null);

  // Backend bolumler API'sinden gelen SiteAdi ile tekil site seçenekleri oluşturulur.
  // SiteId yalnızca API sorguları için kullanılır, ekranda gösterilmez.
  const siteler = useMemo(() => {
    const map = new Map();
    bolumler.forEach((bolum) => {
      const id = Number(read(bolum, "siteId", "SiteId"));
      if (!id) return;
      const adi = String(read(bolum, "siteAdi", "SiteAdi") ?? "").trim();
      if (!map.has(id) || (!map.get(id).siteAdi && adi)) {
        map.set(id, { siteId: id, siteAdi: adi });
      }
    });
    return [...map.values()].sort((a, b) =>
      a.siteAdi.localeCompare(b.siteAdi, "tr"),
    );
  }, [bolumler]);
  const siteBolumleri = useMemo(
    () =>
      bolumler.filter(
        (x) => Number(read(x, "siteId", "SiteId")) === Number(siteId),
      ),
    [bolumler, siteId],
  );
  const seciliToplanti = useMemo(
    () =>
      toplantilar.find(
        (x) => Number(read(x, "id", "Id")) === Number(toplantiId),
      ),
    [toplantilar, toplantiId],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const session = sakinOturumuOku();
      if (!session) {
        setError("Sakin oturumu bulunamadı. Lütfen sakin girişi yapınız.");
        setLoading(false);
        return;
      }
      setOturum(session);
      setInfo(session);

      // Oturum cookie'sindeki tek aktif daire, tüm yetkili daireler demek değildir.
      // Bağımsız bölümleri mutlaka backend'den alıyoruz.
      const [userResult, unitsResult] = await Promise.allSettled([
        getDataAsync("vekalet/benim-bilgilerim"),
        getDataAsync("vekalet/bolumler"),
      ]);
      if (cancelled) return;

      if (userResult.status === "fulfilled") {
        setInfo(userResult.value);
        setApiBilgiHatasi("");
      } else {
        setApiBilgiHatasi(errorText(userResult.reason));
      }

      if (unitsResult.status === "fulfilled") {
        const data = unitsResult.value;
        const list = Array.isArray(data) ? data : [];
        setBolumler(list);
        const preferredSite = Number(session.aktifSiteId);
        const siteList = [
          ...new Set(
            list
              .map((x) => Number(read(x, "siteId", "SiteId")))
              .filter(Boolean),
          ),
        ];
        const initialSite = siteList.includes(preferredSite)
          ? preferredSite
          : siteList[0];
        setSiteId(initialSite ? String(initialSite) : "");
      } else {
        setBolumler([]);
        setError(
          `Bağımsız bölüm bilgileri alınamadı: ${errorText(unitsResult.reason)}. Backend JWT kullanıcı kimliğini kontrol ediniz.`,
        );
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setToplantilar([]);
    setToplantiId("");
    setToplantiHatasi("");
    setToplantiYuklendi(false);
    if (!siteId) {
      setToplantiLoading(false);
      return;
    }

    async function load() {
      setToplantiLoading(true);
      try {
        const data = await getDataAsync(
          `vekalet/toplantilar?siteId=${encodeURIComponent(siteId)}`,
        );
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setToplantilar(list);
        setToplantiYuklendi(true);
      } catch (err) {
        if (cancelled) return;
        setToplantilar([]);
        const status = err?.response?.status;
        setToplantiHatasi(
          `${status ? `HTTP ${status}: ` : ""}${errorText(err)}`,
        );
      } finally {
        if (!cancelled) setToplantiLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [siteId, toplantiYenile]);

  function toggleBolum(id) {
    if (step !== "form") return;
    setSeciliBolumler((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  }

  function validate() {
    if (!siteId || !toplantiId) return "Lütfen site ve toplantı seçiniz.";
    if (!seciliBolumler.length) return "En az bir bağımsız bölüm seçiniz.";
    if (!form.vekaletVerilenAd.trim() || !form.vekaletVerilenSoyad.trim())
      return "Vekil adı ve soyadı zorunludur.";
    const phone = form.vekaletVerilenTelNo
      .replace(/\D/g, "")
      .replace(/^(90|0)/, "");
    if (!/^5\d{9}$/.test(phone))
      return "Vekilin telefonunu 05XXXXXXXXX biçiminde giriniz.";
    const max = Number(
      read(
        seciliToplanti,
        "verilecekMaksVekaletSayisi",
        "VerilecekMaksVekaletSayisi",
      ),
    );
    if (max > 0 && seciliBolumler.length > max)
      return `Bu toplantıda en fazla ${max} bölüm seçebilirsiniz.`;
    return "";
  }

  async function smsGonder() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await postDataAsync("vekalet/sms-gonder", {
        toplantiId: Number(toplantiId),
        bolumIdleri: seciliBolumler,
        vekaletNot: form.vekaletNot.trim(),
        vekaletVerilenAd: form.vekaletVerilenAd.trim(),
        vekaletVerilenSoyad: form.vekaletVerilenSoyad.trim(),
        vekaletVerilenTelNo: form.vekaletVerilenTelNo.trim(),
      });
      const guid = read(result, "basvuruGuid", "BasvuruGuid");
      if (!guid) throw new Error("Başvuru numarası alınamadı.");
      setBasvuruGuid(guid);
      setKod("");
      setStep("otp");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function smsDogrula() {
    if (!/^[A-Z0-9]{6}$/.test(kod)) {
      setError("6 karakterli doğrulama kodunu giriniz.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await postDataAsync("vekalet/sms-dogrula", { basvuruGuid, kod });
      setStep("ready");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function tamamla() {
    setBusy(true);
    setError("");
    try {
      const result = await postDataAsync("vekalet/tamamla", { basvuruGuid });
      setSonuc(result);
      setStep("done");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const isForm = step === "form";
  const isDone = step === "done";
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 ring-1 ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                width={160}
                height={44}
                alt="EOS"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="text-sm font-bold">Vekâlet İşlemleri</div>
              <div className="text-xs text-zinc-500">Yeni vekâlet oluştur</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
          >
            ← Geri
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-bold">Toplantı vekâleti ver</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Bağımsız bölümünüzü ve toplantıyı seçin, vekil bilgilerini girin ve
            kayıtlı telefonunuza gelen SMS ile işlemi onaylayın.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-medium">
            {[
              ["form", "1. Bilgiler"],
              ["otp", "2. SMS"],
              ["done", "3. Tamamlandı"],
            ].map(([key, label], index) => {
              const active =
                index <= (step === "form" ? 0 : step === "otp" ? 1 : 2);
              return (
                <div
                  key={key}
                  className={`rounded-lg px-2 py-2 ${active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {apiBilgiHatasi && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            Sakin bilgileri oturumdan gösteriliyor; backend kimlik doğrulaması
            başarısız: {apiBilgiHatasi}. Vekâlet işlemlerinin çalışması için JWT
            claim eşlemesi kontrol edilmelidir.
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}
        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-sm dark:bg-zinc-900">
            Bilgiler yükleniyor...
          </div>
        ) : !info ? (
          <div className="rounded-2xl bg-white p-8 text-sm dark:bg-zinc-900">
            Kullanıcı bilgileri alınamadı.
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-semibold">Vekâlet veren kişi</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-500">Ad Soyad</div>
                  <div className="mt-1 text-sm font-medium">
                    {read(info, "adi", "Adi")} {read(info, "soyadi", "Soyadi")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Kayıtlı telefon</div>
                  <div className="mt-1 text-sm font-medium">
                    {maskPhone(read(info, "telefon", "Telefon"))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-semibold">Toplantı ve bağımsız bölüm</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Site
                  <select
                    className={fieldClass}
                    disabled={!isForm}
                    value={siteId}
                    onChange={(e) => {
                      setSiteId(e.target.value);
                      setSeciliBolumler([]);
                    }}
                  >
                    <option value="">Site seçiniz</option>
                    {siteler.map((site) => (
                      <option key={site.siteId} value={site.siteId}>
                        {site.siteAdi || "Site adı bulunamadı"}
                        {Number(oturum?.aktifSiteId) === site.siteId
                          ? " (aktif site)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Toplantı
                  <select
                    className={fieldClass}
                    disabled={!isForm || !siteId || toplantiLoading}
                    value={toplantiId}
                    onChange={(e) => setToplantiId(e.target.value)}
                  >
                    <option value="">
                      {toplantiLoading
                        ? "Toplantılar yükleniyor..."
                        : "Toplantı seçiniz"}
                    </option>
                    {toplantilar.map((x) => (
                      <option
                        key={read(x, "id", "Id")}
                        value={read(x, "id", "Id")}
                      >
                        {read(x, "toplantiAdi", "ToplantiAdi")} —{" "}
                        {formatDate(
                          read(x, "toplantiTarihi", "ToplantiTarihi"),
                        )}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {siteId && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <button
                    type="button"
                    disabled={toplantiLoading || !isForm}
                    onClick={() => setToplantiYenile((x) => x + 1)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Toplantıları yenile
                  </button>
                  {toplantiLoading && (
                    <span className="text-zinc-500">
                      Toplantılar getiriliyor...
                    </span>
                  )}
                  {!toplantiLoading && toplantiHatasi && (
                    <span
                      role="alert"
                      className="text-red-600 dark:text-red-300"
                    >
                      Toplantılar alınamadı: {toplantiHatasi}
                    </span>
                  )}
                  {!toplantiLoading &&
                    !toplantiHatasi &&
                    toplantiYuklendi &&
                    toplantilar.length === 0 && (
                      <span className="text-amber-700 dark:text-amber-300">
                        Bu site için aktif, tarihi son 7 gün içinde olan veya
                        gelecekte yapılacak toplantı bulunamadı. Toplantı
                        kaydının SiteId, AktifMi ve ToplantiTarihi alanlarını
                        kontrol edin.
                      </span>
                    )}
                  {!toplantiLoading &&
                    !toplantiHatasi &&
                    toplantilar.length > 0 && (
                      <span className="text-emerald-700 dark:text-emerald-300">
                        {toplantilar.length} toplantı bulundu.
                      </span>
                    )}
                </div>
              )}
              {seciliToplanti && (
                <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <p>
                    {read(
                      seciliToplanti,
                      "toplantiAciklama",
                      "ToplantiAciklama",
                    ) || "Toplantı açıklaması bulunmuyor."}
                  </p>
                  <p className="mt-1">
                    Vekâlet verme sınırı:{" "}
                    {read(
                      seciliToplanti,
                      "verilecekMaksVekaletSayisi",
                      "VerilecekMaksVekaletSayisi",
                    ) ?? "-"}{" "}
                    · Vekâlet alma sınırı:{" "}
                    {read(
                      seciliToplanti,
                      "alinanMaksVekaletSayisi",
                      "AlinanMaksVekaletSayisi",
                    ) ?? "-"}
                  </p>
                </div>
              )}
              <div className="mt-5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Bağımsız bölümler ({seciliBolumler.length} seçili)
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Bağımsız bölümleri toplantı seçmeden de işaretleyebilirsiniz.
              </p>
              {siteBolumleri.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Vekâlet verebileceğiniz bağımsız bölüm bulunamadı.
                </p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {siteBolumleri.map((x) => {
                    const id = Number(
                      read(x, "daireMeskenBolumId", "DaireMeskenBolumId"),
                    );
                    return (
                      <label
                        key={id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${seciliBolumler.includes(id) ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-zinc-200 dark:border-zinc-700"}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 accent-emerald-600"
                          disabled={!isForm}
                          checked={seciliBolumler.includes(id)}
                          onChange={() => toggleBolum(id)}
                        />
                        <span>
                          <strong>
                            {read(x, "blokAdi", "BlokAdi") ||
                              "Blok belirtilmemiş"}
                          </strong>{" "}
                          · Kat {read(x, "katNo", "KatNo") ?? "-"} · Daire{" "}
                          {read(x, "daireNo", "DaireNo") ?? "-"}
                          <span className="block text-xs text-zinc-500">
                            Bağımsız bölüm:{" "}
                            {read(x, "bagimsizBolumNo", "BagimsizBolumNo") ??
                              id}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-semibold">Vekâlet verilen kişi</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    key: "vekaletVerilenAd",
                    label: "Ad",
                    placeholder: "Vekilin adı",
                  },
                  {
                    key: "vekaletVerilenSoyad",
                    label: "Soyad",
                    placeholder: "Vekilin soyadı",
                  },
                  {
                    key: "vekaletVerilenTelNo",
                    label: "Telefon",
                    placeholder: "05XXXXXXXXX",
                  },
                ].map((x) => (
                  <label
                    key={x.key}
                    className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    {x.label}
                    <input
                      className={fieldClass}
                      disabled={!isForm}
                      value={form[x.key]}
                      placeholder={x.placeholder}
                      maxLength={x.key === "vekaletVerilenTelNo" ? 16 : 150}
                      onChange={(e) =>
                        setForm((old) => ({ ...old, [x.key]: e.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="mt-4 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Vekâlet notu (isteğe bağlı)
                <textarea
                  className={`${fieldClass} h-28 py-3`}
                  disabled={!isForm}
                  maxLength={4000}
                  value={form.vekaletNot}
                  onChange={(e) =>
                    setForm((old) => ({ ...old, vekaletNot: e.target.value }))
                  }
                  placeholder="Eklemek istediğiniz açıklama"
                />
              </label>
            </section>

            {step === "form" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={busy || Boolean(apiBilgiHatasi) || toplantiLoading}
                  className={buttonClass}
                  onClick={smsGonder}
                >
                  {busy ? "SMS gönderiliyor..." : "Doğrulama SMS'i gönder"}
                </button>
              </div>
            )}
            {step === "otp" && (
              <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-zinc-900">
                <h2 className="font-semibold">SMS doğrulaması</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {maskPhone(read(info, "telefon", "Telefon"))} numarasına
                  gönderilen 6 karakterli harf ve rakamlardan oluşan kodu
                  giriniz. Kod 5 dakika geçerlidir.
                </p>
                <label className="mt-4 block text-xs font-medium">
                  Doğrulama kodu
                  <input
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className={`${fieldClass} max-w-xs text-center text-xl tracking-[0.3em]`}
                    value={kod}
                    onChange={(e) =>
                      setKod(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 6),
                      )
                    }
                  />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={busy}
                    onClick={smsDogrula}
                  >
                    {busy ? "Kontrol ediliyor..." : "Kodu doğrula"}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700"
                    disabled={busy}
                    onClick={() => {
                      setStep("form");
                      setBasvuruGuid("");
                      setKod("");
                      setError("");
                    }}
                  >
                    Bilgileri düzenle
                  </button>
                </div>
              </section>
            )}
            {step === "ready" && (
              <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-zinc-900">
                <h2 className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Telefon doğrulandı
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Vekâlet henüz oluşturulmadı. İşlemi kesinleştirmek için
                  aşağıdaki düğmeye basınız.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  className={`${buttonClass} mt-4`}
                  onClick={tamamla}
                >
                  {busy ? "Kaydediliyor..." : "Vekâleti kesin olarak oluştur"}
                </button>
              </section>
            )}
            {isDone && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
                <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                  Vekâlet başarıyla oluşturuldu
                </h2>
                <p className="mt-2 text-sm">
                  Vekâlet numarası: <strong>#{read(sonuc, "id", "Id")}</strong>
                </p>
                <p className="mt-1 break-all text-xs text-zinc-600 dark:text-zinc-300">
                  Doğrulama kodu:{" "}
                  {read(sonuc, "vekaletGuidCode", "VekaletGuidCode")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {read(sonuc, "vekaletGuidQrLink", "VekaletGuidQrLink") && (
                    <a
                      className={buttonClass}
                      href={read(
                        sonuc,
                        "vekaletGuidQrLink",
                        "VekaletGuidQrLink",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Doğrulama sayfasını aç
                    </a>
                  )}
                  <button
                    type="button"
                    className="rounded-xl border border-emerald-300 px-4 py-3 text-sm"
                    onClick={() => router.reload()}
                  >
                    Yeni vekâlet oluştur
                  </button>
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  PDF belge oluşturma ve QR görseli sonraki aşamada
                  eklenecektir.
                </p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
