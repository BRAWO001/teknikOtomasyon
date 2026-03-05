// pages/Destek/TalepDetay/[token].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import TicketDosyaPanelV2 from "@/components/TicketDosyaPanelV2";

/* =========================
   helpers
========================= */
function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}
function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return safeText(iso);
  }
}
function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
}
function normalizeTicket(res) {
  return res?.ticket ?? res?.Ticket ?? null;
}
function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (res?.items && Array.isArray(res.items)) return res.items;
  if (res?.Items && Array.isArray(res.Items)) return res.Items;
  return [];
}
function upperTR(s) {
  return String(s ?? "")
    .replace(/i/g, "İ")
    .toUpperCase();
}

const DURUM_OPTIONS = ["Devam Ediyor", "Beklemede", "Kapalı"];

export default function TalepDetayPage() {
  const router = useRouter();
  const token = useMemo(
    () => String(router.query.token || "").trim(),
    [router.query.token]
  );

  // auth/cookie
  const [personel, setPersonel] = useState(null);
  const isPersonel = !!personel;

  // data
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ticket, setTicket] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);

  // ui
  const [toast, setToast] = useState("");
  const [durumSaving, setDurumSaving] = useState(false);
  const [yorumSaving, setYorumSaving] = useState(false);

  // forms
  const [newYorum, setNewYorum] = useState("");
  const [selectedDurum, setSelectedDurum] = useState("");

  const showToast = (m) => {
    setToast(m);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1500);
  };

  /* ================
     cookie oku
  ================= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const c = getClientCookie("PersonelUserInfo");
      if (!c) return setPersonel(null);
      setPersonel(JSON.parse(c));
    } catch {
      setPersonel(null);
    }
  }, []);

  /* ================
     load detail
  ================= */
  const loadDetail = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setErr("");

      const res = await getDataAsync(
        `destek-talep-ticket/token/${encodeURIComponent(token)}`
      );

      const t = normalizeTicket(res);
      if (!t) {
        setTicket(null);
        setYorumlar([]);
        setErr("Ticket verisi dönmedi.");
        return;
      }

      setTicket(t);

      const fromResYorumlar = normalizeList(res?.yorumlar ?? res?.Yorumlar);
      setYorumlar(fromResYorumlar);

      const durum = pickAny(t, "durum", "Durum", "not_1", "Not_1") || "";
      setSelectedDurum(String(durum || "").trim());
    } catch (e) {
      console.error("TOKEN DETAIL ERROR:", e);
      const status = e?.response?.status;
      if (status === 404)
        setErr(e?.response?.data?.message || "Ticket bulunamadı.");
      else setErr(e?.response?.data?.message || e?.message || "Detay alınamadı.");
      setTicket(null);
      setYorumlar([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  /* ================
     actions
  ================= */
  const onUpdateDurum = async () => {
    if (!token) return;
    if (!isPersonel) return showToast("Durum güncelleme sadece personel için.");

    const d = String(selectedDurum || "").trim();
    if (!d) return showToast("Durum seçmelisin.");

    try {
      setDurumSaving(true);
      await postDataAsync(
        `destek-talep-ticket/durum/${encodeURIComponent(token)}`,
        { durum: d }
      );
      showToast("Durum güncellendi ✅");
      await loadDetail();
    } catch (e) {
      console.error("DURUM UPDATE ERROR:", e);
      showToast(e?.response?.data?.message || e?.message || "Durum güncellenemedi.");
    } finally {
      setDurumSaving(false);
    }
  };

  const onAddYorum = async () => {
    if (!token) return;

    const yorum = String(newYorum || "").trim();
    if (!yorum) return showToast("Yorum yazmalısın.");

    let adSoyad = "";
    let rol = "";

    if (isPersonel) {
      const ad = pickAny(personel, "ad", "Ad") ?? "";
      const soyad = pickAny(personel, "soyad", "Soyad") ?? "";
      adSoyad = `${ad} ${soyad}`.trim();
      rol = String(pickAny(personel, "rol", "Rol") ?? "Personel").trim();
      if (!adSoyad) return showToast("Cookie personel adı boş.");
    } else {
      const tAdSoyad = pickAny(ticket, "adSoyad", "AdSoyad") ?? "";
      adSoyad = String(tAdSoyad || "").trim();
      rol = "Kat Maliki";
      if (!adSoyad) return showToast("Ticket üzerinde ad soyad yok.");
    }

    try {
      setYorumSaving(true);

      await postDataAsync(
        `destek-talep-ticket/token/${encodeURIComponent(token)}/yorum`,
        {
          adSoyad: upperTR(adSoyad),
          rol: String(rol || "").trim(),
          yorum,
        }
      );

      setNewYorum("");
      showToast("Yorum eklendi ✅");
      await loadDetail();
    } catch (e) {
      console.error("ADD YORUM ERROR:", e);
      showToast(e?.response?.data?.message || e?.message || "Yorum eklenemedi.");
    } finally {
      setYorumSaving(false);
    }
  };

  const disabledAll = loading || !token;

  const ticketNo = safeText(pickAny(ticket, "ticketNo", "TicketNo"));
  const tarih = formatTR(pickAny(ticket, "tarihUtc", "TarihUtc"));

  const siteAd = safeText(pickAny(ticket, "siteAd", "SiteAd"));
  const departman = safeText(pickAny(ticket, "departman", "Departman"));
  const blok = safeText(pickAny(ticket, "blok", "Blok"));
  const daire = safeText(pickAny(ticket, "daire", "Daire"));
  const adSoyadTicket = safeText(pickAny(ticket, "adSoyad", "AdSoyad"));
  const tel = safeText(pickAny(ticket, "tel", "Tel"));
  const eposta = safeText(pickAny(ticket, "eposta", "Eposta"));
  const konu = safeText(pickAny(ticket, "konu", "Konu"));
  const aciklama = safeText(pickAny(ticket, "aciklama", "Aciklama"));
  const durum = safeText(pickAny(ticket, "durum", "Durum", "not_1", "Not_1"));

  const ticketId = Number(pickAny(ticket, "id", "Id")) || 0;

  // Excel gibi satırlar (label/value)
  const rows = [
    ["Talep No", ticketNo],
    ["Tarih", tarih],
    ["Durum", durum],
    ["Departman", departman],
    ["Proje", siteAd],
    ["Blok", blok],
    ["Daire", daire],
    ["Ad Soyad", adSoyadTicket],
    ["Telefon", tel],
    ["E-posta", eposta],
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:p-5">
      {/* toast */}
      {toast ? (
        <div className="fixed left-0 right-0 top-3 z-50 mx-auto w-[calc(100%-18px)] sm:w-[calc(100%-40px)]">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[12px] font-semibold shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {toast}
          </div>
        </div>
      ) : null}

      {/* ✅ Tam genişlik rapor header */}
      <div className="w-full">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-28 sm:h-9 sm:w-32">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Yönetim"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="leading-tight">
              <div className="text-[12px] font-extrabold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Talep Raporu
              </div>
            </div>

            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-extrabold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  isPersonel ? "bg-emerald-500" : "bg-amber-500",
                ].join(" ")}
              />
              {isPersonel ? "PERSONEL" : "KAT MALİKİ"}
            </span>

            {!isPersonel ? (
              <span className="hidden sm:inline text-[11px] text-zinc-500 dark:text-zinc-400">
                • {adSoyadTicket}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDetail()}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
              disabled={disabledAll}
              title="Yenile"
            >
              Yenile
            </button>
            <button
              onClick={() => router.push("/")}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
            >
              Anasayfa
            </button>
            <button
              onClick={() => router.back()}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
            >
              ← Geri
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Yükleniyor...
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </div>
        ) : !ticket ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Kayıt yok.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[520px_1fr]">
            {/* ✅ SOL: Yorumlar EN ÜST + Yazma alanı */}
            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-extrabold">Notlar</div>
                  </div>

                  {!isPersonel ? (
                    <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-extrabold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                      Kat Maliki: {adSoyadTicket}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-extrabold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                      {safeText(pickAny(personel, "ad", "Ad"))}{" "}
                      {safeText(pickAny(personel, "soyad", "Soyad"))} •{" "}
                      {safeText(pickAny(personel, "rol", "Rol"))}
                    </span>
                  )}
                </div>
              </div>

              {/* yorum yaz */}
              <div className="px-4 py-3">
                <div className="grid gap-2">
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] outline-none dark:border-zinc-800 dark:bg-zinc-950"
                    value={newYorum}
                    onChange={(e) => setNewYorum(e.target.value)}
                    placeholder="Yeni Not..."
                    disabled={yorumSaving || disabledAll}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {isPersonel ? "Personel Not ekleme." : "Kat Maliki Notu."}
                    </div>
                    <button
                      type="button"
                      onClick={onAddYorum}
                      disabled={yorumSaving || disabledAll || !newYorum.trim()}
                      className="h-9 rounded-xl bg-emerald-600 px-4 text-[12px] font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {yorumSaving ? "Gönderiliyor..." : "Yorum Gönder"}
                    </button>
                  </div>
                </div>
              </div>

              {/* yorum listesi (en yeni üstte) */}
              <div className="border-t border-zinc-200 px-2 py-2 dark:border-zinc-800">
                {yorumlar.length === 0 ? (
                  <div className="px-2 py-3 text-[12px] text-zinc-500 dark:text-zinc-400">
                    Henüz Not yok.
                  </div>
                ) : (
                  [...yorumlar]
                    .slice()
                    .reverse()
                    .map((y) => {
                      const id = pickAny(y, "id", "Id") ?? Math.random();
                      const adSoyad = safeText(
                        pickAny(y, "adSoyad", "AdSoyad"),
                      );
                      const rol = safeText(pickAny(y, "rol", "Rol"));
                      const yorum = safeText(pickAny(y, "yorum", "Yorum"));
                      const dt = formatTR(
                        pickAny(y, "olusturmaTarihiUtc", "OlusturmaTarihiUtc"),
                      );

                      return (
                        <div
                          key={String(id)}
                          className="mx-2 mb-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[12px] dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate font-extrabold">
                                {adSoyad}{" "}
                                <span className="ml-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                                  {rol}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 text-[10px] text-zinc-500 dark:text-zinc-400">
                              {dt}
                            </div>
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-[12px] text-zinc-800 dark:text-zinc-100">
                            {yorum}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </section>

            {/* ✅ SAĞ: Bilgi + Dosya rapor blokları */}
            <div className="space-y-3">
              {/* Bilgiler (Excel gibi) */}
              <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-extrabold">
                        Talep Bilgileri
                      </div>
                    </div>

                    {/* durum güncelleme (personel) */}
                    {isPersonel ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="h-9 rounded-xl border border-zinc-200 bg-white px-2 text-[12px] font-semibold outline-none dark:border-zinc-800 dark:bg-zinc-950"
                          value={selectedDurum}
                          onChange={(e) => setSelectedDurum(e.target.value)}
                          disabled={durumSaving || loading}
                        >
                          <option value="">Durum seç</option>
                          {DURUM_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={onUpdateDurum}
                          disabled={durumSaving || loading || !selectedDurum}
                          className="h-9 rounded-xl bg-zinc-900 px-3 text-[12px] font-extrabold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                        >
                          {durumSaving ? "..." : "Kaydet"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="p-2">
                  <div className="grid gap-3 lg:grid-cols-2">
                    {/* =========================
        SOL – Excel Bilgiler
    ========================= */}
                    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                      

                      <div className="grid gap-0">
                        {rows.map(([label, value], i) => {
                          const val = safeText(value);

                          // Durum renkleri
                          const getDurumClass = (v) => {
                            const d = String(v || "").toLowerCase();

                            if (d.includes("devam"))
                              return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700";

                            if (d.includes("bekle"))
                              return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";

                            if (d.includes("kapalı") || d.includes("kapali"))
                              return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";

                            return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
                          };

                          return (
                            <div
                              key={label}
                              className={[
                                "grid grid-cols-[140px_1fr] gap-2 px-3 py-2 text-[12px]",
                                i !== rows.length - 1
                                  ? "border-b border-zinc-200 dark:border-zinc-800"
                                  : "",
                              ].join(" ")}
                            >
                              {/* Label */}
                              <div className="font-extrabold text-zinc-600 dark:text-zinc-300">
                                {label}
                              </div>

                              {/* Value */}
                              <div>
                                {label.toLowerCase().includes("talep no") ? (
                                  <span className="text-[13px] font-black tracking-wide text-zinc-900 dark:text-zinc-100">
                                    {val}
                                  </span>
                                ) : label.toLowerCase().includes("durum") ? (
                                  <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${getDurumClass(
                                      val,
                                    )}`}
                                  >
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-zinc-900 dark:text-zinc-100">
                                    {val}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* =========================
        SAĞ – Konu & Açıklama
    ========================= */}
                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="mb-1 text-[12px] font-extrabold text-zinc-700 dark:text-zinc-300">
                          Konu
                        </div>
                        <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">
                          {safeText(konu)}
                        </div>
                      </div>

                      <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="mb-1 text-[12px] font-extrabold text-zinc-700 dark:text-zinc-300">
                          Açıklama
                        </div>
                        <div className="whitespace-pre-wrap text-[12px] text-zinc-900 dark:text-zinc-100">
                          {safeText(aciklama)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Dosyalar */}
              <TicketDosyaPanelV2
                ticketId={ticketId}
                disabled={disabledAll}
                onChanged={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBlock({ title, value, pre = false }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[11px] font-extrabold text-zinc-600 dark:text-zinc-300">
        {title}
      </div>
      <div
        className={[
          "mt-1 text-[12px] text-zinc-900 dark:text-zinc-100",
          pre ? "whitespace-pre-wrap" : "",
        ].join(" ")}
      >
        {safeText(value)}
      </div>
    </div>
  );
}