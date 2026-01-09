// pages/yoneticiRaporu.jsx
import { useEffect, useMemo, useState } from "react";
import { getDataAsync } from "@/utils/apiService";

/**
 * ✅ Yönetici Raporu (Excel gibi)
 * - Üstte 3 KPI kartı (Toplam Kayıt, Toplam Tutar, Toplam Kalem)
 * - Altta filtrelenebilir / sıralanabilir tablo
 * - Satır tıklayınca detay drawer (Not_1..Not_2..Not_3, malzemeler vs.)
 *
 * ✅ Beklenen JSON (örnek alanlar)
 * [
 *  {
 *    "id": 3,
 *    "tarih": "2026-01-03T07:24:32.017",
 *    "seriNo": "SA-20260103072432",
 *    "talepCinsi": "elektrik",
 *    "not_1": "Satın alındı",
 *    "not_2": "https://...fatura.pdf",
 *    "siteAdi": "Site A",
 *    "malzemeler": [ ... ],
 *    "not_3": "12345" // string ama sayıya çevrilebilir
 *  }
 * ]
 *
 * ⚠️ Endpoint'i aşağıdaki REPORT_ENDPOINT ile değiştir.
 */
const REPORT_ENDPOINT = "satinalma/yonetici-raporu"; // <-- senin backend endpoint

