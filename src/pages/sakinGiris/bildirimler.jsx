// src/pages/sakinGiris/bildirimler.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { roleGuard } from "@/utils/roleGuard";

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

function pickAny(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return null;
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  if (Array.isArray(data?.bildirimler)) return data.bildirimler;
  if (Array.isArray(data?.Bildirimler)) return data.Bildirimler;

  return [];
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractBackendMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;
  if (data?.title) return data.title;

  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors)
      .flatMap((values) => (Array.isArray(values) ? values : []))
      .filter(Boolean);

    if (messages.length) return messages.join(" | ");
  }

  return error?.message || "Bildirimler alınamadı.";
}

function getNotificationId(item) {
  return (
    pickAny(
      item,
      "id",
      "Id",
      "bildirimId",
      "BildirimId",
      "notificationId",
      "NotificationId"
    ) || null
  );
}

function isReadNotification(item) {
  const value = pickAny(
    item,
    "okunduMu",
    "OkunduMu",
    "okundu",
    "Okundu",
    "isRead",
    "IsRead"
  );

  return value === true || value === 1 || String(value).toLowerCase() === "true";
}

function getNotificationTitle(item) {
  return (
    pickAny(
      item,
      "baslik",
      "Baslik",
      "title",
      "Title",
      "konu",
      "Konu"
    ) || "Bildirim"
  );
}

function getNotificationDescription(item) {
  return (
    pickAny(
      item,
      "aciklama",
      "Aciklama",
      "mesaj",
      "Mesaj",
      "icerik",
      "Icerik",
      "description",
      "Description"
    ) || "-"
  );
}

function getNotificationDate(item) {
  return pickAny(
    item,
    "tarihUtc",
    "TarihUtc",
    "olusturmaTarihiUtc",
    "OlusturmaTarihiUtc",
    "createdAt",
    "CreatedAt",
    "tarih",
    "Tarih"
  );
}

function getNotificationLink(item) {
  return pickAny(
    item,
    "link",
    "Link",
    "url",
    "Url",
    "yonlendirmeUrl",
    "YonlendirmeUrl"
  );
}

export default function BildirimlerPage() {
  const router = useRouter();

  const [bildirimler, setBildirimler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionId, setActionId] = useState(null);

  const unreadCount = useMemo(
    () => bildirimler.filter((item) => !isReadNotification(item)).length,
    [bildirimler]
  );

  const loadNotifications = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const data = await getDataAsync("AppMobil/bildirimler");
      setBildirimler(normalizeList(data));
    } catch (error) {
      console.error("BİLDİRİMLER ALINAMADI:", error);
      setBildirimler([]);
      setErrorMessage(extractBackendMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (item) => {
    const id = getNotificationId(item);

    if (!id || isReadNotification(item)) return;

    try {
      setActionId(id);

      await postDataAsync(`AppMobil/bildirimler/${id}/okundu`, {});

      setBildirimler((previous) =>
        previous.map((current) =>
          String(getNotificationId(current)) === String(id)
            ? {
                ...current,
                okunduMu: true,
                OkunduMu: true,
                okundu: true,
                Okundu: true,
                isRead: true,
                IsRead: true,
              }
            : current
        )
      );
    } catch (error) {
      console.error("BİLDİRİM OKUNDU YAPILAMADI:", error);
      setErrorMessage(extractBackendMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const handleNotificationClick = async (item) => {
    await markAsRead(item);

    const link = getNotificationLink(item);

    if (link) {
      router.push(String(link));
    }
  };

  const markAllAsRead = async () => {
    if (!unreadCount) return;

    try {
      setActionId("all");
      setErrorMessage("");

      await postDataAsync("AppMobil/bildirimler/tumunu-okundu", {});

      setBildirimler((previous) =>
        previous.map((item) => ({
          ...item,
          okunduMu: true,
          OkunduMu: true,
          okundu: true,
          Okundu: true,
          isRead: true,
          IsRead: true,
        }))
      );
    } catch (error) {
      console.error("TÜM BİLDİRİMLER OKUNDU YAPILAMADI:", error);
      setErrorMessage(extractBackendMessage(error));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700 transition hover:bg-slate-50"
                aria-label="Geri dön"
              >
                ←
              </button>

              <div className="relative h-11 w-36">
                <Image
                  src="/eos_management_logo.png"
                  alt="EOS Yönetim"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div>
                <h1 className="text-xl font-black text-slate-900">
                  Bildirimler
                </h1>

                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Güncel duyuru ve işlem bildirimleriniz
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-black text-red-700">
                  {unreadCount} okunmamış
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                  Tümü okundu
                </span>
              )}

              <button
                type="button"
                onClick={() => loadNotifications(true)}
                disabled={refreshing || loading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Yenileniyor..." : "Yenile"}
              </button>
            </div>
          </div>

          {unreadCount > 0 ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={actionId === "all"}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionId === "all"
                  ? "İşleniyor..."
                  : "Tümünü okundu işaretle"}
              </button>
            </div>
          ) : null}
        </header>

        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <div className="mt-4 text-sm font-semibold text-slate-500">
              Bildirimler yükleniyor...
            </div>
          </div>
        ) : bildirimler.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🔔</div>

            <h2 className="mt-4 text-lg font-black text-slate-800">
              Henüz bildiriminiz yok
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Yeni bildirimler burada görüntülenecektir.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bildirimler.map((item, index) => {
              const id = getNotificationId(item) ?? index;
              const read = isReadNotification(item);
              const link = getNotificationLink(item);
              const processing = String(actionId) === String(id);

              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  disabled={processing}
                  className={[
                    "block w-full rounded-2xl border p-4 text-left shadow-sm transition",
                    read
                      ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      : "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100/70",
                    processing ? "cursor-wait opacity-70" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                        read ? "bg-slate-300" : "bg-blue-600",
                      ].join(" ")}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <h2
                          className={[
                            "text-sm text-slate-900",
                            read ? "font-bold" : "font-black",
                          ].join(" ")}
                        >
                          {getNotificationTitle(item)}
                        </h2>

                        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                          {formatDate(getNotificationDate(item))}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {getNotificationDescription(item)}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[10px] font-black",
                            read
                              ? "bg-slate-100 text-slate-500"
                              : "bg-blue-600 text-white",
                          ].join(" ")}
                        >
                          {read ? "Okundu" : "Yeni"}
                        </span>

                        {link ? (
                          <span className="text-xs font-bold text-blue-600">
                            Detaya git →
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}