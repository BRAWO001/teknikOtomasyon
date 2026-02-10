




// src/pages/YonetimKurulu/ileti/[token].jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const DURUM_OPTIONS = [
  { value: "Beklemede", label: "Beklemede" },
  { value: "Yayında", label: "Yayında" },
  { value: "Kapatıldı", label: "Kapatıldı" },
  { value: "İptal", label: "İptal" },
];

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizePersonel(p) {
  if (!p) return null;
  return {
    id: pick(p, "id", "Id") ?? null,
    ad: pick(p, "ad", "Ad") ?? null,
    soyad: pick(p, "soyad", "Soyad") ?? null,
    rol: pick(p, "rol", "Rol") ?? null,
  };
}

function normalizeSite(s) {
  if (!s) return null;
  return {
    id: pick(s, "id", "Id") ?? null,
    ad: pick(s, "ad", "Ad") ?? null,
  };
}

function normalizeYorum(y) {
  if (!y) return null;
  return {
    id: pick(y, "id", "Id") ?? null,
    iletiModalsId: pick(y, "iletiModalsId", "IletiModalsId") ?? null,
    personelId: pick(y, "personelId", "PersonelId") ?? null,
    personel: normalizePersonel(pick(y, "personel", "Personel")),
    yorum: pick(y, "yorum", "Yorum") ?? "",
    olusturmaTarihiUtc: pick(y, "olusturmaTarihiUtc", "OlusturmaTarihiUtc") ?? null,
  };
}

function normalizeIletiDto(dto) {
  // ✅ Bazı backend versiyonlarında { Ileti, Katilimcilar } döner
  const rawIleti = pick(dto, "ileti", "Ileti") || dto;

  const siteObj = pick(rawIleti, "site", "Site");
  const siteNormalized = siteObj ? normalizeSite(siteObj) : null;

  const yorumlarRaw = pick(rawIleti, "yorumlar", "Yorumlar");
  const yorumlar = Array.isArray(yorumlarRaw) ? yorumlarRaw.map(normalizeYorum).filter(Boolean) : [];

  const normalized = {
    id: pick(rawIleti, "id", "Id") ?? null,
    siteId: pick(rawIleti, "siteId", "SiteId") ?? null,
    site: siteNormalized,
    siteBazliNo: pick(rawIleti, "siteBazliNo", "SiteBazliNo") ?? null,
    tarihUtc: pick(rawIleti, "tarihUtc", "TarihUtc", "tarihUTC", "TarihUTC") ?? null,
    iletiBaslik: pick(rawIleti, "iletiBaslik", "IletiBaslik", "iletiKonusu", "IletiKonusu") ?? null,
    iletiAciklama: pick(rawIleti, "iletiAciklama", "IletiAciklama") ?? null,
    durum: pick(rawIleti, "durum", "Durum") ?? null,
    publicToken: pick(rawIleti, "publicToken", "PublicToken") ?? null,
    sistemUretilmisLink: pick(rawIleti, "sistemUretilmisLink", "SistemUretilmisLink") ?? null,
    duzenlemeDurumu: pick(rawIleti, "duzenlemeDurumu", "DuzenlemeDurumu") ?? false,
    yorumlar,
  };

  // ✅ Katılımcılar gerekiyorsa (wrap’li response)
  const katilimcilarRaw = pick(dto, "katilimcilar", "Katilimcilar");
  const katilimcilar = Array.isArray(katilimcilarRaw)
    ? katilimcilarRaw.map((k) => ({
        id: pick(k, "id", "Id") ?? null,
        iletiModalsId: pick(k, "iletiModalsId", "IletiModalsId") ?? null,
        personelId: pick(k, "personelId", "PersonelId") ?? null,
        personel: normalizePersonel(pick(k, "personel", "Personel")),
      }))
    : null;

  return { ...normalized, katilimcilar };
}

