




// pages/teknik/isEmriDetay/print/[id].jsx
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "../../../../utils/apiService";

/* ========= PRINT HELPERS ========= */
function formatTR(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}
function initials(name) {
  const s = (name ?? "").toString().trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = (parts[0]?.[0] ?? "").toUpperCase();
  const b = (parts[1]?.[0] ?? parts[0]?.[1] ?? "").toUpperCase();
  return (a + b).slice(0, 2) || "?";
}
function formatKaynak(kod, ad) {
  const k = (kod ?? "").toString().trim();
  const a = (ad ?? "").toString().trim();
  if (a && k) return `${a} (${k})`;
  if (a) return a;
  if (k) return k;
  return "-";
}
function pickAny(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return null;
}
function getFileUrl(d) {
  const url = pickAny(
    d,
    "url",
    "Url",
    "fileUrl",
    "FileUrl",
    "dosyaUrl",
    "DosyaUrl",
    "path",
    "Path",
    "dosyaYolu",
    "DosyaYolu",
    "link",
    "Link"
  );
  if (!url) return null;
  const s = String(url);

  // ✅ Eğer relative geliyorsa base eklemek istersen burayı aç:
  // const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  // if (base && !s.startsWith("http")) return `${base.replace(/\/+$/,"")}/${s.replace(/^\/+/,"")}`;

  return s;
}
function getFileName(d) {
  const name = pickAny(d, "ad", "Ad", "name", "Name", "dosyaAdi", "DosyaAdi", "fileName", "FileName");
  return name ? String(name) : "Dosya";
}
function isImageUrl(url) {
  const u = (url || "").toLowerCase();
  return (
    u.includes(".jpg") ||
    u.includes(".jpeg") ||
    u.includes(".png") ||
    u.includes(".webp") ||
    u.includes(".gif") ||
    u.includes("image/")
  );
}
function extOf(url) {
  try {
    const u = (url || "").split("?")[0];
    const i = u.lastIndexOf(".");
    if (i === -1) return "";
    return u.slice(i + 1).toUpperCase();
  } catch {
    return "";
  }
}

/* ========= PRINT COMPONENTS (PAGE-ONLY) ========= */

