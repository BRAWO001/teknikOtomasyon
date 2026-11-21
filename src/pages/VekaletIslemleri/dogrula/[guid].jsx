import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";

const value = (obj, key) =>
  obj?.[key] ?? obj?.[key.charAt(0).toUpperCase() + key.slice(1)];
const shown = (v) =>
  v === null || v === undefined || String(v).trim() === "" ? "—" : String(v);
const formatDate = (v) => {
  if (!v) return "—";
  const date = new Date(v);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" });
};
const validGuid = (v) =>
  typeof v === "string" &&
  (/^[0-9a-f]{32}$/i.test(v) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      v,
    ));

function Detail({ label, children }) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {children}
      </dd>
    </div>
  );
}
function Panel({ number, title, children }) {
  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:mb-3 print:break-inside-avoid print:rounded-lg print:shadow-none">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 print:py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
          {number}
        </span>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      <div className="px-5 py-2">{children}</div>
    </section>
  );
}

export default function VekaletDogrulamaPage() {
  const router = useRouter();
  const { guid } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [qr, setQr] = useState("");
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      setData(null);
      try {
        if (!validGuid(guid))
          throw new Error("Geçersiz vekâlet doğrulama bağlantısı.");
        const result = await getDataAsync(
          `vekalet/dogrula/${encodeURIComponent(guid)}`,
        );
        if (!cancelled)
          setData(result?.data && !result?.vekaletId ? result.data : result);
      } catch (err) {
        if (!cancelled)
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Vekâlet bilgileri alınamadı.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, guid]);

  useEffect(() => {
    if (!data || typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const link = `${window.location.origin}/VekaletIslemleri/dogrula/${encodeURIComponent(guid)}`;
        const image = await QRCode.toDataURL(link, {
          width: 300,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) {
          setQr(image);
          setQrError("");
        }
      } catch {
        if (!cancelled)
          setQrError(
            "QR kodu oluşturulamadı. 'qrcode' paketinin kurulu olduğunu kontrol edin.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, guid]);

  const gecerli = Boolean(value(data, "gecerliMi"));
  const veren = value(data, "vekaletVeren") || {};
  const alan = value(data, "vekaletAlan") || {};
  const bolumler = value(data, "bagliBolumler") || [];
  const fullname = (person) =>
    [value(person, "ad"), value(person, "soyad")].filter(Boolean).join(" ") ||
    shown(value(person, "firmaAdi"));
  const meetingNotes = [
    value(data, "toplantiNot1"),
    value(data, "toplantiNot2"),
    value(data, "toplantiNot3"),
  ].filter((v) => typeof v === "string" && v.trim());

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          html,
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            max-width: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .print-columns {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .print-break {
            break-inside: avoid;
          }
        }
      `}</style>
      <div className="print-sheet mx-auto max-w-5xl">
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              EOS Management
            </p>
            <p className="text-sm text-slate-600">
              Dijital vekâlet belgesi doğrulama
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Yenile
            </button>
            <button
              type="button"
              disabled={!data || !qr}
              onClick={() => window.print()}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              PDF olarak kaydet / Yazdır
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-slate-600">
            Vekâlet belgesi ve doğrulama bilgileri yükleniyor...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-8"
          >
            <h1 className="text-xl font-bold text-red-700">
              Belge görüntülenemedi
            </h1>
            <p className="mt-3 text-sm text-slate-600">{error}</p>
          </div>
        ) : (
          data && (
            <>
              <header className="print-break mb-5 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between print:mb-3 print:rounded-lg print:p-4 print:shadow-none">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold tracking-[0.18em] text-white">
                    EOS MANAGEMENT
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl print:text-2xl">
                    VEKÂLET BELGESİ
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Kat malikleri toplantısı için elektronik ortamda oluşturulan
                    vekâlet kaydı
                  </p>
                  <div
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${gecerli ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${gecerli ? "bg-emerald-600" : "bg-rose-600"}`}
                    />
                    {gecerli ? "SİSTEMDE AKTİF KAYIT" : "AKTİF OLMAYAN KAYIT"}
                  </div>
                  <p className="mt-4 break-all text-xs text-slate-500">
                    Belge kodu:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {shown(value(data, "vekaletGuidCode") || guid)}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-center rounded-xl border border-slate-200 p-3 sm:w-44 print:w-36">
                  {qr ? (
                    <img
                      src={qr}
                      alt="Belge doğrulama QR kodu"
                      className="h-32 w-32 object-contain print:h-28 print:w-28"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center text-center text-xs text-slate-400">
                      QR hazırlanıyor
                    </div>
                  )}
                  <span className="mt-1 text-center text-[11px] font-semibold text-slate-600">
                    QR ile doğrula
                  </span>
                  {qrError && (
                    <p className="no-print mt-2 text-center text-xs text-red-600">
                      {qrError}
                    </p>
                  )}
                </div>
              </header>

              <Panel number="01" title="Site / Proje ve Toplantı Bilgileri">
                <dl className="grid gap-x-8 sm:grid-cols-2 print-columns">
                  <Detail label="Site / Proje Adı">
                    {shown(value(data, "siteAdi"))}
                  </Detail>
                  <Detail label="Toplantı Adı">
                    {shown(value(data, "toplantiAdi"))}
                  </Detail>
                  <Detail label="Toplantı Tarihi">
                    {formatDate(value(data, "toplantiTarihi"))}
                  </Detail>
                  <Detail label="Toplantı Numarası">
                    {shown(value(data, "toplantiId"))}
                  </Detail>
                </dl>
                {value(data, "toplantiAciklama") && (
                  <div className="py-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Toplantı Açıklaması
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {value(data, "toplantiAciklama")}
                    </p>
                  </div>
                )}
                {meetingNotes.length > 0 && (
                  <div className="border-t border-slate-100 py-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Toplantı Notları
                    </h3>
                    {meetingNotes.map((note, index) => (
                      <p
                        key={index}
                        className="mt-2 whitespace-pre-wrap text-sm text-slate-700"
                      >
                        {note}
                      </p>
                    ))}
                  </div>
                )}
              </Panel>

              <div className="grid gap-5 md:grid-cols-2 print-columns">
                <Panel number="02" title="Vekâlet Veren Bilgileri">
                  <dl>
                    <Detail label="Adı Soyadı / Ünvanı">
                      {fullname(veren)}
                    </Detail>
                    {value(veren, "firmaAdi") && (
                      <Detail label="Firma">{value(veren, "firmaAdi")}</Detail>
                    )}
                    <Detail label="Kayıtlı Telefon">
                      {shown(value(veren, "telefon"))}
                    </Detail>
                    <Detail label="Sıfatı">Bağımsız bölüm maliki</Detail>
                  </dl>
                </Panel>
                <Panel number="03" title="Vekâlet Alan Bilgileri">
                  <dl>
                    <Detail label="Adı Soyadı">{fullname(alan)}</Detail>
                    <Detail label="Telefon">
                      {shown(value(alan, "telefon"))}
                    </Detail>
                    <Detail label="Sıfatı">Vekil olarak belirtilen kişi</Detail>
                  </dl>
                </Panel>
              </div>

              <Panel
                number="04"
                title={`Vekâlet Verilen Bağımsız Bölümler (${bolumler.length})`}
              >
                {bolumler.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <th className="py-3 pr-3">Daire</th>
                          <th className="py-3">Bağımsız Bölüm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bolumler.map((bolum, index) => (
                          <tr
                            key={
                              value(bolum, "appDbDaireMeskenBolumuId") || index
                            }
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-3 pr-3">
                              {shown(value(bolum, "daireNo"))}
                            </td>
                            <td className="py-3">
                              {shown(value(bolum, "bagimsizBolumNo"))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-4 text-sm text-slate-500">
                    Bu vekâlete bağlı bağımsız bölüm bilgisi bulunamadı.
                  </p>
                )}
              </Panel>

              <Panel number="05" title="Vekâlet Beyanı ve Açıklama">
                {value(data, "vekaletNot") && (
                  <div className="mb-3 rounded-xl bg-slate-50 p-4">
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {value(data, "vekaletNot")}
                    </p>
                  </div>
                )}
              </Panel>

              <Panel number="06" title="Belge ve SMS Doğrulama Kaydı">
                <dl className="grid gap-x-8 sm:grid-cols-2 print-columns">
                  <Detail label="Vekâlet Kayıt Tarihi">
                    {formatDate(value(data, "vekaletVerilmeTarihi"))}
                  </Detail>
                  <Detail label="SMS Doğrulama Tarihi">
                    {formatDate(value(data, "smsDogrulamaTarihiUtc"))}
                  </Detail>
                  <Detail label="Belge Durumu">
                    {gecerli ? "Aktif" : "Aktif değil"}
                  </Detail>
                  <Detail label="Belge Numarası">
                    {shown(value(data, "vekaletId"))}
                  </Detail>
                </dl>
              </Panel>
            </>
          )
        )}
      </div>
    </main>
  );
}