export default function IletiTokenDetayPage() {
  const router = useRouter();
  const { token } = router.query;

  const [personel, setPersonel] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [yorum, setYorum] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const [durumSelect, setDurumSelect] = useState("");
  const [durumCustom, setDurumCustom] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState(null);

  const isRol90 = useMemo(() => Number(personel?.rol) === 90, [personel]);

  const duzenlemeAcikMi = useMemo(() => !!data?.duzenlemeDurumu, [data?.duzenlemeDurumu]);

  const canComment = useMemo(() => {
    return !!personel?.id && duzenlemeAcikMi;
  }, [personel?.id, duzenlemeAcikMi]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      const parsed = JSON.parse(cookie);
      const p = parsed?.personel ?? parsed;
      setPersonel(p || null);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      setPersonel(null);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);

        // ✅ Endpoint doğru ama response casing değişken olabilir => normalize ediyoruz
        const dto = await getDataAsync(`projeYonetimKurulu/ileti/public/${token}`);
        if (cancelled) return;

        const normalized = normalizeIletiDto(dto || {});
        setData(normalized);

        // durum default
        const dStr = normalized?.durum ? String(normalized.durum) : "";
        const known = DURUM_OPTIONS.some((x) => x.value === dStr) ? dStr : "";
        setDurumSelect(known);
        setDurumCustom(known ? "" : dStr);
      } catch (e) {
        console.error("PUBLIC TOKEN GET ERROR:", e);
        if (cancelled) return;
        setErr("İleti detayı alınamadı (token geçersiz olabilir).");
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

  const handleYorumEkle = async () => {
    if (!data?.id) return;
    if (!personel?.id) return;

    if (!canComment) {
      setSaveMsg("Şu an yorumlar kapalı veya yetkin yok.");
      return;
    }

    const y = (yorum || "").trim();
    if (!y) {
      setSaveMsg("Lütfen yorum yazınız.");
      return;
    }

    try {
      setSaving(true);
      setSaveMsg(null);

      const payload = {
        iletiModalsId: Number(data.id),
        personelId: Number(personel.id),
        yorum: y,
      };

      const res = await postDataAsync("projeYonetimKurulu/ileti/yorum", payload);

      const newItem = normalizeYorum({
        Id: res?.id ?? Math.floor(Math.random() * 1e9),
        IletiModalsId: Number(data.id),
        PersonelId: Number(personel.id),
        Personel: { Id: Number(personel.id), Ad: personel.ad, Soyad: personel.soyad, Rol: personel.rol },
        Yorum: y,
        OlusturmaTarihiUtc: res?.olusturmaTarihiUtc ?? new Date().toISOString(),
      });

      setData((prev) => {
        if (!prev) return prev;
        const list = Array.isArray(prev.yorumlar) ? [...prev.yorumlar] : [];
        return { ...prev, yorumlar: [newItem, ...list] };
      });

      setYorum("");
      setSaveMsg("Yorum eklendi.");
    } catch (e) {
      console.error("YORUM POST ERROR:", e);
      const status = e?.response?.status;
      setSaveMsg(status ? `Yorum eklenemedi (HTTP ${status}).` : "Yorum eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDurum = async () => {
    if (!data?.id) return;

    if (!isRol90) {
      setAdminMsg("Bu işlem sadece rol 90 için.");
      return;
    }

    const finalVal = (durumSelect || durumCustom || "").trim();
    const payload = { durum: finalVal ? finalVal : null };

    try {
      setAdminSaving(true);
      setAdminMsg(null);

      const res = await postDataAsync(`projeYonetimKurulu/ileti/${data.id}/durum`, payload);

      const newVal = pick(res, "durum", "Durum") ?? payload.durum;
      setData((prev) => (prev ? { ...prev, durum: newVal } : prev));

      const newStr = newVal ? String(newVal) : "";
      const isKnown = DURUM_OPTIONS.some((x) => x.value === newStr);
      setDurumSelect(isKnown ? newStr : "");
      setDurumCustom(isKnown ? "" : newStr);

      setAdminMsg("Durum güncellendi.");
    } catch (e) {
      console.error("DURUM UPDATE ERROR:", e);
      const status = e?.response?.status;
      setAdminMsg(status ? `Durum güncellenemedi (HTTP ${status}).` : "Durum güncellenemedi.");
    } finally {
      setAdminSaving(false);
    }
  };

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
        iletiId: Number(data.id),
        duzenlemeDurumu: !duzenlemeAcikMi,
      };

      const res = await postDataAsync("projeYonetimKurulu/ileti/duzenleme-durumu", payload);

      const newVal =
        typeof pick(res, "duzenlemeDurumu", "DuzenlemeDurumu") === "boolean"
          ? pick(res, "duzenlemeDurumu", "DuzenlemeDurumu")
          : payload.duzenlemeDurumu;

      setData((prev) => (prev ? { ...prev, duzenlemeDurumu: newVal } : prev));
      setAdminMsg(newVal ? "Yorumlar açıldı." : "Yorumlar kapatıldı.");
    } catch (e) {
      console.error("DUZENLEME DURUMU UPDATE ERROR:", e);
      const status = e?.response?.status;
      setAdminMsg(status ? `Güncellenemedi (HTTP ${status}).` : "Güncellenemedi.");
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
          <div className="text-[12px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</div>
          {subtitle ? <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
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
              <div className="text-sm font-bold tracking-wide">EOS MANAGEMENT</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Yönetim Kurulu • İleti Detayı</div>
            </div>
          </div>

          
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-6">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusPill tone={duzenlemeAcikMi ? "ok" : "bad"} label={duzenlemeAcikMi ? "Yorumlar Açık" : "Yorumlar Kapalı"} />
            
          </div>

          <div className="text-right text-[11px] text-zinc-500 dark:text-zinc-400">
            {personel ? (
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                {safeText(personel.ad)} {safeText(personel.soyad)}
              </div>
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
            <div className="lg:col-span-8 space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                    {data.site?.ad ? `${data.site.ad} • ` : ""}
                    {formatTR(data.tarihUtc)}
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    İleti No:
                    <span className="ml-1 font-semibold text-zinc-900 dark:text-zinc-100">
                      #{typeof data?.siteBazliNo === "number" && data.siteBazliNo > 0 ? ` ${data.siteBazliNo}` : ` ${safeText(data?.id)}`}
                    </span>
                  </div>
                </div>

                <div className="break-words text-[15px] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
                  {safeText(data.iletiBaslik)}
                </div>

                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  <div className="whitespace-pre-wrap break-words">{safeText(data.iletiAciklama)}</div>
                </div>
              </div>

              {/* Yorum yazma (SoftCard YOK) */}
<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
  <div className="mb-3">
    <div className="text-[12px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      Yorum / Görüş Bildir
    </div>
    
  </div>

  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
    <textarea
      value={yorum}
      onChange={(e) => setYorum(e.target.value)}
      placeholder={duzenlemeAcikMi ? "Görüşünüzü yazın..." : "Yorumlar kapalı"}
      disabled={!canComment || saving}
      rows={4}
      className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-relaxed outline-none transition
        focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
        disabled:opacity-60
        dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100
        dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
    />

    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <button
        onClick={handleYorumEkle}
        disabled={!canComment || saving}
        className="h-10 rounded-md bg-zinc-900 px-4 text-[12px] font-semibold text-white
          shadow-sm transition hover:bg-zinc-800 active:scale-[0.99]
          disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "Gönderiliyor..." : "Yorum Gönder"}
      </button>

      {saveMsg ? (
        <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {saveMsg}
        </div>
      ) : (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          
        </div>
      )}
    </div>
  </div>
</div>

{/* Yorum listesi (istersen SoftCard kalsın; istersen bunu da kart yapısına çeviririz) */}
<div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
  <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
    <div className="min-w-0">
      <div className="text-[12px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Yorumlar
      </div>
      <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Toplam: {Array.isArray(data.yorumlar) ? data.yorumlar.length : 0}
      </div>
    </div>
  </div>

  <div className="px-5 py-4">
    {Array.isArray(data.yorumlar) && data.yorumlar.length > 0 ? (
      <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {data.yorumlar.map((y) => {
          const isMe = Number(y.personelId) === Number(personel?.id);

          return (
            <div key={y.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                      {safeText(y.personel?.ad)} {safeText(y.personel?.soyad)}
                    </div>
                    {isMe ? (
                      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        SEN
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 whitespace-pre-wrap break-words text-[12px] text-zinc-700 dark:text-zinc-200">
                    {safeText(y.yorum)}
                  </div>
                </div>

                <div className="shrink-0 text-right text-[10px] text-zinc-500 dark:text-zinc-400">
                  {formatTR(y.olusturmaTarihiUtc)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        Henüz yorum yok.
      </div>
    )}
  </div>
</div>

            </div>

            <div className="lg:col-span-4 space-y-3">
              {isRol90 ? (
                <SoftCard
                  title="Yönetici Paneli"
                  right={
                    <button
                      type="button"
                      disabled={adminSaving}
                      onClick={handleToggleDuzenleme}
                      className={`h-10 rounded-md px-3 text-[12px] font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60 ${
                        duzenlemeAcikMi ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {adminSaving ? "İşleniyor..." : duzenlemeAcikMi ? "Yorumları Kapat" : "Yorumları Aç"}
                    </button>
                  }
                >
                 
                </SoftCard>
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-[12px] text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <div className="mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Yönetim Kurulu İleti Bilgilendirmesi</div>

                  <p className="text-[12px] leading-relaxed">
                    Bu ekranda yer alan iletiler, yönetim kurulu tarafından <b>kurumsal kayıt ve bilgilendirme</b> amacıyla paylaşılır.
                    İletiler ve yorumlar arşivlenir; yetkili kişiler tarafından görüntülenebilir.
                  </p>

                  <p className="mt-2 text-[12px] leading-relaxed">
                    Durum ve yorum yetkileri yalnızca yönetim planında tanımlı <b>yetkili yönetici</b> tarafından yönetilir. Yorumlar
                    şeffaflık ve izlenebilirlik esaslarıyla kayıt altına alınır.
                  </p>

                  <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">EOS Management</p>
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
