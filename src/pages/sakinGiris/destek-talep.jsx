// src/pages/sakinGiris/destek-talep.jsx

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { roleGuard } from "@/utils/roleGuard";
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


export async function getServerSideProps(ctx) {
  const guardResult = await roleGuard(ctx, {
    allow: [77],
    redirectTo: "/sakinGiris",
  });

  if (guardResult?.redirect || guardResult?.notFound) {
    return guardResult;
  }

  return {
    props: {
      ...(guardResult?.props || {}),
    },
  };
}

function extractBackendMsg(err) {
  const data = err?.response?.data;

  if (!data) return err?.message || null;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;
  if (data?.title) return data.title;

  if (data?.errors && typeof data.errors === "object") {
    return Object.entries(data.errors)
      .flatMap(([key, values]) =>
        Array.isArray(values)
          ? values.map((value) => `${key}: ${value}`)
          : []
      )
      .join(" | ");
  }

  return null;
}

function text(value, fallback = "-") {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function getDaireLabel(item) {
  const daire = item?.daire || {};
  const iliski = item?.iliski || {};

  const bolum =
    text(daire.bagimsizBolumNo, "") ||
    text(daire.daireNo, "") ||
    `Bölüm ${text(daire.id)}`;

  const parts = [
    text(daire.blokAdi, ""),
    daire.katNo ? `Kat ${daire.katNo}` : "",
    daire.daireNo ? `Daire ${daire.daireNo}` : "",
    iliski.iliskiTipAd ? `(${iliski.iliskiTipAd})` : "",
  ].filter(Boolean);

  return {
    title: bolum,
    detail: parts.join(" • ") || text(daire.adres),
  };
}

function ReadonlyInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-800">
        {text(value)}
      </div>
    </div>
  );
}