function PrintIsEmriHeader({
  kod,
  kod_2,
  kod_3,
  kisaBaslik,
  durumAd,
  durumKod,
  olusturmaTarihiUtc,
  onayTarihiUtc,
  baslamaTarihiUtc,
  bitisTarihiUtc,
}) {
  let kod3Label = null;
  let kod3Class = "";
  if (kod_3) {
    if (kod_3 === "ACIL") {
      kod3Label = "ACİL";
      kod3Class = "bg-red-50 text-red-800 ring-red-200";
    } else {
      kod3Label = "DIŞ İŞ";
      kod3Class = "bg-amber-50 text-amber-800 ring-amber-200";
    }
  }

  return (
    <header className="border-b border-zinc-300 pb-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            <div className="text-[12px] font-extrabold tracking-[0.10em] text-zinc-900">
              {kod}
            </div>

            {kod_2 ? (
              <span className="rounded px-1 py-[1px] text-[9px] font-bold text-blue-800 ring-1 ring-blue-200 bg-blue-50">
                {kod_2}
              </span>
            ) : null}

            {kod3Label ? (
              <span className={`rounded px-1 py-[1px] text-[9px] font-bold ring-1 ${kod3Class}`}>
                {kod3Label}
              </span>
            ) : null}
          </div>

          <div className="mt-[1px] text-[11px] font-bold text-zinc-900">
            {kisaBaslik || "-"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-[2px] text-[9px] text-zinc-700">
          <div>
            <div className="text-[8px] text-zinc-500">Oluşturma</div>
            <div className="font-semibold">{formatTR(olusturmaTarihiUtc)}</div>
          </div>
          <div>
            <div className="text-[8px] text-zinc-500">Onay</div>
            <div className="font-semibold">{onayTarihiUtc ? formatTR(onayTarihiUtc) : "-"}</div>
          </div>
          <div>
            <div className="text-[8px] text-zinc-500">Başlangıç</div>
            <div className="font-semibold">{baslamaTarihiUtc ? formatTR(baslamaTarihiUtc) : "-"}</div>
          </div>
          <div>
            <div className="text-[8px] text-zinc-500">Bitiş</div>
            <div className="font-semibold">{bitisTarihiUtc ? formatTR(bitisTarihiUtc) : "-"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function PrintIsEmriTopGrid({
  site,
  apt,
  ev,
  konum,
  evSahibi,
  kiraci,
  aciklama,
  aciklama_2,
}) {
  return (
    <section className="mt-1 grid grid-cols-2 gap-1">
      <div className="rounded border border-zinc-300 bg-zinc-50 p-1">
        <div className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-600">
          Konum / Adres
        </div>

        <div className="mt-[2px] text-[10px] text-zinc-800">
          <span className="font-bold">{site?.ad || "-"}</span>
          {apt?.ad ? <span className="text-zinc-500"> • {apt.ad}</span> : null}
          {ev?.kapiNo ? <span className="text-zinc-500"> • Kapı:{ev.kapiNo}</span> : null}
          {ev?.pkNo ? <span className="text-zinc-500"> • PK:{ev.pkNo}</span> : null}
        </div>

        {konum?.adresMetni ? (
          <div className="mt-[2px] whitespace-pre-wrap text-[9px] text-zinc-700">
            {konum.adresMetni}
          </div>
        ) : null}

        {(konum?.enlem || konum?.boylam) ? (
          <div className="mt-[2px] text-[8px] text-zinc-500">
            Koord: {konum?.enlem ?? "-"} / {konum?.boylam ?? "-"}
          </div>
        ) : null}
      </div>

      

      <div className="rounded border border-zinc-300 bg-zinc-50 p-1">
        <div className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-600">
          Açıklama
        </div>

        {/* ✅ clamp yok -> tamamı */}
        {aciklama ? (
          <div className="mt-[2px] whitespace-pre-wrap text-[10px] text-zinc-800">
            {aciklama}
          </div>
        ) : (
          <div className="mt-[2px] text-[10px] text-zinc-500">-</div>
        )}

        {aciklama_2 ? (
          <div className="mt-[2px] whitespace-pre-wrap text-[9px] text-zinc-700">
            {aciklama_2}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PrintIsEmriDosyalar({
  dosyalar = [],
  maxItems = 60,
  boxH = 95,
  gapPx = 3,
}) {
  const items = useMemo(() => {
    const raw = Array.isArray(dosyalar) ? dosyalar : [];
    return raw
      .map((d, idx) => {
        const url = getFileUrl(d);
        return {
          key: d?.id ?? d?.Id ?? idx,
          url,
          name: getFileName(d),
          isImage: url ? isImageUrl(url) : false,
          ext: url ? extOf(url) : "",
        };
      })
      .filter((x) => !!x.url);
  }, [dosyalar]);

  if (!items.length) return null;

  const shown = items.slice(0, Math.max(0, maxItems));
  const hidden = Math.max(0, items.length - shown.length);

  return (
    <section className="mt-1 rounded border border-zinc-300 bg-white p-1">
      <div className="mb-[2px] flex items-center justify-between">
        <div className="text-[10px] font-extrabold text-zinc-900">
          Dosyalar / Fotoğraflar
        </div>

        {hidden > 0 && (
          <div className="text-[8px] text-zinc-500">
            (+{hidden} dosya daha var)
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: `${gapPx}px`,
        }}
      >
        {shown.map((x) => (
          <div
            key={x.key}
            style={{
              width: `calc(20% - ${(gapPx * 4) / 5}px)`,
              height: `${boxH}px`,
              border: "1px solid rgb(212,212,216)",
              borderRadius: "6px",
              background: "white",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {x.isImage ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={x.url}
                  alt={x.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",      // kutuyu doldurur
                    objectPosition: "center",// tam ortadan kırpar
                    display: "block",
                  }}
                  loading="eager"
                />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "4px",
                }}
              >
                <div style={{ fontSize: "9px", fontWeight: 800 }}>
                  {x.ext || "BELGE"}
                </div>

                <div
                  style={{
                    fontSize: "8px",
                    color: "#52525b",
                    marginTop: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {x.name}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function PrintIsEmriNotlar({ notlar = [] }) {
  if (!notlar?.length) return null;

  return (
    <section className="mt-1 rounded border border-zinc-300 bg-white p-1">
      <div className="mb-[2px] flex items-center justify-between">
        <div className="text-[10px] font-extrabold text-zinc-900">Notlar</div>
        <div className="text-[8px] text-zinc-500">Toplam: {notlar.length}</div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {notlar.map((n) => {
          const fullName = `${n?.personel?.ad ?? ""} ${n?.personel?.soyad ?? ""}`.trim();
          return (
            <div key={n.id} className="rounded border border-zinc-200 bg-zinc-50 p-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-zinc-900 text-[8px] font-bold text-white">
                    {fullName ? initials(fullName) : "?"}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-900">
                    {fullName || "Personel"}
                  </span>
                </div>
                <span className="text-[8px] text-zinc-500">{formatTR(n.olusturmaTarihiUtc)}</span>
              </div>

              <div className="mt-[2px] whitespace-pre-wrap text-[10px] leading-snug text-zinc-800">
                {n.metin}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PrintIsEmriPersoneller({ personeller = [] }) {
  if (!personeller?.length) return null;

  return (
    <section className="mt-1 rounded border border-zinc-300 bg-white p-1">
      <div className="mb-[2px] flex items-center justify-between">
        <div className="text-[10px] font-extrabold text-zinc-900">Personeller</div>
        <div className="text-[8px] text-zinc-500">Toplam: {personeller.length}</div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {personeller.map((p) => {
          const fullName = `${p?.personel?.ad ?? ""} ${p?.personel?.soyad ?? ""}`.trim();
          return (
            <div key={p.id} className="rounded border border-zinc-200 bg-zinc-50 p-1">
              <div className="flex items-center gap-1">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-zinc-900 text-[8px] font-bold text-white">
                  {initials(fullName || `P${p.id}`)}
                </span>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-zinc-900">
                    {fullName || `#${p.personelId}`}
                  </div>
                  <div className="text-[8px] text-zinc-600">{p.rolAd || "-"}</div>
                </div>
              </div>
              {p.not ? (
                <div className="mt-[2px] whitespace-pre-wrap text-[8px] text-zinc-600">
                  {p.not}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PrintIsEmriMalzemeler({ malzemeler = [], kdvIncluded = true }) {
  if (!malzemeler?.length) return null;

  const netToplam = malzemeler.reduce((acc, m) => {
    const birim = Number(m.birimFiyat ?? 0);
    const adet = Number(m.adet ?? 0);
    return acc + birim * adet;
  }, 0);

  const grossToplam = netToplam * 1.2;

  return (
    <section className="mt-1 rounded border border-zinc-300 bg-white p-1">
      <div className="mb-[2px] flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-extrabold text-zinc-900">Malzeme / İşçilik</div>
          <div className="text-[8px] text-zinc-600">
            Genel Tutar:{" "}
            <span className="font-bold">
              ₺ {(kdvIncluded ? grossToplam : netToplam).toFixed(2)}
            </span>{" "}
            <span className="text-[8px] text-zinc-500">
              ({kdvIncluded ? "KDV %20 dahil" : "KDV hariç"})
            </span>
          </div>
        </div>
        <div className="text-[8px] text-zinc-500">Kalem: {malzemeler.length}</div>
      </div>

      <div className="overflow-hidden">
        <table className="w-full border-collapse text-[8px]">
          <thead>
            <tr className="border-b border-zinc-200 text-[8px] uppercase tracking-wide text-zinc-500">
              <th className="py-[2px] pr-1 text-left">Malzeme</th>
              <th className="py-[2px] px-1 text-left">Kaynak</th>
              <th className="py-[2px] px-1 text-right">Adet</th>
              <th className="py-[2px] px-1 text-right">Birim</th>
              <th className="py-[2px] px-1 text-right">Net</th>
              <th className="py-[2px] pl-1 text-right">KDV</th>
            </tr>
          </thead>
          <tbody>
            {malzemeler.map((m) => {
              const net = Number(m.birimFiyat ?? 0);
              const adet = Number(m.adet ?? 0);
              const netTutar = net * adet;
              const kdvTutar = netTutar * 1.2;

              const kaynakKod = m.kaynakKod ?? m.KaynakKod;
              const kaynakAd = m.kaynakAd ?? m.KaynakAd;

              return (
                <tr key={m.id} className="border-b border-zinc-100 last:border-0">
                  <td className="py-[2px] pr-1 text-left">
                    <div className="max-w-[200px] whitespace-pre-wrap font-semibold text-zinc-900">
                      {m.malzemeAdi}
                    </div>
                  </td>
                  <td className="py-[2px] px-1 text-left text-zinc-700">
                    {formatKaynak(kaynakKod, kaynakAd)}
                  </td>
                  <td className="py-[2px] px-1 text-right text-zinc-800">{adet}</td>
                  <td className="py-[2px] px-1 text-right text-zinc-800">₺ {net.toFixed(2)}</td>
                  <td className="py-[2px] px-1 text-right text-zinc-800">₺ {netTutar.toFixed(2)}</td>
                  <td className="py-[2px] pl-1 text-right text-zinc-800">₺ {kdvTutar.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ✅ İMZA BÖLÜMÜ (3 ADET) */
function PrintIsEmriImzalar({
  labels = ["Teknik Müdür", "Genel Müdür / Onay"],
  linesH = 78,
}) {
  return (
    <section className="mt-1 rounded border border-zinc-300 bg-white p-1">
      <div className="mb-[2px] flex items-center justify-between">
        <div className="text-[10px] font-extrabold text-zinc-900">İmza</div>
        
      </div>

      <div className="grid grid-cols-3 gap-1">
        {labels.map((label, i) => (
          <div key={i} className="rounded border border-zinc-200 bg-zinc-50 p-1">
            <div className="text-[9px] font-bold text-zinc-900">{label}</div>

            <div
              style={{
                height: `${linesH}px`,
                marginTop: "6px",
                border: "1px dashed rgb(161,161,170)", // zinc-400
                borderRadius: "6px",
                background: "white",
              }}
            />

            
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========= PAGE ========= */
export default function IsEmriPrintPage() {
  const router = useRouter();
  const { id } = router.query;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const kdvIncluded = true;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await getDataAsync(`is-emirleri/${id}`);
        setRecord(data || null);
      } catch (e) {
        setErr(e?.message || "Veri alınamadı.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // otomatik yazdır
  useEffect(() => {
    if (!record) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [record]);

  const ui = useMemo(() => {
    if (!record) return null;

    const {
      kod,
      kod_2,
      kod_3,
      kisaBaslik,
      aciklama,
      aciklama_2,
      durumKod,
      durumAd,
      olusturmaTarihiUtc,
      onayTarihiUtc,
      baslamaTarihiUtc,
      bitisTarihiUtc,
      konum,
      site,
      apt,
      ev,
      evSahibi,
      kiraci,
      dosyalar = [],
      personeller = [],
      malzemeler = [],
      notlar = [],
    } = record;

    return (
      <div className="mx-auto w-full max-w-[820px]">
        <div className="mb-1 flex items-start justify-between border-b border-zinc-300 pb-[2px]">
          <div className="text-[11px] font-extrabold text-zinc-900">İŞ EMRİ</div>
        </div>

        <div className="rounded border border-zinc-300 bg-white p-1">
          <PrintIsEmriHeader
            kod={kod}
            kod_2={kod_2}
            kod_3={kod_3}
            kisaBaslik={kisaBaslik}
            durumAd={durumAd}
            durumKod={durumKod}
            olusturmaTarihiUtc={olusturmaTarihiUtc}
            onayTarihiUtc={onayTarihiUtc}
            baslamaTarihiUtc={baslamaTarihiUtc}
            bitisTarihiUtc={bitisTarihiUtc}
          />

          <PrintIsEmriTopGrid
            site={site}
            apt={apt}
            ev={ev}
            konum={konum}
            evSahibi={evSahibi}
            kiraci={kiraci}
            aciklama={aciklama}
            aciklama_2={aciklama_2}
          />

          {/* ✅ Görseller (5li sabit + ortalı) */}
          <PrintIsEmriDosyalar
            dosyalar={dosyalar}
            maxItems={60}
            boxH={95}
            gapPx={3}
            fit="cover"
          />

          {/* ✅ Notlar metni TAM */}
          <PrintIsEmriNotlar notlar={notlar} />

          <div className="mt-1 grid grid-cols-2 gap-1">
            <PrintIsEmriPersoneller personeller={personeller} />
            <PrintIsEmriMalzemeler malzemeler={malzemeler} kdvIncluded={kdvIncluded} />
          </div>

          {/* ✅ İMZA (en altta) */}
          <PrintIsEmriImzalar
            labels={["İşin Ücreti","Cem Eren ( Ön Kontrol )", "Ali Oğuz ( Onay )"]}
            linesH={78}
          />
        </div>
      </div>
    );
  }, [record]);

  if (loading) return <div className="p-2 text-[11px]">Yükleniyor...</div>;
  if (err || !record) return <div className="p-2 text-[11px] text-red-700">{err || "Kayıt yok."}</div>;

  return (
    <div className="print-root min-h-screen bg-white p-1 text-zinc-900">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 5mm; }

          /* sıkıştır */
          .print-root, .print-root * {
            font-size: 10px !important;
            line-height: 1.12 !important;
            box-shadow: none !important;
          }

          /* buton vs zaten yok */
          button { display: none !important; }

          /* genel resim taşmasın */
          img { max-width: 100% !important; height: auto !important; }

          /* ✅ galeri resimleri: ortalama + kutu içinde max */
          .print-thumb {
            display: block !important;
            height: auto !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
          }

          /* kart bölünmesini azalt */
          section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {ui}
    </div>
  );
}