// src/pages/YonetimKurulu/karar/[token].jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const OPTIONS = [
  { value: "Onaylıyorum", label: "Onaylıyorum" },
  { value: "Onaylamıyorum", label: "Onaylamıyorum" },
  { value: "Çekimser/Fikrim Yok", label: "Çekimser / Fikrim Yok" },
];

const NIHAI_OPTIONS = [
  { value: "Beklemede", label: "Beklemede" },
  { value: "Onaylandı", label: "Onaylandı" },
  { value: "Reddedildi", label: "Reddedildi" },
  { value: "İptal", label: "İptal" },
];

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

export default function KararTokenDetayPage() {
  const router = useRouter();
  const { token } = router.query;

  const [personel, setPersonel] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Rol11 oy/düşünce
  const [secim, setSecim] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Rol90 patron paneli
  const [nihai, setNihai] = useState("");
  const [nihaiSelect, setNihaiSelect] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState(null);

  const isRol11 = useMemo(() => Number(personel?.rol) === 11, [personel]);
  const isRol90 = useMemo(() => Number(personel?.rol) === 90, [personel]);

  const myOnerenKaydi = useMemo(() => {
    const pid = Number(personel?.id);
    const list = data?.onerenKisiler;
    if (!pid || !Array.isArray(list)) return null;
    return list.find((x) => Number(x.personelId) === pid) || null;
  }, [data?.onerenKisiler, personel?.id]);

  const duzenlemeAcikMi = useMemo(
    () => !!data?.duzenlemeDurumu,
    [data?.duzenlemeDurumu]
  );

  const canEdit = useMemo(() => {
    return isRol11 && !!myOnerenKaydi && duzenlemeAcikMi;
  }, [isRol11, myOnerenKaydi, duzenlemeAcikMi]);

  // cookie -> personel
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      const parsed = JSON.parse(cookie);
      const p = parsed?.personel ?? parsed;
      setPersonel(p);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
    }
  }, []);

  // token -> dto
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);

        const dto = await getDataAsync(`projeYonetimKurulu/public/${token}`);
        if (cancelled) return;

        setData(dto || null);

        // Nihai sonuc defaultları
        const nih = dto?.nihaiSonuc ?? "";
        const nihStr = nih ? String(nih) : "";

        const known = NIHAI_OPTIONS.some((x) => x.value === nihStr) ? nihStr : "";
        setNihaiSelect(known);
        setNihai(known ? "" : nihStr);
      } catch (e) {
        console.error("PUBLIC TOKEN GET ERROR:", e);
        if (cancelled) return;
        setErr("Karar detayı alınamadı (token geçersiz olabilir).");
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // benim kayıt -> seçim & açıklama
  useEffect(() => {
    if (!myOnerenKaydi) return;

    const mevcut = myOnerenKaydi?.kararDusuncesi;
    const mevcutAcik = myOnerenKaydi?.kararDusunceAciklamasi;
    const known = OPTIONS.some((o) => o.value === mevcut) ? mevcut : "";

    setSecim(known);
    setAciklama(mevcutAcik || "");
  }, [myOnerenKaydi]);

  const formatTR = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const handleKaydet = async () => {
    if (!data?.id) return;
    if (!personel?.id) return;

    if (!canEdit) {
      setSaveMsg("Şu an düzenleme kapalı veya yetkin yok.");
      return;
    }
    if (!secim) {
      setSaveMsg("Lütfen bir seçim yapınız.");
      return;
    }

    try {
      setSaving(true);
      setSaveMsg(null);

      const payload = {
        kararModalsId: data.id,
        personelId: Number(personel.id),
        kararDusuncesi: secim,
        kararDusunceAciklamasi: aciklama?.trim() ? aciklama.trim() : null,
      };

      await postDataAsync("projeYonetimKurulu/karar/dusunce", payload);

      setData((prev) => {
        if (!prev) return prev;
        const list = Array.isArray(prev.onerenKisiler) ? [...prev.onerenKisiler] : [];
        const idx = list.findIndex(
          (x) => Number(x.personelId) === Number(personel.id)
        );
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            kararDusuncesi: secim,
            kararDusunceAciklamasi: payload.kararDusunceAciklamasi,
          };
        }
        return { ...prev, onerenKisiler: list };
      });

      setSaveMsg("Kaydedildi.");
    } catch (e) {
      console.error("DUSUNCE POST ERROR:", e);
      setSaveMsg("Kaydedilemedi. (Yetki/endpoint/validasyon kontrol et)");
    } finally {
      setSaving(false);
    }
  };

  // Rol90: NihaiSonuc güncelle
  const handleUpdateNihai = async () => {
    if (!data?.id) return;

    if (!isRol90) {
      setAdminMsg("Bu işlem sadece rol 90 için.");
      return;
    }

    const finalVal = (nihaiSelect || nihai || "").trim();
    const payload = { nihaiSonuc: finalVal ? finalVal : null };

    try {
      setAdminSaving(true);
      setAdminMsg(null);

      const res = await postDataAsync(
        `projeYonetimKurulu/karar/${data.id}/nihai-sonuc`,
        payload
      );

      const newVal = res?.nihaiSonuc ?? payload.nihaiSonuc;
      setData((prev) => (prev ? { ...prev, nihaiSonuc: newVal } : prev));

      const newStr = newVal ? String(newVal) : "";
      const isKnown = NIHAI_OPTIONS.some((x) => x.value === newStr);
      setNihaiSelect(isKnown ? newStr : "");
      setNihai(isKnown ? "" : newStr);

      setAdminMsg("Nihai sonuç güncellendi.");
    } catch (e) {
      console.error("NIHAI SONUC UPDATE ERROR:", e);
      const status = e?.response?.status;
      setAdminMsg(
        status ? `Nihai sonuç güncellenemedi (HTTP ${status}).` : "Nihai sonuç güncellenemedi."
      );
    } finally {
      setAdminSaving(false);
    }
  };

  // Rol90: Düzenleme Aç/Kapat
  const handleToggleDuzenleme = async () => {
    if (!data?.id) return;

    if (!isRol90) {
      setAdminMsg("Bu işlem sadece rol 90 için.");
      return;
    }

    try {
      setAdminSaving(true);
      setAdminMsg(null);

      const payload = {
        kararId: Number(data.id),
        duzenlemeDurumu: !duzenlemeAcikMi,
      };

      const res = await postDataAsync(
        "projeYonetimKurulu/karar/duzenleme-durumu",
        payload
      );

      const newVal =
        typeof res?.duzenlemeDurumu === "boolean"
          ? res.duzenlemeDurumu
          : payload.duzenlemeDurumu;

      setData((prev) => (prev ? { ...prev, duzenlemeDurumu: newVal } : prev));
      setAdminMsg(newVal ? "Düzenleme açıldı." : "Düzenleme kapatıldı.");
    } catch (e) {
      console.error("DUZENLEME DURUMU UPDATE ERROR:", e);
      const status = e?.response?.status;
      setAdminMsg(
        status ? `Düzenleme güncellenemedi (HTTP ${status}).` : "Düzenleme güncellenemedi."
      );
    } finally {
      setAdminSaving(false);
    }
  };

  const StatusPill = ({ tone = "neutral", label }) => {
    const cls =
      tone === "ok"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/15 dark:text-emerald-200"
        : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
        : tone === "bad"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/15 dark:text-red-200"
        : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";

    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
        {label}
      </span>
    );
  };

  const SoftCard = ({ title, subtitle, right, children }) => (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* =========================================================
          ✅ KURUMSAL STICKY HEADER (logo her zaman açık)
         ========================================================= */}
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Yönetim Kurulu • Karar Detayı
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Kararlar kurumsal kayıt esaslarına uygun şekilde yönetilir ve
              arşivlenir.
            </span>
            <button
              type="button"
              onClick={() => router.push("/YonetimKurulu")}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              ← Listeye Dön
            </button>
          </div>
        </div>
      </div>

      {/* içerik */}
      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-6">
        {/* üst mini bar */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusPill
              tone={duzenlemeAcikMi ? "ok" : "bad"}
              label={duzenlemeAcikMi ? "Düzenleme Açık" : "Düzenleme Kapalı"}
            />
            <StatusPill
              tone={data?.nihaiSonuc ? "neutral" : "warn"}
              label={`Nihai: ${data?.nihaiSonuc ?? "-"}`}
            />
          </div>

          <div className="text-right text-[11px] text-zinc-500 dark:text-zinc-400">
            {personel ? (
              <>
                <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {safeText(personel.ad)} {safeText(personel.soyad)}
                </div>
                <div className="text-[10px]">Rol: {personel.rol}</div>
              </>
            ) : null}
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[12px] text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Yükleniyor...
          </div>
        )}

        {err && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {err}
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            {/* SOL */}
            <div className="lg:col-span-8 space-y-3">
              <SoftCard
                title="Karar Detayı"
                subtitle={`${data.site?.ad ? `${data.site.ad} • ` : ""}${formatTR(data.tarih)}`}
                right={
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Karar No:
                      <span className="ml-1 font-semibold text-zinc-900 dark:text-zinc-100">
                        #{data.id}
                      </span>
                    </div>
                    
                  </div>
                }
              >
                <div className="text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {safeText(data.kararKonusu)}
                </div>

                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  <div className="whitespace-pre-wrap">
                    {safeText(data.kararAciklamasi)}
                  </div>
                </div>
              </SoftCard>

              {/* Yetki uyarıları */}
              {personel && !isRol11 && !isRol90 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800 shadow-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                  Bu ekranda oy/düşünce girişi sadece <b>rol 11</b>, yönetici
                  işlemleri sadece <b>rol 90</b>.
                </div>
              )}

              {isRol11 && !myOnerenKaydi && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800 shadow-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                  Bu karar için “söz sahibi üye” listesinde değilsin. Oy/düşünce
                  giremezsin.
                </div>
              )}

              {isRol11 && myOnerenKaydi && !duzenlemeAcikMi && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                  Düzenleme kapalı olduğu için şu an oy/düşünce girişi kapalı.
                </div>
              )}

              {/* Rol11 form */}
              {canEdit && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  {/* Başlık */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Karar Düşüncen
                    </div>
                    
                  </div>

                  {/* Form alanı */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Seçim */}
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                        Seçim
                      </label>
                      <select
                        value={secim}
                        onChange={(e) => setSecim(e.target.value)}
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[12px]
                     outline-none transition
                     focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
                     dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100
                     dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                      >
                        <option value="">Seçiniz...</option>
                        {OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Açıklama */}
                    <div>
                      <label
                        htmlFor="aciklama"
                        className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300"
                      >
                        Açıklama (opsiyonel)
                      </label>

                      <input
                        id="aciklama"
                        type="text"
                        value={aciklama ?? ""}
                        onChange={(e) => setAciklama(e.target.value)}
                        placeholder="Kısa not..."
                        autoComplete="off"
                        className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-[12px] text-zinc-900
                     outline-none transition
                     focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200
                     dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100
                     dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Aksiyonlar */}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={handleKaydet}
                      disabled={saving}
                      className="h-10 rounded-md bg-zinc-900 px-4 text-[12px] font-semibold text-white
                   shadow-sm transition hover:bg-zinc-800 active:scale-[0.99]
                   disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </button>

                    {saveMsg && (
                      <div
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-700
                        dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        {saveMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Söz sahibi üyeler */}
              {Array.isArray(data.onerenKisiler) &&
                data.onerenKisiler.length > 0 && (
                  <SoftCard
                    title="Söz Sahibi Üyeler"
                    subtitle="Üyelerin seçimi ve açıklamaları bu kararın kayıt sürecinin parçasıdır."
                  >
                    <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                      {data.onerenKisiler.map((o) => {
                        const isMe =
                          Number(o.personelId) === Number(personel?.id);
                        const dusunce = o.kararDusuncesi ?? "-";

                        return (
                          <div key={o.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="truncate text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                                    {o.personel?.ad ?? "-"}{" "}
                                    {o.personel?.soyad ?? ""}
                                  </div>
                                  {isMe ? (
                                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                      SEN
                                    </span>
                                  ) : null}
                                </div>

                                {o.kararDusunceAciklamasi ? (
                                  <div className="mt-1 text-[11px] text-zinc-700 dark:text-zinc-200">
                                    {o.kararDusunceAciklamasi}
                                  </div>
                                ) : (
                                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Açıklama yok
                                  </div>
                                )}
                              </div>

                              <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                                {dusunce}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SoftCard>
                )}
            </div>

            {/* SAĞ: Yönetici paneli */}
            <div className="lg:col-span-4 space-y-3">
              {isRol90 ? (
                <SoftCard
                  title="Yönetici Paneli"
                  subtitle="Düzenleme durumu ve nihai sonuç yalnızca rol 90 tarafından yönetilir."
                  right={
                    <button
                      type="button"
                      disabled={adminSaving}
                      onClick={handleToggleDuzenleme}
                      className={`h-10 rounded-md px-3 text-[12px] font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60 ${
                        duzenlemeAcikMi
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {adminSaving
                        ? "İşleniyor..."
                        : duzenlemeAcikMi
                          ? "Düzenlemeyi Kapat"
                          : "Düzenlemeyi Aç"}
                    </button>
                  }
                >
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                        Nihai Sonuç
                      </label>
                      <select
                        value={nihaiSelect}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNihaiSelect(v);
                          if (v) setNihai("");
                        }}
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[12px] shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                      >
                        <option value="">Seçiniz...</option>
                        {NIHAI_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                     
                    </div>

                    <button
                      type="button"
                      disabled={adminSaving}
                      onClick={handleUpdateNihai}
                      className="h-10 w-full rounded-md bg-indigo-600 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
                    >
                      {adminSaving ? "Kaydediliyor..." : "Nihai Sonucu Kaydet"}
                    </button>

                    {adminMsg ? (
                      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                        {adminMsg}
                      </div>
                    ) : null}
                  </div>
                </SoftCard>
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-[12px] text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Yönetici Paneli
                  </div>
                
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}
