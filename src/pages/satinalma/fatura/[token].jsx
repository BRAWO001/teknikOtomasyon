// pages/satinalma/fatura/[token].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";

const UPLOAD_URL = "HttpUpload/upload-ftp"; // ✅ çalışan endpoint
const SAVE_NOT2_URL = (id) => `satinalma/isaret/fatura-url/${id}`; // ✅ backend’e eklediğimiz endpoint

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

function normalizePublicDto(dto) {
  if (!dto) return null;

  const id = dto.id ?? dto.Id ?? null;
  const seriNo = dto.seriNo ?? dto.SeriNo ?? "-";
  const tarih = dto.tarih ?? dto.Tarih ?? null;
  const talepCinsi = dto.talepCinsi ?? dto.TalepCinsi ?? "-";
  const aciklama = dto.aciklama ?? dto.Aciklama ?? null;

  const rawList = dto.malzemeler ?? dto.Malzemeler ?? [];
  const list = Array.isArray(rawList) ? rawList : [];

  const malzemeler = list.map((m) => ({
    id: m.id ?? m.Id ?? null,
    malzemeAdi: m.malzemeAdi ?? m.MalzemeAdi ?? "-",
    marka: m.marka ?? m.Marka ?? null,
    adet: m.adet ?? m.Adet ?? 0,
    birim: m.birim ?? m.Birim ?? "",
    kullanimAmaci: m.kullanimAmaci ?? m.KullanimAmaci ?? null,
    ornekUrunLinki: m.ornekUrunLinki ?? m.OrnekUrunLinki ?? null,
  }));

  return { id, seriNo, tarih, talepCinsi, aciklama, malzemeler };
}

