// utils/notifications.js
import axios from "axios";

// 🔧 .env KULLANMIYORUZ, SABİT DEĞİŞKEN
// .NET API base adresin:
const API_BASE_URL = "https://localhost:7289/api"; // gerekirse değiştirirsin

// .NET appsettings'teki Vapid:PublicKey ile aynı olmalı
const VAPID_PUBLIC_KEY =
  "BJE7n8Uq2qfCwX0pGqPj5o5r2Nw8hVf1yX0QjwX9wj8mJbYg4eX2YRT0fXG2YdKG4CQP61T7JvJ7pwxS9Wq-8z0";

// 1) Kullanıcıdan bildirim izni iste
export async function askNotificationPermission() {
  if (typeof window === "undefined") return null;

  if (!("Notification" in window)) {
    console.warn("Tarayıcı bildirim desteklemiyor.");
    return null;
  }

  // Eğer daha önce izin verildiyse tekrar sormayalım
  if (Notification.permission === "granted") {
    return "granted";
  }

  const permission = await Notification.requestPermission();
  return permission; // "granted" | "denied" | "default"
}

// 2) Service worker üzerinden push subscription al
export async function subscribeUserToPush() {
  if (typeof window === "undefined") return null;

  if (!("serviceWorker" in navigator)) {
    console.warn("Service worker desteklenmiyor.");
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  });

  return subscription; // { endpoint, keys: { p256dh, auth } }
}

// 3) Subscription'ı .NET API'ne gönder (PersonelId ile)
export async function saveSubscriptionToApi({ personelId, cihazTipi, cihazAdi, subscription }) {
  try {
    const res = await axios.post(`${API_BASE_URL}/bildirim/abone-ol`, {
      personelId,
      cihazTipi, // Web = 10 (backend enum'unla aynı olsun)
      cihazAdi,
      subscription,
    });

    return res.data;
  } catch (error) {
    console.error("Abonelik kaydedilirken hata:", error?.response?.data || error.message);
    throw error;
  }
}

// Helper: base64 -> UInt8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
