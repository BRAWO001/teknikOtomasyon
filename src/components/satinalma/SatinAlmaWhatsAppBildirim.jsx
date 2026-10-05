import { useEffect, useRef, useState } from "react";

import { postDataAsync } from "@/utils/apiService";

export default function SatinAlmaWhatsAppBildirim({
  satinAlmaId,
  enabled = false,
  showNotice = true,
  onStatusChange,
  selectedPersoneller = [],
}) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const sentIdRef = useRef(null);

  useEffect(() => {
    const id = Number(satinAlmaId || 0);

    if (!enabled) return;
    if (!id || id <= 0) return;
    if (sentIdRef.current === id) return;

    const sendWhatsApp = async () => {
      sentIdRef.current = id;

      try {
        setStatus("sending");
        setMessage("");

        if (typeof onStatusChange === "function") {
          onStatusChange({
            sending: true,
            completed: false,
            success: false,
          });
        }

        const result = await postDataAsync(
          `SatinAlmaWhatsApp/${id}/gonder`,
          {}
        );

        setStatus("success");

        setMessage(
          result?.message ||
            "WhatsApp bildirimi başarıyla gönderildi."
        );

        if (typeof onStatusChange === "function") {
          onStatusChange({
            sending: false,
            completed: true,
            success: true,
          });
        }
      } catch (err) {
        console.error("SATINALMA WHATSAPP SEND ERROR:", err);

        setStatus("error");

        setMessage(
          err?.message ||
            "WhatsApp bildirimi gönderilemedi."
        );

        // WhatsApp hatası talep oluşturma akışını kilitlemesin.
        if (typeof onStatusChange === "function") {
          onStatusChange({
            sending: false,
            completed: true,
            success: false,
          });
        }
      }
    };

    sendWhatsApp();
  }, [satinAlmaId, enabled, onStatusChange]);

  if (!showNotice) return null;

  // =========================================================
  // SEÇİLEN PERSONEL ADINI BUL
  // Farklı API response formatlarına dayanıklı
  // =========================================================

  const getPersonelId = (personel) =>
    Number(
      personel?.id ??
        personel?.Id ??
        personel?.personelId ??
        personel?.PersonelId ??
        0
    );

  const getPersonelAdSoyad = (personel) => {
    const direktAdSoyad =
      personel?.adSoyad ??
      personel?.AdSoyad;

    if (direktAdSoyad) {
      return String(direktAdSoyad).trim();
    }

    const ad =
      personel?.ad ??
      personel?.Ad ??
      "";

    const soyad =
      personel?.soyad ??
      personel?.Soyad ??
      "";

    return `${ad} ${soyad}`.trim();
  };

  // PersonelId = 20 WhatsApp gönderiminden hariç tutulduğu
  // için bildirim listesinde de gösterilmez.
  const goruntulenecekPersoneller = selectedPersoneller
    .filter((personel) => getPersonelId(personel) !== 20)
    .filter((personel) => getPersonelAdSoyad(personel));

  // =========================================================
  // GÖNDERİLİYOR
  // =========================================================

  if (status === "sending") {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              WhatsApp Bildirimi Gönderiliyor
            </div>

            <div className="mt-1 text-sm leading-5 text-amber-700 dark:text-amber-300">
              Seçilen kişilere WhatsApp bildirimi gönderiliyor.
            </div>

            {goruntulenecekPersoneller.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {goruntulenecekPersoneller.map((personel, index) => (
                  <div
                    key={`${getPersonelId(personel)}-${index}`}
                    className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
                      ✓
                    </span>

                    <span>{getPersonelAdSoyad(personel)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // BAŞARILI
  // =========================================================

  if (status === "success") {
    return (
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            ✓
          </span>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              WhatsApp Bildirimi Gönderildi
            </div>

            {goruntulenecekPersoneller.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {goruntulenecekPersoneller.map((personel, index) => (
                  <div
                    key={`${getPersonelId(personel)}-${index}`}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                      ✓
                    </span>

                    <span>{getPersonelAdSoyad(personel)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 text-sm leading-5 text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // HATA
  // =========================================================

  if (status === "error") {
    return (
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 shadow-sm dark:border-red-900/60 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700 dark:bg-red-900/50 dark:text-red-300">
            !
          </span>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-red-900 dark:text-red-200">
              WhatsApp Bildirimi Gönderilemedi
            </div>

            <div className="mt-1 text-sm leading-5 text-red-700 dark:text-red-300">
              {message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // HENÜZ TALEP OLUŞTURULMADI
  // =========================================================

  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          ✓
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            WhatsApp Bildirimi
          </div>

          {goruntulenecekPersoneller.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {goruntulenecekPersoneller.map((personel, index) => (
                <div
                  key={`${getPersonelId(personel)}-${index}`}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    ✓
                  </span>

                  <span>{getPersonelAdSoyad(personel)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 text-sm leading-5 text-emerald-700 dark:text-emerald-300">
            Yukarıdaki kişilere talep oluşturulduktan sonra WhatsApp mesajı
            gönderilecektir.
          </div>
        </div>
      </div>
    </div>
  );
}