function safeStr(v) {
  if (v == null) return "";
  return String(v);
}
function normalizeTRLower(s) {
  return safeStr(s).trim().toLocaleLowerCase("tr-TR");
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
    return "-";
  }
}
function parseMoney(val) {
  // Not_3 string gelebilir: "12.345,67" / "12345.67" / "12345" vb.
  if (val == null) return 0;
  const raw = safeStr(val).trim();
  if (!raw) return 0;

  // TR format olasılığı: 12.345,67 -> 12345.67
  const tr = raw.replace(/\./g, "").replace(",", ".");
  const num = Number(tr);
  return Number.isFinite(num) ? num : 0;
}
function currencyTR(val) {
  const n = Number(val) || 0;
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getField(row, keys, fallback = "") {
  for (const k of keys) {
    if (row && row[k] != null) return row[k];
  }
  return fallback;
}

function KPI({ title, value, hint }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
        minWidth: 220,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280" }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 26, fontWeight: 950, color: "#111827" }}>{value}</div>
      {hint && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Pill({ text, tone = "gray" }) {
  const tones = {
    gray: { bg: "#f3f4f6", bd: "#e5e7eb", tx: "#111827" },
    green: { bg: "#d1fae5", bd: "#86efac", tx: "#064e3b" },
    red: { bg: "#fee2e2", bd: "#fecaca", tx: "#991b1b" },
    amber: { bg: "#fffbeb", bd: "#fde68a", tx: "#92400e" },
    blue: { bg: "#dbeafe", bd: "#bfdbfe", tx: "#1e40af" },
  };
  const t = tones[tone] || tones.gray;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${t.bd}`,
        background: t.bg,
        color: t.tx,
        fontSize: 11,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function Drawer({ open, onClose, row }) {
  if (!open) return null;

  const id = row?.id ?? row?.Id;
  const seriNo = row?.seriNo ?? row?.SeriNo ?? "-";
  const tarih = row?.tarih ?? row?.Tarih ?? null;
  const talepCinsi = row?.talepCinsi ?? row?.TalepCinsi ?? "-";
  const siteAdi = row?.siteAdi ?? row?.SiteAdi ?? row?.siteAdı ?? row?.SiteAdı ?? "-";
  const not1 = row?.not_1 ?? row?.Not_1 ?? "";
  const not2 = row?.not_2 ?? row?.Not_2 ?? "";
  const not3 = row?.not_3 ?? row?.Not_3 ?? "";

  const malzList = row?.malzemeler ?? row?.Malzemeler ?? [];
  const malzemeler = Array.isArray(malzList) ? malzList : [];
  const kalemSayisi = malzemeler.length;

  const toplam = parseMoney(not3);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 92vw)",
          height: "100%",
          background: "#ffffff",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.25)",
          padding: 14,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 950, color: "#111827" }}>
            Detay • #{id}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 10,
              padding: "8px 10px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Kapat
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#f9fafb" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280" }}>Özet</div>
            <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, color: "#111827" }}>
              <div><strong>SeriNo:</strong> {seriNo}</div>
              <div><strong>Tarih:</strong> {formatTR(tarih)}</div>
              <div><strong>Talep Cinsi:</strong> {talepCinsi}</div>
              <div><strong>Site:</strong> {siteAdi}</div>
              <div><strong>Kalem Sayısı:</strong> {kalemSayisi}</div>
              <div><strong>Not_3 Toplam:</strong> {currencyTR(toplam)} ₺</div>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#ffffff" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280" }}>Not Alanları</div>
            <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#6b7280" }}>Not_1</div>
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: "#111827" }}>
                  {not1 || "-"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#6b7280" }}>Not_2 (Fatura URL)</div>
                {not2 ? (
                  <a
                    href={safeStr(not2)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginTop: 4, display: "inline-block", fontSize: 13, fontWeight: 900, color: "#2563eb", textDecoration: "underline", wordBreak: "break-all" }}
                  >
                    {safeStr(not2)}
                  </a>
                ) : (
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: "#111827" }}>-</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#6b7280" }}>Not_3 (Toplam)</div>
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900, color: "#111827" }}>
                  {safeStr(not3) || "-"}{" "}
                  {not3 ? <span style={{ color: "#6b7280", fontWeight: 800 }}>(parse: {currencyTR(toplam)} ₺)</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#f9fafb" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280" }}>Satın Alınan Malzemeler</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {malzemeler.length === 0 ? (
                <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280" }}>Malzeme yok.</div>
              ) : (
                malzemeler.map((m, idx) => {
                  const ad = m?.malzemeAdi ?? m?.MalzemeAdi ?? "-";
                  const marka = m?.marka ?? m?.Marka ?? "";
                  const adet = m?.adet ?? m?.Adet ?? "";
                  const birim = m?.birim ?? m?.Birim ?? "";
                  return (
                    <div
                      key={m?.id ?? m?.Id ?? idx}
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "#ffffff",
                        borderRadius: 12,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ fontWeight: 950, color: "#111827", fontSize: 13 }}>
                        {idx + 1}. {ad}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "#4b5563", fontWeight: 700 }}>
                        {marka ? <div><strong>Marka:</strong> {marka}</div> : null}
                        {(adet || birim) ? <div><strong>Miktar:</strong> {adet} {birim}</div> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function YoneticiRaporuPage() {
  const [rows, setRows] = useState([]);
  const [rawErr, setRawErr] = useState("");
  const [loading, setLoading] = useState(true);

  // UI state
  const [q, setQ] = useState("");
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [not1Filter, setNot1Filter] = useState("ALL");
  const [sortKey, setSortKey] = useState("tarih");
  const [sortDir, setSortDir] = useState("desc");

  // selection
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);


  const load = async () => {
  try {
    setLoading(true);
    setRawErr("");

    // ✅ MOCK DATA (GET hazır değilken görünüm için)
    const mockRows = [
      {
        id: 101,
        tarih: "2026-01-06T09:12:00.000",
        seriNo: "SA-20260106091200",
        talepCinsi: "Elektrik",
        not_1: "Satın alındı",
        not_2: "https://files.pilotapisrc.com/faturalar/SA-20260106091200.pdf",
        siteAdi: "Güneş Sitesi",
        malzemeler: [
          { id: 1, malzemeAdi: "Kablo NYM 3x2.5", marka: "Prysmian", adet: 50, birim: "Metre" },
          { id: 2, malzemeAdi: "Sigorta 16A", marka: "Schneider", adet: 6, birim: "Adet" },
          { id: 3, malzemeAdi: "Buat", marka: "Viko", adet: 10, birim: "Adet" },
        ],
        not_3: "18450,00",
      },
      {
        id: 102,
        tarih: "2026-01-06T11:35:00.000",
        seriNo: "SA-20260106113500",
        talepCinsi: "Temizlik",
        not_1: "Beklemede - Onay bekleniyor",
        not_2: "",
        siteAdi: "Mavi Kule",
        malzemeler: [
          { id: 1, malzemeAdi: "Yüzey Temizleyici 5L", marka: "Diversey", adet: 6, birim: "Bidon" },
          { id: 2, malzemeAdi: "Mop Seti", marka: "Vileda", adet: 4, birim: "Set" },
        ],
        not_3: "7420",
      },
      {
        id: 103,
        tarih: "2026-01-06T14:10:00.000",
        seriNo: "SA-20260106141000",
        talepCinsi: "Asansör",
        not_1: "Satın alınmadı",
        not_2: "",
        siteAdi: "Ihlamur Evleri",
        malzemeler: [
          { id: 1, malzemeAdi: "Kapı Kilidi", marka: "Fermator", adet: 1, birim: "Adet" },
          { id: 2, malzemeAdi: "Fotosel", marka: "Wittur", adet: 1, birim: "Adet" },
        ],
        not_3: "12980,50",
      },
      {
        id: 104,
        tarih: "2026-01-07T08:20:00.000",
        seriNo: "SA-20260107082000",
        talepCinsi: "Mekanik",
        not_1: "Satın alındı",
        not_2: "https://files.pilotapisrc.com/faturalar/SA-20260107082000.pdf",
        siteAdi: "Yelken Residence",
        malzemeler: [
          { id: 1, malzemeAdi: "Sirkülasyon Pompası", marka: "Grundfos", adet: 1, birim: "Adet" },
          { id: 2, malzemeAdi: "Vana 1\"", marka: "ECA", adet: 3, birim: "Adet" },
          { id: 3, malzemeAdi: "Teflon Bant", marka: "Fırat", adet: 10, birim: "Adet" },
        ],
        not_3: "25500",
      },
      {
        id: 105,
        tarih: "2026-01-07T10:05:00.000",
        seriNo: "SA-20260107100500",
        talepCinsi: "Elektrik",
        not_1: "Satın alındı",
        not_2: "",
        siteAdi: "Güneş Sitesi",
        malzemeler: [
          { id: 1, malzemeAdi: "LED Panel 60x60", marka: "Philips", adet: 8, birim: "Adet" },
          { id: 2, malzemeAdi: "Klemens", marka: "Wago", adet: 20, birim: "Adet" },
        ],
        not_3: "16890,75",
      },
      {
        id: 106,
        tarih: "2026-01-07T13:40:00.000",
        seriNo: "SA-20260107134000",
        talepCinsi: "Peyzaj",
        not_1: "Beklemede - Fiyat toplama",
        not_2: "",
        siteAdi: "Çınar Park",
        malzemeler: [
          { id: 1, malzemeAdi: "Çim Tohumu", marka: "Barenbrug", adet: 2, birim: "Çuval" },
          { id: 2, malzemeAdi: "Budama Makası", marka: "Fiskars", adet: 2, birim: "Adet" },
          { id: 3, malzemeAdi: "Bahçe Hortumu 50m", marka: "Hozelock", adet: 1, birim: "Adet" },
        ],
        not_3: "9850",
      },
      {
        id: 107,
        tarih: "2026-01-08T09:00:00.000",
        seriNo: "SA-20260108090000",
        talepCinsi: "Güvenlik",
        not_1: "Satın alındı",
        not_2: "https://files.pilotapisrc.com/faturalar/SA-20260108090000.pdf",
        siteAdi: "Mavi Kule",
        malzemeler: [
          { id: 1, malzemeAdi: "IP Kamera", marka: "Hikvision", adet: 4, birim: "Adet" },
          { id: 2, malzemeAdi: "PoE Switch 8 Port", marka: "TP-Link", adet: 1, birim: "Adet" },
        ],
        not_3: "32100",
      },
      {
        id: 108,
        tarih: "2026-01-08T11:15:00.000",
        seriNo: "SA-20260108111500",
        talepCinsi: "Elektrik",
        not_1: "Satın alınmadı",
        not_2: "",
        siteAdi: "Ihlamur Evleri",
        malzemeler: [
          { id: 1, malzemeAdi: "UPS 1kVA", marka: "Inform", adet: 1, birim: "Adet" },
        ],
        not_3: "8700,00",
      },
      {
        id: 109,
        tarih: "2026-01-08T15:25:00.000",
        seriNo: "SA-20260108152500",
        talepCinsi: "Boya",
        not_1: "Beklemede - Onay bekleniyor",
        not_2: "",
        siteAdi: "Yelken Residence",
        malzemeler: [
          { id: 1, malzemeAdi: "İç Cephe Boya 20kg", marka: "Filli Boya", adet: 3, birim: "Kova" },
          { id: 2, malzemeAdi: "Rulo Set", marka: "Dyo", adet: 5, birim: "Set" },
          { id: 3, malzemeAdi: "Maskeleme Bandı", marka: "Tesa", adet: 10, birim: "Adet" },
        ],
        not_3: "14640",
      },
      {
        id: 110,
        tarih: "2026-01-09T08:45:00.000",
        seriNo: "SA-20260109084500",
        talepCinsi: "Mekanik",
        not_1: "Satın alındı",
        not_2: "https://files.pilotapisrc.com/faturalar/SA-20260109084500.pdf",
        siteAdi: "Çınar Park",
        malzemeler: [
          { id: 1, malzemeAdi: "Genleşme Tankı 24L", marka: "Reflex", adet: 1, birim: "Adet" },
          { id: 2, malzemeAdi: "Emniyet Ventili", marka: "ECA", adet: 2, birim: "Adet" },
        ],
        not_3: "11250,90",
      },
    ];

    setRows(mockRows);
  } catch (e) {
    setRawErr("Rapor verisi alınamadı.");
    setRows([]);
  } finally {
    setLoading(false);
  }
};





  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sites = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      const s = getField(r, ["siteAdi", "SiteAdi", "siteAdı", "SiteAdı"], "");
      if (s) set.add(s);
    });
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b, "tr"))];
  }, [rows]);

  const not1Options = useMemo(() => {
    // Not_1'e göre status rozet
    return ["ALL", "satın alındı", "satın alınmadı", "beklemede/diğer"];
  }, []);

  const kpi = useMemo(() => {
    const totalCount = rows.length;

    let totalAmount = 0;
    let totalKalem = 0;

    rows.forEach((r) => {
      const not3 = getField(r, ["not_3", "Not_3"], "");
      totalAmount += parseMoney(not3);

      const malz = getField(r, ["malzemeler", "Malzemeler"], []);
      const arr = Array.isArray(malz) ? malz : [];
      totalKalem += arr.length;
    });

    return { totalCount, totalAmount, totalKalem };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = normalizeTRLower(q);

    return rows.filter((r) => {
      const id = getField(r, ["id", "Id"], "");
      const seriNo = getField(r, ["seriNo", "SeriNo"], "");
      const talepCinsi = getField(r, ["talepCinsi", "TalepCinsi"], "");
      const not1 = getField(r, ["not_1", "Not_1"], "");
      const not2 = getField(r, ["not_2", "Not_2"], "");
      const siteAdi = getField(r, ["siteAdi", "SiteAdi", "siteAdı", "SiteAdı"], "");

      const textBlob = normalizeTRLower([id, seriNo, talepCinsi, not1, not2, siteAdi].join(" | "));

      const passQ = !query || textBlob.includes(query);

      const passSite = siteFilter === "ALL" ? true : safeStr(siteAdi) === safeStr(siteFilter);

      const not1Norm = normalizeTRLower(not1);
      let passNot1 = true;
      if (not1Filter !== "ALL") {
        if (not1Filter === "satın alındı") passNot1 = not1Norm.includes("satın alındı") || not1Norm.includes("satin alindi");
        else if (not1Filter === "satın alınmadı") passNot1 = not1Norm.includes("satın alınmadı") || not1Norm.includes("satin alinmadi");
        else passNot1 = !(not1Norm.includes("satın alındı") || not1Norm.includes("satin alindi") || not1Norm.includes("satın alınmadı") || not1Norm.includes("satin alinmadi"));
      }

      return passQ && passSite && passNot1;
    });
  }, [rows, q, siteFilter, not1Filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];

    const getSortVal = (r) => {
      if (sortKey === "siraNo") return Number(getField(r, ["id", "Id"], 0)) || 0;
      if (sortKey === "tarih") return new Date(getField(r, ["tarih", "Tarih"], 0)).getTime() || 0;
      if (sortKey === "seriNo") return safeStr(getField(r, ["seriNo", "SeriNo"], ""));
      if (sortKey === "talepCinsi") return safeStr(getField(r, ["talepCinsi", "TalepCinsi"], ""));
      if (sortKey === "siteAdi") return safeStr(getField(r, ["siteAdi", "SiteAdi", "siteAdı", "SiteAdı"], ""));
      if (sortKey === "kalem") {
        const malz = getField(r, ["malzemeler", "Malzemeler"], []);
        return (Array.isArray(malz) ? malz.length : 0) || 0;
      }
      if (sortKey === "toplam") {
        const not3 = getField(r, ["not_3", "Not_3"], "");
        return parseMoney(not3);
      }
      return 0;
    };

    list.sort((a, b) => {
      const va = getSortVal(a);
      const vb = getSortVal(b);

      // string karşılaştırma
      if (typeof va === "string" || typeof vb === "string") {
        const sa = safeStr(va);
        const sb = safeStr(vb);
        const cmp = sa.localeCompare(sb, "tr");
        return sortDir === "asc" ? cmp : -cmp;
      }

      const cmp = (va || 0) - (vb || 0);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [filtered, sortKey, sortDir]);

  const openRow = (r) => {
    setSelected(r);
    setDrawerOpen(true);
  };

  const getNot1Tone = (not1) => {
    const n = normalizeTRLower(not1);
    if (n.includes("satın alındı") || n.includes("satin alindi")) return "green";
    if (n.includes("satın alınmadı") || n.includes("satin alinmadi")) return "red";
    if (!n) return "gray";
    return "amber";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b1220", padding: 16, color: "#fff" }}>
        Yükleniyor...
      </div>
    );
  }

  if (rawErr) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b1220", padding: 16, color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Yönetici Raporu</div>
          <div style={{ marginTop: 10, color: "#fecaca", fontWeight: 800 }}>{rawErr}</div>
          <button
            onClick={load}
            style={{
              marginTop: 12,
              borderRadius: 12,
              padding: "10px 12px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", padding: 16 }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Header */}
        <div
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            padding: 14,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 20, fontWeight: 980, letterSpacing: 0.2 }}>
              Yönetici Raporu
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={load}
              style={{
                borderRadius: 12,
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Yenile
            </button>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <KPI title="Toplam Kayıt" value={kpi.totalCount} hint="Rapor içindeki toplam satın alma satırı" />
            <KPI title="Toplam Tutar (Not_3)" value={`${currencyTR(kpi.totalAmount)} ₺`} hint="Not_3 string → sayıya çevrilerek toplandı" />
            <KPI title="Toplam Kalem" value={kpi.totalKalem} hint="Tüm kayıtların malzeme adet toplamı (kalem sayısı)" />
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            borderRadius: 18,
            background: "#ffffff",
            padding: 14,
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, fontWeight: 950, color: "#111827" }}>Filtreler</div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ara: sıraNo, seriNo, site, talep cinsi, not_1, not_2..."
              style={{
                flex: "1 1 360px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 700,
                outline: "none",
              }}
            />

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 800,
                background: "#fff",
                minWidth: 190,
              }}
            >
              {sites.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "Site: Tümü" : s}
                </option>
              ))}
            </select>

            <select
              value={not1Filter}
              onChange={(e) => setNot1Filter(e.target.value)}
              style={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 800,
                background: "#fff",
                minWidth: 190,
              }}
            >
              {not1Options.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "Not_1: Tümü" : s}
                </option>
              ))}
            </select>

            <select
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(":");
                setSortKey(k);
                setSortDir(d);
              }}
              style={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 800,
                background: "#fff",
                minWidth: 220,
              }}
            >
              <option value="tarih:desc">Sırala: Tarih (Yeni → Eski)</option>
              <option value="tarih:asc">Sırala: Tarih (Eski → Yeni)</option>
              <option value="toplam:desc">Sırala: Toplam (Büyük → Küçük)</option>
              <option value="toplam:asc">Sırala: Toplam (Küçük → Büyük)</option>
              <option value="kalem:desc">Sırala: Kalem (Çok → Az)</option>
              <option value="kalem:asc">Sırala: Kalem (Az → Çok)</option>
              <option value="seriNo:asc">Sırala: SeriNo (A → Z)</option>
              <option value="seriNo:desc">Sırala: SeriNo (Z → A)</option>
              <option value="siteAdi:asc">Sırala: Site (A → Z)</option>
              <option value="siteAdi:desc">Sırala: Site (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            borderRadius: 18,
            background: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ padding: 12, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, fontWeight: 950, color: "#111827" }}>
              Kayıtlar
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 900, color: "#6b7280" }}>
                ({sorted.length} satır)
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
              Satıra tıkla → Detay açılır
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1100 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {[
                    "SıraNo",
                    "Tarih",
                    "SeriNo",
                    "TalepCinsi",
                    "Not_1",
                    "Not_2",
                    "SiteAdı",
                    "Kalem",
                    "Toplam (Not_3)",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        fontSize: 12,
                        fontWeight: 950,
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 16, fontSize: 13, fontWeight: 800, color: "#6b7280" }}>
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  sorted.map((r, idx) => {
                    const id = getField(r, ["id", "Id"], "");
                    const tarih = getField(r, ["tarih", "Tarih"], null);
                    const seriNo = getField(r, ["seriNo", "SeriNo"], "");
                    const talepCinsi = getField(r, ["talepCinsi", "TalepCinsi"], "");
                    const not1 = getField(r, ["not_1", "Not_1"], "");
                    const not2 = getField(r, ["not_2", "Not_2"], "");
                    const siteAdi = getField(r, ["siteAdi", "SiteAdi", "siteAdı", "SiteAdı"], "");
                    const malz = getField(r, ["malzemeler", "Malzemeler"], []);
                    const kalem = Array.isArray(malz) ? malz.length : 0;
                    const not3 = getField(r, ["not_3", "Not_3"], "");
                    const toplam = parseMoney(not3);

                    const tone = getNot1Tone(not1);

                    return (
                      <tr
                        key={id || idx}
                        onClick={() => openRow(r)}
                        style={{
                          cursor: "pointer",
                          background: idx % 2 === 0 ? "#ffffff" : "#fcfcfd",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fcfcfd")}
                      >
                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 950, color: "#111827", whiteSpace: "nowrap" }}>
                          {id}
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 800, color: "#111827", whiteSpace: "nowrap" }}>
                          {formatTR(tarih)}
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 900, color: "#111827", whiteSpace: "nowrap" }}>
                          {seriNo || "-"}
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 800, color: "#111827" }}>
                          {talepCinsi || "-"}
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6" }}>
                          <Pill text={not1 ? safeStr(not1) : "—"} tone={tone} />
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", maxWidth: 320 }}>
                          {not2 ? (
                            <a
                              href={safeStr(not2)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                color: "#2563eb",
                                fontWeight: 900,
                                textDecoration: "underline",
                                display: "inline-block",
                                maxWidth: 320,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={safeStr(not2)}
                            >
                              Fatura Linki
                            </a>
                          ) : (
                            <span style={{ color: "#6b7280", fontWeight: 900 }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 800, color: "#111827", whiteSpace: "nowrap" }}>
                          {siteAdi || "-"}
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 950, color: "#111827", whiteSpace: "nowrap" }}>
                          {kalem}
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 950, color: "#111827", whiteSpace: "nowrap" }}>
                          {currencyTR(toplam)} ₺
                        </td>

                        <td style={{ padding: "12px 12px", borderBottom: "1px solid #f3f4f6", color: "#6b7280", fontWeight: 900, whiteSpace: "nowrap" }}>
                          Detay →
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        row={selected}
      />
    </div>
  );
}
