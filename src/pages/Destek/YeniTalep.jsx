import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import TicketDosyaPanel from "@/components/TicketDosyaPanel";

const DEPARTMAN_OPTIONS = [
  "Ortak Alan - Tesis",
  "Arıza - Sorun Bildirimi",
  "Ortak Alan - Tesis Öneri",
  "Bireysel Ekstre - Bakiye Talebi",
  "Yönetimsel Konular Talep - İleti - Öneri",
  "Daire İçi Bireysel Teknik Destek Talebi",
  "Daire içi Temizlik Hizmeti Talebi",
];

const BLOK_OPTIONS = ["1C", "2B", "3D", "4A", "5E", "6J", "7F", "8I", "9G", "10H"];

const FIYAT_LISTESI_URL =
  "https://eosyonetim.com/uploads/tickets/file/Yeni%20Tepe%20Etap%201%20BI%CC%87REYSEL%20TALEPLERI%CC%87NI%CC%87Z%20I%CC%87C%CC%A7I%CC%87N%20EOS%20TEKNI%CC%87K%20FI%CC%87YAT%20LI%CC%87STESI%CC%87DI%CC%87R.pdf";

function safeTrim(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function toUpperTR(s) {
  return String(s ?? "").trim().toLocaleUpperCase("tr-TR");
}

function normalizeTel(telRaw) {
  const digits = String(telRaw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return digits;
  return digits;
}

function extractBackendMsg(err) {
  const data = err?.response?.data;
  if (!data) return null;

  if (data?.errors && typeof data.errors === "object") {
    const flat = Object.entries(data.errors)
      .flatMap(([k, arr]) => (Array.isArray(arr) ? arr.map((x) => `${k}: ${x}`) : []))
      .slice(0, 10);
    if (flat.length) return flat.join(" | ");
  }

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;
  if (data?.title) return data.title;

  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

export default function YeniTicketPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState("");

  const selectedSite = useMemo(
    () => sites.find((s) => String(s.id) === String(siteId)) || null,
    [sites, siteId]
  );

  const [form, setForm] = useState({
    departman: "",
    blok: "",
    daire: "",
    adSoyad: "",
    eposta: "",
    tel: "",
    konu: "",
    aciklama: "",
    not_1: "",
    not_2: "",
    not_3: "",
  });

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [createdTicketId, setCreatedTicketId] = useState(null);
  const [createdTicketNo, setCreatedTicketNo] = useState(null);

  const [panelStatus, setPanelStatus] = useState({
    uploading: false,
    attaching: false,
    pendingCount: 0,
    hasTicketId: false,
  });

  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      try {
        setSitesLoading(true);
        setSitesError("");

        const res = await getDataAsync("destek-talep-ticket/aktif-siteler");
        if (cancelled) return;

        const arr = Array.isArray(res) ? res : res ? [res] : [];
        const mapped = arr
          .map((x) => ({
            id: Number(x?.id ?? x?.Id ?? 0),
            ad: String(x?.ad ?? x?.Ad ?? "").trim(),
          }))
          .filter((x) => x.id > 0 && x.ad);

        setSites(mapped);
      } catch (e) {
        console.error("SITE LIST ERROR:", e);
        if (cancelled) return;
        setSites([]);
        setSitesError(extractBackendMsg(e) || e?.message || "Siteler alınamadı.");
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
  }, []);

  const telStartsWithZero = useMemo(() => {
    const rawDigits = String(form.tel ?? "").replace(/\D/g, "");
    if (!rawDigits) return true;
    return rawDigits.startsWith("0");
  }, [form.tel]);

  const showTelZeroWarn = useMemo(() => {
    const rawDigits = String(form.tel ?? "").replace(/\D/g, "");
    return rawDigits.length > 0 && !rawDigits.startsWith("0");
  }, [form.tel]);

  const validate = () => {
    if (!siteId) return "Proje (Site) seçmelisin.";
    if (!String(form.departman || "").trim()) return "Departman seçmelisin.";
    if (!String(form.blok || "").trim()) return "Blok zorunlu.";
    if (!String(form.daire || "").trim()) return "Daire zorunlu.";
    if (!String(form.adSoyad || "").trim()) return "Ad Soyad zorunlu.";
    if (!String(form.eposta || "").trim()) return "E-posta zorunlu.";
    if (!String(form.tel || "").trim()) return "Telefon zorunlu.";

    const telNorm = normalizeTel(form.tel);
    if (!telNorm) return "Telefon zorunlu.";
    if (!telStartsWithZero) return "Telefon numarası 0 ile başlamalıdır. (Örn: 05xx...)";
    if (telNorm.length < 10) return "Telefon numarası eksik görünüyor.";

    if (!String(form.konu || "").trim()) return "Konu zorunlu.";
    if (!String(form.aciklama || "").trim()) return "Açıklama zorunlu.";

    return null;
  };

  const buildPayload = () => {
    const telDigits = String(form.tel ?? "").replace(/\D/g, "");
    return {
      siteId: siteId ? Number(siteId) : null,
      departman: safeTrim(form.departman),
      blok: safeTrim(form.blok),
      daire: safeTrim(form.daire),
      adSoyad: safeTrim(toUpperTR(form.adSoyad)),
      eposta: safeTrim(form.eposta),
      tel: safeTrim(telDigits),
      konu: safeTrim(form.konu),
      aciklama: safeTrim(form.aciklama),
      tarihUtc: null,
      not_1: safeTrim(form.not_1),
      not_2: safeTrim(form.not_2),
      not_3: safeTrim(form.not_3),
    };
  };

  const showSuccess = !!createdTicketId;

  useEffect(() => {
    if (!createdTicketId) return;

    const done =
      !panelStatus.uploading &&
      !panelStatus.attaching &&
      (panelStatus.pendingCount || 0) === 0;

    setAllDone(done);
  }, [createdTicketId, panelStatus.uploading, panelStatus.attaching, panelStatus.pendingCount]);

  const onSubmit = async (e) => {
    e.preventDefault();

    const v = validate();
    if (v) return setMsg(v);

    try {
      setSaving(true);
      setMsg(null);

      const created = await postDataAsync("destek-talep-ticket", buildPayload());

      const id = created?.id ?? created?.Id ?? null;
      const ticketNo = created?.ticketNo ?? created?.TicketNo ?? null;

      if (!id) throw new Error("Ticket oluşturuldu ama id dönmedi.");

      setCreatedTicketId(Number(id));
      setCreatedTicketNo(ticketNo != null ? String(ticketNo) : null);
    } catch (err) {
      console.error("CREATE TICKET ERROR:", err);

      const backendMsg = extractBackendMsg(err);
      const status = err?.response?.status;

      if (status === 401) setMsg("Yetkisiz (401). Ticket endpoint token istiyor olabilir.");
      else if (status === 403) setMsg("Erişim reddedildi (403). Endpoint yetki istiyor olabilir.");
      else setMsg(backendMsg || err?.message || "Ticket oluşturulurken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const disabledAll = saving || showSuccess || sitesLoading;

  const visibleTicketNo = createdTicketNo || (createdTicketId != null ? String(createdTicketId) : "");

  const copyTicketNo = async () => {
    const v = String(visibleTicketNo || "");
    if (!v) return;

    try {
      await navigator.clipboard.writeText(v);
      setMsg("Ticket No kopyalandı ✅");
      setTimeout(() => setMsg(null), 1500);
    } catch {
      setMsg("Kopyalanamadı. Ticket No: " + v);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 sm:px-6 dark:bg-zinc-950 dark:text-zinc-50">
      {showSuccess && (
        <div className="fixed left-0 right-0 top-3 z-50 mx-auto w-[min(780px,calc(100%-24px))]">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
            <div className="font-semibold">Destek Talebiniz Oluşturuldu ✅</div>

            <div className="mt-1 text-[12px]">
              <span className="font-semibold">Talep No:</span>{" "}
              <span className="rounded-md bg-white/70 px-2 py-[2px] font-bold dark:bg-black/20">
                {visibleTicketNo}
              </span>
              <button
                type="button"
                onClick={copyTicketNo}
                className="ml-2 rounded-md border border-emerald-300 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100 dark:hover:bg-emerald-900/20"
              >
                Kopyala
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="ml-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                title="Ana sayfaya dön"
              >
                Ana Sayfa
              </button>
            </div>

            <div className="mt-2 text-[12px] text-emerald-900/90 dark:text-emerald-100/90">
              <b>Bunu kaydetmeyi unutmayın.</b> Bu Talep No üzerinden talebinize ulaşabilirsiniz.
            </div>

            <div className="mt-2 text-[12px]">
              {panelStatus.uploading || panelStatus.attaching || panelStatus.pendingCount > 0 ? (
                <span>
                  Dosyalar ticket&apos;a bağlanıyor...{" "}
                  {panelStatus.pendingCount > 0 ? (
                    <span className="opacity-90">(bekleyen: {panelStatus.pendingCount})</span>
                  ) : null}
                </span>
              ) : (
                <span className="font-semibold">Dosyalar eklendi ✅</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="relative h-14 w-48">
            <Image src="/eos_management_logo.png" alt="EOS Yönetim" fill className="object-contain" priority />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Destek Talep Formu</h1>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Talebinizi iletin, ekibimiz en kısa sürede dönüş sağlayacaktır.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.push("/Destek/Giris")}
            className="group w-full rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-1 py-1 text-left text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_34px_rgba(37,99,235,0.28)] focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                
                <div className="mt-1 text-base font-semibold sm:text-lg">
                  Mevcut talebinizi görüntülemek için giriş yapın
                </div>
                
              </div>

              <div className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-[12px] font-semibold text-white backdrop-blur-sm transition group-hover:bg-white/20">
                Talep Girişi →
              </div>
            </div>
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Site (Proje) *">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={disabledAll}
              >
                <option value="">{sitesLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>

              {sitesError ? (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {sitesError}
                </div>
              ) : null}

              {selectedSite && (
                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200">
                  <div className="font-semibold">Bireysel Talepleriniz için EOS Teknik Fiyat Listesi</div>
                  <div className="mt-2">
                    <a
                      href={FIYAT_LISTESI_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-black transition hover:bg-zinc-200 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                    >
                      Fiyat Listesi
                    </a>
                  </div>
                </div>
              )}
            </Field>

            <Field label="Departman *">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.departman}
                onChange={(e) => setField("departman", e.target.value)}
                disabled={disabledAll}
              >
                <option value="">Seçiniz</option>
                {DEPARTMAN_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Blok *">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.blok}
                onChange={(e) => setField("blok", e.target.value)}
                disabled={disabledAll}
              >
                <option value="">Seçiniz</option>
                {BLOK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Daire *">
              <input
                type="number"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.daire}
                onChange={(e) => setField("daire", e.target.value)}
                placeholder="Örn: 12"
                min="1"
                disabled={disabledAll}
              />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Ad Soyad *">
              <input
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.adSoyad}
                onChange={(e) => setField("adSoyad", e.target.value)}
                onBlur={() => setField("adSoyad", toUpperTR(form.adSoyad))}
                placeholder="Örn: Ahmet Yılmaz"
                disabled={disabledAll}
              />
            </Field>

            <Field label="Telefon *">
              <>
                <input
                  inputMode="tel"
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 dark:bg-zinc-950 ${
                    showTelZeroWarn
                      ? "border-amber-400 focus:ring-amber-500 dark:border-amber-700 dark:focus:ring-amber-400"
                      : "border-zinc-200 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:ring-zinc-50"
                  }`}
                  value={form.tel}
                  onChange={(e) => setField("tel", e.target.value)}
                  placeholder="05xx..."
                  disabled={disabledAll}
                />

                {showTelZeroWarn ? (
                  <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    Telefon numarası 0 ile başlamalıdır. Örn: 05xx...
                  </div>
                ) : null}
              </>
            </Field>

            <Field label="E-posta *">
              <input
                inputMode="email"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.eposta}
                onChange={(e) => setField("eposta", e.target.value)}
                placeholder="ornek@mail.com"
                disabled={disabledAll}
              />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field label="Konu *">
              <input
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.konu}
                onChange={(e) => setField("konu", e.target.value)}
                placeholder="Örn: Su kaçağı"
                disabled={disabledAll}
              />
            </Field>

            <Field label="Açıklama *">
              <textarea
                rows={6}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={form.aciklama}
                onChange={(e) => setField("aciklama", e.target.value)}
                placeholder="Detaylı açıklama..."
                disabled={disabledAll}
              />
            </Field>
          </div>

          <TicketDosyaPanel
            ticketId={createdTicketId}
            onStatusChange={setPanelStatus}
            disabled={saving || showSuccess}
          />

          {msg && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {msg}
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="submit"
              disabled={saving || showSuccess}
              className="w-full rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 sm:w-auto dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              {saving ? "Gönderiliyor..." : showSuccess ? "Ticket Oluşturuldu" : "Talep Oluştur"}
            </button>
          </div>

          {showSuccess && allDone ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Talebiniz alındı. Ticket No: <b>{visibleTicketNo}</b>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</div>
      {children}
    </label>
  );
}