function Badge({ children }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 900,
        padding: "5px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function FaturaUploadModal({ open, onClose, satinAlmaId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!open) {
      setFile(null);
      setLoading(false);
      setErr("");
      setOk("");
    }
  }, [open]);

  if (!open) return null;

  const pick = (e) => {
    const f = e.target.files?.[0] || null;
    setErr("");
    setOk("");
    setFile(null);

    if (!f) return;

    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErr("Lütfen sadece PDF fatura yükleyiniz.");
      return;
    }

    setFile(f);
  };

  const upload = async () => {
    if (!satinAlmaId) {
      setErr("SatınAlmaId bulunamadı.");
      return;
    }
    if (!file) {
      setErr("Lütfen bir PDF seçin.");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setOk("");

      // 1) FTP upload
      const fd = new FormData();
      fd.append("file", file);

      const uploadRes = await postDataAsync(UPLOAD_URL, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = uploadRes?.Url || uploadRes?.url;
      if (!url) throw new Error("Upload cevabında Url bulunamadı.");

      // 2) Not_2'ye yaz (404 buradaydı → backend endpoint eklenince düzelir)
      const saveRes = await postDataAsync(SAVE_NOT2_URL(satinAlmaId), {
        not2: url,
      });

      setOk(saveRes?.Message || "Fatura linki kaydedildi.");
      if (typeof onUploaded === "function") await onUploaded(url);
    } catch (e) {
      const apiMsg =
        e?.response?.data?.Message ||
        e?.response?.data?.message ||
        e?.response?.data ||
        e?.message ||
        "Fatura yüklenirken hata oluştu.";

      setErr(
        typeof apiMsg === "string" ? apiMsg : "Fatura yüklenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 18,
          background: "#ffffff",
          boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 950, color: "#111827" }}>
            PDF Fatura Yükleme
          </div>

          {/* DOSYA SEÇ */}
          <button
            type="button"
            onClick={() => document.getElementById("faturaFileInput")?.click()}
            title="PDF dosya seç"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            📄 Dosya Seç
          </button>
        </div>

        {/* CONTENT */}
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* GİZLİ INPUT */}
          <input
            id="faturaFileInput"
            type="file"
            accept="application/pdf,.pdf"
            onChange={pick}
            style={{ display: "none" }}
          />

          {err && (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#991b1b",
                padding: "10px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {err}
            </div>
          )}

          {ok && (
            <div
              style={{
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#166534",
                padding: "10px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {ok}
            </div>
          )}

          <button
            type="button"
            onClick={upload}
            disabled={loading}
            style={{
              width: "100%",
              borderRadius: 14,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 950,
              border: "1px solid #e5e7eb",
              background: loading ? "#e5e7eb" : "#d1fae5",
              color: "#064e3b",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Yükleniyor..." : "Faturayı Yükle ve Kaydet"}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              borderRadius: 14,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 900,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#111827",
              cursor: "pointer",
            }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SatinAlmaFaturaPublicPage() {
  const router = useRouter();
  const { token } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [lastUrl, setLastUrl] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErr("");

      const res = await getDataAsync(`satinalma/public/${token}`);
      const norm = normalizePublicDto(res);
      setData(norm);
    } catch (e) {
      const msg =
        e?.response?.data?.Message ||
        e?.response?.data?.message ||
        e?.response?.data ||
        e?.message ||
        "Kayıt bulunamadı.";

      setErr(typeof msg === "string" ? msg : "Kayıt bulunamadı.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const malzemeler = useMemo(
    () => (Array.isArray(data?.malzemeler) ? data.malzemeler : []),
    [data]
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b1220",
          padding: 16,
          color: "#fff",
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  if (err) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b1220",
          padding: 16,
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 8 }}>
            Sayfa Açılmadı
          </div>
          <div style={{ color: "#fecaca", fontWeight: 800 }}>{err}</div>
        </div>
      </div>
    );
  }

  const satinAlmaId = data?.id ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", padding: 16 }}>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            padding: 14,
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 980, letterSpacing: 0.2 }}>
              Satın Alma – Ürün Listesi
            </div>
            <div style={{ flex: 1 }} />
            <Badge>SeriNo: {data?.seriNo || "-"}</Badge>
            <Badge>Tarih: {formatTR(data?.tarih)}</Badge>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.55,
            }}
          >
            <div>
              <strong>Talep Cinsi:</strong> {data?.talepCinsi || "-"}
            </div>
            {data?.aciklama && (
              <div style={{ marginTop: 4 }}>
                <strong>Açıklama:</strong> {data.aciklama}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              width: "100%",
              marginTop: 12,
              borderRadius: 16,
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 980,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "#d1fae5",
              color: "#064e3b",
              cursor: "pointer",
              boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
            }}
          >
            PDF Faturayı Yükle
          </button>

          {lastUrl && (
            <div
              style={{
                marginTop: 10,
                borderRadius: 14,
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                fontSize: 12,
                color: "rgba(255,255,255,0.88)",
                wordBreak: "break-all",
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 6 }}>
                Kaydedilen Fatura Linki (Not_2)
              </div>
              <a
                href={lastUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#93c5fd",
                  fontWeight: 900,
                  textDecoration: "underline",
                }}
              >
                {lastUrl}
              </a>
            </div>
          )}
        </div>

        {/* MALZEME LISTESI */}
        <div
          style={{
            borderRadius: 18,
            background: "#ffffff",
            padding: 14,
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 980, color: "#111827" }}>
              Malzeme / Ürün Listesi
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
              Toplam {malzemeler.length} kalem
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {malzemeler.length === 0 ? (
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
                Malzeme bulunamadı.
              </div>
            ) : (
              malzemeler.map((m, idx) => (
                <div
                  key={m.id ?? idx}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "10px 12px",
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 980,
                          color: "#111827",
                        }}
                      >
                        {idx + 1}. {m.malzemeAdi}
                      </div>

                      {(m.marka || m.kullanimAmaci) && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#4b5563",
                            marginTop: 4,
                            lineHeight: 1.6,
                          }}
                        >
                          {m.marka && (
                            <div>
                              <strong>Marka:</strong> {m.marka}
                            </div>
                          )}
                          {m.kullanimAmaci && (
                            <div>
                              <strong>Kullanım:</strong> {m.kullanimAmaci}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right", minWidth: 200 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 950,
                          color: "#111827",
                        }}
                      >
                        {Number(m.adet || 0).toLocaleString("tr-TR")}{" "}
                        {m.birim || ""}
                      </div>

                      {m.ornekUrunLinki && (
                        <a
                          href={m.ornekUrunLinki}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            fontSize: 12,
                            fontWeight: 900,
                            color: "#2563eb",
                            textDecoration: "underline",
                          }}
                        >
                          Örnek Ürün Linki
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <FaturaUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        satinAlmaId={satinAlmaId}
        onUploaded={async (url) => {
          setLastUrl(url);
        }}
      />
    </div>
  );
}
