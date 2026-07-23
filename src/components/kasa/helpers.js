export function getCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const found = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!found) {
    return null;
  }

  return decodeURIComponent(found.split("=").slice(1).join("="));
}

export function getCurrentPersonelAdSoyad() {
  try {
    const raw = getCookie("PersonelUserInfo");

    if (!raw) {
      return "";
    }

    const obj = JSON.parse(raw);

    const ad =
      obj?.ad ??
      obj?.Ad ??
      obj?.personel?.ad ??
      obj?.personel?.Ad ??
      "";

    const soyad =
      obj?.soyad ??
      obj?.Soyad ??
      obj?.personel?.soyad ??
      obj?.personel?.Soyad ??
      "";

    const adSoyad =
      obj?.adSoyad ??
      obj?.AdSoyad ??
      obj?.personel?.adSoyad ??
      obj?.personel?.AdSoyad ??
      `${ad} ${soyad}`;

    return String(adSoyad || "").trim();
  } catch (error) {
    console.error("Personel cookie bilgisi okunamadı:", error);
    return "";
  }
}

export function formatDateTR(iso) {
  if (!iso) {
    return "-";
  }

  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function moneyTR(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function toDateInputValue(date) {
  try {
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function toLocalDateTimeInputValue(date = new Date()) {
  try {
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000
    );

    return localDate.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function getDefaultRange() {
  const today = new Date();
  const start = new Date(today);

  start.setMonth(start.getMonth() - 6);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

export function getVal(obj, ...keys) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) {
      return obj[key];
    }
  }

  return null;
}

export function parseAmount(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return 0;
  }

  let normalized = rawValue.replace(/\s/g, "");

  if (normalized.includes(".") && normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function startsWithEOS(value) {
  return Boolean(
    value &&
      String(value).trim().toUpperCase().startsWith("EOS")
  );
}

export function createInitialForm() {
  return {
    baslik: "Ev Temizlik",
    aciklama: "",
    teslimEdilenPersonel: "",
    iscilikTutari: "",
    malzemeTutari: "",
    alinanToplamTutar: "",
    kasaKayitTarihi: toLocalDateTimeInputValue(),
    odemeTipi: "Nakit",
    kaydiYapanPersonel: getCurrentPersonelAdSoyad(),
  };
}

export function normalizeSummary(summary) {
  return {
    toplamAlinanTutar: summary?.toplamAlinanTutar ?? 0,
    toplamMalzemeTutari: summary?.toplamMalzemeTutari ?? 0,
    toplamDusulenTutar: summary?.toplamDusulenTutar ?? 0,
    toplamIscilikTutari: summary?.toplamIscilikTutari ?? 0,
    genelBakiye: summary?.genelBakiye ?? 0,
    ibanliKayitSayisi: summary?.ibanliKayitSayisi ?? 0,
    nakitKayitSayisi: summary?.nakitKayitSayisi ?? 0,
    nakit: {
      kayitSayisi: summary?.nakit?.kayitSayisi ?? 0,
      toplamAlinan: summary?.nakit?.toplamAlinan ?? 0,
      toplamMalzeme: summary?.nakit?.toplamMalzeme ?? 0,
      kasayaKalan: summary?.nakit?.kasayaKalan ?? 0,
    },
    iban: {
      kayitSayisi: summary?.iban?.kayitSayisi ?? 0,
      toplamAlinan: summary?.iban?.toplamAlinan ?? 0,
      toplamMalzeme: summary?.iban?.toplamMalzeme ?? 0,
      kasayaKalan: summary?.iban?.kasayaKalan ?? 0,
    },
  };
}
