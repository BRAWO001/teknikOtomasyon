




import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodePage() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  const lastValueRef = useRef("");
  const lastHitAtRef = useRef(0);

  // 🔊 WebAudio (beep)
  const audioCtxRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("-");
  const [status, setStatus] = useState("Hazır");
  const [error, setError] = useState("");

  // ✅ Okunanlar listesi
  const [items, setItems] = useState([]); // { code, ts }

  // ✅ SSR-safe: ilk render'da "unknown", client'ta hesaplanır
  const [secureBadge, setSecureBadge] = useState({
    ok: null,
    text: "Kontrol ediliyor...",
  });

  useEffect(() => {
    const ok = window.isSecureContext || window.location.hostname === "localhost";
    setSecureBadge({
      ok,
      text: ok ? "HTTPS/Local OK" : "HTTPS Gerekli",
    });
  }, []);

  const ensureAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      // iOS bazen suspended gelir
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume?.();
      }
    } catch {
      // ses desteklenmezse sessiz devam
    }
  };

  const beep = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // kısa, net bip
      osc.type = "sine";
      osc.frequency.value = 880; // Hz
      gain.gain.value = 0.06; // ses seviyesi

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + 0.07); // 70ms
    } catch {
      // sorun olursa sessiz devam
    }
  };

  const stopScan = () => {
    try {
      readerRef.current?.reset();
    } catch {}
    readerRef.current = null;

    // stream kapat
    try {
      const v = videoRef.current;
      const stream = v?.srcObject;
      if (stream && typeof stream.getTracks === "function") {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (v) v.srcObject = null;
    } catch {}

    setScanning(false);
    setStatus("Durduruldu");
  };

  const startScan = async () => {
    setError("");
    setStatus("Kamera hazırlanıyor...");

    ensureAudioContext(); // 🔊 kullanıcı butona basınca hazırla

    const ok = window.isSecureContext || window.location.hostname === "localhost";
    if (!ok) {
      setStatus("Hata");
      setError("Kamera için HTTPS gerekli (localhost hariç).");
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    try {
      // önce varsa kapat
      stopScan();

      // iOS için kritik
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.autoplay = true;

      // decode aralığı: daha hızlı deneme için 120ms iyi
      const reader = new BrowserMultiFormatReader(undefined, 120);
      readerRef.current = reader;

      setScanning(true);
      setStatus("Taranıyor...");

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      await reader.decodeFromConstraints(constraints, video, (result, err) => {
        if (result) {
          const text = result.getText();
          const now = Date.now();

          // ✅ spam engeli (aynı barkodu 900ms içinde tekrar ekleme)
          if (lastValueRef.current === text && now - lastHitAtRef.current < 900) return;

          lastValueRef.current = text;
          lastHitAtRef.current = now;

          setBarcode(text);
          setStatus("Okundu ✅ (tarama devam ediyor)");

          // 🔊 bip
          beep();

          // ✅ listeye ekle (en yeni üstte)
          setItems((prev) => [{ code: text, ts: now }, ...prev]);

          return;
        }

        // NotFoundException normal
        if (err && err.name !== "NotFoundException") {
          setError(err.message || String(err));
          setStatus("Okuma hatası");
        }
      });
    } catch (e) {
      stopScan();
      setStatus("Hata");
      setError(
        "Kamera başlatılamadı.\n\n" +
          "Kontrol et:\n" +
          "• HTTPS mi?\n" +
          "• Kamera izni verildi mi?\n" +
          "• Başka uygulama kamerayı kullanıyor mu?\n\n" +
          `Detay: ${String(e?.message || e)}`
      );
    }
  };

  useEffect(() => () => stopScan(), []);

  function formatTR(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const s = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(1200px 600px at 20% 0%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(16,185,129,0.14), transparent 60%), #0b1220",
      color: "#e5e7eb",
      padding: 18,
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
    },
    shell: { maxWidth: 980, margin: "0 auto" },
    header: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 14,
    },
    title: { fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -0.2 },
    sub: { margin: "8px 0 0 0", opacity: 0.85, lineHeight: 1.55, fontSize: 14 },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap",
    },
    dot: (ok) => ({
      width: 8,
      height: 8,
      borderRadius: 999,
      background:
        ok === null ? "rgba(255,255,255,0.45)" : ok ? "#34d399" : "#f87171",
      display: "inline-block",
    }),
    grid: { display: "grid", gridTemplateColumns: "1fr", gap: 14 },
    card: {
      background: "rgba(15, 23, 42, 0.88)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 18,
      boxShadow: "0 12px 35px rgba(0,0,0,0.35)",
      overflow: "hidden",
    },
    cardBody: { padding: 14 },
    actions: { display: "flex", gap: 10, flexWrap: "wrap" },
    btn: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 900,
    },
    btnPrimary: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(59,130,246,0.45)",
      background: "rgba(59,130,246,0.18)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 900,
    },
    btnStop: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(248,113,113,0.40)",
      background: "rgba(248,113,113,0.14)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 900,
    },
    videoWrap: {
      position: "relative",
      background: "#000",
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.10)",
    },
    video: { width: "100%", height: 520, objectFit: "cover" },
    crosshair: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      display: "grid",
      placeItems: "center",
    },
    target: {
      width: "72%",
      maxWidth: 620,
      height: 170,
      border: "2px solid rgba(255,255,255,0.75)",
      borderRadius: 16,
      boxShadow: "0 0 0 9999px rgba(0,0,0,0.20) inset",
    },
    hint: {
      marginTop: 12,
      padding: 12,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
      fontSize: 13,
      lineHeight: 1.45,
      opacity: 0.9,
    },
    stat: {
      marginTop: 12,
      padding: 12,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
    },
    label: { fontSize: 12, opacity: 0.8, fontWeight: 800 },
    value: { marginTop: 6, fontSize: 14, fontWeight: 900 },
    mono: {
      marginTop: 8,
      padding: 12,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
      fontSize: 18,
      fontWeight: 900,
      letterSpacing: 0.6,
      color: "#a7f3d0",
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      wordBreak: "break-all",
    },
    err: {
      marginTop: 12,
      padding: 12,
      borderRadius: 16,
      border: "1px solid rgba(248,113,113,0.38)",
      background: "rgba(248,113,113,0.12)",
      whiteSpace: "pre-wrap",
      lineHeight: 1.45,
      fontSize: 13,
    },
    listWrap: {
      marginTop: 12,
      padding: 12,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
    },
    listHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 10,
    },
    listTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
    item: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
      padding: "10px 10px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(0,0,0,0.20)",
      marginBottom: 8,
    },
    itemLeft: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
    itemCode: {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontWeight: 900,
      letterSpacing: 0.4,
      wordBreak: "break-all",
    },
    itemTs: { fontSize: 12, opacity: 0.75 },
    smallBtn: {
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    },
  };

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Barkod Okuyucu</h1>
            <p style={s.sub}>
              “Taramayı Başlat” ile kamera açılır. Barkod okununca bip sesi gelir
              ve listeye eklenir. Tarama <b>devam eder</b>.
            </p>
          </div>

          <div style={s.badge}>
            <span style={s.dot(secureBadge.ok)} />
            {secureBadge.text}
          </div>
        </div>

        <div style={s.grid}>
          <div style={s.card}>
            <div style={s.cardBody}>
              <div style={s.actions}>
                {!scanning ? (
                  <button style={s.btnPrimary} onClick={startScan}>
                    Taramayı Başlat
                  </button>
                ) : (
                  <button style={s.btnStop} onClick={stopScan}>
                    Durdur
                  </button>
                )}

                <button
                  style={s.btn}
                  onClick={() => {
                    setBarcode("-");
                    setError("");
                    setStatus("Hazır");
                    lastValueRef.current = "";
                    lastHitAtRef.current = 0;
                    setItems([]);
                  }}
                >
                  Temizle
                </button>

                <button
                  style={s.btn}
                  onClick={() => ensureAudioContext()}
                  title="iOS'ta ses kilidini açmak için"
                >
                  Ses Hazırla
                </button>
              </div>
            </div>

            <div style={{ padding: 14, paddingTop: 0 }}>
              <div style={s.videoWrap}>
                <video ref={videoRef} style={s.video} autoPlay muted playsInline />
                <div style={s.crosshair}>
                  <div style={s.target} />
                </div>
              </div>

              <div style={s.hint}>
                İpucu: Barkodu yaklaştır (10–20cm), ışığı artır, parlama olmasın.
                Aynı barkodu üst üste yazmaması için 900ms kilit var.
              </div>

              <div style={s.stat}>
                <div style={s.label}>Durum</div>
                <div style={s.value}>{status}</div>

                <div style={{ marginTop: 12 }}>
                  <div style={s.label}>Son Okunan</div>
                  <div style={s.mono}>{barcode}</div>
                </div>

                {error ? <div style={s.err}>{error}</div> : null}
              </div>

              <div style={s.listWrap}>
                <div style={s.listHead}>
                  <div style={s.listTitle}>Okunanlar ({items.length})</div>
                  <button
                    style={s.smallBtn}
                    onClick={() => setItems([])}
                    disabled={items.length === 0}
                  >
                    Listeyi Temizle
                  </button>
                </div>

                {items.length === 0 ? (
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    Henüz okuma yok.
                  </div>
                ) : (
                  items.slice(0, 30).map((x, idx) => (
                    <div key={`${x.ts}-${idx}`} style={s.item}>
                      <div style={s.itemLeft}>
                        <div style={s.itemCode}>{x.code}</div>
                        <div style={s.itemTs}>{formatTR(x.ts)}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          style={s.smallBtn}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(x.code);
                            } catch {}
                          }}
                        >
                          Kopyala
                        </button>

                        <button
                          style={s.smallBtn}
                          onClick={() =>
                            setItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {items.length > 30 ? (
                  <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
                    Performans için sadece son 30 kayıt gösteriliyor.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
          Next.js + ZXing — sürekli tarama + bip + liste
        </div>
      </div>
    </div>
  );
}