export default function DestekTalepPage() {
  const router = useRouter();

  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState("");
  const [context, setContext] = useState(null);

  const [selectedDaireId, setSelectedDaireId] = useState("");
  const [form, setForm] = useState({
    departman: "",
    konu: "",
    aciklama: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [createdTicket, setCreatedTicket] = useState(null);

  const [panelStatus, setPanelStatus] = useState({
    uploading: false,
    attaching: false,
    pendingCount: 0,
    hasTicketId: false,
  });

  useEffect(() => {
    let cancelled = false;

    const loadContext = async () => {
      try {
        setContextLoading(true);
        setContextError("");

        const data = await getDataAsync("AppProjeDestekTicket/context");

        if (cancelled) return;

        const relations = Array.isArray(data?.daireIliskileri)
          ? data.daireIliskileri
          : [];

        setContext({
          ...data,
          daireIliskileri: relations,
        });

        const defaultId =
          Number(data?.varsayilanDaireMeskenBolumId || 0) ||
          Number(relations?.[0]?.daire?.id || 0);

        setSelectedDaireId(defaultId > 0 ? String(defaultId) : "");
      } catch (err) {
        console.error("DESTEK CONTEXT ERROR:", err);

        if (!cancelled) {
          const status = err?.response?.status;

          if (status === 401 || status === 403) {
            setContextError(
              "Oturum bilgisi doğrulanamadı. Lütfen yeniden giriş yapın."
            );
          } else {
            setContextError(
              extractBackendMsg(err) ||
                "Kullanıcı ve bağımsız bölüm bilgileri alınamadı."
            );
          }
        }
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    };

    loadContext();

    return () => {
      cancelled = true;
    };
  }, []);

  const relations = context?.daireIliskileri || [];
  const user = context?.kullanici || {};

  const selectedRelation = useMemo(
    () =>
      relations.find(
        (item) => Number(item?.daire?.id) === Number(selectedDaireId)
      ) || null,
    [relations, selectedDaireId]
  );

  const selectedDaire = selectedRelation?.daire || null;
  const selectedRelationInfo = selectedRelation?.iliski || null;

  const fullName = useMemo(() => {
    const backendFullName = text(user?.adSoyad, "");
    if (backendFullName) return backendFullName;

    const name = [user?.adi, user?.soyadi]
      .map((value) => text(value, ""))
      .filter(Boolean)
      .join(" ");

    return name || text(user?.firmaAdi, "Sakin Kullanıcı");
  }, [user]);

  const setField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validate = () => {
    if (!selectedDaireId) return "Talep oluşturulacak bölümü seçmelisiniz.";
    if (!form.departman.trim()) return "Departman seçmelisiniz.";
    if (!form.konu.trim()) return "Konu zorunludur.";
    if (!form.aciklama.trim()) return "Açıklama zorunludur.";
    return null;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validate();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    if (panelStatus.uploading) {
      setMessage("Dosyaların yüklenmesi tamamlanmadan talebi gönderemezsiniz.");
      return;
    }

    if (panelStatus.attaching) {
      setMessage("Dosyalar talebe bağlanıyor. İşlem tamamlanınca tekrar deneyin.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const body = new FormData();

      body.append("DaireMeskenBolumId", String(selectedDaireId));
      body.append("Departman", form.departman.trim());
      body.append("Konu", form.konu.trim());
      body.append("Aciklama", form.aciklama.trim());

      const response = await postDataAsync(
        "AppProjeDestekTicket",
        body,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const ticket = response?.ticket || {};
      const id = ticket?.id ?? ticket?.Id ?? null;
      const ticketNo =
        ticket?.ticketNo ??
        ticket?.TicketNo ??
        response?.ticketNo ??
        response?.TicketNo ??
        id;

      setCreatedTicket({
        id,
        ticketNo,
        token: ticket?.token ?? ticket?.Token ?? null,
      });

      setMessage("Destek talebiniz başarıyla oluşturuldu.");
    } catch (err) {
      console.error("DESTEK CREATE ERROR:", err);

      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        setMessage(
          "Oturum süreniz dolmuş olabilir. Lütfen yeniden giriş yapın."
        );
      } else {
        setMessage(
          extractBackendMsg(err) ||
            "Destek talebi oluşturulurken bir hata oluştu."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const copyTicketNo = async () => {
    const ticketNo = String(createdTicket?.ticketNo || "");
    if (!ticketNo) return;

    try {
      await navigator.clipboard.writeText(ticketNo);
      setMessage("Talep numarası kopyalandı.");
    } catch {
      setMessage(`Talep numarası: ${ticketNo}`);
    }
  };

  const disabled = saving || Boolean(createdTicket);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex flex-col items-center gap-3">
          <div className="relative h-14 w-48">
            <Image
              src="/eos_management_logo.png"
              alt="EOS Yönetim"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold sm:text-2xl">
              Destek Talebi Oluştur
            </h1>
           
          </div>
        </header>

        {contextLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <div className="mt-3 text-sm font-medium text-slate-600">
              Kullanıcı ve bölüm bilgileri yükleniyor...
            </div>
          </div>
        ) : contextError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {contextError}

            <button
              type="button"
              onClick={() => router.replace("/sakinGiris")}
              className="mt-4 block rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white"
            >
              Giriş sayfasına dön
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 sm:p-6"
          >
            <section>
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Kullanıcı Bilgileri
                </h2>
                
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ReadonlyInfo label="Ad Soyad" value={fullName} />
                <ReadonlyInfo label="Telefon" value={user?.telefon} />
                <ReadonlyInfo label="E-posta" value={user?.email} />
              </div>
            </section>

            <section className="mt-6">
              <label className="block">
                <div className="mb-1 text-xs font-bold text-slate-700">
                  Talep Oluşturulacak Bölüm *
                </div>

                <select
                  value={selectedDaireId}
                  onChange={(event) =>
                    setSelectedDaireId(event.target.value)
                  }
                  disabled={disabled}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                >
                  <option value="">Bölüm seçiniz</option>

                  {relations.map((item) => {
                    const id = item?.daire?.id;
                    const label = getDaireLabel(item);

                    return (
                      <option key={id} value={id}>
                        {label.title} — {label.detail}
                      </option>
                    );
                  })}
                </select>
              </label>

              {selectedDaire && (
                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Seçili yaşam alanı
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <ReadonlyInfo
                      label="Site ID"
                      value={selectedDaire.siteId}
                    />
                    <ReadonlyInfo
                      label="Blok"
                      value={selectedDaire.blokAdi}
                    />
                    <ReadonlyInfo
                      label="Kat"
                      value={selectedDaire.katNo}
                    />
                    <ReadonlyInfo
                      label="Daire"
                      value={
                        selectedDaire.daireNo ||
                        selectedDaire.bagimsizBolumNo
                      }
                    />
                  </div>

                  
                </div>
              )}
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4">
              <label className="block">
                <div className="mb-1 text-xs font-bold text-slate-700">
                  Departman *
                </div>

                <select
                  value={form.departman}
                  onChange={(event) =>
                    setField("departman", event.target.value)
                  }
                  disabled={disabled}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                >
                  <option value="">Seçiniz</option>
                  {DEPARTMAN_OPTIONS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

            

              <label className="block">
                <div className="mb-1 text-xs font-bold text-slate-700">
                  Konu *
                </div>

                <input
                  value={form.konu}
                  onChange={(event) => setField("konu", event.target.value)}
                  disabled={disabled}
                  placeholder="Örn: Banyoda su kaçağı"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs font-bold text-slate-700">
                  Açıklama *
                </div>

                <textarea
                  rows={6}
                  value={form.aciklama}
                  onChange={(event) =>
                    setField("aciklama", event.target.value)
                  }
                  disabled={disabled}
                  placeholder="Talebinizi ayrıntılı şekilde açıklayın..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </label>
            </section>

            <TicketDosyaPanel
              ticketId={createdTicket?.id}
              onStatusChange={setPanelStatus}
              disabled={saving || Boolean(createdTicket)}
            />

            {message && (
              <div
                className={`mt-4 rounded-xl border p-3 text-sm ${
                  createdTicket
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {message}
              </div>
            )}

            {createdTicket && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="font-bold">
                  Destek Talebiniz Oluşturuldu
                </div>

                <div className="mt-2 text-sm">
                  Talep No:{" "}
                  <span className="rounded-md bg-white px-2 py-1 font-black">
                    {createdTicket.ticketNo}
                  </span>

                  <button
                    type="button"
                    onClick={copyTicketNo}
                    className="ml-2 rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs font-bold"
                  >
                    Kopyala
                  </button>
                </div>

                <div className="mt-3 text-xs font-semibold">
                  {panelStatus.uploading ||
                  panelStatus.attaching ||
                  panelStatus.pendingCount > 0
                    ? `Dosyalar talebe bağlanıyor... Bekleyen: ${panelStatus.pendingCount}`
                    : "Dosyalar talebe eklendi."}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => router.push("/sakinGiris/sakin")}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
              >
                Geri Dön
              </button>

              <button
                type="submit"
                disabled={
                  disabled ||
                  contextLoading ||
                  panelStatus.uploading ||
                  panelStatus.attaching ||
                  relations.length === 0
                }
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Gönderiliyor..."
                  : createdTicket
                  ? "Talep Oluşturuldu"
                  : "Talep Oluştur"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}