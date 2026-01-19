export function formatTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    d.setHours(d.getHours() + 3); // ⬅️ +3 saat ekle

    return d.toLocaleString("tr-TR", {
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



export function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function isImageFile(urlOrName = "") {
  const lower = (urlOrName || "").toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp")
  );
}

// ⭐ Malzeme kaynağı (enum) metne çevir
export function formatKaynak(kaynakKod, kaynakAd) {
  if (kaynakAd) {
    const lower = kaynakAd.toLowerCase();

    if (lower.includes("depo")) return "Depo";
    if (lower.includes("yenialim") || lower.includes("yeni")) return "Yeni Alım";
    if (lower.includes("isverentemini") || lower.includes("işveren"))
      return "İşveren Temini";

    return kaynakAd;
  }

  if (kaynakKod !== null && kaynakKod !== undefined) {
    const num = Number(kaynakKod);
    if (num === 10) return "Depo";
    if (num === 20) return "Yeni Alım";
    if (num === 30) return "İşveren Temini";
    return String(kaynakKod);
  }

  return "-";
}
