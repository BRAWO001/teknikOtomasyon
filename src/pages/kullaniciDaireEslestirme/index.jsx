//src/pages/kullaniciDaireEslestirme/index.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "../../utils/apiService";

const ILISKI_TIPLERI = [
  { id: 1, ad: "Ev Sahibi (Kat Maliki)" },
  { id: 2, ad: "Kiracı" },
  { id: 3, ad: "Oturan" },
  { id: 4, ad: "Vekil" },
  { id: 5, ad: "İş Yeri Yetkilisi" },
];

const DOGAL_SIRALAYICI = new Intl.Collator("tr-TR", {
  numeric: true,
  sensitivity: "base",
});

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

export default function KullaniciDaireEslestirme() {
  const [sites, setSites] = useState([]);
  const [apts, setApts] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [aptId, setAptId] = useState("");

  const [kullaniciArama, setKullaniciArama] = useState("");
  const [kullanicilar, setKullanicilar] = useState([]);
  const [kullaniciToplam, setKullaniciToplam] = useState(0);
  const [secilenKullanici, setSecilenKullanici] = useState(null);

  const [bolumArama, setBolumArama] = useState("");
  const [bolumler, setBolumler] = useState([]);
  const [secilenBolumId, setSecilenBolumId] = useState(null);

  const [iliskiTipi, setIliskiTipi] = useState(1);
  const [aciklama, setAciklama] = useState("");

  const [sitesLoading, setSitesLoading] = useState(true);
  const [aptLoading, setAptLoading] = useState(false);
  const [kullaniciLoading, setKullaniciLoading] = useState(false);
  const [bolumLoading, setBolumLoading] = useState(false);
  const [kaydetLoading, setKaydetLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const secilenBolum = useMemo(
    () => bolumler.find((x) => x.id === secilenBolumId) || null,
    [bolumler, secilenBolumId],
  );

  const siraliAptler = useMemo(
    () =>
      [...apts].sort((a, b) =>
        DOGAL_SIRALAYICI.compare(a.ad || "", b.ad || ""),
      ),
    [apts],
  );

  const filtreliVeSiraliBolumler = useMemo(() => {
    const aranan = turkceKucult(bolumArama.trim());

    return bolumler
      .filter((bolum) => {
        if (!aranan) return true;

        return [
          bolum.blokAdi,
          bolum.katNo,
          bolum.daireNo,
          bolum.bagimsizBolumNo,
          bolum.daireTipi,
        ].some((deger) => turkceKucult(deger).includes(aranan));
      })
      .sort(bolumleriDogalSirala);
  }, [bolumler, bolumArama]);

  const blokGruplari = useMemo(
    () => bolumleriBloklaraAyir(filtreliVeSiraliBolumler, apts),
    [filtreliVeSiraliBolumler, apts],
  );

  const blokOzetleri = useMemo(
    () => bolumOzetleriniHesapla(bolumler, apts),
    [bolumler, apts],
  );

  const genelOzet = useMemo(() => bolumOzetiHesapla(bolumler), [bolumler]);

  useEffect(() => {
    let aktif = true;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        const data = await getDataAsync("SiteAptEvControllerSet/sites");
        if (aktif) setSites(Array.isArray(data) ? data : []);
      } catch (err) {
        if (aktif) setError(getErrorMessage(err, "Siteler alınamadı."));
      } finally {
        if (aktif) setSitesLoading(false);
      }
    };

    loadSites();
    return () => {
      aktif = false;
    };
  }, []);

  // Kullanıcı yazmayı bıraktıktan 350 ms sonra arama yapılır.
  useEffect(() => {
    const aranan = kullaniciArama.trim();
    if (aranan.length < 2) {
      setKullanicilar([]);
      setKullaniciToplam(0);
      setKullaniciLoading(false);
      return undefined;
    }

    let aktif = true;
    const timer = setTimeout(async () => {
      try {
        setKullaniciLoading(true);
        setError("");
        const data = await getDataAsync(
          `AppMobil/eslestirme/kullanicilar?arama=${encodeURIComponent(
            aranan,
          )}&limit=30`,
        );

        if (!aktif) return;
        setKullanicilar(Array.isArray(data?.items) ? data.items : []);
        setKullaniciToplam(Number(data?.total || 0));
      } catch (err) {
        if (aktif) {
          setKullanicilar([]);
          setKullaniciToplam(0);
          setError(getErrorMessage(err, "Kullanıcı araması yapılamadı."));
        }
      } finally {
        if (aktif) setKullaniciLoading(false);
      }
    }, 350);

    return () => {
      aktif = false;
      clearTimeout(timer);
    };
  }, [kullaniciArama]);

  const loadBolumler = useCallback(async () => {
    if (!siteId) {
      setBolumler([]);
      return;
    }

    try {
      setBolumLoading(true);
      setError("");

      const params = new URLSearchParams({ siteId: String(siteId) });
      if (aptId) params.set("aptId", String(aptId));
      const data = await getDataAsync(
        `AppMobil/eslestirme/bolumler?${params.toString()}`,
      );
      const yeniBolumler = Array.isArray(data?.items) ? data.items : [];

      setBolumler(yeniBolumler);
      setSecilenBolumId((oncekiId) =>
        yeniBolumler.some((x) => x.id === oncekiId) ? oncekiId : null,
      );
    } catch (err) {
      setBolumler([]);
      setSecilenBolumId(null);
      setError(getErrorMessage(err, "Bağımsız bölümler alınamadı."));
    } finally {
      setBolumLoading(false);
    }
  }, [siteId, aptId]);

  // Site veya blok değiştiğinde bütün bölümleri bir kez alır.
  // Daire araması ve doğal sıralama tarayıcıda yapılır.
  useEffect(() => {
    loadBolumler();
  }, [loadBolumler]);

  const onSiteChange = async (value) => {
    setSiteId(value);
    setAptId("");
    setApts([]);
    setBolumArama("");
    setSecilenBolumId(null);
    setSuccess("");

    if (!value) return;

    try {
      setAptLoading(true);
      setError("");
      const data = await getDataAsync(`SiteAptEvControllerSet/sites/${value}`);
      setApts(Array.isArray(data?.aptler) ? data.aptler : []);
    } catch (err) {
      setError(getErrorMessage(err, "Seçilen sitenin blokları alınamadı."));
    } finally {
      setAptLoading(false);
    }
  };

  const onAptChange = (value) => {
    setAptId(value);
    setBolumArama("");
    setSecilenBolumId(null);
    setSuccess("");
  };

  const onKaydet = async () => {
    setError("");
    setSuccess("");

    if (!secilenKullanici) {
      setError("Önce sol taraftan bir kişi seçmelisiniz.");
      return;
    }
    if (!secilenBolum) {
      setError("Önce sağ taraftan bir bağımsız bölüm seçmelisiniz.");
      return;
    }

    const ayniKayitVar = (secilenBolum.kayitliKisiler || []).some(
      (x) =>
        x.kullaniciId === secilenKullanici.id &&
        x.iliskiTipKod === Number(iliskiTipi),
    );

    if (ayniKayitVar) {
      setError("Bu kişi, seçilen bölüme aynı ilişki türüyle zaten kayıtlı.");
      return;
    }

    try {
      setKaydetLoading(true);
      const response = await postDataAsync("AppMobil/eslestirme/kaydet", {
        kullaniciId: secilenKullanici.id,
        daireMeskenBolumId: secilenBolum.id,
        iliskiTipi: Number(iliskiTipi),
        baslangicTarihi: new Date().toISOString(),
        bitisTarihi: null,
        aciklama: aciklama.trim() || null,
        rolKaydiDaOlusturulsunMu: true,
        rolTipi: null,
      });

      setSuccess(response?.message || "Kişi ve bağımsız bölüm eşleştirildi.");
      setAciklama("");
      await loadBolumler();
    } catch (err) {
      setError(getErrorMessage(err, "Eşleştirme kaydedilemedi."));
    } finally {
      setKaydetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-2 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 md:p-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3">
          <h1 className="text-xl font-semibold tracking-tight">
            Kişi – Bağımsız Bölüm Eşleştirme
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Soldan kişiyi, sağdan gerçek mesken bölümünü seçip ilişki türünü
            kaydedin.
          </p>
        </div>

        {(error || success) && (
          <div
            className={`mb-3 rounded-lg border p-2.5 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <Panel
            title="1. Kişiyi seç"
            description="Ad, soyad, firma, telefon veya e-posta ile arayın."
          >
            <input
              className={inputClass}
              value={kullaniciArama}
              onChange={(e) => {
                setKullaniciArama(e.target.value);
                setSuccess("");
              }}
              placeholder="Örn. Ahmet Yılmaz veya 0532..."
              autoComplete="off"
            />

            <div className="mt-1.5 flex min-h-4 items-center justify-between text-[11px] text-zinc-500">
              <span>
                {kullaniciArama.trim().length < 2
                  ? "Aramak için en az 2 karakter yazın."
                  : kullaniciLoading
                    ? "Kişiler aranıyor..."
                    : `${kullaniciToplam} kayıt bulundu`}
              </span>
              {kullaniciToplam > 30 && <span>İlk 30 sonuç gösteriliyor</span>}
            </div>

            <div className="mt-2 max-h-[500px] space-y-1.5 overflow-y-auto pr-1">
              {kullanicilar.map((kisi) => {
                const secili = secilenKullanici?.id === kisi.id;
                return (
                  <button
                    key={kisi.id}
                    type="button"
                    onClick={() => {
                      setSecilenKullanici(kisi);
                      setSuccess("");
                    }}
                    className={`w-full rounded-lg border p-2.5 text-left transition ${
                      secili
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/30 dark:ring-blue-950"
                        : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">
                          {kisi.adSoyad ||
                            kisi.firmaAdi ||
                            `Kullanıcı #${kisi.id}`}
                        </div>
                        <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {[kisi.telefon, kisi.email]
                            .filter(Boolean)
                            .join(" · ") || "İletişim bilgisi yok"}
                        </div>
                      </div>
                      <Badge>{kisi.kullaniciTipAd}</Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Aktif bölüm ilişkisi: {kisi.aktifIliskiSayisi || 0}
                    </div>
                  </button>
                );
              })}

              {!kullaniciLoading &&
                kullaniciArama.trim().length >= 2 &&
                kullanicilar.length === 0 && (
                  <EmptyState text="Aramanıza uygun aktif kullanıcı bulunamadı." />
                )}
            </div>
          </Panel>

          <Panel
            title="2. Bağımsız bölümü seç"
            description="Site ve blok seçildiğinde kayıtlı kişilerle birlikte bölümler gelir."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Site">
                <select
                  className={inputClass}
                  value={siteId}
                  onChange={(e) => onSiteChange(e.target.value)}
                  disabled={sitesLoading}
                >
                  <option value="">
                    {sitesLoading ? "Siteler yükleniyor..." : "Site seçiniz"}
                  </option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.ad}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Bölüm / Blok">
                <select
                  className={inputClass}
                  value={aptId}
                  onChange={(e) => onAptChange(e.target.value)}
                  disabled={!siteId || aptLoading}
                >
                  <option value="">
                    {!siteId
                      ? "Önce site seçiniz"
                      : aptLoading
                        ? "Bloklar yükleniyor..."
                        : "Tüm bloklar"}
                  </option>
                  {siraliAptler.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.ad}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-2">
              <input
                className={inputClass}
                value={bolumArama}
                onChange={(e) => setBolumArama(e.target.value)}
                placeholder="Daire no, bağımsız bölüm no, kat veya blok ara"
                disabled={!siteId}
              />
            </div>

            {siteId && !bolumLoading && (
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <SummaryBox
                  label="Bağımsız bölüm"
                  value={genelOzet.bolumSayisi}
                />
                <SummaryBox
                  label="Toplam kişi"
                  value={genelOzet.tekilKisiSayisi}
                  highlighted
                />
                <SummaryBox
                  label="Boş bölüm"
                  value={genelOzet.bosBolumSayisi}
                />
              </div>
            )}

            <div className="mt-2 max-h-[470px] space-y-2 overflow-y-auto pr-1">
              {bolumLoading && (
                <EmptyState text="Bağımsız bölümler yükleniyor..." />
              )}

              {!bolumLoading &&
                blokGruplari.map((grup) => {
                  const tamOzet =
                    blokOzetleri.get(grup.anahtar) ||
                    bolumOzetiHesapla(grup.bolumler);

                  return (
                    <section
                      key={grup.anahtar}
                      className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-2.5 py-1.5 dark:border-zinc-800">
                        <div className="text-xs font-semibold">{grup.ad}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <span>{tamOzet.bolumSayisi} bölüm</span>
                          <span>·</span>
                          <span className="font-semibold text-violet-700 dark:text-violet-300">
                            {tamOzet.tekilKisiSayisi} kişi
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 p-1.5">
                        {grup.bolumler.map((bolum) => {
                          const secili = secilenBolumId === bolum.id;
                          const kisiler = bolum.kayitliKisiler || [];

                          return (
                            <button
                              key={bolum.id}
                              type="button"
                              onClick={() => {
                                setSecilenBolumId(bolum.id);
                                setSuccess("");
                              }}
                              className={`w-full rounded-md border p-2 text-left transition ${
                                secili
                                  ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:ring-violet-900"
                                  : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-sm font-semibold">
                                    {bolumBaslik(bolum)}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {[
                                      bolum.katNo && `Kat ${bolum.katNo}`,
                                      bolum.bagimsizBolumNo &&
                                        `B.B. ${bolum.bagimsizBolumNo}`,
                                      bolum.daireTipi,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ") || "Ek bölüm bilgisi yok"}
                                  </div>
                                </div>
                                <Badge>{tekilKisiSayisi(kisiler)} kişi</Badge>
                              </div>

                              {kisiler.length > 0 ? (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {kisiler.map((kayit) => (
                                    <span
                                      key={kayit.iliskiId}
                                      className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                    >
                                      {kayit.kullanici?.adSoyad ||
                                        kayit.kullanici?.firmaAdi ||
                                        `Kişi #${kayit.kullaniciId}`}

                                      {kayit.kullanici?.telefon && (
                                        <> · {kayit.kullanici.telefon}</>
                                      )}

                                      {" · "}
                                      {iliskiAdi(kayit.iliskiTipKod)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">
                                  Henüz kişi bağlanmamış.
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

              {!bolumLoading &&
                siteId &&
                filtreliVeSiraliBolumler.length === 0 && (
                  <EmptyState text="Seçilen filtrelerde kayıtlı mesken bölümü bulunamadı." />
                )}

              {!siteId && (
                <EmptyState text="Bağımsız bölümleri görmek için önce site seçin." />
              )}
            </div>
          </Panel>
        </div>

        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid items-end gap-2 lg:grid-cols-[1fr_auto_1fr]">
            <SelectionCard
              title="Seçilen kişi"
              value={
                secilenKullanici
                  ? secilenKullanici.adSoyad || secilenKullanici.firmaAdi
                  : "Henüz kişi seçilmedi"
              }
              detail={secilenKullanici?.telefon}
              tone="blue"
            />

            <div className="hidden pb-3 text-xl text-zinc-400 lg:block">→</div>

            <SelectionCard
              title="Seçilen bağımsız bölüm"
              value={
                secilenBolum
                  ? bolumBaslik(secilenBolum)
                  : "Henüz bölüm seçilmedi"
              }
              detail={
                secilenBolum
                  ? `${tekilKisiSayisi(secilenBolum.kayitliKisiler || [])} aktif kişi`
                  : null
              }
              tone="violet"
            />
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <Field label="İlişki türü">
              <select
                className={inputClass}
                value={iliskiTipi}
                onChange={(e) => setIliskiTipi(Number(e.target.value))}
              >
                {ILISKI_TIPLERI.map((tip) => (
                  <option key={tip.id} value={tip.id}>
                    {tip.ad}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Açıklama (isteğe bağlı)">
              <input
                className={inputClass}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Örn. Tapu kaydına göre eklendi"
              />
            </Field>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onKaydet}
              disabled={kaydetLoading || !secilenKullanici || !secilenBolum}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {kaydetLoading ? "Eşleştiriliyor..." : "Kişiyi Bölüme Eşleştir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, description, children }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-2.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function Badge({ children }) {
  return (
    <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {text}
    </div>
  );
}

function SelectionCard({ title, value, detail, tone }) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
      : "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30";

  return (
    <div className={`rounded-lg border p-2.5 ${toneClass}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{value || "—"}</div>
      {detail && (
        <div className="mt-0.5 text-[11px] text-zinc-500">{detail}</div>
      )}
    </div>
  );
}

function SummaryBox({ label, value, highlighted = false }) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        highlighted
          ? "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50"
      }`}
    >
      <div className="text-[9px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`text-base font-bold leading-tight ${
          highlighted ? "text-violet-700 dark:text-violet-300" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function bolumleriDogalSirala(a, b) {
  const blokKarsilastirma = DOGAL_SIRALAYICI.compare(
    String(a.blokAdi || ""),
    String(b.blokAdi || ""),
  );
  if (blokKarsilastirma !== 0) return blokKarsilastirma;

  const daireA = a.daireNo ?? a.bagimsizBolumNo ?? "";
  const daireB = b.daireNo ?? b.bagimsizBolumNo ?? "";
  const daireKarsilastirma = DOGAL_SIRALAYICI.compare(
    String(daireA),
    String(daireB),
  );
  if (daireKarsilastirma !== 0) return daireKarsilastirma;

  const katKarsilastirma = DOGAL_SIRALAYICI.compare(
    String(a.katNo || ""),
    String(b.katNo || ""),
  );
  if (katKarsilastirma !== 0) return katKarsilastirma;

  return Number(a.id || 0) - Number(b.id || 0);
}

function bolumleriBloklaraAyir(bolumler, apts) {
  const aptAdlari = new Map(apts.map((apt) => [Number(apt.id), apt.ad]));
  const gruplar = new Map();

  bolumler.forEach((bolum) => {
    const { anahtar, ad } = bolumGrupBilgisi(bolum, aptAdlari);

    if (!gruplar.has(anahtar)) {
      gruplar.set(anahtar, { anahtar, ad, bolumler: [] });
    }

    gruplar.get(anahtar).bolumler.push(bolum);
  });

  return [...gruplar.values()].sort((a, b) =>
    DOGAL_SIRALAYICI.compare(a.ad, b.ad),
  );
}

function bolumOzetleriniHesapla(bolumler, apts) {
  const aptAdlari = new Map(apts.map((apt) => [Number(apt.id), apt.ad]));
  const gruplar = new Map();

  bolumler.forEach((bolum) => {
    const { anahtar } = bolumGrupBilgisi(bolum, aptAdlari);
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
    gruplar.get(anahtar).push(bolum);
  });

  const ozetler = new Map();
  gruplar.forEach((grupBolumleri, anahtar) => {
    ozetler.set(anahtar, bolumOzetiHesapla(grupBolumleri));
  });

  return ozetler;
}

function bolumGrupBilgisi(bolum, aptAdlari) {
  if (bolum.aptId != null) {
    return {
      anahtar: `apt-${bolum.aptId}`,
      ad:
        aptAdlari.get(Number(bolum.aptId)) ||
        bolum.blokAdi ||
        `Blok #${bolum.aptId}`,
    };
  }

  const blokAdi = bolum.blokAdi || "Blok bilgisi olmayan bölümler";
  return {
    anahtar: `blok-${turkceKucult(blokAdi)}`,
    ad: blokAdi,
  };
}

function bolumOzetiHesapla(bolumler) {
  const kisiIdleri = new Set();
  let bosBolumSayisi = 0;

  bolumler.forEach((bolum) => {
    const kayitlar = bolum.kayitliKisiler || [];
    if (kayitlar.length === 0) bosBolumSayisi += 1;

    kayitlar.forEach((kayit) => {
      const kullaniciId = kayit.kullaniciId ?? kayit.kullanici?.id;
      if (kullaniciId != null) kisiIdleri.add(String(kullaniciId));
    });
  });

  return {
    bolumSayisi: bolumler.length,
    tekilKisiSayisi: kisiIdleri.size,
    bosBolumSayisi,
  };
}

function tekilKisiSayisi(kayitlar) {
  const kisiIdleri = new Set();

  kayitlar.forEach((kayit) => {
    const kullaniciId = kayit.kullaniciId ?? kayit.kullanici?.id;
    if (kullaniciId != null) kisiIdleri.add(String(kullaniciId));
  });

  return kisiIdleri.size;
}

function turkceKucult(deger) {
  return String(deger ?? "").toLocaleLowerCase("tr-TR");
}

function bolumBaslik(bolum) {
  return (
    [
      bolum.blokAdi,
      bolum.daireNo ? `Daire ${bolum.daireNo}` : null,
      !bolum.daireNo && bolum.bagimsizBolumNo
        ? `Bağımsız Bölüm ${bolum.bagimsizBolumNo}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || `Bölüm #${bolum.id}`
  );
}

function iliskiAdi(kod) {
  return ILISKI_TIPLERI.find((x) => x.id === Number(kod))?.ad || "Bilinmiyor";
}

function getErrorMessage(err, fallback) {
  const responseData = err?.response?.data;
  if (typeof responseData?.message === "string") return responseData.message;
  if (typeof responseData === "string") return responseData;
  if (typeof err?.data?.message === "string") return err.data.message;
  if (typeof err?.message === "string") return err.message;
  return fallback;
}